const { chromium } = require('playwright');

(async () => {
  console.log('--- Starting Comprehensive E2E Tests on Vercel ---');
  const browser = await chromium.launch({ headless: true });
  
  // Test 1: Company Registration & Workspace Lockout
  try {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    const timestamp = Date.now();
    
    console.log('[Test 1] Registering as COMPANY...');
    await page1.goto('https://frontend-tolongin.vercel.app/register', { waitUntil: 'networkidle' });
    
    // Fill form
    await page1.fill('input[name="companyName"]', 'Tolongin E2E Corp ' + timestamp);
    await page1.fill('input[name="email"]', `corp${timestamp}@example.com`);
    await page1.fill('input[name="password"]', 'Password123!');
    
    // Click "TOLONGIN COMPANY" button (the label or button that switches role)
    // Looking at the code previously, it might be a div with 'TOLONGIN COMPANY' text
    await page1.click('text="TOLONGIN COMPANY"').catch(() => console.log('Could not click Company tab'));
    
    // Select industry and tier if they appear
    await page1.fill('input[name="industry"]').catch(() => {});
    
    const submitBtn = await page1.$('button[type="submit"]');
    await submitBtn.click();
    await page1.waitForTimeout(3000); // wait for redirect
    
    console.log('[Test 1] Navigating to /workspace...');
    await page1.goto('https://frontend-tolongin.vercel.app/workspace', { waitUntil: 'networkidle' });
    const workspaceText = await page1.innerText('body');
    if (workspaceText.includes('Menunggu Persetujuan Admin')) {
      console.log('[Test 1] SUCCESS: Pending Approval UI is displayed on /workspace');
    } else {
      console.log('[Test 1] FAILED: Pending Approval UI NOT displayed. Found text length:', workspaceText.length);
    }
    
    console.log('[Test 1] Attempting to bypass by visiting /workspace/challenges/create ...');
    await page1.goto('https://frontend-tolongin.vercel.app/workspace/challenges/create', { waitUntil: 'networkidle' });
    const bypassText = await page1.innerText('body');
    if (bypassText.includes('Menunggu Persetujuan Admin')) {
      console.log('[Test 1] SUCCESS: Pending Approval UI successfully intercepted /workspace/challenges/create');
    } else {
      console.log('[Test 1] FAILED: Interceptor did not block access!');
    }
    
    await context1.close();
  } catch (err) {
    console.error('[Test 1] Error:', err);
  }

  // Test 2: Unauthenticated Access Check
  try {
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    console.log('[Test 2] Testing unauthenticated access to protected routes...');
    
    // By default, if not logged in, user store is empty. Let's see what happens if they visit /workspace
    await page2.goto('https://frontend-tolongin.vercel.app/workspace', { waitUntil: 'networkidle' });
    const url2 = page2.url();
    console.log('[Test 2] URL after trying /workspace:', url2);
    // Since we didn't implement global redirect yet, it will probably stay on /workspace but fail APIs
    
    await context2.close();
  } catch (err) {
    console.error('[Test 2] Error:', err);
  }

  await browser.close();
  console.log('--- Comprehensive E2E Tests Finished ---');
})();
