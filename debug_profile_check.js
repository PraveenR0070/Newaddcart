const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });

  try {
    await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector("xpath=//input[@id='usernameField']", { timeout: 30000 });
    await page.fill("xpath=//input[@id='usernameField']", 'praveenpadigapati09@gmail.com');
    await page.fill("xpath=//input[@id='passwordField']", 'Telangana@9988');
    await page.locator("button[type='submit']").first().click();
    await page.waitForTimeout(12000);

    console.log('URL_AFTER_LOGIN:', page.url());
    const links = await page.$$eval('a', as => as.map(a => ({
      text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
      href: a.href
    }))).filter(x => /(profile|view|update)/i.test(x.text) || /profile/i.test(x.href));
    console.log('LINKS_MATCHING_PROFILE_OR_VIEW');
    console.log(JSON.stringify(links.slice(0, 50), null, 2));

    const bodyText = await page.locator('body').innerText();
    console.log('HAS_VIEW_PROFILE_TEXT:', /View.*Profile|Update.*Profile/i.test(bodyText));
    console.log(bodyText.slice(0, 2000));
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    await browser.close();
  }
})();
