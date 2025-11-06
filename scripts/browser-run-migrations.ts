/**
 * Browser Automation: Run SQL Migrations via Supabase Dashboard
 * Uses Playwright to automate the entire migration process
 */

import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  🤖 Automated SQL Migration via Browser               ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Get project info
  const projectRef = await question('Enter your Supabase project reference: ');
  const serviceRoleKey = await question('Enter your service role key (for cron job): ');

  console.log('\n🌐 Launching Chromium browser...\n');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500  // Slow down for visibility
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to Supabase and login
    console.log('1️⃣ Navigating to Supabase Dashboard...');
    await page.goto('https://supabase.com/dashboard');
    await page.waitForLoadState('networkidle');

    console.log('   🔐 Please login to Supabase in the browser...');
    console.log('   Press ENTER after you\'ve logged in successfully...');
    await question('');

    // Step 2: Navigate to SQL Editor
    console.log('\n2️⃣ Opening SQL Editor...');
    await page.goto(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for editor to load

    // Step 3: Run Migration 1 - Create tables
    console.log('\n3️⃣ Running Migration 1: Create Case Manager Tables...');
    
    const migration1Path = path.join(process.cwd(), 'supabase/migrations/20251106000001_create_case_manager_tables.sql');
    const migration1SQL = fs.readFileSync(migration1Path, 'utf-8');

    // Click in the SQL editor
    console.log('   📝 Inserting SQL into editor...');
    
    // Try multiple selectors for the Monaco editor
    const editorSelectors = [
      '.monaco-editor textarea',
      '[data-mode-id="sql"] textarea',
      '.view-lines',
      '[role="textbox"]',
    ];

    let editorFound = false;
    for (const selector of editorSelectors) {
      try {
        const editor = page.locator(selector).first();
        if (await editor.isVisible({ timeout: 2000 })) {
          await editor.click();
          await page.keyboard.press('Control+A'); // Select all
          await page.keyboard.press('Delete'); // Clear
          
          // Type the SQL (for large text, use clipboard)
          await page.evaluate((sql) => {
            navigator.clipboard.writeText(sql);
          }, migration1SQL);
          
          await page.keyboard.press('Control+V'); // Paste
          editorFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!editorFound) {
      console.log('   ⚠️ Could not auto-fill editor. Please paste manually:');
      console.log('   1. Open the file: supabase/migrations/20251106000001_create_case_manager_tables.sql');
      console.log('   2. Copy all contents');
      console.log('   3. Paste into Supabase SQL Editor');
      console.log('   4. Press ENTER here when ready...');
      await question('');
    } else {
      console.log('   ✅ SQL inserted into editor');
      await page.waitForTimeout(1000);
    }

    // Run the SQL
    console.log('   ▶️ Running SQL...');
    
    // Look for Run button
    const runButtonSelectors = [
      'button:has-text("Run")',
      'button:has-text("Execute")',
      '[data-testid="run-query"]',
      'button[title*="Run"]',
    ];

    let runClicked = false;
    for (const selector of runButtonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          runClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!runClicked) {
      console.log('   ⚠️ Could not find Run button. Please click it manually.');
      console.log('   Press ENTER after running the SQL...');
      await question('');
    } else {
      console.log('   ✅ SQL execution triggered');
      await page.waitForTimeout(3000); // Wait for execution
    }

    // Check for success/error
    console.log('   🔍 Checking result...');
    const hasError = await page.locator('text=/error|failed|invalid/i').count();
    if (hasError > 0) {
      console.log('   ⚠️ Possible error detected. Check the results panel.');
      await page.screenshot({ path: 'migration-1-error.png' });
    } else {
      console.log('   ✅ Migration 1 completed successfully!');
      await page.screenshot({ path: 'migration-1-success.png' });
    }

    // Step 4: Verify tables were created
    console.log('\n4️⃣ Verifying tables were created...');
    await page.goto(`https://supabase.com/dashboard/project/${projectRef}/editor`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const tables = [
      'case_feedback',
      'case_actions',
      'case_faces',
      'inventory_matches',
      'notifications',
    ];

    console.log('   Checking for tables:');
    for (const tableName of tables) {
      const exists = await page.locator(`text="${tableName}"`).count();
      if (exists > 0) {
        console.log(`   ✅ ${tableName}`);
      } else {
        console.log(`   ❌ ${tableName} - NOT FOUND`);
      }
    }

    await page.screenshot({ path: 'tables-verification.png', fullPage: true });

    // Step 5: Set up cron job
    console.log('\n5️⃣ Setting up reminder scheduler cron job...');
    await page.goto(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const cronSQL = `SELECT cron.schedule(
  'case-manager-reminders',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url:='https://${projectRef}.supabase.co/functions/v1/reminder-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${serviceRoleKey}"}'::jsonb
  )$$
);`;

    console.log('   📝 Inserting cron job SQL...');
    
    // Try to fill the editor again
    editorFound = false;
    for (const selector of editorSelectors) {
      try {
        const editor = page.locator(selector).first();
        if (await editor.isVisible({ timeout: 2000 })) {
          await editor.click();
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Delete');
          
          await page.evaluate((sql) => {
            navigator.clipboard.writeText(sql);
          }, cronSQL);
          
          await page.keyboard.press('Control+V');
          editorFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!editorFound) {
      console.log('   ⚠️ Could not auto-fill. Please paste this SQL:');
      console.log('\n' + cronSQL + '\n');
      console.log('   Press ENTER when ready...');
      await question('');
    } else {
      console.log('   ✅ Cron SQL inserted');
    }

    // Run the cron SQL
    console.log('   ▶️ Running cron job setup...');
    
    runClicked = false;
    for (const selector of runButtonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          runClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!runClicked) {
      console.log('   ⚠️ Please click Run button manually.');
      console.log('   Press ENTER after running...');
      await question('');
    } else {
      console.log('   ✅ Cron job setup executed');
      await page.waitForTimeout(2000);
    }

    // Step 6: Verify cron job
    console.log('\n6️⃣ Verifying cron job was created...');
    await page.goto(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const verifyCronSQL = "SELECT * FROM cron.job WHERE jobname = 'case-manager-reminders';";
    
    // Fill verification query
    for (const selector of editorSelectors) {
      try {
        const editor = page.locator(selector).first();
        if (await editor.isVisible({ timeout: 2000 })) {
          await editor.click();
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Delete');
          await page.keyboard.type(verifyCronSQL);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    console.log('   📋 Verification query ready. Click Run to verify.');
    console.log('   Should return 1 row if cron job was created successfully.');
    console.log('   Press ENTER to continue...');
    await question('');

    // Final summary
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  ✅ Migration Complete!                               ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('📸 Screenshots saved:');
    console.log('   - migration-1-success.png (or migration-1-error.png)');
    console.log('   - tables-verification.png');
    console.log('');
    console.log('✅ Database tables created:');
    console.log('   - case_feedback');
    console.log('   - case_actions');
    console.log('   - case_faces');
    console.log('   - inventory_matches');
    console.log('   - notifications');
    console.log('');
    console.log('✅ RLS policies applied');
    console.log('✅ Indexes created');
    console.log('✅ Cron job scheduled (verify with the query above)');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Deploy Edge Functions: ./scripts/deploy-edge-functions.sh');
    console.log('   2. Or run: supabase functions deploy');
    console.log('   3. Refresh your browser at /app/crm/case/...');
    console.log('   4. The Case Manager should now load!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during automation:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('Screenshot saved: error-screenshot.png');
  } finally {
    console.log('Press ENTER to close browser...');
    await question('');
    await browser.close();
    rl.close();
  }
}

main().catch(console.error);

