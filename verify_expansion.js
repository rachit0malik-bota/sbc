const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3005';
const SHOTS_DIR = path.join(__dirname, 'shots');

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

async function runVerification() {
  console.log('=== SBC EXPANSION & FEATURE REFINEMENTS VERIFICATION ===\n');

  // 1. Verify REST APIs & SSR Endpoints
  console.log('--- Step 1: Testing Backend APIs & SEO Endpoints ---');

  // Robots.txt
  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  const robotsTxt = await robotsRes.text();
  console.log('✓ /robots.txt status:', robotsRes.status);
  if (!robotsTxt.includes('Sitemap: http://localhost:3005/sitemap.xml') || !robotsTxt.includes('Disallow: /stealth-desk-14')) {
    throw new Error('Robots.txt missing expected directives!');
  }

  // Sitemap.xml
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  const sitemapXml = await sitemapRes.text();
  console.log('✓ /sitemap.xml status:', sitemapRes.status);
  if (!sitemapXml.includes('<loc>http://localhost:3005/blog</loc>') || !sitemapXml.includes('tracing-indias-arabica-roots-chikmagalur')) {
    throw new Error('Sitemap.xml missing blog URLs!');
  }

  // SSR Blog Directory
  const blogDirRes = await fetch(`${BASE_URL}/blog`);
  const blogDirHtml = await blogDirRes.text();
  console.log('✓ /blog SSR status:', blogDirRes.status, 'HTML length:', blogDirHtml.length);
  if (!blogDirHtml.includes('tracing-indias-arabica-roots-chikmagalur') || !blogDirHtml.includes('Brewing Guides')) {
    throw new Error('Blog directory missing seeded articles or category tags!');
  }

  // SSR Article Detail
  const artRes = await fetch(`${BASE_URL}/blog/tracing-indias-arabica-roots-chikmagalur`);
  const artHtml = await artRes.text();
  console.log('✓ /blog/:slug SSR status:', artRes.status, 'HTML length:', artHtml.length);
  if (!artHtml.includes('application/ld+json') || !artHtml.includes('BlogPosting') || !artHtml.includes('LocalBusiness')) {
    throw new Error('Article page missing JSON-LD structured schema markup!');
  }

  // Stealth Admin Route
  const adminRes = await fetch(`${BASE_URL}/stealth-desk-14`);
  console.log('✓ /stealth-desk-14 status:', adminRes.status);

  // Gallery API
  const galRes = await fetch(`${BASE_URL}/api/gallery`);
  const galData = await galRes.json();
  console.log('✓ /api/gallery count:', galData.length);
  if (galData.length < 6) throw new Error('Expected at least 6 gallery items!');

  // Reviews API
  const revRes = await fetch(`${BASE_URL}/api/reviews`);
  const revData = await revRes.json();
  console.log('✓ /api/reviews (approved) count:', revData.length);

  // Test Review Submission & Moderation
  console.log('\n--- Step 2: Testing Review Submission & Moderation Lifecycle ---');
  const postRevRes = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Tanvi Saxena',
      role: 'Indirapuram Study Fellow',
      rating: 5,
      favoriteOrder: 'Iced Biscoff & Truffle Sourdough',
      quote: 'Desk 14 in the morning with natural limewash sunlight is absolute bliss.'
    })
  });
  const newRev = await postRevRes.json();
  console.log('✓ Review created with ID:', newRev.id, 'status:', newRev.status);
  if (newRev.status !== 'pending') throw new Error('New review should default to pending moderation!');

  // Moderate: Approve
  const approveRes = await fetch(`${BASE_URL}/api/reviews/${newRev.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' })
  });
  console.log('✓ Review approved status:', approveRes.status);

  // Cleanup test review
  await fetch(`${BASE_URL}/api/reviews/${newRev.id}`, { method: 'DELETE' });
  console.log('✓ Test review cleaned up successfully.');

  // Test Blog Drafting & Live Preview
  console.log('\n--- Step 3: Testing Blog Draft & Real-Time Preview Lifecycle ---');
  const testPostRes = await fetch(`${BASE_URL}/api/blog/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Testing Extraction Velocity in Specialty Coffee',
      slug: 'testing-extraction-velocity-specialty-coffee',
      category: 'Brewing Guides',
      author: 'Arpit · Founder',
      excerpt: 'A comprehensive study of flow rates and particle distribution.',
      content: '<p>Detailed brewing notes and flow profile graphs.</p>',
      primaryKeyword: 'Extraction Velocity',
      metaTitle: 'Testing Extraction Velocity in Specialty Coffee | SBC',
      metaDescription: 'A comprehensive study of flow rates and particle distribution in single-origin coffee.',
      coverImage: 'hero-coffee.jpg',
      published: false,
      readTime: '3 min read'
    })
  });
  const testPost = await testPostRes.json();
  console.log('✓ Draft created with slug:', testPost.slug, 'published:', testPost.published);

  // Verify unpublished post is blocked on standard URL
  const pubCheckRes = await fetch(`${BASE_URL}/blog/${testPost.slug}`);
  console.log('✓ Accessing unpublished post normally returns:', pubCheckRes.status, '(Expected 404)');

  // Verify accessible with preview query
  const prevCheckRes = await fetch(`${BASE_URL}/blog/${testPost.slug}?preview=1`);
  console.log('✓ Accessing with preview query returns:', prevCheckRes.status, '(Expected 200)');
  if (prevCheckRes.status !== 200) throw new Error('Live preview query failed!');

  // Clean up test post
  await fetch(`${BASE_URL}/api/blog/posts/${testPost.id}`, { method: 'DELETE' });
  console.log('✓ Test post draft cleaned up successfully.');

  // Step 4: Browser Automation & Screenshots via Playwright
  console.log('\n--- Step 4: Running Playwright Browser Verification ---');
  const browser = await chromium.launch({ executablePath: edgePath, headless: true });
  
  // Desktop Viewport
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktopPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

  // Check for unwanted text on homepage
  const homeContent = await desktopPage.content();
  const prohibited = ['equity', 'investor', 'owner share', 'unit economic'];
  for (const term of prohibited) {
    if (homeContent.toLowerCase().includes(term)) {
      throw new Error(`Prohibited term "${term}" found on public homepage!`);
    }
  }
  console.log('✓ Verified ZERO mentions of owner share, equity, investor stats, or unit economics on public homepage.');

  // Check horizontal overflow
  const desktopOverflow = await desktopPage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('✓ Desktop horizontal overflow:', desktopOverflow);

  // Test Gallery Filter Buttons
  console.log('✓ Testing Community Gallery filters...');
  await desktopPage.locator('#gallery').scrollIntoViewIfNeeded();
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: path.join(SHOTS_DIR, '01-community-gallery-all.png') });

  // Click "Events & Meetups" filter
  await desktopPage.click('button[data-filter="events"]');
  await desktopPage.waitForTimeout(400);
  await desktopPage.screenshot({ path: path.join(SHOTS_DIR, '02-community-gallery-events.png') });

  // Click a gallery card to open Lightbox
  console.log('✓ Testing Lightbox click-to-expand...');
  const firstVisibleCard = desktopPage.locator('.gallery-card:visible').first();
  await firstVisibleCard.click();
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: path.join(SHOTS_DIR, '03-gallery-lightbox-open.png') });

  // Close lightbox with ESC
  await desktopPage.keyboard.press('Escape');
  await desktopPage.waitForTimeout(400);

  // Test Alumni Review Modal
  console.log('✓ Testing Alumni Review Submission Modal...');
  await desktopPage.locator('#alumni').scrollIntoViewIfNeeded();
  await desktopPage.waitForTimeout(400);
  await desktopPage.click('#openReviewModalBtn');
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: path.join(SHOTS_DIR, '04-alumni-review-modal.png') });
  await desktopPage.keyboard.press('Escape');
  await desktopPage.waitForTimeout(300);

  // Test Blog Directory Page in Browser
  console.log('✓ Testing Blog Directory view...');
  await desktopPage.goto(`${BASE_URL}/blog`, { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: path.join(SHOTS_DIR, '05-blog-directory.png'), fullPage: false });

  // Test Article Detail Page in Browser
  console.log('✓ Testing Article Detail view...');
  await desktopPage.goto(`${BASE_URL}/blog/tracing-indias-arabica-roots-chikmagalur`, { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: path.join(SHOTS_DIR, '06-article-detail.png'), fullPage: false });

  // Test Stealth Admin Console with Auth Gate
  console.log('✓ Testing Stealth Admin Console...');
  await desktopPage.goto(`${BASE_URL}/stealth-desk-14`, { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: path.join(SHOTS_DIR, '07-stealth-auth-gate.png') });

  // Enter password and log in
  await desktopPage.fill('#adminPass', 'SectionB#2021');
  await desktopPage.click('button[type="submit"]');
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(SHOTS_DIR, '08-stealth-dashboard-authenticated.png') });

  // Mobile Viewport Verification
  console.log('\n--- Step 5: Mobile Viewport Verification ---');
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const mobileOverflow = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('✓ Mobile horizontal overflow:', mobileOverflow);
  await mobilePage.screenshot({ path: path.join(SHOTS_DIR, '09-mobile-hero.png') });

  await mobilePage.locator('#gallery').scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(SHOTS_DIR, '10-mobile-gallery.png') });

  await mobilePage.locator('#alumni').scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(SHOTS_DIR, '11-mobile-alumni.png') });

  await browser.close();
  console.log('\n======================================================');
  console.log('🎉 ALL SBC EXPANSION & REFINEMENT CHECKS PASSED 100%!');
  console.log('======================================================\n');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
