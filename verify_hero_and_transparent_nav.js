const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\fa6dc11a-ef75-4727-b355-1879659dea71';

(async () => {
  console.log('--- Verifying Transparent Nav & Hero Video Visibility ---');
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3005', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 1. Verify Transparent Nav at Top
  const headerStylesAtTop = await page.$eval('#siteHeader', el => {
    const s = window.getComputedStyle(el);
    return {
      bg: s.backgroundColor,
      border: s.borderBottomColor,
      hasScrolledClass: el.classList.contains('scrolled')
    };
  });
  console.log('Header styles at top (scrollY = 0):', headerStylesAtTop);

  // Check Hero Video state
  const heroVideoState = await page.$eval('#heroVideo', vid => {
    return {
      paused: vid.paused,
      currentTime: vid.currentTime,
      duration: vid.duration,
      poster: vid.getAttribute('poster'),
      preload: vid.getAttribute('preload'),
      readyState: vid.readyState
    };
  });
  console.log('Hero Video State:', heroVideoState);

  // Take Desktop Hero Full Viewport Screenshot (Transparent Nav)
  const heroShot = path.join(ARTIFACT_DIR, 'desktop-transparent-nav-hero.png');
  await page.screenshot({ path: heroShot });
  console.log(`✓ Screenshot saved: ${heroShot}`);

  // 2. Scroll down and verify background appears
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
  await page.waitForTimeout(500);

  const headerStylesScrolled = await page.$eval('#siteHeader', el => {
    const s = window.getComputedStyle(el);
    return {
      bg: s.backgroundColor,
      hasScrolledClass: el.classList.contains('scrolled'),
      boxShadow: s.boxShadow
    };
  });
  console.log('Header styles when scrolled (scrollY = 300):', headerStylesScrolled);

  const scrolledShot = path.join(ARTIFACT_DIR, 'desktop-scrolled-header.png');
  await page.screenshot({ path: scrolledShot, clip: { x: 0, y: 0, width: 1440, height: 400 } });
  console.log(`✓ Screenshot saved: ${scrolledShot}`);

  // 3. Mobile Hero Audit
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3005', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(1500);

  const mobileHeroShot = path.join(ARTIFACT_DIR, 'mobile-transparent-hero.png');
  await mobilePage.screenshot({ path: mobileHeroShot });
  console.log(`✓ Mobile Screenshot saved: ${mobileHeroShot}`);

  await browser.close();
  console.log('--- Verification Finished ---');
})();
