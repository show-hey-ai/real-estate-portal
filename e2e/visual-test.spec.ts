import { test, expect } from '@playwright/test'

const screenshotDir = './screenshots'

test.describe('Visual tests with screenshots', () => {
  test('Homepage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for listings to load
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: `${screenshotDir}/01-home-page.png`,
      fullPage: true
    })

    // Check hero section
    await expect(page.locator('h1')).toBeVisible()

    // Check if listings are displayed
    const listingCards = page.locator('[class*="grid"] a[href^="/listings/"]')
    const count = await listingCards.count()
    console.log(`Found ${count} listing cards on home page`)
  })

  test('Listings page', async ({ page }) => {
    await page.goto('/listings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: `${screenshotDir}/02-listings-page.png`,
      fullPage: true
    })

    // Check page title
    await expect(page.locator('h1')).toContainText(/物件一覧|Listings|房源列表|物件列表/)

    // Check filters are present
    await expect(page.locator('form')).toBeVisible()

    // Count listings
    const listingCards = page.locator('[class*="grid"] > div').filter({ has: page.locator('a[href^="/listings/"]') })
    const count = await listingCards.count()
    console.log(`Found ${count} listings on listings page`)
  })

  test('Listing detail page', async ({ page }) => {
    // First get a listing ID from the listings page
    await page.goto('/listings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const firstListing = page.locator('a[href^="/listings/"]').first()
    const href = await firstListing.getAttribute('href')

    if (href) {
      await page.goto(href)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      await page.screenshot({
        path: `${screenshotDir}/03-listing-detail.png`,
        fullPage: true
      })

      // Check price is displayed
      const priceElement = page.locator('text=/¥|万円/')
      await expect(priceElement.first()).toBeVisible()
    }
  })

  test('Admin dashboard', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: `${screenshotDir}/04-admin-dashboard.png`,
      fullPage: true
    })
  })

  test('Admin listings page', async ({ page }) => {
    await page.goto('/admin/listings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: `${screenshotDir}/05-admin-listings.png`,
      fullPage: true
    })

    // Check table headers
    const table = page.locator('table')
    if (await table.isVisible()) {
      console.log('Admin listings table is visible')
    }
  })

  test('Login page', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: `${screenshotDir}/06-login-page.png`,
      fullPage: true
    })

    // Check login form
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('Register page', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: `${screenshotDir}/07-register-page.png`,
      fullPage: true
    })
  })

  test('Favorites page (requires login)', async ({ page }) => {
    await page.goto('/favorites')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: `${screenshotDir}/08-favorites-page.png`,
      fullPage: true
    })
  })

  test('Language switch to English', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click language switcher (use first() to avoid strict mode violation)
    const langButton = page.locator('button:has-text("日本語"), button:has-text("Language")').first()
    if (await langButton.isVisible()) {
      await langButton.click()
      await page.waitForTimeout(500)

      // Look for English option
      const englishOption = page.locator('text=English').first()
      if (await englishOption.isVisible()) {
        await englishOption.click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
      }
    }

    await page.screenshot({
      path: `${screenshotDir}/09-home-english.png`,
      fullPage: true
    })
  })

  test('Mobile viewport - Home', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: `${screenshotDir}/10-home-mobile.png`,
      fullPage: true
    })
  })

  test('Mobile viewport - Listings', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/listings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: `${screenshotDir}/11-listings-mobile.png`,
      fullPage: true
    })
  })
})
