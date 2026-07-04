import { test, expect } from '@playwright/test';

test.describe('Onboarding & Dashboard Flow', () => {
  test('should load the homepage properly', async ({ page }) => {
    await page.goto('/');
    
    // Validasi elemen hero
    await expect(page.locator('text=Tolongin')).toBeVisible();
    // Assuming the homepage has text like "Temukan" or "Talenta" based on the platform purpose
    // Let's just check for the Masuk button as a proxy for successful load
    await expect(page.locator('text=Masuk')).toBeVisible();
  });

  test('should allow navigation to login page', async ({ page }) => {
    await page.goto('/');
    
    // Klik tombol Masuk
    const loginButton = page.locator('text=Masuk');
    await loginButton.click();

    // Verifikasi URL pindah ke /login
    await expect(page).toHaveURL(/.*\/login/);
    
    // Verifikasi form tampil
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
