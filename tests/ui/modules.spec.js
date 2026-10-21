import { test, expect } from '@playwright/test';
import { navigation } from '../../src/app.js';

for (const width of [390, 768, 1440]) {
  test(`all preview modules render without overflow at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [slug] of navigation) {
      await page.goto(`/${slug}`);
      await expect(page.locator('main h1').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), slug).toBe(true);
      expect(await page.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)), slug).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${slug}-${width}.png`), fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test('component preview opens and dismisses a modal and shows a toast', async ({ page }) => {
  await page.goto('/references');
  await page.getByRole('button', { name: 'Buka contoh modal' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#componentModal')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#componentModal')).toBeHidden();
  await expect(page.locator('#componentModal')).not.toHaveClass(/show/);
  await page.getByRole('button', { name: 'Tampilkan contoh toast' }).click();
  await expect(page.locator('#componentToast .toast')).toBeVisible();
});

test('mobile table cards preserve column labels and disabled forms are labelled', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/master-barang');
  const cell = page.locator('td[data-label="Nama Barang"]').first();
  await expect(cell).toBeVisible();
  expect(await cell.evaluate(el => getComputedStyle(el, '::before').content)).toContain('Nama Barang');
  await expect(page.getByLabel('Nama Barang', { exact: true })).toBeDisabled();
  await expect(page.locator('a:not([href])').first()).toHaveAttribute('aria-disabled', 'true');
});
