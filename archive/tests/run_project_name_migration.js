import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('📝 Reading migration file...');
    const migrationPath = join(__dirname, 'supabase/migrations/20251103000001_add_project_name_to_leads_and_purchase_requests.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Running migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try alternative method using REST API
      console.log('⚠️ RPC method failed, trying alternative...');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Migration failed:', errorText);
        console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
        console.log('   File:', migrationPath);
        process.exit(1);
      }
      
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('✅ Migration completed successfully!');
    }
    
  } catch (err) {
    console.error('❌ Error running migration:', err.message);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log('   File: supabase/migrations/20251103000001_add_project_name_to_leads_and_purchase_requests.sql');
    process.exit(1);
  }
}

runMigration();

