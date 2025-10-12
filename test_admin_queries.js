// Test admin queries in browser console
// Run this on localhost:5173/app/admin

const testAdminQueries = async () => {
  console.log('🧪 Testing admin queries...\n');

  try {
    // Test 1: Profiles
    console.log('1️⃣ Testing profiles query...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      console.error('❌ Profiles error:', profilesError);
    } else {
      console.log('✅ Profiles loaded:', profiles.length, 'users');
      console.log('First user:', profiles[0]);
    }

    // Test 2: Projects
    console.log('\n2️⃣ Testing projects query...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, region, available_leads, price_per_lead, description')
      .order('name');
    
    if (projectsError) {
      console.error('❌ Projects error:', projectsError);
    } else {
      console.log('✅ Projects loaded:', projects.length, 'projects');
      console.log('First project:', projects[0]);
    }

    // Test 3: Leads count
    console.log('\n3️⃣ Testing leads count query...');
    const { count, error: leadsError } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });
    
    if (leadsError) {
      console.error('❌ Leads error:', leadsError);
    } else {
      console.log('✅ Leads count:', count);
    }

    // Test 4: Purchase requests (optional)
    console.log('\n4️⃣ Testing purchase requests query...');
    const { data: requests, error: requestsError } = await supabase
      .from('lead_purchase_requests')
      .select('id, user_id, project_id, lead_count, total_amount, status, created_at, profiles:user_id(name), projects:project_id(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (requestsError) {
      console.warn('⚠️ Purchase requests error (table may not exist):', requestsError);
    } else {
      console.log('✅ Purchase requests loaded:', requests.length, 'pending');
    }

    console.log('\n✅ All tests completed!');
    console.log('📊 Summary:');
    console.log('  - Profiles:', profiles?.length || 0);
    console.log('  - Projects:', projects?.length || 0);
    console.log('  - Leads:', count || 0);
    console.log('  - Pending Requests:', requests?.length || 0);

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

// Run the test
testAdminQueries();

