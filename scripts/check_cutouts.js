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
        body { background: #235441; padding: 40px; display: flex; flex-wrap: wrap; gap: 30px; align-items: center; }
        .box { background: rgba(255,255,255,0.12); padding: 15px; border-radius: 8px; text-align: center; color: white; font-family: sans-serif; }
        img { display: block; margin: 0 auto; max-height: 180px; object-fit: contain; }
      </style>
    </head>
    <body>
      <div class="box"><h4>mascot-bear-3d</h4><img src="http://localhost:3005/mascot-bear-3d.png" /></div>
      <div class="box"><h4>roasted-beans</h4><img src="http://localhost:3005/roasted-beans.png" /></div>
      <div class="box"><h4>cherries</h4><img src="http://localhost:3005/cherries.png" /></div>
      <div class="box"><h4>desk-notebook</h4><img src="http://localhost:3005/desk-notebook.png" /></div>
      <div class="box"><h4>sbc-cup-cutout</h4><img src="http://localhost:3005/sbc-cup-cutout.png" /></div>
      <div class="box"><h4>sbc-signature-cup</h4><img src="http://localhost:3005/sbc-signature-cup.png" /></div>
      <div class="box"><h4>coffee-bean.svg</h4><img src="http://localhost:3005/coffee-bean.svg" style="width: 80px; height: 80px;" /></div>
    </body>
    </html>
  `;
  await page.setContent(html);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'shots/test-png-cutouts.png' });
  console.log('Saved shots/test-png-cutouts.png');
  await browser.close();
})();
