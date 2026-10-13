const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  try {
    let response = await page.goto('https://www.naukri.com', { waitUntil: 'networkidle', timeout: 120000 });
    console.log('Homepage status:', response && response.status());
    console.log('Homepage URL:', page.url());
    const homeText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    console.log('Homepage text snippet:', homeText.replace(/\n/g, ' '));
    response = await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'networkidle', timeout: 120000 });
    console.log('Login page status:', response && response.status());
    console.log('Login page URL:', page.url());
    const loginText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    console.log('Login text snippet:', loginText.replace(/\n/g, ' '));
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
