import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCMS() {
  console.log('🌱 Seeding CMS data...\n');

  // Seed Email Templates
  console.log('📧 Seeding email templates...');
  
  const emailTemplates = [
    {
      key: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to SaleMate - {{name}}!',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: linear-gradient(135deg, #1e293b, #475569); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; }
        .footer { text-align: center; padding: 20px; background: #f8fafc; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to SaleMate!</h1>
        </div>
        <div class="content">
            <h2>Hello {{name}},</h2>
            <p>Thank you for joining SaleMate, Egypt's premier real estate lead platform.</p>
            <p>You can now:</p>
            <ul>
                <li>Browse quality real estate leads</li>
                <li>Manage your CRM pipeline</li>
                <li>Track your deals and performance</li>
                <li>Build your team</li>
            </ul>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{dashboard_url}}" class="button">Go to Dashboard</a>
            </p>
        </div>
        <div class="footer">
            <p>© 2024 SaleMate. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
      `,
      variables: ['name', 'dashboard_url'],
      status: 'active',
    },
    {
      key: 'otp',
      name: 'OTP Verification Code',
      subject: 'Your SaleMate Verification Code',
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 40px 20px;">
        <h2>Verification Code</h2>
        <p>Your SaleMate verification code is:</p>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
            {{otp_code}}
        </div>
        <p>This code will expire in {{expiry_minutes}} minutes.</p>
        <p style="color: #64748b; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
    </div>
</body>
</html>
      `,
      variables: ['otp_code', 'expiry_minutes'],
      status: 'active',
    },
    {
      key: 'purchase_confirmation',
      name: 'Purchase Confirmation',
      subject: 'Lead Purchase Confirmed - {{project_name}}',
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2>Purchase Confirmed! 🎉</h2>
        <p>Hi {{name}},</p>
        <p>Your purchase has been confirmed:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f8fafc;">
                <td style="padding: 12px; border: 1px solid #e2e8f0;">Project:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>{{project_name}}</strong></td>
            </tr>
            <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">Quantity:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>{{quantity}} leads</strong></td>
            </tr>
            <tr style="background: #f8fafc;">
                <td style="padding: 12px; border: 1px solid #e2e8f0;">Total Amount:</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>{{amount}} EGP</strong></td>
            </tr>
        </table>
        <p>Your leads are now available in your CRM.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{crm_url}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View My Leads</a>
        </p>
    </div>
</body>
</html>
      `,
      variables: ['name', 'project_name', 'quantity', 'amount', 'crm_url'],
      status: 'active',
    },
  ];

  const { error: emailError } = await supabase
    .from('templates_email')
    .upsert(emailTemplates, { onConflict: 'key' });

  if (emailError) {
    console.error('❌ Error seeding email templates:', emailError);
  } else {
    console.log('✅ Email templates seeded\n');
  }

  // Seed SMS Templates
  console.log('📱 Seeding SMS templates...');
  
  const smsTemplates = [
    {
      key: 'otp_sms',
      name: 'OTP Verification',
      body: 'Your SaleMate verification code is: {{otp_code}}\n\nThis code will expire in {{expiry_minutes}} minutes.',
      variables: ['otp_code', 'expiry_minutes'],
      status: 'active',
    },
    {
      key: 'purchase_confirmation_sms',
      name: 'Purchase Confirmation SMS',
      body: 'SaleMate: Your purchase of {{quantity}} leads from {{project_name}} is confirmed! Total: {{amount}} EGP',
      variables: ['quantity', 'project_name', 'amount'],
      status: 'active',
    },
    {
      key: 'wallet_topup_approved',
      name: 'Wallet Top-up Approved',
      body: 'SaleMate: Your wallet has been credited with {{amount}} EGP. Current balance: {{balance}} EGP',
      variables: ['amount', 'balance'],
      status: 'active',
    },
  ];

  const { error: smsError } = await supabase
    .from('templates_sms')
    .upsert(smsTemplates, { onConflict: 'key' });

  if (smsError) {
    console.error('❌ Error seeding SMS templates:', smsError);
  } else {
    console.log('✅ SMS templates seeded\n');
  }

  // Seed System Settings
  console.log('⚙️  Seeding system settings...');
  
  const systemSettings = [
    {
      key: 'platform_name',
      value: { en: 'SaleMate', ar: 'سيل ميت' },
      description: 'Platform display name',
    },
    {
      key: 'contact_email',
      value: 'support@salemate-eg.com',
      description: 'Main contact email',
    },
    {
      key: 'contact_phone',
      value: '+20 123 456 7890',
      description: 'Support phone number',
    },
    {
      key: 'min_wallet_topup',
      value: 100,
      description: 'Minimum wallet top-up amount (EGP)',
    },
    {
      key: 'default_cpl',
      value: 50,
      description: 'Default cost per lead (EGP)',
    },
  ];

  const { error: settingsError } = await supabase
    .from('system_settings')
    .upsert(systemSettings, { onConflict: 'key' });

  if (settingsError) {
    console.error('❌ Error seeding system settings:', settingsError);
  } else {
    console.log('✅ System settings seeded\n');
  }

  // Seed Feature Flags
  console.log('🚩 Seeding feature flags...');
  
  const featureFlags = [
    {
      key: 'enable_team_invitations',
      description: 'Allow managers to invite team members',
      enabled: true,
    },
    {
      key: 'enable_2fa',
      description: 'Enable two-factor authentication option',
      enabled: true,
    },
    {
      key: 'enable_wallet_system',
      description: 'Enable wallet and credits system',
      enabled: true,
    },
    {
      key: 'enable_deals',
      description: 'Enable deals tracking feature',
      enabled: true,
    },
    {
      key: 'maintenance_mode',
      description: 'Put platform in maintenance mode',
      enabled: false,
    },
  ];

  const { error: flagsError } = await supabase
    .from('feature_flags')
    .upsert(featureFlags, { onConflict: 'key' });

  if (flagsError) {
    console.error('❌ Error seeding feature flags:', flagsError);
  } else {
    console.log('✅ Feature flags seeded\n');
  }

  console.log('🎉 CMS seeding complete!\n');
}

// Run the seed
seedCMS().catch(console.error);

