const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(10000);
  const inputs = await page.$$eval('input', nodes => nodes.map(n => ({
    type: n.type,
    id: n.id,
    name: n.name,
    ariaLabel: n.getAttribute('aria-label'),
    placeholder: n.placeholder,
    class: n.className,
  })));
  const buttons = await page.$$eval('button', nodes => nodes.map(n => ({
    type: n.type,
    id: n.id,
    name: n.name,
    text: n.innerText,
    class: n.className,
  })));
  const iframes = await page.$$eval('iframe', nodes => nodes.map(i => ({
    src: i.src,
    id: i.id,
    name: i.name,
    title: i.title,
    display: window.getComputedStyle(i).display,
    visibility: window.getComputedStyle(i).visibility,
  })));
  console.log('inputs:', JSON.stringify(inputs, null, 2));
  console.log('buttons:', JSON.stringify(buttons, null, 2));
  console.log('iframes:', JSON.stringify(iframes, null, 2));
  await browser.close();
})();
