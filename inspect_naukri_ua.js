const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  try {
    const response = await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'networkidle', timeout: 60000 });
    console.log('URL', page.url());
    console.log('Status', response && response.status());
    const html = await page.content();
    console.log('HTML snippet:', html.slice(0, 600).replace(/\n/g, ' '));
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
