const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
  const page = await browser.newPage();
  const cupPath = 'file:///' + path.resolve('assets/sbc-cup-cutout.png').replace(/\\/g, '/');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body style="background: #FBF9F5; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;">
      <img src="${cupPath}" style="max-height:80vh;" />
    </body>
    </html>
  `);
  await page.screenshot({ path: 'shots/test-cup-cutout.png' });
  console.log('Saved shots/test-cup-cutout.png');
  await browser.close();
})();
