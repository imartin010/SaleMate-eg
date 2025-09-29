// scripts/import-csv.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { statSync } from 'fs';
import { globby } from 'globby';
import { z } from 'zod';
import path from 'path';

const Env = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE: z.string().min(10),
  TABLE: z.string().min(1),             // salemate-inventory
  GLOB: z.string().default('./data/**/*.csv'),
  BATCH_SIZE: z.coerce.number().default(1000),
  UPSERT: z
    .union([z.string(), z.boolean()])
    .transform(v => (typeof v === 'string' ? v.toLowerCase() === 'true' : v))
    .default(false),
  CONFLICT_TARGET: z.string().default('id'),
  DRY_RUN: z
    .union([z.string(), z.boolean()])
    .transform(v => (typeof v === 'string' ? v.toLowerCase() === 'true' : v))
    .default(false),
});

const env = Env.parse(process.env);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

type Row = Record<string, unknown>;

async function insertBatch(rows: Row[]) {
  const maxAttempts = 5;
  let attempt = 0;
  while (true) {
    attempt++;
    const q = env.UPSERT
      ? supabase.from(env.TABLE).upsert(rows, {
          onConflict: env.CONFLICT_TARGET,
        })
      : supabase.from(env.TABLE).insert(rows);

    const { error } = await q;

    if (!error) return;

    // Retry on any error up to maxAttempts
    if (attempt >= maxAttempts) {
      throw new Error(`Insert failed (attempt ${attempt}): ${error?.message || 'unknown error'}`);
    }
    const backoff = Math.min(15000, 500 * Math.pow(2, attempt));
    await sleep(backoff);
  }
}

async function ensureTableExists() {
  // Try a zero-select to validate table exists
  const { error } = await supabase.from(env.TABLE).select('*', { count: 'exact', head: true });
  if (error) {
    throw new Error(
      `Cannot access table "${env.TABLE}". Check name & RLS/permissions. Details: ${error.message}`
    );
  }
}

function normalizeValue(v: unknown) {
  if (v === undefined) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '' || t.toLowerCase() === 'null') return null;
    return t;
  }
  return v;
}

async function processFile(file: string) {
  return new Promise<{ read: number; sent: number; skipped: number }>((resolve, reject) => {
    const rows: Row[] = [];
    let headers: string[] | null = null;
    let read = 0;
    let sent = 0;
    let skipped = 0;

    const parser = parse({
      bom: true,
      columns: (hdrs: string[]) => {
        headers = hdrs.map(h => h.trim());
        return headers;
      },
      relax_column_count: true,
      relax_quotes: true,
      skip_empty_lines: true,
      trim: true,
    });

    parser.on('readable', () => {
      let record: Record<string, unknown>;
      while ((record = parser.read()) !== null) {
        read++;
        const obj: Row = {};
        for (const k in record) {
          obj[k] = normalizeValue(record[k]);
        }
        // skip completely empty rows
        if (Object.values(obj).every(v => v === null || v === '')) {
          skipped++;
          continue;
        }
        rows.push(obj);
      }
    });

    parser.on('error', err => reject(err));

    parser.on('end', async () => {
      if (env.DRY_RUN) {
        console.log(
          `DRY RUN: ${file} — total rows parsed: ${read}, firstRow:`,
          rows[0] ? JSON.stringify(rows[0]).slice(0, 300) : 'N/A'
        );
        return resolve({ read, sent: 0, skipped });
      }

      try {
        for (let i = 0; i < rows.length; i += env.BATCH_SIZE) {
          const batch = rows.slice(i, i + env.BATCH_SIZE);
          await insertBatch(batch);
          sent += batch.length;
          const pct = Math.min(100, Math.floor((sent / rows.length) * 100));
          process.stdout.write(`\r  -> ${path.basename(file)}: ${sent}/${rows.length} (${pct}%)`);
        }
        process.stdout.write('\n');
        resolve({ read, sent, skipped });
      } catch (e) {
        reject(e);
      }
    });

    createReadStream(file).pipe(parser);
  });
}

(async () => {
  console.log('=== Supabase CSV Importer ===');
  console.log(
    JSON.stringify(
      {
        table: env.TABLE,
        glob: env.GLOB,
        batch: env.BATCH_SIZE,
        upsert: env.UPSERT,
        conflict: env.CONFLICT_TARGET,
        dryRun: env.DRY_RUN,
        url: env.SUPABASE_URL.replace(/https?:\/\//, ''),
      },
      null,
      2
    )
  );

  await ensureTableExists();

  const files = await globby(env.GLOB);
  if (!files.length) {
    console.error(`No CSV files matched: ${env.GLOB}`);
    process.exit(1);
  }

  // Pretty list
  files.forEach((f, i) => {
    const size = statSync(f).size;
    console.log(`${i + 1}/${files.length} - ${f} (${(size / 1024).toFixed(1)} KB)`);
  });

  let totalRead = 0;
  let totalSent = 0;
  let totalSkipped = 0;

  const start = Date.now();
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    console.log(`\n[${i + 1}/${files.length}] Importing ${f} ...`);
    const res = await processFile(f);
    totalRead += res.read;
    totalSent += res.sent;
    totalSkipped += res.skipped;
  }
  const secs = ((Date.now() - start) / 1000).toFixed(1);

  console.log('\n=== Summary ===');
  console.log(
    JSON.stringify(
      { files: files.length, totalRead, totalInserted: totalSent, totalSkipped, seconds: secs },
      null,
      2
    )
  );
})().catch(err => {
  console.error('\n❌ Import failed:', err?.message || err);
  process.exit(1);
});
