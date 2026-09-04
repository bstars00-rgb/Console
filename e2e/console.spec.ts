import { test, expect, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/#/login')
  // Suppress the login-time notice modal so flows aren't blocked by the overlay.
  await page.evaluate(() => localStorage.setItem('omh:noticeDismissed', 'true'))
  await page.getByPlaceholder('Email address').fill('tram.tt@ohmyhotel.com')
  await page.getByPlaceholder('Password').fill('demo1234')
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/#\/vendor\/booking/)
}

test.describe('Ohmyhotel Vendor Console', () => {
  test('demo login and logout', async ({ page }) => {
    await login(page)
    await expect(page.getByText('Payment Period')).toBeVisible()
    // Header log out opens a confirm dialog; confirm it.
    await page.locator('header').getByRole('button', { name: 'Log out' }).click()
    const dialog = page.getByRole('dialog', { name: 'Log out' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/#\/login/)
  })

  test('sidebar navigates all menus and opens tabs', async ({ page }) => {
    await login(page)
    const menus = ['Room Type', 'Rate plan', 'Rate & Allotment', 'Promotion', 'Billings', 'Dashboard', 'FAQ Board', 'Notice', 'Hotel Content']
    for (const label of menus) {
      await page.locator('nav').getByRole('button', { name: label, exact: true }).click()
    }
    // All ten workspace tabs should be open.
    await expect(page.getByRole('button', { name: /^Close/ })).toHaveCount(10)
  })

  test('booking search filters the grid', async ({ page }) => {
    await login(page)
    // Grid starts empty (like the original); Search loads the full set.
    await page.getByRole('button', { name: 'Search' }).click()
    const before = await page.locator('table tbody tr').count()
    expect(before).toBeGreaterThan(1)
    // Filter by a specific ELLIS code that matches a single booking.
    await page.getByLabel('ELLIS Booking Code').fill('S26090001')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.locator('table tbody tr')).toHaveCount(1)
    // Reset clears back to the empty grid.
    await page.getByRole('button', { name: 'Reset' }).click()
    await expect(page.getByText('No records available.')).toBeVisible()
  })

  test('booking detail opens and status changes with a toast', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: 'Search' }).click()
    await page.locator('table tbody tr').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Reservation')).toBeVisible()
    // Try to confirm or cancel (whichever action is available).
    const cancelBtn = dialog.getByRole('button', { name: 'Cancel booking' })
    const confirmBtn = dialog.getByRole('button', { name: 'Confirm' })
    if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click()
    else if (await cancelBtn.isVisible().catch(() => false)) await cancelBtn.click()
    await expect(page.getByRole('alert').first()).toBeVisible()
  })

  test('hotel content popup edits and persists across reload', async ({ page }) => {
    await login(page)
    await page.goto('/#/vendor/hotel-content/1001097')
    const dialog = page.getByRole('dialog', { name: 'Hotel Master' })
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Fax No.').fill('82-2-9999-8888')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()
    // Reload (same hash URL) — the modal auto-opens from the :code param with the persisted value.
    await page.reload()
    await expect(page.getByRole('dialog', { name: 'Hotel Master' }).getByLabel('Fax No.')).toHaveValue('82-2-9999-8888')
  })

  test('required-field validation blocks save in popup', async ({ page }) => {
    await login(page)
    await page.goto('/#/vendor/hotel-content/1001097')
    const dialog = page.getByRole('dialog', { name: 'Hotel Master' })
    await dialog.getByLabel('Hotel Name (EN)').fill('')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog.getByText('Required').first()).toBeVisible()
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await login(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(2)
  })
})
