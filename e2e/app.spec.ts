import { test, expect } from '@playwright/test'

test.describe('View360 app', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows drop zone on initial load', async ({ page }) => {
    await expect(page.locator('.drop-zone')).toBeVisible()
  })

  test('shows correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '360° Image Viewer' })).toBeVisible()
  })

  test('shows browse files button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Browse files' })).toBeVisible()
  })

  test('drop zone highlights on drag over', async ({ page }) => {
    const dropZone = page.locator('.drop-zone')
    await page.evaluate(() => {
      const el = document.querySelector('.drop-zone')!
      el.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }))
    })
    await expect(dropZone).toHaveClass(/drag-over/)
  })
})
