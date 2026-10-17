const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  try {
    console.log('Navigating to maps url...');
    await page.goto('https://maps.app.goo.gl/aEAJmoLQ8FcPe38f6', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('DOM Content Loaded, waiting for elements...');
    await page.waitForTimeout(6000);
    
    // Check title and url
    console.log('Final URL:', page.url());
    console.log('Title:', await page.title());

    // Click on Reviews tab if found
    const reviewTab = await page.$('button[aria-label*="Reviews"], button[aria-label*="reviews"], div[role="tab"]:has-text("Reviews")');
    if (reviewTab) {
      console.log('Clicking reviews tab...');
      await reviewTab.click();
      await page.waitForTimeout(3000);
    }

    // Extract place details and reviews
    const data = await page.evaluate(() => {
      const title = document.querySelector('h1')?.innerText || '';
      const rating = document.querySelector('div.F7nice span')?.innerText || '';
      const reviewsCount = document.querySelector('div.F7nice span:nth-child(2)')?.innerText || '';
      
      // Extract all review text blocks
      const reviewCards = [];
      document.querySelectorAll('div[data-review-id]').forEach(card => {
        const author = card.querySelector('.d4r55')?.innerText?.trim() || '';
        const rating = card.querySelector('.kvMYJc')?.getAttribute('aria-label') || '';
        const text = card.querySelector('.wiI7pd')?.innerText?.trim() || '';
        const time = card.querySelector('.rsqaWe')?.innerText?.trim() || '';
        if (author || text) {
          reviewCards.push({ author, rating, text, time });
        }
      });

      // Fallback: look for review snippets anywhere
      const fallbackSnippets = [];
      document.querySelectorAll('.MyEned, .wiI7pd').forEach(el => {
        const t = el.innerText.trim();
        if (t.length > 15) fallbackSnippets.push(t);
      });

      return { title, rating, reviewsCount, reviewCards, fallbackSnippets };
    });

    console.log('EXTRACTED_DATA_START');
    console.log(JSON.stringify(data, null, 2));
    console.log('EXTRACTED_DATA_END');
    
    await page.screenshot({ path: 'maps-page.png' });

  } catch (err) {
    console.error('Error fetching reviews:', err.message);
  } finally {
    await browser.close();
  }
})();
