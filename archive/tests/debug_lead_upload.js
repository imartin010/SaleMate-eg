// Debug script for lead upload issues
// Run this in your browser console on the admin page

const debugLeadUpload = async () => {
  console.log('🔍 Debugging lead upload issue...');
  
  try {
    // Check if supabaseAdmin is available
    if (typeof supabaseAdmin === 'undefined') {
      console.error('❌ supabaseAdmin not available');
      return;
    }
    
    // Test 1: Check projects table access
    console.log('📋 Testing projects table access...');
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name, region')
      .limit(1);
    
    if (projectsError) {
      console.error('❌ Projects table error:', projectsError);
    } else {
      console.log('✅ Projects table accessible:', projects);
    }
    
    // Test 2: Check leads table structure
    console.log('📋 Testing leads table structure...');
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .limit(1);
    
    if (leadsError) {
      console.error('❌ Leads table error:', leadsError);
    } else {
      console.log('✅ Leads table accessible:', leads);
    }
    
    // Test 3: Check if RPC functions exist
    console.log('📋 Testing RPC functions...');
    try {
      const { data: rpcTest, error: rpcError } = await supabaseAdmin
        .rpc('rpc_upload_leads', {
          project_id: 'test',
          leads_data: []
        });
      
      if (rpcError) {
        console.log('⚠️ RPC function exists but has error (expected):', rpcError.message);
      }
    } catch (rpcCatchError) {
      console.log('⚠️ RPC function might not exist:', rpcCatchError.message);
    }
    
    // Test 4: Check user permissions
    console.log('📋 Testing user permissions...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    // Test 5: Check environment variables
    console.log('📋 Environment check:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('Service key available:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🎯 Debug complete! Check the results above.');
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  }
};

// Run the debug
debugLeadUpload();
