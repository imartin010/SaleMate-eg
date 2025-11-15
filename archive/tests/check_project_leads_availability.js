// Check Project Leads Availability
// Run this to see how many unassigned leads are available in each project

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkxbhvckmgrmdkdkhnqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGJodmNrbWdybWRka2RobnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MTU4MjAsImV4cCI6MjA1MTQ5MTgyMH0.tqAqwrGpT1kp4EqWbmxMgJJ3yI0rT0LOtMFKPPLJZSI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectLeads() {
  console.log('🔍 Checking project leads availability...\n');

  // Get all projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, available_leads')
    .order('name');

  if (projectsError) {
    console.error('❌ Error fetching projects:', projectsError);
    return;
  }

  console.log(`📊 Found ${projects.length} projects\n`);

  // Check each project for unassigned leads
  for (const project of projects) {
    console.log(`\n📁 Project: ${project.name}`);
    console.log(`   Available leads (counter): ${project.available_leads}`);

    // Count unassigned leads
    const { count: unassignedCount, error: unassignedError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id)
      .or('buyer_user_id.is.null,buyer_user_id.eq.00000000-0000-0000-0000-000000000000')
      .eq('stage', 'New Lead');

    if (unassignedError) {
      console.log(`   ❌ Error: ${unassignedError.message}`);
      continue;
    }

    // Count all leads
    const { count: totalCount, error: totalError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id);

    if (totalError) {
      console.log(`   ❌ Error: ${totalError.message}`);
      continue;
    }

    const assignedCount = totalCount - unassignedCount;

    console.log(`   📊 Total leads in DB: ${totalCount}`);
    console.log(`   ✅ Unassigned leads: ${unassignedCount}`);
    console.log(`   👤 Assigned leads: ${assignedCount}`);

    if (unassignedCount === 0 && project.available_leads > 0) {
      console.log(`   ⚠️  WARNING: Project shows ${project.available_leads} available but 0 unassigned leads in DB!`);
      console.log(`   💡 You need to add real leads to this project before approving purchase requests.`);
    } else if (unassignedCount < project.available_leads) {
      console.log(`   ⚠️  WARNING: Mismatch! Counter says ${project.available_leads} but only ${unassignedCount} unassigned in DB`);
    } else if (unassignedCount > 0) {
      console.log(`   ✅ Ready for purchase! ${unassignedCount} leads available for assignment`);
    }
  }

  console.log('\n\n📝 Summary:');
  console.log('To approve purchase requests, each project must have unassigned leads in the database.');
  console.log('If a project shows 0 unassigned leads, you need to:');
  console.log('1. Upload leads CSV via Admin Panel → Upload Leads');
  console.log('2. Or import leads directly into the database');
}

checkProjectLeads().catch(console.error);

