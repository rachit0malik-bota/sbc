const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage();
  const bearPath = 'file:///' + path.resolve('assets/sbc-mascot-bear.png').replace(/\\/g, '/');
  
  await page.goto(bearPath);
  
  const result = await page.evaluate(() => {
    const img = document.querySelector('img');
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const idata = ctx.getImageData(0, 0, c.width, c.height);
    const data = idata.data;
    
    return {
      w: c.width,
      h: c.height,
      tl: [data[0], data[1], data[2], data[3]],
      tr: [data[(c.width-1)*4], data[(c.width-1)*4+1], data[(c.width-1)*4+2], data[(c.width-1)*4+3]],
      bl: [data[((c.height-1)*c.width)*4], data[((c.height-1)*c.width)*4+1], data[((c.height-1)*c.width)*4+2], data[((c.height-1)*c.width)*4+3]],
    };
  });
  
  console.log('Bear image info:', JSON.stringify(result));
  await browser.close();
})();
