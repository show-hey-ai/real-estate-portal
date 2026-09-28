import { test, expect } from '@playwright/test'

test.describe('Portal desktop UX foundations', () => {
  test('home exposes a branded shell and clear primary paths', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('[data-testid="public-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="home-search-panel"]')).toBeVisible()
    await expect(page.locator('a[href="/listings"]').first()).toBeVisible()
    await expect(page.locator('a[href="/register"]').last()).toBeVisible()
  })

  test('listings keeps acquisition filters visible on desktop', async ({ page }) => {
    await page.goto('/listings')

    await expect(page.locator('[data-testid="listings-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="listing-filters"]')).toBeVisible()
    await expect(page.locator('[data-testid="listings-results"]')).toBeVisible()
  })

  test('auth pages use the shared branded entry point', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('[data-testid="auth-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="auth-brand"]')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})
