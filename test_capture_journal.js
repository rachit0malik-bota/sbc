const { chromium } = require('playwright-core');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\fa6dc11a-ef75-4727-b355-1879659dea71';

(async () => {
  console.log('--- Capturing Enhanced Journal Pages ---');
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  // 1. Desktop Journal Page (Hero & Spotlight)
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3005/journal', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'page-journal-hero-spotlight.png') });
  console.log('✓ Saved page-journal-hero-spotlight.png');

  // 2. Desktop Journal Cards Grid & Blackboard
  await page.evaluate(() => window.scrollTo({ top: 950, behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'page-journal-cards-grid.png') });
  console.log('✓ Saved page-journal-cards-grid.png');

  // 3. Desktop Single Article Detail Page
  await page.goto('http://localhost:3005/journal/tracing-indias-arabica-roots-chikmagalur', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'page-journal-article-detail.png') });
  console.log('✓ Saved page-journal-article-detail.png');

  // 4. Mobile Journal View
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3005/journal', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'page-journal-mobile.png') });
  console.log('✓ Saved page-journal-mobile.png');

  await browser.close();
  console.log('--- Done ---');
})();
