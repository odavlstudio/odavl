import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Authentication Flow
 * Tests user registration, login, and session management
 */

test.describe('Authentication Flow', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(() => {
    // Generate unique test credentials for each test
    const timestamp = Date.now();
    testEmail = `e2e-test-${timestamp}@odavl.com`;
    testPassword = 'SecureTestP@ss123';
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check page title
    await expect(page).toHaveTitle(/Login.*ODAVL/i);
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check "Register" link
    await expect(page.locator('text=Register')).toBeVisible();
  });

  test('should display registration page', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check page title
    await expect(page).toHaveTitle(/Register.*ODAVL/i);
    
    // Check form elements
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Fill registration form
    await page.fill('input[name="name"]', 'E2E Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message or redirect
    await page.waitForURL(/\/dashboard|\/auth\/verify/, { timeout: 10000 });
    
    // Verify we're redirected (either to dashboard or verification page)
    const url = page.url();
    expect(url).toMatch(/\/dashboard|\/auth\/verify/);
  });

  test('should show error for duplicate email', async ({ page }) => {
    // First registration
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'E2E Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/auth\/verify/, { timeout: 10000 });
    
    // Try to register again with same email
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Duplicate User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=/already exists|already registered/i')).toBeVisible({
      timeout: 5000
    });
  });

  test('should login with valid credentials', async ({ page }) => {
    // First, register a user
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Login Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/auth\/verify/, { timeout: 10000 });
    
    // Logout (if logged in automatically)
    const logoutButton = page.locator('button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
    
    // Now login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to login with non-existent credentials
    await page.fill('input[type="email"]', 'nonexistent@odavl.com');
    await page.fill('input[type="password"]', 'WrongPassword123');
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=/invalid|incorrect|wrong/i')).toBeVisible({
      timeout: 5000
    });
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Enter invalid email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', testPassword);
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Check for validation error
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => 
      el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Enter weak password
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', '123');
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Check for password validation error
    await expect(page.locator('text=/password.*too short|minimum.*characters/i')).toBeVisible({
      timeout: 5000
    });
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/auth/login');
    
    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('button:has-text("Show")');
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      
      // Check if password is now visible
      await expect(page.locator('input[type="text"]')).toBeVisible();
    }
  });

  test('should persist session after page refresh', async ({ page }) => {
    // Register and login
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Session Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Refresh page
    await page.reload();
    
    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
