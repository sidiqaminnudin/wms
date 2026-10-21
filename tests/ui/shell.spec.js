import { test, expect } from '@playwright/test';

test('desktop homepage renders without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Kelola Gudang/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('mobile dashboard exposes off-canvas menu control', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  await expect(page.getByRole('button', { name: 'Buka menu' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Buka menu' }).click();
  await expect(page.locator('#appSidebar')).toHaveClass(/open/);
});

test('mobile sidebar manages keyboard focus, dismissal and desktop resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  const toggle = page.getByRole('button', { name: 'Buka menu' });
  const sidebar = page.locator('#appSidebar');
  const links = sidebar.locator('a[href]');
  await expect(sidebar).toHaveAttribute('inert', '');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(links.first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(links.last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(links.first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(sidebar).toHaveAttribute('inert', '');
  await expect(page.locator('.sidebar-backdrop')).toHaveCount(0);
  await toggle.click();
  await page.locator('.sidebar-backdrop').click({ position: { x: 380, y: 400 } });
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(sidebar).not.toHaveAttribute('inert', '');
  await expect(sidebar).not.toHaveClass(/open/);
  await expect(page.locator('.sidebar-backdrop')).toHaveCount(0);
});

test('login explicitly identifies preview authentication state', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText(/Backend autentikasi akan tersedia/)).toBeVisible();
  await expect(page.getByRole('button', { name: /segera tersedia/i })).toBeDisabled();
});
