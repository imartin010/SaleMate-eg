import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Case Manager
 * These tests ensure UI consistency
 */

// Test credentials
const TEST_EMAIL = 'test@salemate.com';
const TEST_PASSWORD = 'testpassword123';

test.describe('Visual Regression - Case Manager', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/**');
  });

  test('Case Manager full page layout', async ({ page }) => {
    // Navigate to a case
    await page.goto('/app/crm');
    await page.waitForLoadState('networkidle');
    
    // Click first lead
    const manageButton = page.locator('button:has-text("Manage")').first();
    await manageButton.click();
    
    // Wait for case manager to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Case:');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('case-manager-full-page.png', {
      fullPage: true,
      timeout: 10000,
    });
  });

  test('Stage Timeline component', async ({ page }) => {
    await page.goto('/app/crm');
    await page.locator('button:has-text("Manage")').first().click();
    await page.waitForSelector('text=Current Stage');
    
    const timeline = page.locator('text=Current Stage').locator('..');
    await expect(timeline).toHaveScreenshot('stage-timeline.png');
  });

  test('AI Coach Panel with recommendations', async ({ page }) => {
    // This test requires a case with AI coaching already present
    await page.goto('/app/crm');
    await page.locator('button:has-text("Manage")').first().click();
    
    // Check if AI coach panel exists
    const coachPanel = page.locator('text=AI Coach Recommendations');
    if (await coachPanel.count() > 0) {
      const panel = coachPanel.locator('..');
      await expect(panel).toHaveScreenshot('ai-coach-panel.png');
    } else {
      console.log('⚠️ No AI coach panel found (no feedback submitted yet)');
    }
  });

  test('Actions List component', async ({ page }) => {
    await page.goto('/app/crm');
    await page.locator('button:has-text("Manage")').first().click();
    await page.waitForSelector('text=Actions & Reminders');
    
    const actionsList = page.locator('text=Actions & Reminders').locator('..');
    await expect(actionsList).toHaveScreenshot('actions-list.png');
  });

  test('Notification Bell dropdown', async ({ page }) => {
    await page.goto('/app/crm');
    
    // Click notification bell
    await page.click('[aria-label="Notifications"]');
    
    // Wait for dropdown
    await page.waitForSelector('text=Notifications');
    
    const dropdown = page.locator('text=Notifications').locator('../..');
    await expect(dropdown).toHaveScreenshot('notification-dropdown.png');
  });

  test('Mobile responsive - Case Manager', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/app/crm');
    await page.locator('button:has-text("Manage")').first().click();
    await page.waitForSelector('text=Case:');
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('case-manager-mobile.png', {
      fullPage: true,
    });
  });
});

test.describe('Visual Regression - Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/**');
  });

  test('Stage Change Modal', async ({ page }) => {
    await page.goto('/app/crm');
    await page.locator('button:has-text("Manage")').first().click();
    
    // Click a stage button
    await page.click('button:has-text("Potential")');
    
    // Wait for modal
    await page.waitForSelector('text=Change Stage to:');
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('stage-change-modal.png');
  });

  test('Change Face Modal', async ({ page }) => {
    await page.goto('/app/crm');
    await page.locator('button:has-text("Manage")').first().click();
    
    // Click change face button
    await page.click('button:has-text("Change Face")');
    
    // Wait for modal
    await page.waitForSelector('text=Change Face');
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('change-face-modal.png');
  });
});

