import { test, expect } from '@playwright/test';

test('Backend merespons dengan benar', async ({ request }) => {
  // Mengasumsikan API backend ada di port 3001
  const response = await request.get('http://localhost:3001/api/v1');
  
  // Memastikan server backend online
  expect(response.ok()).toBeTruthy();
  const text = await response.text();
  expect(text).toContain('Hello World'); // Sesuai dengan default NestJS AppController
});
