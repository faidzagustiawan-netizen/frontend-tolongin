const { chromium } = require('playwright');

(async () => {
  console.log('Starting E2E test on https://frontend-tolongin.vercel.app ...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Visit homepage
    console.log('Navigating to homepage...');
    await page.goto('https://frontend-tolongin.vercel.app');
    console.log('Homepage loaded.');
    
    // 2. Go to login
    await page.goto('https://frontend-tolongin.vercel.app/login');
    console.log('Login page loaded.');
    
    // We will just do a quick navigation check to see if layout interceptor works when not logged in
    // Note: actually if not logged in, /workspace should redirect to /login
    await page.goto('https://frontend-tolongin.vercel.app/workspace/challenges/create');
    const currentUrl = page.url();
    console.log('Tried to access /workspace/challenges/create. Result URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('SUCCESS: Unauthenticated user redirected to login.');
    } else {
      console.log('FAILED: Unauthenticated user was NOT redirected to login.');
    }
    
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
    console.log('Test finished.');
  }
})();
