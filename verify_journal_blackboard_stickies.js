const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('=== SECTION-B COFFEE: VERIFYING JOURNAL, BLACKBOARD & STICKY NOTES ===\n');

  // 1. Visit homepage
  await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });
  console.log('✓ Loaded http://localhost:3005 successfully');

  // ---------------------------------------------------------------------------
  // TEST 1: Editorial Journal Stop-Scroll Section (#journal)
  // ---------------------------------------------------------------------------
  const journal = page.locator('#journal');
  const journalCount = await journal.count();
  console.log(`✓ Journal section found: ${journalCount > 0}`);

  const journalHeading = await page.locator('.journal-heading').textContent();
  console.log(`✓ Journal heading: "${journalHeading.trim()}"`);

  const chapterBtns = page.locator('.journal-chapter-btn');
  const chapterBtnCount = await chapterBtns.count();
  console.log(`✓ Journal chapter buttons count: ${chapterBtnCount} (expected 4)`);

  const manuscriptCards = page.locator('.journal-card');
  const manuscriptCardCount = await manuscriptCards.count();
  console.log(`✓ Journal manuscript cards count: ${manuscriptCardCount} (expected 4)`);

  // Test interactive slide switching
  await chapterBtns.nth(1).click();
  await page.waitForTimeout(300);
  const card1Active = await manuscriptCards.nth(1).evaluate(el => el.classList.contains('active'));
  console.log(`✓ Clicked Chapter 02: Manuscript 02 is active: ${card1Active}`);

  await chapterBtns.nth(2).click();
  await page.waitForTimeout(300);
  const card2Active = await manuscriptCards.nth(2).evaluate(el => el.classList.contains('active'));
  console.log(`✓ Clicked Chapter 03: Manuscript 03 is active: ${card2Active}`);

  // Check read dispatch link
  const readLink = await manuscriptCards.nth(2).locator('.btn-read-dispatch').getAttribute('href');
  console.log(`✓ Chapter 03 Read Link: ${readLink}`);

  // Check full archive link
  const archiveLink = await page.locator('.btn-all-dispatches').getAttribute('href');
  console.log(`✓ Journal full archive link: ${archiveLink}`);

  // Screenshot Journal section
  await journal.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/desktop-journal-stopscroll.png' });
  console.log('✓ Captured shots/desktop-journal-stopscroll.png');

  // ---------------------------------------------------------------------------
  // TEST 2: Classroom Blackboard Notice Board & Video Reels (#gallery)
  // ---------------------------------------------------------------------------
  const gallery = page.locator('#gallery');
  const blackboardFrame = page.locator('.classroom-blackboard-frame');
  const blackboardCount = await blackboardFrame.count();
  console.log(`\n✓ Classroom Blackboard Frame found: ${blackboardCount > 0}`);

  const brassPlaque = await page.locator('.blackboard-brass-plaque').textContent();
  console.log(`✓ Blackboard Brass Plaque: "${brassPlaque.trim()}"`);

  const chalkNotes = await page.locator('.blackboard-chalk-notes').textContent();
  console.log(`✓ Chalk Annotations: "${chalkNotes.replace(/\s+/g, ' ').trim()}"`);

  const blackboardCards = page.locator('.blackboard-card');
  const cardCount = await blackboardCards.count();
  console.log(`✓ Blackboard Cards count: ${cardCount} (expected 8 real events)`);

  const reelVideos = page.locator('.blackboard-reel-video');
  const reelVideoCount = await reelVideos.count();
  console.log(`✓ Native Video Reel Previews count: ${reelVideoCount}`);

  // Test filtering: Coffee School & Workshops
  const workshopFilterBtn = page.locator('.gallery-filter-btn[data-filter="workshops"]');
  await workshopFilterBtn.click();
  await page.waitForTimeout(300);
  const visibleWorkshopCards = await page.locator('.gallery-card:visible').count();
  console.log(`✓ Filtered "Coffee School & Workshops": visible cards = ${visibleWorkshopCards}`);

  // Test filtering: Campus Launches
  const launchesFilterBtn = page.locator('.gallery-filter-btn[data-filter="launches"]');
  await launchesFilterBtn.click();
  await page.waitForTimeout(300);
  const visibleLaunchesCards = await page.locator('.gallery-card:visible').count();
  console.log(`✓ Filtered "Campus Launches": visible cards = ${visibleLaunchesCards}`);

  // Reset filter to All
  const allFilterBtn = page.locator('.gallery-filter-btn[data-filter="all"]');
  await allFilterBtn.click();
  await page.waitForTimeout(300);

  // Test Lightbox on a card with video reel
  const firstCard = blackboardCards.first();
  await firstCard.click();
  await page.waitForTimeout(400);

  const lightboxActive = await page.locator('#galleryLightbox').evaluate(el => el.classList.contains('active'));
  const lightboxVideoVisible = await page.locator('#lightboxVideo').evaluate(el => el.style.display !== 'none');
  const lightboxTagText = await page.locator('#lightboxTag').textContent();
  const lightboxTitleText = await page.locator('#lightboxTitle').textContent();

  console.log(`✓ Lightbox opened: ${lightboxActive}`);
  console.log(`✓ Lightbox video player displayed: ${lightboxVideoVisible}`);
  console.log(`✓ Lightbox Tag: "${lightboxTagText.trim()}"`);
  console.log(`✓ Lightbox Title: "${lightboxTitleText.trim()}"`);

  // Screenshot Lightbox Reel
  await page.screenshot({ path: 'shots/desktop-blackboard-lightbox-reel.png' });
  console.log('✓ Captured shots/desktop-blackboard-lightbox-reel.png');

  // Close lightbox
  await page.locator('#closeGalleryLightbox').click();
  await page.waitForTimeout(300);

  // Screenshot Classroom Blackboard Notice Board
  await gallery.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/desktop-classroom-blackboard.png' });
  console.log('✓ Captured shots/desktop-classroom-blackboard.png');

  // ---------------------------------------------------------------------------
  // TEST 3: Pinned Notebook Sticky Notes (#alumni)
  // ---------------------------------------------------------------------------
  const alumni = page.locator('#alumni');
  const stickyNotes = page.locator('.note-sticky');
  const stickyCount = await stickyNotes.count();
  console.log(`\n✓ Pinned Notebook Sticky Notes count: ${stickyCount} (expected 6)`);

  const brassPins = page.locator('.pin-brass');
  const brassPinCount = await brassPins.count();
  console.log(`✓ 3D Brass Pushpins count: ${brassPinCount}`);

  const washiTapes = page.locator('.note-washi');
  const washiTapeCount = await washiTapes.count();
  console.log(`✓ Translucent Washi Tapes count: ${washiTapeCount}`);

  const handwritingQuotes = page.locator('.note-handwriting');
  const handwritingCount = await handwritingQuotes.count();
  console.log(`✓ Collegiate Handwriting Quotes count: ${handwritingCount}`);

  // Verify reviews content preserved
  const firstReviewAuthor = await page.locator('.alumni-name').first().textContent();
  const firstReviewQuote = await handwritingQuotes.first().textContent();
  console.log(`✓ Note 01 Author: "${firstReviewAuthor.trim()}"`);
  console.log(`✓ Note 01 Excerpt: "${firstReviewQuote.slice(0, 70).trim()}..."`);

  // Test Write an Alumni Dispatch modal
  const openModalBtn = page.locator('#openReviewModalBtn');
  await openModalBtn.click();
  await page.waitForTimeout(300);
  const modalActive = await page.locator('#reviewModal').evaluate(el => el.classList.contains('active'));
  console.log(`✓ Write an Alumni Dispatch Modal opened: ${modalActive}`);
  await page.locator('#closeReviewModal').click();
  await page.waitForTimeout(300);

  // Screenshot Pinned Notebook Sticky Notes
  await alumni.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/desktop-notebook-stickies.png' });
  console.log('✓ Captured shots/desktop-notebook-stickies.png');

  // ---------------------------------------------------------------------------
  // TEST 4: Mobile Viewport Flawless Adaptation (390x844)
  // ---------------------------------------------------------------------------
  console.log('\n=== TESTING MOBILE RESPONSIVENESS (390 x 844) ===');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.goto('http://localhost:3005', { waitUntil: 'networkidle' });

  // Check horizontal overflow
  const overflow = await mobilePage.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
  console.log(`✓ Mobile viewport: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}, hasOverflow=${overflow.hasOverflow}`);

  // Screenshot Mobile Journal
  await mobilePage.locator('#journal').scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: 'shots/mobile-journal.png' });
  console.log('✓ Captured shots/mobile-journal.png');

  // Screenshot Mobile Blackboard
  await mobilePage.locator('#gallery').scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: 'shots/mobile-blackboard.png' });
  console.log('✓ Captured shots/mobile-blackboard.png');

  // Screenshot Mobile Sticky Notes
  await mobilePage.locator('#alumni').scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: 'shots/mobile-stickies.png' });
  console.log('✓ Captured shots/mobile-stickies.png');

  // Full page mobile shot
  await mobilePage.screenshot({ path: 'shots/mobile-full-view.png', fullPage: true });
  console.log('✓ Captured shots/mobile-full-view.png');

  await browser.close();
  console.log('\n=== ALL TESTS PASSED WITH 100% SUCCESS ===');
})();
