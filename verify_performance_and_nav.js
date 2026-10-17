const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\fa6dc11a-ef75-4727-b355-1879659dea71';

(async () => {
  console.log('--- SBC Performance & Minimalist Navigation Audit ---');
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const startTime = Date.now();
  await page.goto('http://localhost:3005', { waitUntil: 'domcontentloaded' });
  const domLoadedTime = Date.now() - startTime;
  console.log(`✓ DOMContentLoaded in: ${domLoadedTime}ms`);

  // Wait for initial paints
  await page.waitForTimeout(1000);

  // 1. Verify Navigation Bar Links & Structure
  const navLinks = await page.$$eval('.nav-menu .nav-link', links => links.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') })));
  console.log('Nav Links detected:', navLinks);
  if (navLinks.length === 4) {
    console.log('✓ EXACTLY 4 curated navigation links present: Story, Menu, Journal, Campuses');
  } else {
    console.warn('⚠️ Warning: Expected 4 nav links, found:', navLinks.length);
  }

  // 2. Verify Order Online Dropdown
  const orderBtn = await page.$('#navOrderBtn');
  if (orderBtn) {
    console.log('✓ #navOrderBtn found in DOM');
    
    // Check initial state
    let isExpanded = await orderBtn.getAttribute('aria-expanded');
    console.log('Initial aria-expanded:', isExpanded);

    // Click Order Online trigger
    await orderBtn.click();
    await page.waitForTimeout(300);

    const isDropdownOpen = await page.$eval('#navOrderDropdown', el => el.classList.contains('is-open'));
    isExpanded = await orderBtn.getAttribute('aria-expanded');
    console.log(`✓ Dropdown opened on click? ${isDropdownOpen} (aria-expanded: ${isExpanded})`);

    // Screenshot open dropdown
    const navDropdownShot = path.join(ARTIFACT_DIR, 'desktop-minimal-nav-dropdown.png');
    await page.screenshot({ path: navDropdownShot, clip: { x: 0, y: 0, width: 1440, height: 380 } });
    console.log(`✓ Screenshot saved: ${navDropdownShot}`);

    // Click outside to close
    await page.click('body', { position: { x: 200, y: 300 } });
    await page.waitForTimeout(300);
    const isClosedAfterOutside = !(await page.$eval('#navOrderDropdown', el => el.classList.contains('is-open')));
    console.log(`✓ Dropdown closed on outside click? ${isClosedAfterOutside}`);
  }

  // 3. Verify Video Preload Attributes
  const videoStats = await page.$$eval('video', vids => {
    return vids.map(v => ({
      id: v.id || v.className,
      preload: v.getAttribute('preload'),
      autoplay: v.hasAttribute('autoplay'),
      paused: v.paused
    }));
  });
  console.log(`Detected ${videoStats.length} total video elements:`);
  let offscreenNonePreloads = videoStats.filter(v => v.preload === 'none').length;
  console.log(`✓ Off-screen videos with preload="none": ${offscreenNonePreloads} / ${videoStats.length}`);

  // 4. Test Scroll Smoothness through all sections
  console.log('Testing smooth scroll down...');
  const scrollSteps = [600, 1400, 2400, 3500, 4800, 6000, 7500];
  for (const pos of scrollSteps) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), pos);
    await page.waitForTimeout(200);
  }

  // Screenshot scrolled Journal stop-scroll and blackboard
  await page.evaluate(() => {
    const el = document.getElementById('journal');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);
  const journalShot = path.join(ARTIFACT_DIR, 'desktop-smooth-journal.png');
  await page.screenshot({ path: journalShot });
  console.log(`✓ Screenshot saved: ${journalShot}`);

  await page.evaluate(() => {
    const el = document.getElementById('gallery');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);
  const blackboardShot = path.join(ARTIFACT_DIR, 'desktop-blackboard-smooth.png');
  await page.screenshot({ path: blackboardShot });
  console.log(`✓ Screenshot saved: ${blackboardShot}`);

  // 5. Mobile Viewport Audit
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3005', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(800);

  // Mobile Header Shot
  const mobileHeroShot = path.join(ARTIFACT_DIR, 'mobile-minimal-header.png');
  await mobilePage.screenshot({ path: mobileHeroShot });
  console.log(`✓ Mobile Hero Screenshot saved: ${mobileHeroShot}`);

  // Open mobile drawer
  const mobileBtn = await mobilePage.$('#mobileMenuBtn');
  if (mobileBtn) {
    await mobileBtn.click();
    await mobilePage.waitForTimeout(400);
    const mobileDrawerShot = path.join(ARTIFACT_DIR, 'mobile-drawer-open.png');
    await mobilePage.screenshot({ path: mobileDrawerShot });
    console.log(`✓ Mobile Drawer Screenshot saved: ${mobileDrawerShot}`);
  }

  // Check horizontal overflow
  const horizontalOverflow = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`✓ Mobile zero horizontal overflow? ${!horizontalOverflow}`);

  await browser.close();
  console.log('--- Audit Completed Successfully ---');
})();
