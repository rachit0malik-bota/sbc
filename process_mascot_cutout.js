const { chromium } = require('playwright-core');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3005/');

  const results = await page.evaluate(async () => {
    async function makeTransparent(imgUrl, threshold = 242, feather = 14) {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

            // Clean white background removal with smooth feathered edge
            if (brightness > threshold && diff < 18) {
              if (brightness >= threshold + feather) {
                data[i + 3] = 0;
              } else {
                const alpha = 1 - (brightness - threshold) / feather;
                data[i + 3] = Math.round(data[i + 3] * alpha);
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = imgUrl;
      });
    }

    const mascotDataUrl = await makeTransparent('http://localhost:3005/mascot-studio.jpg', 244, 10);
    return { mascotDataUrl };
  });

  fs.writeFileSync('mascot-bear-cutout.png', Buffer.from(results.mascotDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
  console.log('Successfully saved high-res clean mascot-bear-cutout.png!');
  await browser.close();
})();
