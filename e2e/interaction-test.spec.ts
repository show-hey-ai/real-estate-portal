import { test, expect } from '@playwright/test'

const screenshotDir = './screenshots'

test.describe('Interactive tests', () => {
  test('Filter listings by property type', async ({ page }) => {
    await page.goto('/listings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Open property type dropdown
    const propertyTypeSelect = page.locator('button:has-text("すべての種別")').first()
    if (await propertyTypeSelect.isVisible()) {
      await propertyTypeSelect.click()
      await page.waitForTimeout(500)

      await page.screenshot({
        path: `${screenshotDir}/12-filter-dropdown-open.png`,
        fullPage: false
      })

      // Select a property type if available
      const option = page.locator('[role="option"]').first()
      if (await option.isVisible()) {
        await option.click()
        await page.waitForTimeout(1000)
      }
    }

    await page.screenshot({
      path: `${screenshotDir}/13-after-filter.png`,
      fullPage: true
    })
  })

  test('Test listing detail - click through gallery', async ({ page }) => {
    await page.goto('/listings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click first listing
    const firstListing = page.locator('a[href^="/listings/"]').first()
    await firstListing.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click through gallery thumbnails if present
    const thumbnails = page.locator('img[class*="cursor-pointer"]')
    const thumbCount = await thumbnails.count()

    if (thumbCount > 1) {
      for (let i = 0; i < Math.min(thumbCount, 3); i++) {
        await thumbnails.nth(i).click()
        await page.waitForTimeout(300)
      }
    }

    await page.screenshot({
      path: `${screenshotDir}/14-gallery-interaction.png`,
      fullPage: false
    })
  })

  test('Test favorite button (not logged in)', async ({ page }) => {
    await page.goto('/listings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Find and click a favorite button
    const favoriteBtn = page.locator('button[aria-label*="お気に入り"], button:has(svg[class*="lucide-heart"])').first()
    if (await favoriteBtn.isVisible()) {
      await favoriteBtn.click()
      await page.waitForTimeout(1000)

      await page.screenshot({
        path: `${screenshotDir}/15-favorite-click-not-logged-in.png`,
        fullPage: false
      })
    }
  })

  test('Test language switcher', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click language button
    const langBtn = page.locator('button').filter({ hasText: /日本語|Language|English/ }).first()
    if (await langBtn.isVisible()) {
      await langBtn.click()
      await page.waitForTimeout(500)

      await page.screenshot({
        path: `${screenshotDir}/16-language-dropdown.png`,
        fullPage: false
      })

      // Try switching to Chinese
      const zhOption = page.getByText('繁體中文', { exact: true })
      if (await zhOption.isVisible()) {
        await zhOption.click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        await page.screenshot({
          path: `${screenshotDir}/17-chinese-home.png`,
          fullPage: true
        })
      }
    }
  })

  test('Test inquiry form on detail page', async ({ page }) => {
    await page.goto('/listings')
    await page.waitForLoadState('networkidle')

    const firstListing = page.locator('a[href^="/listings/"]').first()
    await firstListing.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Look for inquiry form
    const inquiryForm = page.locator('form, [class*="inquiry"]')
    if (await inquiryForm.first().isVisible()) {
      await page.screenshot({
        path: `${screenshotDir}/18-inquiry-form.png`,
        fullPage: false
      })
    }

    // Try filling in the form
    const messageInput = page.locator('textarea')
    if (await messageInput.isVisible()) {
      await messageInput.fill('この物件について詳しく教えてください。')

      await page.screenshot({
        path: `${screenshotDir}/19-inquiry-form-filled.png`,
        fullPage: false
      })
    }
  })

  test('Pagination test', async ({ page }) => {
    await page.goto('/listings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Check for pagination
    const pagination = page.locator('nav[aria-label*="pagination"], [class*="pagination"]')
    if (await pagination.isVisible()) {
      await page.screenshot({
        path: `${screenshotDir}/20-pagination.png`,
        fullPage: false
      })

      // Click next page if available
      const nextBtn = page.locator('button:has-text("次"), a:has-text("次"), [aria-label*="next"]').first()
      if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
        await nextBtn.click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        await page.screenshot({
          path: `${screenshotDir}/21-page-2.png`,
          fullPage: true
        })
      }
    }
  })
})
