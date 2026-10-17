const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const pdfPath = path.resolve(__dirname, 'section-b-coffee-menu.pdf');
const shotsDir = path.resolve(__dirname, 'shots');

(async () => {
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  const page = await browser.newPage({
    viewport: { width: 1200, height: 1600 }
  });

  console.log('Opening PDF in Edge...');
  await page.goto('http://localhost:3005/section-b-coffee-menu.pdf', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(shotsDir, 'menu-pdf-preview.png') });
  console.log('Saved menu-pdf-preview.png');

  await browser.close();
})();
