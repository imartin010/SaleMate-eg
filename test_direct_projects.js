// Direct test for projects loading
// Run this in your browser console on the admin page

const testDirectProjects = async () => {
  console.log('🧪 Testing direct projects loading...');
  
  try {
    // Test 1: Check if supabase client is available
    if (typeof supabase === 'undefined') {
      console.error('❌ supabase client not available');
      return;
    }
    
    console.log('✅ supabase client available');
    
    // Test 2: Try direct query
    console.log('🔄 Attempting direct projects query...');
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, region, available_leads, price_per_lead, description, created_at')
      .order('name');
    
    if (error) {
      console.error('❌ Direct query failed:', error);
      return;
    }
    
    console.log('📊 Direct query results:');
    console.log('Projects loaded:', data?.length || 0);
    console.log('Projects data:', data);
    
    if (data && data.length > 0) {
      console.log('✅ SUCCESS: Direct query worked!');
      console.log('First project:', data[0]);
      
      // Test 3: Check if we can access the admin function
      if (typeof getAllProjectsAdmin !== 'undefined') {
        console.log('✅ getAllProjectsAdmin function is available');
        try {
          const adminData = await getAllProjectsAdmin();
          console.log('Admin function result:', adminData);
        } catch (adminError) {
          console.log('⚠️ Admin function failed:', adminError);
        }
      } else {
        console.log('❌ getAllProjectsAdmin function not available');
      }
    } else {
      console.log('⚠️ WARNING: No projects found in database');
      console.log('💡 Try running the quick_projects_fix.sql script in Supabase');
    }
    
  } catch (error) {
    console.error('💥 ERROR: Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
};

// Run the test
testDirectProjects();
