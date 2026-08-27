const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Simple run logger
const LOG_FILE = path.resolve(__dirname, '..', '..', 'naukri_run.log');
function runLog(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch (e) {}
  console.log(...args);
}

// Results writer (CSV + JSON append)
const RESULTS_CSV = path.resolve(__dirname, '..', '..', 'naukri_results.csv');
const RESULTS_JSON = path.resolve(__dirname, '..', '..', 'naukri_results.jsonl');
function writeResultRow(obj) {
  try {
    // ensure CSV header
    if (!fs.existsSync(RESULTS_CSV)) {
      const header = 'timestamp,jobLink,hostname,isNaukri,applied,handledExternal,note\n';
      fs.appendFileSync(RESULTS_CSV, header);
    }
    const line = `${obj.timestamp},"${(obj.jobLink||'').replace(/"/g,'""')}",${obj.hostname||''},${obj.isNaukri||false},${obj.applied||false},${obj.handledExternal||false},"${(obj.note||'').replace(/"/g,'""')}"\n`;
    fs.appendFileSync(RESULTS_CSV, line);
  } catch (e) { runLog('Failed to write CSV result', e.message || e); }
  try {
    fs.appendFileSync(RESULTS_JSON, JSON.stringify(obj) + '\n');
  } catch (e) { runLog('Failed to write JSON result', e.message || e); }
}

// Retry helper for flaky network/actions
async function retry(fn, attempts = 3, delayMs = 1000) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      runLog(`Retry ${i + 1}/${attempts} failed:`, e.message || e);
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

function getTodayDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyCsvPaths() {
  const newDir = path.resolve(__dirname, '..', '..', 'new');
  fs.mkdirSync(newDir, { recursive: true });

  const dateStamp = getTodayDateStamp();
  const dailyCsvPath = path.join(newDir, `naukri_jobs_${dateStamp}.csv`);
  const fallbackCsvPath = path.join(newDir, 'naukri_jobs_new.csv');

  if (!fs.existsSync(dailyCsvPath) && fs.existsSync(fallbackCsvPath)) {
    fs.copyFileSync(fallbackCsvPath, dailyCsvPath);
    runLog(`Created daily job file snapshot: ${dailyCsvPath}`);
  }

  return { dailyCsvPath, fallbackCsvPath };
}

function isWithinOneDayPosted(postedDate) {
  if (!postedDate) return false;

  const value = String(postedDate).trim().toLowerCase();
  if (!value) return false;

  if (['today', 'just now', 'few hours ago', 'few mins ago', 'few minutes ago'].includes(value)) {
    return true;
  }

  if (value.includes('hour')) {
    return true;
  }

  const match = value.match(/(\d+)\+?\s*(day|days|week|weeks|month|months)/);
  if (!match) return false;

  const qty = Number(match[1]);
  const unit = match[2];

  if (unit.startsWith('day')) {
    return qty <= 1;
  }

  return false;
}

