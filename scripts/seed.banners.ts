import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedBanners() {
  console.log('🎨 Seeding dashboard banners...\n');

  // Get admin user ID (11111111-1111-1111-1111-111111111111)
  const adminId = '11111111-1111-1111-1111-111111111111';

  const banners = [
    {
      title: 'Welcome to SaleMate!',
      subtitle: 'Start browsing quality real estate leads from top developers across Egypt',
      cta_label: 'Browse Leads',
      cta_url: '/app/shop',
      placement: 'dashboard_top',
      audience: ['user', 'manager', 'admin'],
      visibility_rules: {},
      status: 'live',
      start_at: new Date().toISOString(),
      end_at: null,
      priority: 10,
      created_by: adminId,
    },
    {
      title: 'Top Up Your Wallet',
      subtitle: 'Add credits to your wallet and never miss a quality lead opportunity',
      cta_label: 'Top Up Now',
      cta_url: '/app/wallet',
      placement: 'dashboard_grid',
      audience: ['user', 'manager'],
      visibility_rules: {
        max_wallet_balance: 500, // Only show if wallet < 500 EGP
      },
      status: 'live',
      start_at: new Date().toISOString(),
      end_at: null,
      priority: 20,
      created_by: adminId,
    },
    {
      title: '🎉 Special Offer: Premium Leads',
      subtitle: 'Get 20% off on leads from luxury developments this week only!',
      cta_label: 'View Offers',
      cta_url: '/app/shop?filter=premium',
      placement: 'dashboard_grid',
      audience: ['user', 'manager'],
      visibility_rules: {},
      status: 'scheduled',
      start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      priority: 5,
      created_by: adminId,
    },
  ];

  const { data, error } = await supabase
    .from('dashboard_banners')
    .insert(banners)
    .select();

  if (error) {
    console.error('❌ Error seeding banners:', error);
    return;
  }

  console.log(`✅ ${data?.length || 0} banners seeded successfully!\n`);
  console.log('Banners created:');
  data?.forEach((banner, index) => {
    console.log(`  ${index + 1}. ${banner.title} (${banner.status})`);
  });
  
  console.log('\n🎉 Banner seeding complete!\n');
}

// Run the seed
seedBanners().catch(console.error);

