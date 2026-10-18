const fs = require('fs');
const path = require('path');
const { renderBlogDirectory, renderArticlePage, generateSitemapXml } = require('../blog_renderer');

console.log('==> Starting SBC Static Production Build for Vercel...');

const hostUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'https://sectionbcoffee.com';

// 1. Generate journal.html at root
const journalHtml = renderBlogDirectory(hostUrl);
fs.writeFileSync(path.join(__dirname, '..', 'journal.html'), journalHtml, 'utf-8');
console.log('✓ Created journal.html (' + Math.round(journalHtml.length / 1024) + ' KB)');

// 2. Ensure directories exist
const blogDir = path.join(__dirname, '..', 'blog');
const journalDir = path.join(__dirname, '..', 'journal');
if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
if (!fs.existsSync(journalDir)) fs.mkdirSync(journalDir, { recursive: true });

// 3. Write index.html inside blog/ and journal/
fs.writeFileSync(path.join(blogDir, 'index.html'), journalHtml, 'utf-8');
fs.writeFileSync(path.join(journalDir, 'index.html'), journalHtml, 'utf-8');
console.log('✓ Created blog/index.html and journal/index.html');

// 4. Read all published posts and generate static HTML for each slug
let posts = [];
try {
  const postsData = fs.readFileSync(path.join(__dirname, '..', 'data', 'blog_posts.json'), 'utf-8');
  posts = JSON.parse(postsData);
} catch (e) {
  console.warn('Warning: Could not read blog_posts.json:', e.message);
}

let generatedCount = 0;
for (const post of posts) {
  if (!post.slug) continue;

  const articleHtml = renderArticlePage(post.slug, hostUrl, false);
  if (!articleHtml) continue;

  // Save as blog/:slug.html and journal/:slug.html
  fs.writeFileSync(path.join(blogDir, `${post.slug}.html`), articleHtml, 'utf-8');
  fs.writeFileSync(path.join(journalDir, `${post.slug}.html`), articleHtml, 'utf-8');

  // Also save as blog/:slug/index.html and journal/:slug/index.html for trailing slash support
  const postBlogSubdir = path.join(blogDir, post.slug);
  const postJournalSubdir = path.join(journalDir, post.slug);
  if (!fs.existsSync(postBlogSubdir)) fs.mkdirSync(postBlogSubdir, { recursive: true });
  if (!fs.existsSync(postJournalSubdir)) fs.mkdirSync(postJournalSubdir, { recursive: true });

  fs.writeFileSync(path.join(postBlogSubdir, 'index.html'), articleHtml, 'utf-8');
  fs.writeFileSync(path.join(postJournalSubdir, 'index.html'), articleHtml, 'utf-8');

  generatedCount++;
  console.log(`  ✓ Generated article: ${post.slug}`);
}

// 5. Update sitemap.xml
const sitemapXml = generateSitemapXml(hostUrl);
fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), sitemapXml, 'utf-8');
console.log(`✓ Updated sitemap.xml with ${posts.length} entries`);

console.log(`\n==> SBC Build complete! Generated ${generatedCount} static dispatches + directory hubs.`);
