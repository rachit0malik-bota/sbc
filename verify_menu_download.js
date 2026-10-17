const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3005';
const SHOTS_DIR = path.join(__dirname, 'shots');

async function testMenuDownload() {
  console.log('=== TESTING OFFICIAL SECTION-B MENU DOWNLOAD ===\n');

  // 1. Direct HTTP validation
  console.log('--- Step 1: Validating HTTP Endpoints ---');
  const directRes = await fetch(`${BASE_URL}/section-b-coffee-menu.pdf`);
  console.log('✓ /section-b-coffee-menu.pdf status:', directRes.status);
  console.log('  Content-Type:', directRes.headers.get('content-type'));
  console.log('  Content-Length:', directRes.headers.get('content-length'), 'bytes');

  const dlRes = await fetch(`${BASE_URL}/download-menu`);
  console.log('✓ /download-menu status:', dlRes.status);
  console.log('  Content-Type:', dlRes.headers.get('content-type'));
  console.log('  Content-Disposition:', dlRes.headers.get('content-disposition'));
  console.log('  Content-Length:', dlRes.headers.get('content-length'), 'bytes');

  if (dlRes.status !== 200 || !dlRes.headers.get('content-disposition')?.includes('Section-B-Coffee-Official-Menu.pdf')) {
    throw new Error('Failed to verify /download-menu attachment response!');
  }

  // 2. Playwright Browser Download Simulation
  console.log('\n--- Step 2: Testing Browser Interaction & Download Event ---');
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();
  await page.goto(`${BASE_URL}/#menu`, { waitUntil: 'networkidle' });

  // Scroll to download bar
  const downloadBar = page.locator('.menu-download-bar');
  await downloadBar.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(SHOTS_DIR, 'menu-download-banner-updated.png') });
  console.log('✓ Captured menu-download-banner-updated.png');

  // Listen for the download event when clicking download button
  console.log('✓ Clicking Download Official Menu button...');
  const [ download ] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#downloadMenuBtn')
  ]);

  const suggestedFilename = download.suggestedFilename();
  console.log('✓ Download event triggered! Suggested filename:', suggestedFilename);

  // Capture screenshot of toast while downloading
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'menu-download-toast-active.png') });
  console.log('✓ Captured menu-download-toast-active.png');

  // Save the downloaded file to verify integrity
  const downloadSavePath = path.join(SHOTS_DIR, 'verified-download-' + suggestedFilename);
  await download.saveAs(downloadSavePath);
  const downloadedStat = fs.statSync(downloadSavePath);
  console.log('✓ Downloaded file successfully verified on disk:');
  console.log('  Path:', downloadSavePath);
  console.log('  Size:', downloadedStat.size, 'bytes');

  if (downloadedStat.size !== 44950027) {
    throw new Error(`Size mismatch! Expected 44950027 bytes, got ${downloadedStat.size}`);
  }

  await browser.close();

  // Cleanup downloaded verification test copy
  if (fs.existsSync(downloadSavePath)) {
    fs.unlinkSync(downloadSavePath);
  }

  console.log('\n======================================================');
  console.log('🎉 MENU PDF DOWNLOAD FULLY INTEGRATED & VERIFIED!');
  console.log('======================================================\n');
}

testMenuDownload().catch(err => {
  console.error('❌ Menu download test failed:', err);
  process.exit(1);
});
