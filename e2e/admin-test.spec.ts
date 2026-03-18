import { test, expect } from '@playwright/test'

const screenshotDir = './screenshots'

// These tests require a logged-in admin user
// For now, we test the redirects and public-facing admin flows

test.describe('Admin pages tests', () => {
  test('Admin dashboard redirects to login', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should redirect to login
    await expect(page).toHaveURL(/login/)

    await page.screenshot({
      path: `${screenshotDir}/22-admin-redirect-login.png`,
      fullPage: true
    })
  })

  test('Admin listings page redirects to login', async ({ page }) => {
    await page.goto('/admin/listings')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/login/)
  })

  test('Admin import page redirects to login', async ({ page }) => {
    await page.goto('/admin/import')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/login/)
  })

  test('Admin leads page redirects to login', async ({ page }) => {
    await page.goto('/admin/leads')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/login/)
  })

  test('Login form validation', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Try submitting empty form
    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.click()

    await page.waitForTimeout(500)

    await page.screenshot({
      path: `${screenshotDir}/23-login-validation.png`,
      fullPage: true
    })
  })

  test('Register form validation', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    // Fill form with mismatched passwords
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')

    // Find confirm password field
    const passwordFields = page.locator('input[type="password"]')
    const count = await passwordFields.count()
    if (count > 1) {
      await passwordFields.nth(1).fill('different123')
    }

    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.click()

    await page.waitForTimeout(500)

    await page.screenshot({
      path: `${screenshotDir}/24-register-validation.png`,
      fullPage: true
    })
  })
})
