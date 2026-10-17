const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlUrl = 'http://localhost:3005/';
const shotsDir = path.resolve(__dirname, 'shots');

if (!fs.existsSync(shotsDir)) {
  fs.mkdirSync(shotsDir);
}

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to:', htmlUrl);
  await page.goto(htmlUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Verify NO stickers in Hero section
  console.log('Verifying stickers removed from Hero section...');
  const stickersInHero = await page.$('.hero-section .hero-floating-elements-wrap');
  if (stickersInHero) {
    console.error('ERROR: Stickers still found in hero section!');
  } else {
    console.log('SUCCESS: Hero section stickers successfully removed (clean minimal hero)!');
  }

  // 2. Verify Cinema toggle removed from header nav
  console.log('Verifying Cinema toggle removed from header...');
  const cinemaInNav = await page.$('.nav-container #openCinemaModal');
  if (cinemaInNav) {
    console.error('ERROR: Cinema button still found in nav!');
  } else {
    console.log('SUCCESS: Cinema button successfully removed from sticky navbar!');
  }

  // 3. Verify Campus Timings
  console.log('Verifying Campus Timings...');
  const campusText = await page.$eval('#campuses', el => el.innerText);
  const indirapuramOk = campusText.includes('12:00 PM – 11:00 PM');
  const rajendraOk = campusText.includes('11:00 AM – 11:00 PM');
  console.log('Indirapuram (12 PM - 11 PM) verified:', indirapuramOk);
  console.log('Rajendra Nagar (11 AM - 11 PM) verified:', rajendraOk);

  // 4. Verify Alumni Reviews Section
  console.log('Verifying Alumni Reviews Section...');
  const alumniEl = await page.$('#alumni');
  if (alumniEl) {
    const cardCount = await page.$$eval('.alumni-card', els => els.length);
    console.log('Alumni review cards count:', cardCount);
    const mentionsGoogle = await page.$eval('#alumni', el => el.innerText.toLowerCase().includes('google'));
    console.log('Mentions Google in reviews (should be false):', mentionsGoogle);
    await alumniEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await alumniEl.screenshot({ path: path.join(shotsDir, 'desktop-alumni-reviews.png') });
  }

  // 5. Desktop Minimal Hero Screenshot
  console.log('Capturing Desktop Minimal Hero...');
  const heroEl = await page.$('#hero');
  if (heroEl) {
    await heroEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await heroEl.screenshot({ path: path.join(shotsDir, 'desktop-hero-minimal.png') });
  }

  // 6. Desktop Campuses Screenshot
  console.log('Capturing Desktop Campuses...');
  const campusesEl = await page.$('#campuses');
  if (campusesEl) {
    await campusesEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await campusesEl.screenshot({ path: path.join(shotsDir, 'desktop-campuses-updated.png') });
  }

  // 7. Mobile Viewport (390 x 844)
  console.log('Testing Mobile Viewport (390 x 844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(htmlUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Check horizontal overflow
  const isOverflowing = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth;
  });
  console.log('Mobile horizontal overflow detected:', isOverflowing);

  // Capture Mobile Hero
  const mobileHero = await page.$('#hero');
  if (mobileHero) {
    await mobileHero.screenshot({ path: path.join(shotsDir, 'mobile-hero-minimal.png') });
  }

  // Capture Mobile Campuses
  const mobileCampuses = await page.$('#campuses');
  if (mobileCampuses) {
    await mobileCampuses.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await mobileCampuses.screenshot({ path: path.join(shotsDir, 'mobile-campuses-updated.png') });
  }

  // Capture Mobile Alumni
  const mobileAlumni = await page.$('#alumni');
  if (mobileAlumni) {
    await mobileAlumni.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await mobileAlumni.screenshot({ path: path.join(shotsDir, 'mobile-alumni-reviews.png') });
  }

  await browser.close();

  console.log('Verification Complete!');
  if (errors.length > 0) {
    console.log('Console Errors Detected:', errors);
  } else {
    console.log('Zero console errors! Flawless execution.');
  }
})();
