const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'networkidle' });
  console.log('URL', page.url());
  console.log('Title', await page.title());
  await page.waitForTimeout(5000);

  const html = await page.content();
  console.log('HTML length', html.length);
  console.log('Body snippet', html.slice(0, 1200).replace(/\n/g, ' '));

  const frames = page.frames();
  console.log('Frames:', frames.map(f => ({ url: f.url(), name: f.name() })));

  for (const frame of frames) {
    const inputs = await frame.$$eval('input', nodes => nodes.map(n => ({
      type: n.type,
      id: n.id,
      name: n.name,
      ariaLabel: n.getAttribute('aria-label'),
      placeholder: n.placeholder,
      class: n.className,
    })));
    console.log(`Frame ${frame.url()} inputs:`, JSON.stringify(inputs, null, 2));
  }

  await page.screenshot({ path: 'naukri-login.png', fullPage: true });
  console.log('Saved screenshot to naukri-login.png');

  await browser.close();
})();
