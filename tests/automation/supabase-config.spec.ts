import { test, expect } from '@playwright/test';

/**
 * Automated Supabase Configuration Verification
 * These tests verify that Supabase is properly configured
 */

const SUPABASE_DASHBOARD_URL = 'https://supabase.com/dashboard';

test.describe('Supabase Configuration Verification', () => {
  test.skip('verify Supabase Edge Functions are deployed', async ({ page }) => {
    // NOTE: This test requires manual setup of Supabase credentials
    // Skip by default to prevent failures in CI
    
    // Login to Supabase dashboard (requires credentials)
    await page.goto(SUPABASE_DASHBOARD_URL);
    
    // Navigate to Edge Functions
    await page.click('text=Edge Functions');
    
    // Verify all required functions exist
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
      await expect(page.locator(`text=${funcName}`)).toBeVisible();
    }
    
    // Take screenshot for documentation
    await page.screenshot({ path: 'docs/screenshots/edge-functions.png', fullPage: true });
  });

  test.skip('verify Supabase secrets are set', async ({ page }) => {
    // Login to Supabase dashboard
    await page.goto(SUPABASE_DASHBOARD_URL);
    
    // Navigate to Edge Functions > Secrets
    await page.click('text=Edge Functions');
    await page.click('text=Secrets');
    
    // Verify OPENAI_API_KEY is present
    await expect(page.locator('text=OPENAI_API_KEY')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'docs/screenshots/supabase-secrets.png' });
  });

  test.skip('verify database tables exist', async ({ page }) => {
    // Login to Supabase dashboard
    await page.goto(SUPABASE_DASHBOARD_URL);
    
    // Navigate to Table Editor
    await page.click('text=Table Editor');
    
    // Verify case manager tables exist
    const tables = [
      'case_feedback',
      'case_actions',
      'case_faces',
      'inventory_matches',
      'notifications',
    ];
    
    for (const table of tables) {
      await expect(page.locator(`text=${table}`)).toBeVisible();
    }
    
    // Take screenshot
    await page.screenshot({ path: 'docs/screenshots/database-tables.png', fullPage: true });
  });
});

test.describe('Local Development Setup', () => {
  test('verify dev server is running', async ({ page }) => {
    // Check if dev server responds
    const response = await page.goto('http://localhost:5173');
    expect(response?.status()).toBe(200);
  });

  test('verify app loads without errors', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Verify no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Allow some warnings but no critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('Warning') && 
      !e.includes('[vite]') &&
      !e.includes('DevTools')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

