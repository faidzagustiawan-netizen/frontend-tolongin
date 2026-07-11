const { chromium } = require('playwright');

(async () => {
  console.log('--- Starting Comprehensive Feature Tests on Vercel ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect all console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });
  
  try {
    const timestamp = Date.now();
    const email = `talent${timestamp}@example.com`;
    const password = 'Password123!';
    
    // 1. REGISTER
    console.log('[1] Registering a new TALENT account...');
    await page.goto('https://frontend-tolongin.vercel.app/register', { waitUntil: 'networkidle' });
    await page.fill('input[name="fullName"]', 'Test Talent ' + timestamp);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    
    // Ensure "TALENT" tab is active (it's the default usually)
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(3000); // Wait for API and redirect
    
    // Verify redirect
    let currentUrl = page.url();
    if (currentUrl.includes('/profile')) {
      console.log('  -> Registration SUCCESS. Redirected to /profile.');
    } else {
      console.log('  -> Registration FAILED or did not redirect. Current URL:', currentUrl);
      // Wait, maybe we were logged in directly? Or maybe we need to login manually?
    }
    
    // Let's do a manual login just in case
    console.log('[2] Attempting to Login...');
    await page.goto('https://frontend-tolongin.vercel.app/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    const loginBtn = await page.$('button[type="submit"]');
    await loginBtn.click();
    await page.waitForTimeout(3000);
    
    currentUrl = page.url();
    console.log('  -> URL after Login:', currentUrl);
    
    // 3. Visit Challenges page
    console.log('[3] Visiting /challenges...');
    await page.goto('https://frontend-tolongin.vercel.app/challenges', { waitUntil: 'networkidle' });
    const challengesText = await page.innerText('body');
    if (challengesText.length > 500) {
      console.log('  -> /challenges page rendered successfully.');
    } else {
      console.log('  -> /challenges page might be empty or errored. Text length:', challengesText.length);
    }
    
    // Check if there are any challenge links and click one
    const challengeLinks = await page.$$('a[href^="/challenges/"]');
    if (challengeLinks.length > 0) {
      console.log(`  -> Found ${challengeLinks.length} challenge links. Clicking the first one...`);
      await challengeLinks[0].click();
      await page.waitForTimeout(3000);
      console.log('  -> URL after clicking challenge:', page.url());
      
      const detailText = await page.innerText('body');
      if (detailText.includes('Requirement') || detailText.includes('Challenge')) {
        console.log('  -> Challenge detail page loaded successfully.');
      } else {
        console.log('  -> Challenge detail page might have an issue.');
      }
    } else {
      console.log('  -> No challenge links found on the page (Maybe DB is empty or rendering failed).');
    }
    
    // 4. Visit Talent Dashboard
    console.log('[4] Visiting /talent/dashboard (or workspace)...');
    await page.goto('https://frontend-tolongin.vercel.app/workspace', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('  -> URL after /workspace:', page.url());
    
  } catch (err) {
    console.error('Test failed with exception:', err);
  } finally {
    await browser.close();
    console.log('--- Feature Tests Finished ---');
  }
})();
