const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { background: #235441; padding: 40px; display: flex; gap: 30px; align-items: center; justify-content: center; }
        .box { background: rgba(255,255,255,0.08); padding: 20px; border-radius: 12px; text-align: center; color: white; font-family: sans-serif; }
        img { display: block; margin: 0 auto; max-height: 200px; object-fit: contain; }
      </style>
    </head>
    <body>
      <div class="box"><h4>Mascot Bear Cutout</h4><img src="http://localhost:3005/mascot-bear-cutout.png" /></div>
      <div class="box"><h4>Coffee Mug Cutout</h4><img src="http://localhost:3005/coffee-mug-cutout.png" /></div>
      <div class="box"><h4>Beans & Cherries Cutout</h4><img src="http://localhost:3005/coffee-beans-cutout.png" /></div>
      <div class="box"><h4>Iced SBC Cup Cutout</h4><img src="http://localhost:3005/sbc-cup-cutout.png" /></div>
    </body>
    </html>
  `;
  await page.setContent(html);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'shots/verified-all-cutouts.png' });
  console.log('Saved shots/verified-all-cutouts.png');
  await browser.close();
})();
