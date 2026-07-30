import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest hanya untuk logika murni — validasi, perhitungan, transformasi
 * payload. Komponen React sengaja tidak diuji di sini: itu menuntut jsdom
 * beserta testing-library, dan nilainya jauh lebih kecil daripada menguji
 * aturan yang menggerbang seluruh alur.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'e2e', 'test-results', 'playwright-report'],
  },
  resolve: {
    // Alias `@/` mengikuti tsconfig; tanpa ini impor tipe di modul yang diuji
    // gagal di-resolve saat transform.
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
