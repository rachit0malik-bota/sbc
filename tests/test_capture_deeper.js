const { chromium } = require('playwright-core');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\fa6dc11a-ef75-4727-b355-1879659dea71';

(async () => {
  const browser = await chromium.launch({ executablePath: edgePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3005/journal', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Scroll down to cards grid
  await page.evaluate(() => window.scrollTo({ top: 1250, behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'page-journal-grid-cards.png') });
  console.log('✓ Saved page-journal-grid-cards.png');

  // Scroll down to blackboard banner & study hall
  await page.evaluate(() => window.scrollTo({ top: 2150, behavior: 'instant' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'page-journal-blackboard-studyhall.png') });
  console.log('✓ Saved page-journal-blackboard-studyhall.png');

  // Mobile check
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3005/journal', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'page-journal-mobile-clean.png') });
  console.log('✓ Saved page-journal-mobile-clean.png');

  await browser.close();
})();
