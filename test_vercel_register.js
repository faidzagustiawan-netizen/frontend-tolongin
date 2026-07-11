const { chromium } = require('playwright');

(async () => {
  console.log('Starting E2E registration test on https://frontend-tolongin.vercel.app ...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', async res => { if(res.status() >= 400) console.log('ERR RES:', await res.text()) });
  page.on('requestfailed', request => console.log('REQ FAILED:', request.url(), request.failure().errorText));
  
  try {
    // Wait for network idle after navigation
    await page.goto('https://frontend-tolongin.vercel.app/register', { waitUntil: 'networkidle' });
    console.log('Register page loaded.');
    
    // Fill the registration form for TALENT
    const timestamp = Date.now();
    await page.fill('input[name="fullName"]', 'Test User ' + timestamp);
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    
    // Select TALENT role (assuming there's a select or radio button)
    // Actually, usually role selection is a UI toggle or dropdown.
    // If we can't find it easily, let's just click the submit button.
    
    await page.click('button:has-text(\"Talent\")').catch(() => console.log('No Talent button found'));
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      console.log('Submit button clicked.');
      
      // Wait for navigation or API response
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('URL after submit:', currentUrl);
      
      // We can check if there are any toast messages or errors
      const bodyText = await page.innerText('body');
      if (bodyText.includes('berhasil') || currentUrl.includes('/login') || currentUrl.includes('/workspace')) {
         console.log('SUCCESS: Registration seems to have worked.');
      } else {
         console.log('FAILED: Registration might not have worked or Backend is unreachable.');
      }
    } else {
      console.log('FAILED: Submit button not found.');
    }
    
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
    console.log('Test finished.');
  }
})();
