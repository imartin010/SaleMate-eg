// Debug script to check what project data looks like
// Run this in your browser console on the admin page

const debugProjectData = async () => {
  console.log('🔍 Debugging project data structure...');
  
  try {
    // Test direct query to see raw data
    console.log('🔄 Testing direct Supabase query...');
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Query failed:', error);
      return;
    }
    
    console.log('📊 Raw project data from database:');
    console.log('Total projects:', data?.length || 0);
    
    if (data && data.length > 0) {
      data.forEach((project, index) => {
        console.log(`\n📋 Project ${index + 1}:`);
        console.log('Full object:', project);
        console.log('ID:', project.id);
        console.log('Name field:', project.name);
        console.log('Name type:', typeof project.name);
        console.log('Name value:', JSON.stringify(project.name));
        
        // Check if name is an object or string
        if (typeof project.name === 'object' && project.name !== null) {
          console.log('⚠️ Name is an object! Keys:', Object.keys(project.name));
          if (project.name.name) {
            console.log('✅ Found name.name:', project.name.name);
          }
        } else {
          console.log('✅ Name is a string:', project.name);
        }
      });
      
      // Test the current mapping
      console.log('\n🔄 Testing current mapping...');
      const mapped = data.map((p) => ({
        id: p.id,
        name: p.name,
        region: p.region,
        available_leads: p.available_leads ?? 0,
        price_per_lead: p.price_per_lead ?? null,
        description: p.description ?? null,
        created_at: p.created_at,
        developer: 'Unknown'
      }));
      
      console.log('📋 Mapped data:');
      mapped.forEach((project, index) => {
        console.log(`Project ${index + 1}:`, project);
        console.log(`Display name would be: "${project.name}"`);
      });
      
    } else {
      console.log('⚠️ No projects found in database');
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
};

// Run the debug
debugProjectData();
