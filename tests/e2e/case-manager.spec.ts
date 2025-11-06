import { test, expect } from '@playwright/test';

// Test credentials - update these based on your test environment
const TEST_EMAIL = 'test@salemate.com';
const TEST_PASSWORD = 'testpassword123';

test.describe('Case Manager - New Lead Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/**');
  });

  test('should auto-create CALL_NOW action when stage changes to New Lead', async ({ page }) => {
    // Navigate to CRM
    await page.goto('/app/crm');
    await page.waitForLoadState('networkidle');

    // Click on first lead to open case manager
    const firstLead = page.locator('[data-testid="lead-card"]').first();
    await firstLead.click();

    // Should be on case manager page
    await expect(page).toHaveURL(/\/app\/crm\/case\/.+/);

    // Change stage to "New Lead"
    await page.click('button:has-text("New Lead")');

    // Verify modal opens
    await expect(page.locator('text=Change Stage to: New Lead')).toBeVisible();

    // Submit stage change
    await page.click('button:has-text("Change to New Lead")');

    // Verify CALL_NOW action appears
    await expect(page.locator('text=CALL NOW')).toBeVisible({ timeout: 10000 });

    // Verify notification bell shows reminder
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Case Manager - Potential Lead Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/**');
  });

  test('should require feedback and show AI recommendations', async ({ page }) => {
    // Navigate to a lead case
    await page.goto('/app/crm');
    await page.locator('[data-testid="lead-card"]').first().click();

    // Change stage to "Potential"
    await page.click('button:has-text("Potential")');

    // Verify feedback field appears
    await expect(page.locator('textarea[placeholder*="feedback"]')).toBeVisible();

    // Fill feedback
    await page.fill('textarea[placeholder*="feedback"]', 'Client is very interested. Looking for 3-bedroom apartment in New Cairo. Budget around 5M EGP.');

    // Submit
    await page.click('button:has-text("Change to Potential")');

    // Wait for AI coach panel to appear
    await expect(page.locator('text=AI Coach Recommendations')).toBeVisible({ timeout: 15000 });

    // Verify recommendations are shown
    await expect(page.locator('[data-testid="ai-recommendation"]').first()).toBeVisible();

    // Verify meeting scheduler is visible
    await expect(page.locator('text=Schedule Meeting')).toBeVisible();
  });
});

test.describe('Case Manager - Low Budget Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/**');
  });

  test('should collect budget and show inventory matches', async ({ page }) => {
    // Navigate to case
    await page.goto('/app/crm');
    await page.locator('[data-testid="lead-card"]').first().click();

    // Change stage to "Low Budget"
    await page.click('button:has-text("Low Budget")');

    // Fill budget info
    await page.fill('input[placeholder*="Total Budget"]', '2000000');
    await page.fill('input[placeholder*="Down Payment"]', '300000');
    await page.fill('input[placeholder*="Monthly Installment"]', '30000');

    // Submit
    await page.click('button:has-text("Change to Low Budget")');

    // Verify inventory matches card appears
    await expect(page.locator('text=Inventory Matches')).toBeVisible({ timeout: 10000 });

    // Verify recommendation text is shown
    await expect(page.locator('[data-testid="inventory-recommendation"]')).toBeVisible();
  });
});

test.describe('Case Manager - Face Change', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/**');
  });

  test('should allow agent reassignment', async ({ page }) => {
    // Navigate to case
    await page.goto('/app/crm');
    await page.locator('[data-testid="lead-card"]').first().click();

    // Click "Change Face" button
    await page.click('button:has-text("Change Face")');

    // Modal should open
    await expect(page.locator('text=Change Face')).toBeVisible();

    // Select new agent from dropdown
    await page.click('[data-testid="agent-select"]');
    await page.locator('[role="option"]').first().click();

    // Add reason
    await page.fill('textarea[placeholder*="reason"]', 'Client needs different expertise');

    // Submit
    await page.click('button:has-text("Reassign Lead")');

    // Verify face change appears in activity log
    await expect(page.locator('text=Face Changed')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Case Manager - Meeting Scheduler', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/**');
  });

  test('should create meeting with T-24h and T-2h reminders', async ({ page }) => {
    // Navigate to case
    await page.goto('/app/crm');
    await page.locator('[data-testid="lead-card"]').first().click();

    // Open meeting scheduler
    await expect(page.locator('text=Schedule Meeting')).toBeVisible();

    // Set meeting date (tomorrow at 2pm)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const dateValue = tomorrow.toISOString().slice(0, 16);
    
    await page.fill('input[type="datetime-local"]', dateValue);

    // Submit
    await page.click('button:has-text("Schedule Meeting")');

    // Verify success message
    await expect(page.locator('text=Meeting scheduled successfully')).toBeVisible({ timeout: 5000 });

    // Verify meeting action appears in actions list
    await expect(page.locator('text=REMIND_MEETING')).toBeVisible();
  });
});

test.describe('Notifications System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/app/**');
  });

  test('should display in-app notifications in bell dropdown', async ({ page }) => {
    // Navigate to CRM
    await page.goto('/app/crm');

    // Create an action that triggers a notification (change to New Lead)
    await page.locator('[data-testid="lead-card"]').first().click();
    await page.click('button:has-text("New Lead")');
    await page.click('button:has-text("Change to New Lead")');

    // Wait a moment for notification to be created
    await page.waitForTimeout(2000);

    // Click notification bell
    await page.click('[aria-label="Notifications"]');

    // Verify notification appears in dropdown
    await expect(page.locator('text=Call Now Required')).toBeVisible();

    // Click notification
    await page.locator('text=Call Now Required').click();

    // Verify it redirects/stays on case page
    await expect(page).toHaveURL(/\/app\/crm\/case\/.+/);
  });
});

