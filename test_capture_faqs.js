const { chromium } = require('playwright-core');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\fa6dc11a-ef75-4727-b355-1879659dea71';

(async () => {
  console.log('--- Visual Verification for SEO Knowledge Questionnaire Hub ---');
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  // 1. Visit /journal and scroll to FAQ Knowledge Hub
  await page.goto('http://localhost:3005/journal', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const faqSection = await page.$('#faq-knowledge-hub');
  if (faqSection) {
    await faqSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'page-journal-faq-section.png') });
    console.log('✓ Captured page-journal-faq-section.png');

    // Click first FAQ to expand
    const firstFaqSummary = await page.$('.faq-accordion-item:nth-of-type(1) .faq-summary');
    if (firstFaqSummary) {
      await firstFaqSummary.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'page-journal-faq-expanded.png') });
      console.log('✓ Captured page-journal-faq-expanded.png');
    }

    // Filter by searching "v60"
    const searchInput = await page.$('#faqSearchInput');
    if (searchInput) {
      await searchInput.fill('v60');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'page-journal-faq-search-v60.png') });
      console.log('✓ Captured page-journal-faq-search-v60.png');
    }
  }

  // 2. Admin Console: Login and inspect SEO Knowledge & FAQs Pane
  const adminPage = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await adminPage.goto('http://localhost:3005/stealth-desk-14', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(400);

  // Fill credentials
  await adminPage.fill('#adminUser', 'desk14');
  await adminPage.fill('#adminPass', 'SectionB#2021');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForTimeout(800);

  // Click SEO Knowledge & FAQs tab
  const faqTab = await adminPage.$('.admin-tab-btn[data-pane="paneFaqs"]');
  if (faqTab) {
    await faqTab.click();
    await adminPage.waitForTimeout(500);
    await adminPage.screenshot({ path: path.join(ARTIFACT_DIR, 'page-admin-faqs-table.png') });
    console.log('✓ Captured page-admin-faqs-table.png');

    // Click "Add New Question"
    await adminPage.click('#btnNewFaq');
    await adminPage.waitForTimeout(400);
    await adminPage.screenshot({ path: path.join(ARTIFACT_DIR, 'page-admin-faq-editor.png') });
    console.log('✓ Captured page-admin-faq-editor.png');
  }

  await browser.close();
  console.log('--- Verification Complete ---');
})();
