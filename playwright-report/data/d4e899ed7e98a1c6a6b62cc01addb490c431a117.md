# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\update_resume_daily.spec.js >> daily resume update
- Location: tests\tests\update_resume_daily.spec.js:51:1

# Error details

```
Error: Resume was uploaded, but the notification email failed: Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to
535 5.7.8  https://support.google.com/mail/?p=BadCredentials 5a478bee46e88-35977229a6esm24534217eec.8 - gsmtp
```

# Test source

```ts
  47  | }
  48  | 
  49  | test.setTimeout(180000);
  50  | 
  51  | test('daily resume update', async () => {
  52  |   const requiredMailSettings = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'RESUME_NOTIFICATION_TO'];
  53  |   const missingMailSettings = requiredMailSettings.filter(name => !process.env[name]);
  54  |   if (missingMailSettings.length) {
  55  |     throw new Error(`Cannot update resume without email notification settings: ${missingMailSettings.join(', ')}`);
  56  |   }
  57  | 
  58  |   const browser = await chromium.launch({ headless: false });
  59  |   const context = await browser.newContext({
  60  |     userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  61  |     viewport: { width: 1280, height: 900 }
  62  |   });
  63  |   const page = await context.newPage();
  64  | 
  65  |   try {
  66  |     console.log('Launching Naukri login for resume update...');
  67  |     await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'networkidle', timeout: 120000 });
  68  | 
  69  |     await retry(() => page.waitForSelector('xpath=//input[@id="usernameField"]', { timeout: 30000 }), 3, 1000);
  70  |     await retry(() => page.fill('xpath=//input[@id="usernameField"]', 'praveenpadigapati09@gmail.com'), 3, 500);
  71  |     await retry(() => page.fill('xpath=//input[@id="passwordField"]', 'Telangana@9988'), 3, 500);
  72  |     await retry(() => page.locator('button[type="submit"]').first().click(), 3, 500);
  73  | 
  74  |     await page.waitForLoadState('networkidle', { timeout: 120000 });
  75  |     await page.waitForTimeout(5000);
  76  | 
  77  |     const selectors = [
  78  |       'a[href*="/mnjuser/profile"]',
  79  |       'a:has-text("View & Update Profile")',
  80  |       'text=View & Update Profile',
  81  |       'a:has-text("View and Update Profile")',
  82  |       'text=/View.*Profile|Update.*Profile/i'
  83  |     ];
  84  | 
  85  |     let profileOpened = false;
  86  |     for (const sel of selectors) {
  87  |       const loc = page.locator(sel).first();
  88  |       try {
  89  |         if (await loc.count() === 0) continue;
  90  |         await loc.scrollIntoViewIfNeeded();
  91  |         await loc.click({ timeout: 15000 });
  92  |         console.log('Clicked profile link using selector:', sel);
  93  |         profileOpened = true;
  94  |         break;
  95  |       } catch (e) {
  96  |         // try next selector
  97  |       }
  98  |     }
  99  | 
  100 |     if (!profileOpened) {
  101 |       console.log('Profile link not found; navigating directly to the profile page...');
  102 |       await page.goto('https://www.naukri.com/mnjuser/profile?id=&altresid', { waitUntil: 'domcontentloaded', timeout: 60000 });
  103 |     }
  104 | 
  105 |     await page.waitForTimeout(8000);
  106 |     await page.waitForURL(/mnjuser\/profile/, { timeout: 30000 }).catch(() => {});
  107 | 
  108 |     const resumeButtons = [
  109 |       'button:has-text("Update resume")',
  110 |       'button:has-text("Update Resume")',
  111 |       'button:has-text("Upload resume")',
  112 |       'button:has-text("Upload Resume")',
  113 |       'a:has-text("Update resume")',
  114 |       'a:has-text("Update Resume")',
  115 |       'text=/Update.*resume|Upload.*resume/i',
  116 |       'button >> text=resume',
  117 |       'a >> text=resume'
  118 |     ];
  119 | 
  120 |     let resumeUpdated = false;
  121 |     for (const sel of resumeButtons) {
  122 |       const loc = page.locator(sel).first();
  123 |       try {
  124 |         if (await loc.count() === 0) continue;
  125 |         await loc.scrollIntoViewIfNeeded();
  126 |         await loc.click({ timeout: 20000 });
  127 |         console.log('Clicked resume update action using selector:', sel);
  128 |         resumeUpdated = true;
  129 |         break;
  130 |       } catch (e) {
  131 |         // try next selector
  132 |       }
  133 |     }
  134 | 
  135 |     if (!resumeUpdated) {
  136 |       console.log('Resume update action not visible; trying direct upload input fallback.');
  137 |     }
  138 | 
  139 |     const resumeInput = page.locator('input[type="file"], input[id*="resume"], input[name*="resume"]').first();
  140 |     if (await resumeInput.count()) {
  141 |       await resumeInput.setInputFiles(RESUME_PATH);
  142 |       console.log('Resume uploaded using:', RESUME_PATH);
  143 |       await page.waitForTimeout(3000);
  144 |       try {
  145 |         await sendResumeUpdatedEmail();
  146 |       } catch (error) {
> 147 |         throw new Error(`Resume was uploaded, but the notification email failed: ${error.message || error}`);
      |               ^ Error: Resume was uploaded, but the notification email failed: Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to
  148 |       }
  149 |     } else {
  150 |       throw new Error('No resume upload input found; no update notification was sent.');
  151 |     }
  152 | 
  153 |     console.log('Daily resume update workflow completed.');
  154 |   } finally {
  155 |     await browser.close();
  156 |   }
  157 | });
  158 | 
```