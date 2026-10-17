const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

async function extract() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage();

  const sourceImagePath = 'C:/Users/Admin/.gemini/antigravity/brain/fa6dc11a-ef75-4727-b355-1879659dea71/.user_uploaded/media_1792163526634_ff2cf987.png';
  const imgBase64 = fs.readFileSync(sourceImagePath).toString('base64');
  const dataUri = `data:image/png;base64,${imgBase64}`;

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body>
        <img id="srcImg" src="${dataUri}" />
        <canvas id="cropCanvas"></canvas>
      </body>
    </html>
  `);

  await page.waitForSelector('#srcImg');

  // Pure photographic crops without card header text
  const crops = [
    { name: 'desk-notebook.png', x: 745, y: 0, w: 279, h: 248 },
    { name: 'cherries.png', x: 89, y: 375, w: 94, h: 86 },
    { name: 'roasted-beans.png', x: 213, y: 382, w: 96, h: 58 },
    { name: 'espresso-pour.png', x: 336, y: 382, w: 96, h: 58 },
    { name: 'mascot-bear-3d.png', x: 530, y: 330, w: 160, h: 205 },
    { name: 'splash-cup.png', x: 180, y: 135, w: 185, h: 185 }
  ];

  for (const crop of crops) {
    const dataUrl = await page.evaluate((c) => {
      const img = document.getElementById('srcImg');
      const canvas = document.getElementById('cropCanvas');
      canvas.width = c.w;
      canvas.height = c.h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
      return canvas.toDataURL('image/png');
    }, crop);

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const outPath = path.join(__dirname, 'assets', crop.name);
    fs.writeFileSync(outPath, base64Data, 'base64');
    console.log(`Saved: assets/${crop.name}`);
  }

  await browser.close();
  console.log('All crops re-extracted cleanly!');
}

extract().catch(console.error);
