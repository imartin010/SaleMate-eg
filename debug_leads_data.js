// Debug script to check what data is actually coming from the database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkxbhvckmgrmdkdkhnqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indrd2JodmNrbWdybWRrZGtobnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1MzAyNTAsImV4cCI6MjA0MzEwNjI1MH0.m_gXK_lOwibWN1DNGYX1n6_kRQDZAOqLtUlSCJg0Lzw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLeads() {
  console.log('🔍 Fetching leads data...\n');
  
  const { data, error } = await supabase
    .from('leads')
    .select(`
      id,
      client_name,
      project:projects (
        id,
        name,
        region
      )
    `)
    .limit(3);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 Raw data from database:');
  console.log(JSON.stringify(data, null, 2));
  
  console.log('\n🔧 Analyzing project data:');
  data.forEach((lead, index) => {
    console.log(`\nLead ${index + 1}: ${lead.client_name}`);
    if (lead.project) {
      console.log('  Project name type:', typeof lead.project.name);
      console.log('  Project name value:', lead.project.name);
      console.log('  Project name JSON:', JSON.stringify(lead.project.name));
      console.log('  Region type:', typeof lead.project.region);
      console.log('  Region value:', lead.project.region);
      console.log('  Region JSON:', JSON.stringify(lead.project.region));
    }
  });

  // Now let's check the projects table directly
  console.log('\n\n📋 Checking projects table directly:');
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, region')
    .limit(5);

  if (projectsError) {
    console.error('❌ Error:', projectsError);
    return;
  }

  console.log('\nProjects data:');
  projects.forEach((project) => {
    console.log(`\nProject ID: ${project.id}`);
    console.log('  Name type:', typeof project.name);
    console.log('  Name value:', project.name);
    console.log('  Name JSON:', JSON.stringify(project.name));
    console.log('  Region type:', typeof project.region);
    console.log('  Region value:', project.region);
    console.log('  Region JSON:', JSON.stringify(project.region));
  });
}

debugLeads().catch(console.error);

