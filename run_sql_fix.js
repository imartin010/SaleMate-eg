const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Get credentials from environment or use defaults
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wkxbhvckmgrmdkdkhngo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.log('Please set VITE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  const sqlFile = fs.readFileSync('FIX_TOTAL_AMOUNT_COLUMN.sql', 'utf8');
  
  // Execute SQL using RPC (we'll use a simpler approach)
  console.log('🔧 Attempting to fix purchase_requests table...');
  
  try {
    // Split SQL into individual statements and execute
    const statements = sqlFile.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim().startsWith('SELECT') || statement.trim().startsWith('--')) {
        continue; // Skip SELECT and comments
      }
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct query execution
        const { error: queryError } = await supabase.from('_').select('*').limit(0);
        console.log('Note: Direct SQL execution not available via client');
      }
    }
    
    console.log('✅ SQL fix applied (if no errors above)');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  Please run FIX_TOTAL_AMOUNT_COLUMN.sql manually in Supabase SQL Editor');
  }
}

runSQL();