function isTargetLocation(location) {
  if (!location) return false;

  const value = String(location).trim().toLowerCase();
  const allowedCities = ['hyderabad', 'chennai', 'bengaluru', 'bangalore'];

  return allowedCities.some(city => value.includes(city));
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  // Helper to handle external job sites (best-effort)
  async function handleExternalJob(page, context, jobLink) {
    try {
      await retry(() => page.goto(jobLink, { waitUntil: 'domcontentloaded', timeout: 60000 }), 3, 2000);
    } catch (err) {
      console.warn('Navigation failed for external link', jobLink, err.message);
      return false;
    }

    const hostname = new URL(page.url()).hostname;
    if (hostname.includes('glassdoor')) {
      console.warn('Skipping Glassdoor link:', jobLink);
      return false;
    }
    const genericSelectors = ['button:has-text("Apply")', 'a:has-text("Apply")', 'text=Apply', 'button:has-text("Apply Now")', 'a:has-text("Apply Now")', 'text=Apply Now'];
    const selectorsByHost = {
      'ambitionbox.com': ['button:has-text("Apply")', 'a:has-text("Apply")', 'button.apply-btn'],
      'indeed.com': ['button:has-text("Apply Now")', 'a:has-text("Apply Now")', 'text=Apply Now'],
      'linkedin.com': ['button:has-text("Easy Apply")', 'button:has-text("Apply")'],
      'monster.com': ['button:has-text("Apply")', 'a:has-text("Apply")'],
      'timesjobs.com': ['button:has-text("Apply")', 'a:has-text("Apply")'],
      'shine.com': ['button:has-text("Apply")', 'a:has-text("Apply")'],
      'freshersworld.com': ['a:has-text("Apply")', 'button:has-text("Apply")'],
      'quikrjobs.com': ['a:has-text("Apply")', 'button:has-text("Apply")'],
      'careerbuilder.com': ['button:has-text("Apply")', 'a:has-text("Apply")']
    };

    // pick host-specific selectors if available
    let applySelectors = genericSelectors;
    for (const key of Object.keys(selectorsByHost)) {
      if (hostname.includes(key)) {
        applySelectors = selectorsByHost[key].concat(genericSelectors);
        break;
      }
    }

    for (const sel of applySelectors) {
      const loc = page.locator(sel).first();
      if (await loc.count() === 0) continue;
      try {
        if (!(await loc.isVisible())) continue;

        // Click and handle popups (with retry)
        await retry(async () => {
          const clickPromise = loc.click({ timeout: 10000 }).catch(() => {});
          let popup = null;
          try { popup = await context.waitForEvent('page', { timeout: 3000 }); } catch (e) {}
          await clickPromise;
          return popup;
        }, 2, 500).then(async (popup) => {
          const target = popup || page;
          try { await target.waitForLoadState('domcontentloaded', { timeout: 5000 }); } catch (e) {}
          // Try to upload resume if file input present
          if ((await target.locator('input[type=file]').count()) > 0) {
            try { await retry(() => target.locator('input[type=file]').first().setInputFiles('resume_QA.pdf'), 2, 500); } catch (e) { console.warn('File upload failed on', hostname, e.message); }
          }
        });

        return true;
      } catch (e) {
        console.warn('External selector failed', sel, 'on', jobLink, e.message);
      }
    }

    return false;
  }

  // Login to Naukri
  const response = await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'networkidle' });
  console.log('Login page status:', response && response.status());
    await retry(() => page.waitForSelector('xpath=//input[@id="usernameField"]', { timeout: 30000 }), 3, 1000);
    await retry(() => page.fill('xpath=//input[@id="usernameField"]', 'praveenpadigapati09@gmail.com'), 3, 500);
    await retry(() => page.fill('xpath=//input[@id="passwordField"]', 'Telangana@9988'), 3, 500);
    await retry(() => page.locator('button[type="submit"]').first().click(), 3, 500);
  await page.waitForLoadState('networkidle');

  const { dailyCsvPath, fallbackCsvPath } = getDailyCsvPaths();
  const csvPath = fs.existsSync(dailyCsvPath) ? dailyCsvPath : fallbackCsvPath;

  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath);
    await browser.close();
    process.exit(1);
  }

  const jobs = [];
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => jobs.push(row))
    .on('end', async () => {
      for (const row of jobs) {
        const postedDate = row['Posted Date'];
        if (!isWithinOneDayPosted(postedDate)) {
          console.log(`Skipping older job: ${row['Job Title']} | Posted: ${postedDate}`);
          continue;
        }

        const location = row.Location || row['Location'];
        if (!isTargetLocation(location)) {
          console.log(`Skipping non-target location: ${row['Job Title']} | Location: ${location}`);
          continue;
        }

        const jobLink = row.Link;
        if (!jobLink) {
          console.warn('Skipping row with missing Link:', row);
          writeResultRow({ timestamp: new Date().toISOString(), jobLink: '', hostname: '', isNaukri: false, applied: false, handledExternal: false, note: 'missing Link' });
          continue;
        }

        // Skip external sites that are not on naukri.com (these typically redirect)
        try {
          const parsed = new URL(jobLink);
          if (!parsed.hostname.includes('naukri.com')) {
            if (parsed.hostname.includes('glassdoor')) {
              console.log('Skipping Glassdoor link:', jobLink);
              writeResultRow({ timestamp: new Date().toISOString(), jobLink, hostname: parsed.hostname, isNaukri: false, applied: false, handledExternal: false, note: 'skipped Glassdoor' });
              continue;
            }
            console.log('Handling external job link:', jobLink);
            const handled = await handleExternalJob(page, context, jobLink);
            if (handled) {
              console.log('External job handled:', jobLink);
              writeResultRow({ timestamp: new Date().toISOString(), jobLink, hostname: parsed.hostname, isNaukri: false, applied: false, handledExternal: true, note: 'external handled' });
            } else {
              console.warn('External job not handled:', jobLink);
              writeResultRow({ timestamp: new Date().toISOString(), jobLink, hostname: parsed.hostname, isNaukri: false, applied: false, handledExternal: false, note: 'external not handled' });
            }
            continue;
          }
        } catch (e) {
          console.warn('Invalid job Link, skipping:', jobLink);
          continue;
        }

        try {
          await retry(() => page.goto(jobLink, { waitUntil: 'domcontentloaded', timeout: 60000 }), 3, 2000);
        } catch (error) {
          console.warn('Navigation failed for', jobLink, error.message);
          writeResultRow({ timestamp: new Date().toISOString(), jobLink, hostname: '', isNaukri: true, applied: false, handledExternal: false, note: `navigation failed: ${error.message}` });
          continue;
        }
        await retry(() => page.waitForTimeout(2000), 2, 200);

        // Try multiple selectors and ensure the element is visible before clicking.
        // If the job is on naukri.com, use additional selectors and handle popups/file uploads.
        const isNaukri = page.url().includes('naukri.com');
        const genericSelectors = ['button:has-text("Apply")', 'a:has-text("Apply")', 'text=Apply'];
        const naukriSelectors = ['button:has-text("Apply on Naukri")', 'button.apply-btn', 'a.apply-btn', 'button:has-text("Apply")'];
        const applySelectors = isNaukri ? [...naukriSelectors, ...genericSelectors] : genericSelectors;

        let applied = false;
        const beforePages = context.pages().slice();
        for (const sel of applySelectors) {
          const loc = page.locator(sel).first();
          if (await loc.count() === 0) continue;
          try {
            if (!(await loc.isVisible())) continue;

            // Attempt click and detect if a popup/new page opens
              // Attempt click with retry and detect popup
              let popup = null;
              try {
                popup = await retry(async () => {
                  const p = loc.click({ timeout: 10000 }).catch(() => {});
                  try { return await context.waitForEvent('page', { timeout: 3000 }); } catch (e) { return null; }
                }, 2, 500);
              } catch (e) {
                // click attempts failed
              }

            // If a popup opened, operate on it; otherwise stay on current page
            let targetPage = popup || page;

            // Wait a short while for content
            try { await targetPage.waitForLoadState('domcontentloaded', { timeout: 5000 }); } catch (e) {}

            // If there's an upload input on the target page, attach resume (with retry)
            const fileInputs = await targetPage.$$eval('input[type=file]', els => els.map(e => e.id || e.name || e.className || 'file'));
            if (fileInputs.length > 0) {
              const fileLoc = targetPage.locator('input[type=file]').first();
              try { await retry(() => fileLoc.setInputFiles('resume_QA.pdf'), 2, 500); } catch (e) { console.warn('Failed to set resume file on', jobLink, e.message); }
            }

            applied = true;
            break;
          } catch (e) {
            console.warn('Selector attempt failed for', sel, 'on', jobLink, e.message);
          }
        }
        if (!applied) {
          console.warn('Apply button not found or not interactable for', jobLink);
          writeResultRow({ timestamp: new Date().toISOString(), jobLink, hostname: new URL(page.url()).hostname, isNaukri: true, applied: false, handledExternal: false, note: 'apply button not found' });
          continue;
        }

        if (await page.locator('#resumeUpload').count() > 0) {
          await page.setInputFiles('#resumeUpload', 'resume_QA.pdf');
        }

        if (await page.locator('#coverLetter').count() > 0) {
          await page.fill('#coverLetter', 'Dear HR, I am excited to apply...');
        }

        if (await page.locator('#submitApplication').count() > 0) {
          await page.click('#submitApplication');
        }

        console.log('Processed job:', jobLink);
        writeResultRow({ timestamp: new Date().toISOString(), jobLink, hostname: new URL(page.url()).hostname, isNaukri: true, applied: true, handledExternal: false, note: 'processed' });
      }

      console.log('All jobs processed.');
      await browser.close();
    });
})();
