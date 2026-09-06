import { test, expect, type Page } from '@playwright/test'

/** Log in and open a hotel's Hotel Master popup on the Boost tab. */
async function openBoost(page: Page, code: string) {
  await page.goto('/#/login')
  await page.evaluate(() => {
    localStorage.setItem('omh:noticeDismissed', 'true')
    localStorage.setItem('omh:boostOnboarded', 'true') // skip onboarding overlay
  })
  await page.getByPlaceholder('Email address').fill('demo@ohmyhotel.biz')
  await page.getByPlaceholder('Password').fill('demo1234')
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.goto(`/#/vendor/hotel-content/${code}`)
  const dialog = page.getByRole('dialog', { name: 'Hotel Master' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /Boost your hotel/ }).click()
  await expect(page.getByText('콘텐츠 경쟁력 점수')).toBeVisible()
  return dialog
}

const scoreValue = (page: Page) => page.getByTestId('score-value')

async function readScore(page: Page): Promise<number> {
  // Let the count-up animation settle.
  await page.waitForTimeout(900)
  return Number((await scoreValue(page).textContent()) || '0')
}

test.describe('Boost your hotel', () => {
  test('opens with a computed score dashboard', async ({ page }) => {
    await openBoost(page, '2003011') // Ohmy Grand (high)
    const score = await readScore(page)
    expect(score).toBeGreaterThanOrEqual(88)
    await expect(page.getByText('Quick wins', { exact: false })).toBeVisible()
    await expect(page.getByText('콘텐츠 미션')).toBeVisible()
    await expect(page.getByText('OHMYTRIP 실시간 미리보기')).toBeVisible()
  })

  test('existing Basic / Description / Photo tabs still work', async ({ page }) => {
    const dialog = await openBoost(page, '2003011')
    await dialog.getByRole('button', { name: /^basic$/i }).click()
    await expect(dialog.getByText('Hotel code')).toBeVisible()
    await dialog.getByRole('button', { name: /^description$/i }).click()
    await expect(dialog.getByText('Description (EN)')).toBeVisible()
    await dialog.getByRole('button', { name: /^photo$/i }).click()
    await expect(dialog.getByText(/Add photo|Representative|사진/i).first()).toBeVisible()
  })

  test('adding facilities raises the score and shows in the live preview', async ({ page }) => {
    const dialog = await openBoost(page, '2004521') // Sakura (low)
    const before = await readScore(page)
    // Open the Facilities mission and add several facilities.
    await dialog.getByRole('button', { name: '시설 및 서비스', exact: false }).first().click()
    for (const f of ['Swimming Pool', 'Fitness Center', 'Spa & Sauna', 'Business Center', 'Room Service', 'Concierge']) {
      await dialog.getByRole('button', { name: f, exact: true }).click()
    }
    const after = await readScore(page)
    expect(after).toBeGreaterThan(before)
    // Live preview reflects the new facility before saving (scoped to the preview).
    await expect(dialog.getByTestId('ohmytrip-preview').getByText('Swimming Pool')).toBeVisible()
  })

  test('facility chips show icons and support custom entries', async ({ page }) => {
    const dialog = await openBoost(page, '2003011')
    await dialog.getByRole('button', { name: '시설 및 서비스', exact: false }).first().click()
    // Add a facility that is not in the preset list.
    const input = dialog.getByPlaceholder(/직접 추가/).first()
    await input.fill('루프탑 인피니티 풀')
    await dialog.getByRole('button', { name: '추가' }).click()
    // The custom facility becomes a chip and appears in the live preview.
    await expect(dialog.getByRole('button', { name: /루프탑 인피니티 풀/ })).toBeVisible()
    await expect(dialog.getByTestId('ohmytrip-preview').getByText('루프탑 인피니티 풀')).toBeVisible()
  })

  test('device preview toggle switches to mobile', async ({ page }) => {
    const dialog = await openBoost(page, '2003011')
    const mobileBtn = dialog.getByRole('button', { name: '모바일' }).first()
    await mobileBtn.click()
    await expect(mobileBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('autosave persists across reload', async ({ page }) => {
    const dialog = await openBoost(page, '2004521')
    const before = await readScore(page)
    await dialog.getByRole('button', { name: '시설 및 서비스', exact: false }).first().click()
    for (const f of ['Swimming Pool', 'Fitness Center', 'Spa & Sauna', 'Business Center', 'Room Service', 'Concierge']) {
      await dialog.getByRole('button', { name: f, exact: true }).click()
    }
    await expect(page.getByText('Saved', { exact: false }).first()).toBeVisible({ timeout: 4000 })
    await page.reload()
    await page.getByRole('dialog', { name: 'Hotel Master' }).getByRole('button', { name: /Boost your hotel/ }).click()
    const after = await readScore(page)
    expect(after).toBeGreaterThan(before)
  })

  test('AI enriches the hotel description and raises the score', async ({ page }) => {
    const dialog = await openBoost(page, '2004521') // Sakura — short description
    const before = await readScore(page)
    await dialog.getByRole('button', { name: '호텔 설명', exact: false }).first().click()
    await dialog.getByRole('button', { name: 'AI 초안 생성' }).click()
    const apply = dialog.getByRole('button', { name: /적용 \(교체\)/ })
    await expect(apply).toBeVisible({ timeout: 3000 })
    await apply.click()
    const after = await readScore(page)
    expect(after).toBeGreaterThan(before)
  })

  test('publish request updates the status', async ({ page }) => {
    const dialog = await openBoost(page, '2003011')
    await dialog.getByRole('button', { name: '게시 요청' }).click()
    await expect(page.getByRole('alert').first()).toBeVisible()
  })

  test('data syncs from Boost to the Basic tab', async ({ page }) => {
    const dialog = await openBoost(page, '2004521')
    await dialog.getByRole('button', { name: '기본정보', exact: false }).first().click()
    // The basic-info mission's first text field is the EN hotel name.
    await dialog.locator('input').first().fill('Sakura Bay Resort Osaka EDITED')
    await dialog.getByRole('button', { name: /^basic$/i }).click()
    await expect(dialog.getByLabel('Hotel Name (EN)')).toHaveValue('Sakura Bay Resort Osaka EDITED')
  })

  test('content badge appears in the hotel list', async ({ page }) => {
    await page.goto('/#/login')
    await page.evaluate(() => localStorage.setItem('omh:noticeDismissed', 'true'))
    await page.getByPlaceholder('Email address').fill('demo@ohmyhotel.biz')
    await page.getByPlaceholder('Password').fill('demo1234')
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.goto('/#/vendor/hotel-content')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText(/^Content \d+$/).first()).toBeVisible()
  })
})
