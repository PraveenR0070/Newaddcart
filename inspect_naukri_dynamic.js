const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const response = await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'networkidle', timeout: 120000 });
  console.log('URL:', page.url());
  console.log('Status:', response && response.status());
  await page.waitForTimeout(30000);
  const result = await page.evaluate(() => ({
    htmlLength: document.documentElement.outerHTML.length,
    bodyLength: document.body.outerHTML.length,
    innerTextLength: document.body.innerText.length,
    numInputs: document.querySelectorAll('input').length,
    numButtons: document.querySelectorAll('button').length,
    numIframes: document.querySelectorAll('iframe').length,
    bodyText: document.body.innerText.slice(0, 600),
  }));
  console.log(JSON.stringify(result, null, 2));
  await page.screenshot({ path: 'naukri-login-dynamic.png', fullPage: true });
  console.log('Screenshot saved to naukri-login-dynamic.png');
  await browser.close();
})();
