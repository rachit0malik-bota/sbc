const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage();

  // Test transparent cutouts generation using HTML5 canvas
  await page.goto('http://localhost:3005/');

  const result = await page.evaluate(async () => {
    // Helper to remove white/light background from an image
    async function makeTransparent(imgUrl, threshold = 238, feather = 18) {
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
            // Check brightness & neutrality
            const brightness = (r + g + b) / 3;
            const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

            if (brightness > threshold && diff < 20) {
              // Smooth feathering
              if (brightness >= threshold + feather) {
                data[i + 3] = 0; // Completely transparent
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

    const mascotDataUrl = await makeTransparent('http://localhost:3005/mascot-bear-3d.png', 230, 20);
    return { mascotDataUrl };
  });

  // Save mascot-bear-cutout.png
  const mascotBase64 = result.mascotDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('mascot-bear-cutout.png', Buffer.from(mascotBase64, 'base64'));
  console.log('Saved mascot-bear-cutout.png successfully!');

  await browser.close();
})();
