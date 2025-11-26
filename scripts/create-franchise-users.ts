/**
 * Create Franchise Employee and CEO User Accounts
 * 
 * This script creates auth users for all franchises and the CEO
 * Run this AFTER migrations are applied
 * 
 * Usage: npx tsx scripts/create-franchise-users.ts
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface Franchise {
  id: string;
  name: string;
  slug: string;
}

async function createCEOAccount() {
  console.log('\n🔵 Creating CEO account...');
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'ceo@coldwellbanker.com',
    password: 'CWB_CEO_2024',
    email_confirm: true,
    user_metadata: {
      name: 'Coldwell Banker CEO',
      role: 'ceo'
    }
  });

  if (error) {
    console.error('❌ Failed to create CEO account:', error.message);
    return null;
  }

  // Update profile with CEO role
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'ceo', name: 'Coldwell Banker CEO' })
    .eq('id', data.user.id);

  if (updateError) {
    console.error('⚠️  Failed to update CEO profile:', updateError.message);
  }

  console.log('✅ CEO account created: ceo@coldwellbanker.com');
  return data.user.id;
}

async function createFranchiseEmployeeAccount(franchise: Franchise) {
  const email = `${franchise.slug}@coldwellbanker.com`;
  const password = 'CWB2024';
  const name = `${franchise.name} Manager`;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role: 'franchise_employee'
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log(`⚠️  ${franchise.name}: Account already exists`);
      // Get existing user
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      if (existingUser?.user) {
        return existingUser.user.id;
      }
    } else {
      console.error(`❌ ${franchise.name}: ${error.message}`);
    }
    return null;
  }

  // Update profile with franchise_employee role
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'franchise_employee', name })
    .eq('id', data.user.id);

  if (updateError) {
    console.error(`⚠️  Failed to update profile for ${franchise.name}:`, updateError.message);
  }

  // Link user to franchise
  const { error: linkError } = await supabaseAdmin
    .from('performance_franchises')
    .update({ owner_user_id: data.user.id })
    .eq('id', franchise.id);

  if (linkError) {
    console.error(`⚠️  Failed to link ${franchise.name} to user:`, linkError.message);
  }

  console.log(`✅ ${franchise.name}: ${email}`);
  return data.user.id;
}

async function main() {
  console.log('🚀 Creating Performance Program User Accounts\n');

  // Create CEO account
  await createCEOAccount();

  // Fetch all franchises
  console.log('\n🔵 Creating franchise employee accounts...\n');
  const { data: franchises, error } = await supabaseAdmin
    .from('performance_franchises')
    .select('id, name, slug')
    .order('name');

  if (error) {
    console.error('❌ Failed to fetch franchises:', error.message);
    process.exit(1);
  }

  if (!franchises || franchises.length === 0) {
    console.error('❌ No franchises found. Run seed migrations first.');
    process.exit(1);
  }

  console.log(`Found ${franchises.length} franchises\n`);

  // Create account for each franchise
  let successCount = 0;
  for (const franchise of franchises) {
    const userId = await createFranchiseEmployeeAccount(franchise);
    if (userId) successCount++;
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Created ${successCount} franchise employee accounts`);
  
  // Verify
  console.log('\n🔍 Verification:');
  const { data: ceoProfiles } = await supabaseAdmin
    .from('profiles')
    .select('email, role')
    .eq('role', 'ceo');
  console.log(`   CEO accounts: ${ceoProfiles?.length || 0}`);

  const { data: employeeProfiles } = await supabaseAdmin
    .from('profiles')
    .select('email, role')
    .eq('role', 'franchise_employee');
  console.log(`   Franchise employees: ${employeeProfiles?.length || 0}`);

  const { data: linkedFranchises } = await supabaseAdmin
    .from('performance_franchises')
    .select('name')
    .not('owner_user_id', 'is', null);
  console.log(`   Franchises linked: ${linkedFranchises?.length || 0}`);

  console.log('\n✅ User account creation complete!');
  console.log('\n📋 Credentials Summary:');
  console.log('   CEO: ceo@coldwellbanker.com / CWB_CEO_2024');
  console.log('   Franchises: {slug}@coldwellbanker.com / CWB2024');
  console.log('\nSee PERFORMANCE_CREDENTIALS.md for complete list.');
}

main().catch(console.error);
