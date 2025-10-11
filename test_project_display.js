// Test script to verify project names are displayed correctly
// Run this in your browser console on the admin page

const testProjectDisplay = async () => {
  console.log('🧪 Testing project name display fix...');
  
  try {
    // Step 1: Test raw data from database
    console.log('\n📊 Step 1: Checking raw database data...');
    const { data: rawData, error } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Raw query failed:', error);
      return;
    }
    
    console.log('Raw projects from DB:', rawData?.length || 0);
    rawData?.forEach((project, i) => {
      console.log(`Project ${i + 1}:`, {
        id: project.id,
        name: project.name,
        nameType: typeof project.name,
        nameString: JSON.stringify(project.name)
      });
    });
    
    // Step 2: Test the mapping logic
    console.log('\n🔄 Step 2: Testing name extraction logic...');
    const mappedData = (rawData || []).map((p) => {
      let projectName = p.name;
      if (typeof p.name === 'object' && p.name !== null && p.name.name) {
        projectName = p.name.name;
        console.log(`✅ Extracted: ${JSON.stringify(p.name)} → "${projectName}"`);
      } else {
        console.log(`✅ Direct: "${projectName}"`);
      }
      
      return {
        id: p.id,
        name: projectName,
        region: p.region,
        available_leads: p.available_leads ?? 0,
        price_per_lead: p.price_per_lead ?? null,
        description: p.description ?? null,
        created_at: p.created_at,
        developer: 'Unknown'
      };
    });
    
    // Step 3: Show final display names
    console.log('\n📋 Step 3: Final project names for dropdown:');
    mappedData.forEach((project, i) => {
      console.log(`${i + 1}. "${project.name}" (ID: ${project.id})`);
    });
    
    // Step 4: Test search functionality
    console.log('\n🔍 Step 4: Testing search functionality...');
    const searchTerm = 'jaz'; // Try searching for "jaz" (should find "Jazebeya")
    const filtered = mappedData.filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.region.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`Search for "${searchTerm}" found:`, filtered.length, 'projects');
    filtered.forEach(project => {
      console.log(`  - "${project.name}" (${project.region})`);
    });
    
    // Step 5: Simulate dropdown display
    console.log('\n🎯 Step 5: Simulated dropdown display:');
    mappedData.slice(0, 3).forEach((project, i) => {
      console.log(`Dropdown item ${i + 1}:`);
      console.log(`  🏢 Icon: Building icon`);
      console.log(`  📝 Name: "${project.name}"`);
      console.log(`  🏘️  Details: ${project.developer} • ${project.region}`);
      console.log(`  💰 Price: ${project.price_per_lead || 'N/A'} EGP`);
    });
    
    console.log('\n✅ Project display test completed!');
    console.log('💡 Check the admin page dropdown to see if names display correctly now.');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

// Run the test
testProjectDisplay();
