import { test, expect } from '@playwright/test';

test('Homepage memuat Hero Section dan bisa navigasi ke Login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Tolongin.co/);
  
  const heroText = page.locator('text=Setiap talenta layak mendapat');
  await expect(heroText).toBeVisible();

  const startBtn = page.getByRole('button', { name: 'Mulai Eksplorasi Sekarang' });
  await expect(startBtn).toBeVisible();
  
  await startBtn.click();
  await expect(page).toHaveURL(/.*login/);
});
