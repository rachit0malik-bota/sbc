const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  if (!fs.existsSync('shots')) fs.mkdirSync('shots');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }));

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' });

  // 1. Screenshot top (Hero - completely pristine, no coffee stream)
  await page.screenshot({ path: 'shots/shot1-hero.png' });

  // 2. Scroll to small tipped cup transition
  await page.evaluate(() => window.scrollTo(0, 800));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'shots/shot2-spill-cup.png' });

  // 3. Scroll to Born in Section-B scrollytelling
  await page.evaluate(() => window.scrollTo(0, 1500));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'shots/shot3-story.png' });

  // 4. Scroll to Menu
  await page.evaluate(() => {
    const el = document.getElementById('menu');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'shots/shot4-menu.png' });

  console.log('CONSOLE LOGS COUNT:', logs.length);
  if (logs.length > 0) {
    console.log(JSON.stringify(logs, null, 2));
  } else {
    console.log('ALL CLEAR: 0 errors, 0 warnings.');
  }

  await browser.close();
})();
