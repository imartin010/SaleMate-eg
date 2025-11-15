// Test script for projects loading
// Run this in your browser console on the admin page

const testProjectsLoading = async () => {
  console.log('🧪 Testing projects loading...');
  
  try {
    // Test 1: Check if getAllProjectsAdmin is available
    if (typeof getAllProjectsAdmin === 'undefined') {
      console.error('❌ getAllProjectsAdmin function not available');
      return;
    }
    
    // Test 2: Try loading projects
    console.log('🔄 Attempting to load projects...');
    const projects = await getAllProjectsAdmin();
    
    console.log('📊 Results:');
    console.log('Projects loaded:', projects.length);
    console.log('Projects data:', projects);
    
    if (projects.length > 0) {
      console.log('✅ SUCCESS: Projects loaded successfully!');
      console.log('First project:', projects[0]);
    } else {
      console.log('⚠️ WARNING: No projects found in database');
    }
    
  } catch (error) {
    console.error('💥 ERROR: Failed to load projects:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
};

// Run the test
testProjectsLoading();
