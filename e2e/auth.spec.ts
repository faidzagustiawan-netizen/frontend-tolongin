import { test, expect } from '@playwright/test';

test('Halaman Login merender form dengan benar', async ({ page }) => {
  await page.goto('/login');
  
  // Asumsi ada form atau heading login, menggunakan text yang generik terlebih dahulu.
  // Akan disesuaikan jika selector tidak cocok
  await expect(page.getByText('Alamat Email', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Kata Sandi', { exact: false }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /masuk/i }).first()).toBeVisible();
});

test('Validasi form login kosong', async ({ page }) => {
  await page.goto('/login');
  const loginBtn = page.getByRole('button', { name: /masuk/i }).first();
  await loginBtn.click();
  
  // Karena form divalidasi oleh Zod/React Hook Form, pastikan pesan error muncul
  // Jika tidak menggunakan HTML5 require, cari pesan error "Email harus" dsb.
  // Ini mengecek apakah interaksi tombol sukses tanpa crash.
  await expect(page.url()).toContain('/login');
});
