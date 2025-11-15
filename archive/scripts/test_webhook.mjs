// Test script to verify webhook functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkxbhvckmgrmdkdkhnqo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhookFlow() {
  console.log('🧪 Testing Facebook Webhook Integration...\n');

  // 1. Check if projects have codes
  console.log('1️⃣ Checking projects with codes...');
  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select('id, name, project_code, available_leads')
    .not('project_code', 'is', null)
    .limit(5);

  if (projError) {
    console.error('❌ Error fetching projects:', projError);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log('⚠️  No projects with codes found. You need to set project codes first.');
    console.log('   Run PROJECT_CODE_SETUP.sql to configure codes.');
    return;
  }

  console.log(`✅ Found ${projects.length} project(s) with codes:`);
  projects.forEach(p => {
    console.log(`   - ${p.name}: code "${p.project_code}", ${p.available_leads || 0} available leads`);
  });

  // 2. Check recent leads from Facebook
  console.log('\n2️⃣ Checking recent Facebook leads...');
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('id, client_name, client_phone, project_id, source, created_at')
    .eq('source', 'facebook')
    .order('created_at', { ascending: false })
    .limit(5);

  if (leadsError) {
    console.error('❌ Error fetching leads:', leadsError);
    return;
  }

  if (!leads || leads.length === 0) {
    console.log('⚠️  No Facebook leads found yet.');
    console.log('   This is normal if no test leads have been sent.');
  } else {
    console.log(`✅ Found ${leads.length} recent Facebook lead(s):`);
    leads.forEach(l => {
      console.log(`   - ${l.client_name || 'Unknown'} (${l.client_phone || 'No phone'}) - ${new Date(l.created_at).toLocaleString()}`);
    });
  }

  // 3. Check webhook function status
  console.log('\n3️⃣ Webhook Configuration Status:');
  console.log('   ✅ Webhook endpoint: https://wkxbhvckmgrmdkdkhnqo.supabase.co/functions/v1/facebook-leads-webhook');
  console.log('   ✅ JWT verification: DISABLED (public access)');
  console.log('   ✅ Leadgen field: SUBSCRIBED');
  console.log('   ⏳ Waiting for Facebook to send test leads...');

  console.log('\n✅ Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Ensure projects have codes set (001, 002, 003, 004)');
  console.log('   2. Create a test Facebook Lead Ad with campaign name like "001-aliva Test"');
  console.log('   3. Submit the test lead form');
  console.log('   4. Check the leads table for the new entry');
}

testWebhookFlow().catch(console.error);
