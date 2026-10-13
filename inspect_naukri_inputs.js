const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'networkidle', timeout: 60000 });
  const inputs = await page.$$eval('input', nodes => nodes.map(n => ({
    type: n.type,
    id: n.id,
    name: n.name,
    ariaLabel: n.getAttribute('aria-label'),
    placeholder: n.placeholder,
    class: n.className,
  })));
  console.log(JSON.stringify(inputs, null, 2));
  const buttons = await page.$$eval('button', nodes => nodes.map(n => ({
    type: n.type,
    id: n.id,
    name: n.name,
    text: n.innerText,
    class: n.className,
  })));
  console.log(JSON.stringify(buttons, null, 2));
  await browser.close();
})();
