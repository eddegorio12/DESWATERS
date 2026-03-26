import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3000';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log("Navigating to sign-in...");
    await page.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Fill in by id matching the actual form fields
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.click('#email');
    await page.type('#email', 'moontonng13@gmail.com', { delay: 50 });

    await page.waitForSelector('#password', { timeout: 5000 });
    await page.click('#password');
    await page.type('#password', '3915766712@eE', { delay: 50 });

    // Submit the form and wait for navigation away from /sign-in
    await Promise.all([
      page.evaluate(() => document.querySelector('form').requestSubmit()),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
    ]);

    const currentUrl = page.url();
    console.log(`After login, URL is: ${currentUrl}`);
    if (currentUrl.includes('sign-in')) {
      throw new Error('Login failed — still on sign-in page after submit.');
    }

    console.log("Capturing dashboard...");
    await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(__dirname, '../public/github/dashboard.png'), fullPage: true });

    console.log("Capturing billing...");
    await page.goto(`${BASE}/admin/billing`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(__dirname, '../public/github/billing.png'), fullPage: true });

    console.log("Capturing follow-up...");
    await page.goto(`${BASE}/admin/follow-up`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(__dirname, '../public/github/follow-up.png'), fullPage: true });

    console.log("All screenshots captured successfully!");
  } catch (error) {
    console.error("Error:", error.message);
    // Save a debug screenshot to see what went wrong
    await page.screenshot({ path: path.join(__dirname, '../public/github/_debug.png'), fullPage: true });
    console.log("Saved debug screenshot to public/github/_debug.png");
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
