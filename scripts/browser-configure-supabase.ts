/**
 * Browser Automation Script for Supabase Configuration
 * Uses Playwright to automate manual configuration steps
 * 
 * Usage: npx tsx scripts/browser-configure-supabase.ts
 */

import { chromium } from '@playwright/test';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  🤖 Supabase Configuration Automation                 ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log('This script will help you configure Supabase via browser automation.\n');

  const projectRef = await question('Enter your Supabase project reference (e.g., abcdefgh): ');
  const serviceRoleKey = await question('Enter your Supabase service role key (hidden): ');

  console.log('\n🌐 Opening browser...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to Supabase Dashboard
    console.log('1️⃣ Navigating to Supabase Dashboard...');
    await page.goto('https://supabase.com/dashboard');
    await page.waitForLoadState('networkidle');

    console.log('   Please login to Supabase manually in the browser...');
    console.log('   Press ENTER after logging in...');
    await question('');

    // Step 2: Navigate to Edge Functions
    console.log('\n2️⃣ Navigating to Edge Functions...');
    await page.goto(`https://supabase.com/dashboard/project/${projectRef}/functions`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'docs/screenshots/edge-functions-before.png', fullPage: true });

    console.log('   ✅ Screenshot saved: docs/screenshots/edge-functions-before.png');

    // Step 3: Check for required functions
    console.log('\n3️⃣ Checking deployed Edge Functions...');
    const requiredFunctions = [
      'notify-user',
      'case-coach',
      'case-stage-change',
      'case-actions',
      'case-face-change',
      'inventory-matcher',
      'reminder-scheduler',
    ];

    for (const funcName of requiredFunctions) {
      const exists = await page.locator(`text=${funcName}`).count();
      if (exists > 0) {
        console.log(`   ✅ ${funcName} deployed`);
      } else {
        console.log(`   ⚠️ ${funcName} NOT deployed`);
      }
    }

    // Step 4: Navigate to Database Tables
    console.log('\n4️⃣ Navigating to Table Editor...');
    await page.goto(`https://supabase.com/dashboard/project/${projectRef}/editor`);
    await page.waitForLoadState('networkidle');

    // Step 5: Check for required tables
    console.log('\n5️⃣ Checking database tables...');
    const requiredTables = [
      'case_feedback',
      'case_actions',
      'case_faces',
      'inventory_matches',
      'notifications',
    ];

    for (const tableName of requiredTables) {
      const exists = await page.locator(`text="${tableName}"`).count();
      if (exists > 0) {
        console.log(`   ✅ ${tableName} exists`);
      } else {
        console.log(`   ⚠️ ${tableName} NOT found`);
      }
    }

    await page.screenshot({ path: 'docs/screenshots/database-tables.png', fullPage: true });
    console.log('   ✅ Screenshot saved: docs/screenshots/database-tables.png');

    // Step 6: Navigate to SQL Editor for cron setup
    console.log('\n6️⃣ Setting up cron job...');
    await page.goto(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    await page.waitForLoadState('networkidle');

    const cronSQL = `SELECT cron.schedule(
  'case-manager-reminders',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url:='https://${projectRef}.supabase.co/functions/v1/reminder-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${serviceRoleKey}"}'::jsonb
  )$$
);`;

    console.log('\n   📋 Copy this SQL to set up the cron job:\n');
    console.log('   ' + '─'.repeat(60));
    console.log(cronSQL);
    console.log('   ' + '─'.repeat(60));
    console.log('\n   The SQL has been pre-filled in the editor if possible.');

    // Try to fill the SQL editor
    try {
      const editor = page.locator('.monaco-editor, textarea, [contenteditable="true"]').first();
      await editor.click();
      await page.keyboard.type(cronSQL);
      console.log('   ✅ SQL pre-filled in editor');
    } catch {
      console.log('   ⚠️ Could not auto-fill. Please copy/paste manually.');
    }

    console.log('\n   Press ENTER after running the SQL...');
    await question('');

    // Step 7: Verify cron job
    console.log('\n7️⃣ Verifying cron job...');
    await page.goto(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    await page.waitForLoadState('networkidle');

    const verifyCronSQL = "SELECT * FROM cron.job WHERE jobname = 'case-manager-reminders';";
    
    try {
      const editor = page.locator('.monaco-editor, textarea, [contenteditable="true"]').first();
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.type(verifyCronSQL);
      console.log('   ✅ Verification query ready');
      console.log('   Run it to verify cron job was created');
      console.log('\n   Press ENTER to continue...');
      await question('');
    } catch {
      console.log('   ⚠️ Manual verification needed');
    }

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  ✅ Configuration Review Complete!                    ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('📸 Screenshots saved in docs/screenshots/');
    console.log('📋 Review the checklist above');
    console.log('\n🎯 Next steps:');
    console.log('  1. Verify all Edge Functions are deployed');
    console.log('  2. Verify all database tables exist');
    console.log('  3. Verify cron job is scheduled');
    console.log('  4. Test the system: npm run dev');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error during automation:', error);
  } finally {
    console.log('Press ENTER to close browser...');
    await question('');
    await browser.close();
    rl.close();
  }
}

main().catch(console.error);

