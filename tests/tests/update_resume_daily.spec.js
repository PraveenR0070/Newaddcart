const { test } = require('@playwright/test');
const { chromium } = require('playwright');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const RESUME_CANDIDATES = [
  path.resolve(__dirname, '..', '..', 'PraveenReddy_Padigapati_Resume.pdf'),
  path.resolve(__dirname, '..', '..', 'resume_QA.pdf')
];
const RESUME_PATH = RESUME_CANDIDATES.find(fs.existsSync) || RESUME_CANDIDATES[0];

async function sendResumeUpdatedEmail() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, RESUME_NOTIFICATION_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !RESUME_NOTIFICATION_TO) {
    throw new Error('Missing mail configuration: set SMTP_HOST, SMTP_USER, SMTP_PASS, and RESUME_NOTIFICATION_TO.');
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || SMTP_USER,
    to: RESUME_NOTIFICATION_TO,
    subject: 'Naukri resume updated',
    text: `The resume upload workflow completed successfully on ${new Date().toLocaleString()}.`
  });
  console.log('Resume update notification email sent to:', RESUME_NOTIFICATION_TO);
}

async function retry(fn, attempts = 3, delayMs = 1000) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

test.setTimeout(180000);

test('daily resume update', async () => {
  const requiredMailSettings = ['NAUKRI_USER', 'NAUKRI_PASS', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'RESUME_NOTIFICATION_TO'];
  const missingMailSettings = requiredMailSettings.filter(name => !process.env[name]);
  if (missingMailSettings.length) {
    throw new Error(`Cannot update resume without email notification settings: ${missingMailSettings.join(', ')}`);
  }

  const browser = await chromium.launch({ headless: process.env.CI === 'true' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  try {
    console.log('Launching Naukri login for resume update...');
    await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'networkidle', timeout: 120000 });

    await retry(() => page.waitForSelector('xpath=//input[@id="usernameField"]', { timeout: 30000 }), 3, 1000);
    await retry(() => page.fill('xpath=//input[@id="usernameField"]', process.env.NAUKRI_USER), 3, 500);
    await retry(() => page.fill('xpath=//input[@id="passwordField"]', process.env.NAUKRI_PASS), 3, 500);
    await retry(() => page.locator('button[type="submit"]').first().click(), 3, 500);

    await page.waitForLoadState('networkidle', { timeout: 120000 });
    await page.waitForTimeout(5000);

    const selectors = [
      'a[href*="/mnjuser/profile"]',
      'a:has-text("View & Update Profile")',
      'text=View & Update Profile',
      'a:has-text("View and Update Profile")',
      'text=/View.*Profile|Update.*Profile/i'
    ];

    let profileOpened = false;
    for (const sel of selectors) {
      const loc = page.locator(sel).first();
      try {
        if (await loc.count() === 0) continue;
        await loc.scrollIntoViewIfNeeded();
        await loc.click({ timeout: 15000 });
        console.log('Clicked profile link using selector:', sel);
        profileOpened = true;
        break;
      } catch (e) {
        // try next selector
      }
    }

    if (!profileOpened) {
      console.log('Profile link not found; navigating directly to the profile page...');
      await page.goto('https://www.naukri.com/mnjuser/profile?id=&altresid', { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    await page.waitForTimeout(8000);
    await page.waitForURL(/mnjuser\/profile/, { timeout: 30000 }).catch(() => {});

    const resumeButtons = [
      'button:has-text("Update resume")',
      'button:has-text("Update Resume")',
      'button:has-text("Upload resume")',
      'button:has-text("Upload Resume")',
      'a:has-text("Update resume")',
      'a:has-text("Update Resume")',
      'text=/Update.*resume|Upload.*resume/i',
      'button >> text=resume',
      'a >> text=resume'
    ];

    let resumeUpdated = false;
    for (const sel of resumeButtons) {
      const loc = page.locator(sel).first();
      try {
        if (await loc.count() === 0) continue;
        await loc.scrollIntoViewIfNeeded();
        await loc.click({ timeout: 20000 });
        console.log('Clicked resume update action using selector:', sel);
        resumeUpdated = true;
        break;
      } catch (e) {
        // try next selector
      }
    }

    if (!resumeUpdated) {
      console.log('Resume update action not visible; trying direct upload input fallback.');
    }

    const resumeInput = page.locator('input[type="file"], input[id*="resume"], input[name*="resume"]').first();
    if (await resumeInput.count()) {
      await resumeInput.setInputFiles(RESUME_PATH);
      console.log('Resume uploaded using:', RESUME_PATH);
      await page.waitForTimeout(3000);
      try {
        await sendResumeUpdatedEmail();
      } catch (error) {
        throw new Error(`Resume was uploaded, but the notification email failed: ${error.message || error}`);
      }
    } else {
      throw new Error('No resume upload input found; no update notification was sent.');
    }

    console.log('Daily resume update workflow completed.');
  } finally {
    await browser.close();
  }
});
