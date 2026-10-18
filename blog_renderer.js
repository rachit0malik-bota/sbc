const fs = require('fs');
const path = require('path');

const defaultBlogPosts = require('./data/blog_posts.json');
const defaultFaqs = require('./data/faqs.json');

function getPublishedPosts() {
  try {
    const dataPath = path.join(__dirname, 'data', 'blog_posts.json');
    if (fs.existsSync(dataPath)) {
      const posts = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      return posts.filter(p => p.published);
    }
  } catch (err) {}
  return defaultBlogPosts.filter(p => p.published);
}

function getAllPosts() {
  try {
    const dataPath = path.join(__dirname, 'data', 'blog_posts.json');
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
  } catch (err) {}
  return defaultBlogPosts;
}

function getPostBySlug(slug, allowDrafts = false) {
  const posts = allowDrafts ? getAllPosts() : getPublishedPosts();
  return posts.find(p => p.slug.toLowerCase() === slug.toLowerCase());
}

function getFaqs() {
  try {
    const tmpPath = path.join('/tmp', 'faqs.json');
    if (fs.existsSync(tmpPath)) {
      return JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
    }
  } catch (e) {}

  try {
    const dataPath = path.join(__dirname, 'data', 'faqs.json');
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
  } catch (err) {}
  return defaultFaqs;
}

// Annotation hints for student notes
const POST_ANNOTATIONS = {
  'tracing-indias-arabica-roots-chikmagalur': 'Baba Budan · 7 raw seeds strapped under travel robes in 1670',
  'science-of-204c-first-crack-roast-profiling': 'First Crack at 204°C · Natural sucrose caramelizes into dense toffee',
  'born-in-section-b-craft-coffee-story': 'Back-bench Desk 14 daydream · Oct 2021 · 9.2-bar slow-bar craft',
  'v60-vs-aeropress-slow-bar-extraction-guide': 'Conical 60° floral clarity vs immersion pneumatic body'
};

// ---------------------------------------------------------------------------
// 1. Render Blog / Journal Directory (/journal or /blog)
// ---------------------------------------------------------------------------
function renderBlogDirectory(hostUrl = 'http://localhost:3005') {
  const posts = getPublishedPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const categories = ['All', 'Brewing Guides', 'Bean Origins', 'SBC Stories'];

  // Spotlight the newest / top post
  const featuredPost = posts[0] || null;
  const gridPosts = posts.length > 1 ? posts.slice(1) : posts;

  // SEO Knowledge Hub / FAQs
  const faqs = getFaqs().sort((a, b) => (a.order || 99) - (b.order || 99));
  const faqCategories = ['All', ...new Set(faqs.map(f => f.category).filter(Boolean))];

  const faqsHtml = faqs.map(faq => `
    <details class="faq-accordion-item" data-category="${faq.category}" data-search="${(faq.question + ' ' + faq.answer + ' ' + (faq.targetQuery || '')).toLowerCase()}">
      <summary class="faq-summary">
        <div class="faq-summary-left">
          <span class="faq-cat-tag">${faq.category}</span>
          <h3 class="faq-question-title">${faq.question}</h3>
          ${faq.targetQuery ? `<span class="faq-query-chip">🎯 Target Query: "${faq.targetQuery}"</span>` : ''}
        </div>
        <span class="faq-toggle-icon">▾</span>
      </summary>
      <div class="faq-body">
        <div class="faq-answer-text">
          ${faq.answer.replace(/\n/g, '<br><br>')}
        </div>
        ${faq.annotation ? `
          <div class="faq-student-note">
            <span class="note-pin">📌</span>
            <span class="note-text">“${faq.annotation}”</span>
          </div>
        ` : ''}
        ${faq.relatedSlug ? `
          <div class="faq-related-link-row">
            <a href="/journal/${faq.relatedSlug}" class="faq-deep-dive-link">
              <span>Read complete technical dispatch on this topic</span>
              <span>→</span>
            </a>
          </div>
        ` : ''}
      </div>
    </details>
  `).join('\n');

  const faqLdJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer.replace(/\n/g, '<br>')
      }
    }))
  }, null, 2);

  const postCardsHtml = gridPosts.map((post, idx) => {
    const annotation = POST_ANNOTATIONS[post.slug] || `Field Note · Section-B Coffee Labs Issue #${String(idx + 1).padStart(2, '0')}`;
    const pubDate = new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <article class="dispatch-card" data-category="${post.category}" data-search="${(post.title + ' ' + post.excerpt + ' ' + post.category + ' ' + post.author).toLowerCase()}">
        <a href="/journal/${post.slug}" class="dispatch-card-cover-link" aria-label="${post.title}">
          <div class="dispatch-card-media">
            <img src="/${post.coverImage || 'hero-coffee.jpg'}" alt="${post.title}" class="dispatch-card-img" loading="lazy">
            <div class="dispatch-card-media-overlay"></div>
            <span class="dispatch-card-badge">${post.category}</span>
            <span class="dispatch-card-readtime">⏱ ${post.readTime || '4 min read'}</span>
          </div>
        </a>
        <div class="dispatch-card-body">
          <div class="dispatch-card-meta-row">
            <span class="journal-meta-date">${pubDate}</span>
            <span class="journal-meta-sep">·</span>
            <span class="journal-meta-author">${post.author.split('·')[0].trim()}</span>
          </div>
          
          <h2 class="dispatch-card-title">
            <a href="/journal/${post.slug}">${post.title}</a>
          </h2>
          
          <p class="dispatch-card-excerpt">${post.excerpt}</p>

          <!-- Student Handwritten Note Callout -->
          <div class="journal-handwritten-note">
            <span class="note-pin">📌</span>
            <span class="note-text">“${annotation}”</span>
          </div>

          <div class="dispatch-card-footer">
            <div class="dispatch-card-author-pill">
              <span class="author-icon">✍️</span>
              <span class="author-name">${post.author}</span>
            </div>
            <a href="/journal/${post.slug}" class="journal-read-link">
              <span>Read Dispatch</span>
              <span class="journal-read-arrow">→</span>
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Section-B Journal · Specialty Coffee Stories, Roast Science & Guides | SBC</title>
  <meta name="description" content="Explore single-origin Western Ghats Arabica provenance, 204°C roast chemistry, manual slow-bar brewing recipes, and the classroom daydream story of SBC.">
  <link rel="canonical" href="${hostUrl}/journal">
  
  <!-- Open Graph -->
  <meta property="og:title" content="The Section-B Journal · Specialty Coffee Stories & Brewing Guides">
  <meta property="og:description" content="Single-origin bean provenance, roast chemistry, and manual slow-bar brew guides from Section-B Coffee.">
  <meta property="og:url" content="${hostUrl}/journal">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${hostUrl}/hero-coffee.jpg">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="The Section-B Journal · Specialty Coffee Stories & Brewing Guides">
  <meta name="twitter:description" content="Single-origin bean provenance, roast chemistry, and manual brew guides from Section-B Coffee.">
  <meta name="twitter:image" content="${hostUrl}/hero-coffee.jpg">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- Schema.org JSON-LD Blog -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "The Section-B Journal",
    "url": "${hostUrl}/journal",
    "description": "Specialty coffee craft, roast chemistry, and dispatches from Section-B Coffee.",
    "publisher": {
      "@type": "Organization",
      "name": "SBC (Section-B Coffee)",
      "logo": {
        "@type": "ImageObject",
        "url": "${hostUrl}/sbc-official-logo.png"
      }
    }
  }
  </script>

  <!-- Schema.org JSON-LD FAQPage for Google Search Rich Snippets & PAA (People Also Ask) -->
  <script type="application/ld+json">
  ${faqLdJson}
  </script>

  <link rel="stylesheet" href="/styles.css">

  <style>
    /* ==========================================================================
       DEDICATED VISUAL ENHANCEMENTS FOR THE JOURNAL PAGE
       ========================================================================== */
    :root {
      --journal-espresso: #2B1810;
      --journal-forest: #0A4D34;
      --journal-caramel: #C87D32;
      --journal-cream: #FBF8F2;
      --journal-parchment: #F4EFE6;
      --journal-border: rgba(43, 24, 16, 0.12);
    }

    /* Transparent Navigation Bar Over Dark Hero */
    .site-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background-color: transparent;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      transition: background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    }
    .site-header .nav-logo-bold {
      color: #FFFFFF;
      transition: color 0.3s ease;
    }
    .site-header .nav-logo-sub {
      color: #4ADE80;
      transition: color 0.3s ease;
    }
    .site-header .nav-brand-sep {
      color: var(--journal-caramel);
    }
    .site-header .nav-link {
      color: rgba(255, 255, 255, 0.9);
      transition: color 0.3s ease;
    }
    .site-header .nav-link.active {
      color: #E89E58;
      font-weight: 800;
    }
    .site-header .hamburger-bar {
      background-color: #FFFFFF;
      transition: background-color 0.3s ease;
    }

    /* Scrolled State for Header */
    .site-header.scrolled {
      background-color: rgba(251, 248, 242, 0.96) !important;
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(10, 77, 52, 0.08) !important;
      box-shadow: 0 4px 24px rgba(52, 30, 21, 0.08) !important;
    }
    .site-header.scrolled .nav-logo-bold {
      color: var(--journal-espresso) !important;
    }
    .site-header.scrolled .nav-logo-sub {
      color: var(--journal-forest) !important;
    }
    .site-header.scrolled .nav-link {
      color: var(--journal-espresso) !important;
    }
    .site-header.scrolled .nav-link.active {
      color: var(--journal-caramel) !important;
    }
    .site-header.scrolled .hamburger-bar {
      background-color: var(--journal-espresso) !important;
    }

    /* Ambient Hero Header */
    .journal-hero-section {
      position: relative;
      background: radial-gradient(circle at 50% 20%, #341E15 0%, #1A0F0A 100%);
      color: #FBF8F2;
      padding: 9.5rem 1.5rem 5.5rem;
      overflow: hidden;
      text-align: center;
    }
    .journal-hero-bg-media {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.22;
      filter: saturate(1.2) brightness(0.85);
    }
    .journal-hero-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(26, 15, 10, 0.3) 0%, rgba(26, 15, 10, 0.95) 100%);
    }
    .journal-hero-content {
      position: relative;
      z-index: 5;
      max-width: 880px;
      margin: 0 auto;
    }
    .journal-eyebrow-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(200, 125, 50, 0.18);
      border: 1px solid rgba(200, 125, 50, 0.6);
      color: #E89E58;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 0.45rem 1.25rem;
      border-radius: 999px;
      margin-bottom: 1.5rem;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 16px rgba(200, 125, 50, 0.15);
    }
    .journal-hero-title {
      font-size: clamp(2.4rem, 5.5vw, 4.4rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.12;
      color: #FFFFFF;
      margin: 0 0 1.25rem;
    }
    .journal-hero-title span {
      color: var(--journal-caramel);
      font-style: italic;
    }
    .journal-hero-subtitle {
      font-size: clamp(1.05rem, 1.8vw, 1.25rem);
      line-height: 1.65;
      color: rgba(251, 248, 242, 0.88);
      max-width: 720px;
      margin: 0 auto 2.5rem;
    }

    /* Hero Badges Ribbon */
    .journal-hero-ribbon {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(251, 248, 242, 0.12);
      max-width: 780px;
      margin: 0 auto;
    }
    .ribbon-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      color: rgba(251, 248, 242, 0.78);
      letter-spacing: 0.04em;
    }
    .ribbon-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--journal-caramel);
    }

    /* Main Container & Page Body */
    .journal-page-main {
      background: var(--journal-cream);
      padding: 4rem 1.5rem 6rem;
      position: relative;
    }

    /* Interactive Controls Bar: Categories & Search */
    .journal-controls-wrapper {
      max-width: 1200px;
      margin: 0 auto 3.5rem;
      background: #FFFFFF;
      border: 1.5px solid var(--journal-border);
      border-radius: 20px;
      padding: 1.25rem 1.75rem;
      box-shadow: 0 8px 30px rgba(43, 24, 16, 0.06);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
    }
    .journal-filter-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
    .journal-filter-tab {
      background: transparent;
      border: 1.5px solid transparent;
      color: var(--journal-espresso);
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.55rem 1.15rem;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .journal-filter-tab:hover {
      background: rgba(10, 77, 52, 0.06);
      color: var(--journal-forest);
    }
    .journal-filter-tab.active {
      background: var(--journal-forest);
      color: #FFFFFF;
      border-color: var(--journal-forest);
      box-shadow: 0 4px 14px rgba(10, 77, 52, 0.25);
    }
    .tab-count {
      font-size: 0.72rem;
      padding: 2px 6px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.2);
    }
    .journal-filter-tab:not(.active) .tab-count {
      background: rgba(43, 24, 16, 0.08);
      color: var(--journal-espresso);
    }

    /* Live Search Box */
    .journal-search-wrap {
      position: relative;
      flex: 1;
      max-width: 320px;
      min-width: 240px;
    }
    .journal-search-input {
      width: 100%;
      padding: 0.65rem 1rem 0.65rem 2.6rem;
      background: var(--journal-parchment);
      border: 1.5px solid rgba(43, 24, 16, 0.1);
      border-radius: 999px;
      font-family: inherit;
      font-size: 0.88rem;
      color: var(--journal-espresso);
      outline: none;
      transition: all 0.25s ease;
    }
    .journal-search-input:focus {
      background: #FFFFFF;
      border-color: var(--journal-caramel);
      box-shadow: 0 0 0 3px rgba(200, 125, 50, 0.15);
    }
    .journal-search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.95rem;
      color: #8C7B74;
      pointer-events: none;
    }

    /* Spotlight / Lead Article Box */
    .journal-spotlight-box {
      max-width: 1200px;
      margin: 0 auto 4rem;
      background: #FFFFFF;
      border: 2px solid var(--journal-espresso);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 8px 12px 0px rgba(43, 24, 16, 0.12);
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .journal-spotlight-box:hover {
      transform: translateY(-3px);
      box-shadow: 10px 16px 0px rgba(43, 24, 16, 0.16);
    }
    @media (max-width: 900px) {
      .journal-spotlight-box {
        grid-template-columns: 1fr;
      }
    }
    .spotlight-media {
      position: relative;
      min-height: 380px;
      overflow: hidden;
    }
    .spotlight-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .journal-spotlight-box:hover .spotlight-img {
      transform: scale(1.04);
    }
    .spotlight-stamp {
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      background: var(--journal-espresso);
      color: #FBF8F2;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 0.4rem 1rem;
      border-radius: 999px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .spotlight-content {
      padding: 3rem 3rem 3rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    @media (max-width: 600px) {
      .spotlight-content {
        padding: 2rem 1.5rem;
      }
    }
    .spotlight-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--journal-forest);
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.85rem;
    }
    .spotlight-title {
      font-size: clamp(1.6rem, 2.5vw, 2.2rem);
      font-weight: 800;
      color: var(--journal-espresso);
      line-height: 1.22;
      margin: 0 0 1rem;
    }
    .spotlight-title a {
      color: inherit;
      text-decoration: none;
      transition: color 0.2s ease;
    }
    .spotlight-title a:hover {
      color: var(--journal-caramel);
    }
    .spotlight-excerpt {
      font-size: 1rem;
      line-height: 1.6;
      color: #5A4B45;
      margin: 0 0 1.5rem;
    }
    .spotlight-student-note {
      background: #FFF9E6;
      border-left: 3px solid var(--journal-caramel);
      padding: 0.75rem 1rem;
      border-radius: 0 10px 10px 0;
      font-family: 'Caveat', cursive;
      font-size: 1.15rem;
      color: #6C4217;
      margin-bottom: 2rem;
    }
    .spotlight-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(43, 24, 16, 0.08);
    }
    .spotlight-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--journal-forest);
      color: #FFFFFF;
      font-size: 0.92rem;
      font-weight: 800;
      text-decoration: none;
      padding: 0.75rem 1.75rem;
      border-radius: 999px;
      transition: all 0.25s ease;
      box-shadow: 0 4px 14px rgba(10, 77, 52, 0.22);
    }
    .spotlight-btn:hover {
      background: #083D29;
      transform: translateX(4px);
      box-shadow: 0 6px 18px rgba(10, 77, 52, 0.3);
    }

    /* Main Journal Articles Grid */
    .dispatch-grid-wrapper {
      max-width: 1200px;
      margin: 0 auto;
    }
    .dispatch-grid-heading-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding-bottom: 0.75rem;
      border-bottom: 1.5px solid var(--journal-border);
    }
    .dispatch-grid-heading {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--journal-espresso);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .dispatch-grid-sub {
      font-size: 0.85rem;
      color: #8C7B74;
      font-weight: 600;
    }

    .dispatch-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2.25rem;
    }
    @media (max-width: 1024px) {
      .dispatch-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.75rem;
      }
    }
    @media (max-width: 640px) {
      .dispatch-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Journal Card Styling */
    .dispatch-card {
      background: #FFFFFF;
      border: 1.5px solid var(--journal-border);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(43, 24, 16, 0.05);
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }
    .dispatch-card:hover {
      transform: translateY(-8px);
      border-color: var(--journal-caramel);
      box-shadow: 0 18px 40px rgba(43, 24, 16, 0.12);
    }
    .dispatch-card-cover-link {
      display: block;
      text-decoration: none;
    }
    .dispatch-card-media {
      position: relative;
      aspect-ratio: 16 / 10;
      overflow: hidden;
      background: #1C120C;
    }
    .dispatch-card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dispatch-card:hover .dispatch-card-img {
      transform: scale(1.06);
    }
    .dispatch-card-media-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%);
    }
    .dispatch-card-badge {
      position: absolute;
      bottom: 12px;
      left: 12px;
      background: var(--journal-forest);
      color: #FFFFFF;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.3rem 0.85rem;
      border-radius: 999px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .dispatch-card-readtime {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(28, 18, 12, 0.75);
      color: #FBF8F2;
      backdrop-filter: blur(8px);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .dispatch-card-body {
      padding: 1.75rem 1.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .dispatch-card-meta-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      color: #8C7B74;
      font-weight: 600;
      margin-bottom: 0.65rem;
    }
    .journal-meta-sep {
      color: var(--journal-caramel);
    }
    .dispatch-card-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--journal-espresso);
      line-height: 1.32;
      margin: 0 0 0.75rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .dispatch-card-title a {
      color: inherit;
      text-decoration: none;
      transition: color 0.2s ease;
    }
    .dispatch-card-title a:hover {
      color: var(--journal-caramel);
    }
    .dispatch-card-excerpt {
      font-size: 0.9rem;
      line-height: 1.55;
      color: #6A5B55;
      margin: 0 0 1.25rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Collegiate Student Sticky Callout */
    .journal-handwritten-note {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      background: #FDF9EE;
      border: 1px dashed rgba(200, 125, 50, 0.35);
      border-radius: 8px;
      padding: 0.6rem 0.85rem;
      margin-bottom: 1.5rem;
    }
    .note-pin {
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .note-text {
      font-family: 'Caveat', cursive;
      font-size: 1.05rem;
      font-weight: 700;
      color: #7A4B1D;
      line-height: 1.25;
    }

    .dispatch-card-footer {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid rgba(43, 24, 16, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .dispatch-card-author-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.76rem;
      color: #8C7B74;
      font-weight: 600;
    }
    .journal-read-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--journal-caramel);
      text-decoration: none;
      transition: gap 0.2s ease;
    }
    .journal-read-link:hover {
      gap: 8px;
      color: var(--journal-forest);
    }

    /* Classroom Blackboard / Campus Labs Strip */
    .journal-blackboard-banner {
      max-width: 1200px;
      margin: 5rem auto 0;
      background: #1B2921;
      border: 3px solid #3E271E;
      border-radius: 24px;
      padding: 3rem 3rem 2.5rem;
      box-shadow: 0 16px 40px rgba(10, 77, 52, 0.2);
      color: #FBF8F2;
      position: relative;
      overflow: hidden;
    }
    @media (max-width: 768px) {
      .journal-blackboard-banner {
        padding: 2.25rem 1.5rem;
      }
    }
    .chalk-header {
      text-align: center;
      margin-bottom: 2.25rem;
    }
    .chalk-eyebrow {
      font-family: 'Caveat', cursive;
      font-size: 1.4rem;
      color: #D4A373;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 0.25rem;
    }
    .chalk-title {
      font-size: clamp(1.8rem, 3.5vw, 2.6rem);
      font-weight: 800;
      color: #FFFFFF;
      margin: 0;
    }
    .chalk-items-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    @media (max-width: 768px) {
      .chalk-items-grid {
        grid-template-columns: 1fr;
      }
    }
    .chalk-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      padding: 1.5rem;
      text-align: center;
    }
    .chalk-card-icon {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }
    .chalk-card-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0 0 0.5rem;
    }
    .chalk-card-desc {
      font-size: 0.85rem;
      line-height: 1.5;
      color: rgba(251, 248, 242, 0.75);
      margin: 0;
    }
    .chalk-cta-row {
      text-align: center;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
    }
    .chalk-instagram-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--journal-caramel);
      color: #FFFFFF;
      font-size: 0.9rem;
      font-weight: 800;
      text-decoration: none;
      padding: 0.7rem 1.6rem;
      border-radius: 999px;
      transition: all 0.25s ease;
    }
    .chalk-instagram-btn:hover {
      background: #B66C24;
      transform: scale(1.03);
    }

    /* Study Hall Mailroom Newsletter */
    .journal-study-hall-card {
      max-width: 860px;
      margin: 5rem auto 0;
      background: #FFFFFF;
      border: 2px dashed rgba(200, 125, 50, 0.4);
      border-radius: 20px;
      padding: 3.5rem 2.5rem;
      text-align: center;
      box-shadow: 0 12px 36px rgba(43, 24, 16, 0.06);
      position: relative;
    }
    .mailroom-stamp {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(200, 125, 50, 0.12);
      border: 1px solid var(--journal-caramel);
      color: var(--journal-caramel);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 0.35rem 1rem;
      border-radius: 999px;
      margin-bottom: 1.25rem;
    }
    .study-hall-title {
      font-size: clamp(1.6rem, 2.5vw, 2.2rem);
      font-weight: 800;
      color: var(--journal-espresso);
      margin: 0 0 0.85rem;
    }
    .study-hall-lead {
      font-size: 0.95rem;
      color: #6C5D57;
      max-width: 560px;
      margin: 0 auto 2rem;
      line-height: 1.6;
    }
    .study-hall-form {
      display: flex;
      max-width: 500px;
      margin: 0 auto;
      gap: 0.5rem;
    }
    @media (max-width: 540px) {
      .study-hall-form {
        flex-direction: column;
      }
    }
    .study-hall-input {
      flex: 1;
      padding: 0.85rem 1.25rem;
      border: 1.5px solid rgba(43, 24, 16, 0.15);
      border-radius: 999px;
      font-family: inherit;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.25s;
    }
    .study-hall-input:focus {
      border-color: var(--journal-forest);
    }
    .study-hall-btn {
      background: var(--journal-forest);
      color: #FFFFFF;
      border: none;
      padding: 0.85rem 1.85rem;
      border-radius: 999px;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.25s ease;
      white-space: nowrap;
    }
    .study-hall-btn:hover {
      background: #083D29;
      transform: translateY(-1px);
    }

    /* No Results State */
    .journal-no-results {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 1rem;
      background: #FFFFFF;
      border: 1.5px dashed var(--journal-border);
      border-radius: 16px;
      display: none;
    }
    .journal-no-results.visible {
      display: block;
    }

    /* ==========================================================================
       PROGRAMMATIC FAQ & QUERY-BASED SEO KNOWLEDGE SECTION
       ========================================================================== */
    .journal-faq-section {
      margin: 4.5rem 0 3.5rem;
      background: #FFFFFF;
      border: 1.5px solid var(--journal-border);
      border-radius: 20px;
      padding: 3rem 2.5rem;
      box-shadow: 0 12px 36px rgba(43, 24, 16, 0.04);
    }
    @media (max-width: 768px) {
      .journal-faq-section {
        padding: 2rem 1.25rem;
        border-radius: 16px;
      }
    }
    .faq-header-card {
      text-align: center;
      max-width: 820px;
      margin: 0 auto 2.5rem;
    }
    .faq-header-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--journal-caramel);
      background: rgba(200, 125, 50, 0.1);
      padding: 0.4rem 0.95rem;
      border-radius: 999px;
      margin-bottom: 1rem;
    }
    .faq-section-title {
      font-size: clamp(1.8rem, 3.5vw, 2.5rem);
      font-weight: 800;
      color: var(--journal-espresso);
      line-height: 1.2;
      margin: 0 0 0.85rem;
      letter-spacing: -0.02em;
    }
    .faq-section-title span {
      color: var(--journal-forest);
      font-style: italic;
    }
    .faq-section-subtitle {
      font-size: 1rem;
      color: #6C5D57;
      line-height: 1.6;
      margin: 0 auto 2rem;
    }
    .faq-controls-bar {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      align-items: center;
      margin-top: 1.5rem;
    }
    .faq-category-pills {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
    }
    .faq-pill-btn {
      background: var(--journal-parchment);
      border: 1px solid var(--journal-border);
      color: var(--journal-espresso);
      font-size: 0.82rem;
      font-weight: 700;
      padding: 0.45rem 1rem;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .faq-pill-btn:hover {
      background: #E8E0D5;
      border-color: rgba(43, 24, 16, 0.25);
    }
    .faq-pill-btn.active {
      background: var(--journal-forest);
      color: #FFFFFF;
      border-color: var(--journal-forest);
    }
    .faq-search-wrap {
      position: relative;
      width: 100%;
      max-width: 580px;
    }
    .faq-search-icon {
      position: absolute;
      left: 1.15rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.95rem;
      opacity: 0.6;
      pointer-events: none;
    }
    .faq-search-input {
      width: 100%;
      padding: 0.85rem 1.25rem 0.85rem 2.85rem;
      border-radius: 999px;
      border: 1.5px solid var(--journal-border);
      background: #FAF7F2;
      font-family: inherit;
      font-size: 0.92rem;
      color: var(--journal-espresso);
      outline: none;
      transition: all 0.2s ease;
    }
    .faq-search-input:focus {
      border-color: var(--journal-forest);
      background: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(10, 77, 52, 0.12);
    }
    .faq-items-list {
      max-width: 880px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .faq-accordion-item {
      border: 1.5px solid var(--journal-border);
      border-radius: 14px;
      background: #FAF7F2;
      transition: all 0.25s ease;
      overflow: hidden;
    }
    .faq-accordion-item:hover {
      border-color: rgba(43, 24, 16, 0.28);
      background: #FFFFFF;
    }
    .faq-accordion-item[open] {
      background: #FFFFFF;
      border-color: var(--journal-forest);
      box-shadow: 0 8px 24px rgba(10, 77, 52, 0.08);
    }
    .faq-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      cursor: pointer;
      list-style: none;
      user-select: none;
      gap: 1rem;
    }
    .faq-summary::-webkit-details-marker {
      display: none;
    }
    .faq-summary-left {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.4rem;
    }
    .faq-cat-tag {
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--journal-forest);
      background: rgba(10, 77, 52, 0.09);
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
    }
    .faq-question-title {
      font-size: 1.08rem;
      font-weight: 800;
      color: var(--journal-espresso);
      margin: 0;
      line-height: 1.35;
    }
    .faq-query-chip {
      display: inline-block;
      font-size: 0.74rem;
      color: #8C7B74;
      background: #ECE5DA;
      padding: 0.15rem 0.6rem;
      border-radius: 999px;
      font-family: monospace;
      margin-top: 0.2rem;
    }
    .faq-toggle-icon {
      font-size: 1.25rem;
      font-weight: 800;
      color: #8C7B74;
      transition: transform 0.25s ease, color 0.25s ease;
      flex-shrink: 0;
    }
    .faq-accordion-item[open] .faq-toggle-icon {
      transform: rotate(180deg);
      color: var(--journal-forest);
    }
    .faq-body {
      padding: 0 1.5rem 1.5rem 1.5rem;
      border-top: 1px dashed rgba(43, 24, 16, 0.1);
      margin-top: 0.25rem;
      padding-top: 1.25rem;
    }
    .faq-answer-text {
      font-size: 0.95rem;
      line-height: 1.7;
      color: #4A3A34;
    }
    .faq-student-note {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      background: #FFFDF5;
      border: 1.5px dashed rgba(200, 125, 50, 0.45);
      border-radius: 10px;
      padding: 0.75rem 1rem;
      margin-top: 1rem;
    }
    .faq-student-note .note-pin {
      font-size: 1.1rem;
      line-height: 1;
    }
    .faq-student-note .note-text {
      font-family: 'Caveat', cursive, serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: #8C4E1A;
      line-height: 1.35;
    }
    .faq-related-link-row {
      margin-top: 1rem;
      display: flex;
      justify-content: flex-end;
    }
    .faq-deep-dive-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--journal-forest);
      text-decoration: none;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      background: rgba(10, 77, 52, 0.08);
      transition: all 0.2s ease;
    }
    .faq-deep-dive-link:hover {
      background: var(--journal-forest);
      color: #FFFFFF;
      transform: translateX(2px);
    }
    .faq-no-results {
      text-align: center;
      padding: 3rem 1rem;
      background: #FAF7F2;
      border: 1.5px dashed var(--journal-border);
      border-radius: 14px;
    }
  </style>
</head>
<body class="blog-body">
  
  <!-- Sticky Minimal Nav -->
  <header id="siteHeader" class="site-header" role="banner">
    <div class="nav-container">
      <a href="/" class="nav-brand" aria-label="SBC Home">
        <span class="nav-logo-bold">SBC</span>
        <span class="nav-brand-sep" aria-hidden="true">/</span>
        <span class="nav-logo-sub">SECTION-B COFFEE</span>
      </a>
      <nav class="nav-menu" aria-label="Navigation">
        <a href="/story" class="nav-link">Story</a>
        <a href="/#menu" class="nav-link">Menu</a>
        <a href="/journal" class="nav-link active">Journal</a>
        <a href="/#campuses" class="nav-link">Campuses</a>
      </nav>
      <div class="nav-actions">
        <div class="nav-order-dropdown" id="navOrderDropdown">
          <button type="button" class="nav-order-trigger" id="navOrderBtn" aria-expanded="false" aria-haspopup="true">
            <span class="order-indicator-dot" aria-hidden="true"></span>
            <span class="order-btn-label">Order Online</span>
            <span class="order-chevron" aria-hidden="true">▾</span>
          </button>
          <div class="nav-order-popover" id="navOrderPopover" role="menu" aria-hidden="true">
            <a href="https://www.swiggy.com" target="_blank" rel="noopener noreferrer" class="nav-popover-item" role="menuitem">
              <span class="popover-icon">🛵</span>
              <div class="popover-meta">
                <span class="popover-title">Swiggy Delivery</span>
                <small class="popover-sub">Indirapuram &amp; Rajendra Nagar</small>
              </div>
              <span class="popover-arrow">↗</span>
            </a>
            <a href="https://www.zomato.com" target="_blank" rel="noopener noreferrer" class="nav-popover-item" role="menuitem">
              <span class="popover-icon">🍽️</span>
              <div class="popover-meta">
                <span class="popover-title">Zomato Delivery</span>
                <small class="popover-sub">Fresh Bakes &amp; Cold Brews</small>
              </div>
              <span class="popover-arrow">↗</span>
            </a>
            <div class="nav-popover-divider"></div>
            <a href="/download-menu" class="nav-popover-item" role="menuitem">
              <span class="popover-icon">📥</span>
              <div class="popover-meta">
                <span class="popover-title">Official Menu (PDF)</span>
                <small class="popover-sub">Direct Download · 44.95 MB</small>
              </div>
              <span class="popover-arrow">↓</span>
            </a>
          </div>
        </div>
        <button id="mobileMenuBtn" class="mobile-toggle-btn" aria-label="Toggle navigation drawer" aria-expanded="false" aria-controls="mobileDrawer">
          <span class="hamburger-bar"></span>
          <span class="hamburger-bar"></span>
          <span class="hamburger-bar"></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile Navigation Drawer -->
  <div id="mobileDrawerBackdrop" class="drawer-backdrop" aria-hidden="true"></div>
  <aside id="mobileDrawer" class="mobile-drawer" aria-label="Mobile Navigation" aria-hidden="true">
    <div class="drawer-header">
      <div class="drawer-brand">
        <span class="drawer-logo-text">SBC</span>
        <span class="drawer-logo-sub">SECTION-B COFFEE</span>
      </div>
      <button id="closeMobileDrawer" class="drawer-close-btn" aria-label="Close navigation drawer">✕</button>
    </div>
    <nav class="drawer-links" aria-label="Mobile Menu Links">
      <a href="/" class="drawer-link">Home</a>
      <a href="/story" class="drawer-link">Our Story</a>
      <a href="/#menu" class="drawer-link">Menu Signatures</a>
      <a href="/journal" class="drawer-link" style="color: var(--journal-caramel); font-weight: 800;">Journal &amp; Dispatches</a>
      <a href="/#gallery" class="drawer-link">Community Gallery</a>
      <a href="/#alumni" class="drawer-link">Alumni Reviews</a>
      <a href="/#campuses" class="drawer-link">Our Campuses</a>
    </nav>
    <div class="drawer-delivery">
      <p class="drawer-delivery-title">ORDER DOORSTEP CRAFT</p>
      <div class="drawer-delivery-grid">
        <a href="https://www.swiggy.com" target="_blank" rel="noopener noreferrer" class="nav-pill pill-swiggy" style="justify-content: center; width: 100%;">
          <span>🛵 Order on Swiggy</span>
        </a>
        <a href="https://www.zomato.com" target="_blank" rel="noopener noreferrer" class="nav-pill pill-zomato" style="justify-content: center; width: 100%;">
          <span>🍽️ Order on Zomato</span>
        </a>
      </div>
    </div>
  </aside>

  <!-- Hero Header -->
  <section class="journal-hero-section">
    <img src="/hero-coffee.jpg" alt="Section-B Coffee Journal" class="journal-hero-bg-media">
    <div class="journal-hero-vignette"></div>
    <div class="journal-hero-content">
      <div class="journal-eyebrow-pill">
        <span>✦</span>
        <span>DESK 14 LABS · THE SPECIALTY COFFEE JOURNAL</span>
        <span>✦</span>
      </div>
      <h1 class="journal-hero-title">Field Notes, Roast Curves &amp; <span>Campus Chronicles</span></h1>
      <p class="journal-hero-subtitle">
        Dispatches from Desk 14 on shade-grown Western Ghats Arabica terroir, 204°C roast chemistry, manual extraction geometry, and unhurried cafe culture.
      </p>

      <div class="journal-hero-ribbon">
        <div class="ribbon-item"><span class="ribbon-dot"></span> 4 Published Dispatches</div>
        <div class="ribbon-item"><span class="ribbon-dot"></span> 1670 Heritage Lineage</div>
        <div class="ribbon-item"><span class="ribbon-dot"></span> 204°C First-Crack Profiling</div>
        <div class="ribbon-item"><span class="ribbon-dot"></span> Twin Sanctuaries (NCR)</div>
      </div>
    </div>
  </section>

  <!-- Main Journal Content -->
  <main class="journal-page-main">
    
    <!-- Controls Bar: Category Filter & Search -->
    <div class="journal-controls-wrapper">
      <div class="journal-filter-pills" role="tablist">
        ${categories.map((cat, i) => {
          const count = cat === 'All' ? posts.length : posts.filter(p => p.category === cat).length;
          return `
            <button type="button" class="journal-filter-tab ${i === 0 ? 'active' : ''}" data-category="${cat}">
              <span>${cat}</span>
              <span class="tab-count">${count}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="journal-search-wrap">
        <span class="journal-search-icon">🔍</span>
        <input type="search" id="journalSearchInput" class="journal-search-input" placeholder="Search dispatches, origin notes, recipes..." aria-label="Search articles">
      </div>
    </div>

    <!-- Featured / Spotlight Story (First Post) -->
    ${featuredPost ? `
    <article class="journal-spotlight-box" data-category="${featuredPost.category}" data-search="${(featuredPost.title + ' ' + featuredPost.excerpt + ' ' + featuredPost.category + ' ' + featuredPost.author).toLowerCase()}">
      <div class="spotlight-media">
        <img src="/${featuredPost.coverImage || 'coffee-heritage-1670.jpg'}" alt="${featuredPost.title}" class="spotlight-img">
        <span class="spotlight-stamp">★ LEAD DISPATCH · ISSUE NO. 01</span>
      </div>
      <div class="spotlight-content">
        <span class="spotlight-eyebrow">✦ ${featuredPost.category.toUpperCase()} · ${featuredPost.readTime || '4 min read'}</span>
        <h2 class="spotlight-title">
          <a href="/journal/${featuredPost.slug}">${featuredPost.title}</a>
        </h2>
        <p class="spotlight-excerpt">${featuredPost.excerpt}</p>
        
        <div class="spotlight-student-note">
          ✍️ <strong>Desk 14 Annotation:</strong> “${POST_ANNOTATIONS[featuredPost.slug] || 'Directly traced to 1,350m shaded Baba Budan Giri hills.'}”
        </div>

        <div class="spotlight-footer">
          <span style="font-size: 0.82rem; color: #8C7B74; font-weight: 700;">By ${featuredPost.author}</span>
          <a href="/journal/${featuredPost.slug}" class="spotlight-btn">
            <span>Read Complete Dispatch</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </article>
    ` : ''}

    <!-- Main Grid of All Articles -->
    <div class="dispatch-grid-wrapper">
      <div class="dispatch-grid-heading-row">
        <h3 class="dispatch-grid-heading">All Field Dispatches &amp; Guides</h3>
        <span class="dispatch-grid-sub" id="resultsCount">${posts.length} dispatches available</span>
      </div>

      <div class="dispatch-grid" id="journalCardsGrid">
        ${postCardsHtml}

        <!-- No Results Fallback -->
        <div class="journal-no-results" id="journalNoResults">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">🔍</span>
          <h4 style="font-size: 1.25rem; font-weight: 800; color: var(--journal-espresso); margin-bottom: 0.5rem;">No dispatches matched your search</h4>
          <p style="font-size: 0.9rem; color: #8C7B74; margin-bottom: 1.25rem;">Try searching for "Arabica", "roast", "V60", or "Desk 14".</p>
          <button type="button" class="journal-filter-tab active" onclick="document.getElementById('journalSearchInput').value=''; filterArticles();" style="display: inline-block;">Reset Filters</button>
        </div>
      </div>
    </div>

    <!-- Classroom Blackboard / Culture Strip -->
    <section class="journal-blackboard-banner">
      <div class="chalk-header">
        <span class="chalk-eyebrow">~ Desk 14 Community Noticeboard ~</span>
        <h2 class="chalk-title">Weekend Cuppings, Roastery Labs &amp; Study Bench</h2>
      </div>

      <div class="chalk-items-grid">
        <div class="chalk-card">
          <div class="chalk-card-icon">☕</div>
          <h4 class="chalk-card-title">Sensory Cupping Sessions</h4>
          <p class="chalk-card-desc">Monthly blind tastings of Western Ghats micro-lots, comparing wet vs. dry natural fermentation curves.</p>
        </div>

        <div class="chalk-card">
          <div class="chalk-card-icon">🥐</div>
          <h4 class="chalk-card-title">11:00 AM Morning Bake</h4>
          <p class="chalk-card-desc">Double-baked 27-fold pure butter almond croissants and sourdough toasties coming hot out of the ovens.</p>
        </div>

        <div class="chalk-card">
          <div class="chalk-card-icon">📖</div>
          <h4 class="chalk-card-title">Unhurried Study Sanctuary</h4>
          <p class="chalk-card-desc">Power sockets at every banquette, quiet ambient playlists, and zero rush to clear your table.</p>
        </div>
      </div>

      <div class="chalk-cta-row">
        <a href="https://www.instagram.com/sectionbcoffee.india/" target="_blank" rel="noopener noreferrer" class="chalk-instagram-btn">
          <span>Follow Campus Reels on Instagram</span>
          <span>@sectionbcoffee.india ↗</span>
        </a>
      </div>
    </section>

    <!-- Query-Based SEO Knowledge Hub & Questionnaire Section -->
    <section class="journal-faq-section" id="faq-knowledge-hub">
      <div class="faq-header-card">
        <div class="faq-header-eyebrow">
          <span>✦</span>
          <span>PROGRAMMATIC KNOWLEDGE HUB &amp; FIELD INQUIRIES</span>
          <span>✦</span>
        </div>
        <h2 class="faq-section-title">Specialty Coffee Questionnaire &amp; <span>Sensory Field Notes</span></h2>
        <p class="faq-section-subtitle">
          Authoritative answers to queries coffee enthusiasts, students, and home baristas ask most — from single-origin bean selections and 204°C roast thermodynamics to slow-bar ratios and sanctuary study hours.
        </p>

        <!-- Search & Filter Controls -->
        <div class="faq-controls-bar">
          <div class="faq-category-pills" id="faqCategoryPills">
            ${faqCategories.map((cat, i) => `
              <button type="button" class="faq-pill-btn ${i === 0 ? 'active' : ''}" data-faq-cat="${cat}">
                <span>${cat}</span>
              </button>
            `).join('')}
          </div>
          <div class="faq-search-wrap">
            <span class="faq-search-icon">🔍</span>
            <input type="search" id="faqSearchInput" class="faq-search-input" placeholder="Search questions (e.g. best beans, 204°C, timings, V60)..." aria-label="Search FAQs">
          </div>
        </div>
      </div>

      <!-- FAQ Accordion Items -->
      <div class="faq-items-list" id="faqItemsList">
        ${faqsHtml}
        
        <!-- FAQ No Results Fallback -->
        <div class="faq-no-results" id="faqNoResults" style="display: none;">
          <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">☕</span>
          <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--journal-espresso); margin-bottom: 0.35rem;">No inquiries matched your search</h4>
          <p style="font-size: 0.88rem; color: #8C7B74; margin-bottom: 1rem;">Try searching for "beans", "temperature", "hours", or "Teddy Bear".</p>
          <button type="button" class="faq-pill-btn active" onclick="document.getElementById('faqSearchInput').value=''; filterFaqs();" style="display: inline-block;">Reset Inquiries</button>
        </div>
      </div>
    </section>

    <!-- Study Hall Mailroom Newsletter -->
    <div class="journal-study-hall-card">
      <div class="mailroom-stamp">✦ SBC AIRMAIL DESK 14 · WEEKLY HARVEST NOTES ✦</div>
      <h3 class="study-hall-title">Never Miss a Micro-Lot Drop or Roast Recipe</h3>
      <p class="study-hall-lead">
        Join 2,500+ student dreamers, architects, and coffee lovers across Delhi-NCR &amp; Bangalore receiving seasonal roast experiments and secret slow-bar recipes.
      </p>
      <form class="study-hall-form" onsubmit="event.preventDefault(); alert('✦ Welcome to the Section-B Study Hall! You are officially enrolled for seasonal drop alerts.'); this.reset();">
        <input type="email" placeholder="Enter your student or desk email..." required class="study-hall-input" aria-label="Email address for dispatch alerts">
        <button type="submit" class="study-hall-btn">Enroll in Study Hall</button>
      </form>
    </div>

  </main>

  <!-- Clean Footer -->
  <footer class="site-footer" style="background-color: #1A0F0A; color: #FBF8F2; padding: 4rem 1.5rem 3rem;">
    <div class="container" style="max-width: 1200px; margin: 0 auto;">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 2rem; padding-bottom: 2.5rem; border-bottom: 1px solid rgba(251, 248, 242, 0.1);">
        <div>
          <span style="font-size: 1.4rem; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">SBC <span style="color: var(--journal-caramel);">/</span> SECTION-B COFFEE</span>
          <p style="font-size: 0.85rem; color: rgba(251, 248, 242, 0.65); margin: 0.35rem 0 0;">Born in Classroom Desk 14 · Roasting Western Ghats Arabica Since 2021</p>
        </div>
        <div style="display: flex; gap: 1.5rem; font-size: 0.88rem; font-weight: 700;">
          <a href="/story" style="color: rgba(251, 248, 242, 0.85); text-decoration: none;">Story</a>
          <a href="/#menu" style="color: rgba(251, 248, 242, 0.85); text-decoration: none;">Menu</a>
          <a href="/journal" style="color: var(--journal-caramel); text-decoration: none;">Journal</a>
          <a href="/#campuses" style="color: rgba(251, 248, 242, 0.85); text-decoration: none;">Campuses</a>
          <a href="/" style="color: #FFFFFF; text-decoration: underline;">Home ↗</a>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 2rem; font-size: 0.78rem; color: rgba(251, 248, 242, 0.45);">
        <p>© 2026 SBC (SECTION-B COFFEE). All Rights Reserved. Built at Desk 14 <span id="stealthAdminTrigger" title="Class of Section-B" style="cursor: pointer; opacity: 0.35;">·</span></p>
        <p>Indirapuram (12 PM–11 PM) · Rajendra Nagar (11 AM–11 PM)</p>
      </div>
    </div>
  </footer>

  <script src="/script.js"></script>

  <script>
    // Header Scroll Handling (Transparent over dark hero, ivory frosted when scrolled)
    const header = document.getElementById('siteHeader');
    function updateHeaderScroll() {
      if (window.scrollY > 40) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', updateHeaderScroll, { passive: true });
    updateHeaderScroll();

    // Live Search & Category Filter
    const filterTabs = document.querySelectorAll('.journal-filter-tab');
    const searchInput = document.getElementById('journalSearchInput');
    const cards = document.querySelectorAll('.dispatch-card');
    const spotlight = document.querySelector('.journal-spotlight-box');
    const noResults = document.getElementById('journalNoResults');
    const resultsCount = document.getElementById('resultsCount');

    let activeCategory = 'All';

    function filterArticles() {
      const query = (searchInput.value || '').trim().toLowerCase();
      let visibleCount = 0;

      // Filter spotlight
      if (spotlight) {
        const spotCat = spotlight.getAttribute('data-category');
        const spotSearch = spotlight.getAttribute('data-search') || '';
        const spotMatchesCat = (activeCategory === 'All' || spotCat === activeCategory);
        const spotMatchesQuery = !query || spotSearch.includes(query);
        if (spotMatchesCat && spotMatchesQuery) {
          spotlight.style.display = 'grid';
          visibleCount++;
        } else {
          spotlight.style.display = 'none';
        }
      }

      // Filter cards
      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        const searchData = card.getAttribute('data-search') || '';
        
        const matchesCat = (activeCategory === 'All' || cat === activeCategory);
        const matchesQuery = !query || searchData.includes(query);

        if (matchesCat && matchesQuery) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (resultsCount) {
        resultsCount.textContent = visibleCount + ' dispatches found';
      }

      if (noResults) {
        if (visibleCount === 0) {
          noResults.classList.add('visible');
        } else {
          noResults.classList.remove('visible');
        }
      }
    }

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategory = tab.getAttribute('data-category');
        filterArticles();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', filterArticles);
    }

    // Interactive Query FAQ Accordion Filtering & Search
    const faqPills = document.querySelectorAll('.faq-pill-btn');
    const faqSearchInput = document.getElementById('faqSearchInput');
    const faqItems = document.querySelectorAll('.faq-accordion-item');
    const faqNoResults = document.getElementById('faqNoResults');
    let activeFaqCat = 'All';

    function filterFaqs() {
      const q = (faqSearchInput ? faqSearchInput.value : '').trim().toLowerCase();
      let matchCount = 0;

      faqItems.forEach(item => {
        const cat = item.getAttribute('data-category');
        const searchData = item.getAttribute('data-search') || '';
        const matchesCat = (activeFaqCat === 'All' || cat === activeFaqCat);
        const matchesQuery = !q || searchData.includes(q);

        if (matchesCat && matchesQuery) {
          item.style.display = 'block';
          // Auto expand if user enters a search query
          if (q.length >= 2) {
            item.setAttribute('open', '');
          }
          matchCount++;
        } else {
          item.style.display = 'none';
        }
      });

      if (faqNoResults) {
        faqNoResults.style.display = matchCount === 0 ? 'block' : 'none';
      }
    }

    faqPills.forEach(pill => {
      pill.addEventListener('click', () => {
        faqPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeFaqCat = pill.getAttribute('data-faq-cat');
        filterFaqs();
      });
    });

    if (faqSearchInput) {
      faqSearchInput.addEventListener('input', filterFaqs);
    }

    // Stealth Admin Secret Trigger
    document.getElementById('stealthAdminTrigger')?.addEventListener('click', () => {
      window.location.href = '/stealth-desk-14';
    });
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.location.href = '/stealth-desk-14';
      }
    });
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// 2. Render Single Article Detail Page (/journal/:slug or /blog/:slug)
// ---------------------------------------------------------------------------
function renderArticlePage(slug, hostUrl = 'http://localhost:3005', allowDrafts = false) {
  const post = getPostBySlug(slug, allowDrafts);
  if (!post) return null;

  const allPosts = getPublishedPosts();
  const relatedPosts = allPosts.filter(p => p.slug !== post.slug).slice(0, 2);

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const annotation = POST_ANNOTATIONS[post.slug] || 'Dispatches from Section-B Labs · Photographed at our slow-bar roastery.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.metaTitle || post.title} | SBC (Section-B Coffee)</title>
  <meta name="description" content="${post.metaDescription || post.excerpt}">
  <link rel="canonical" href="${hostUrl}/journal/${post.slug}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${post.title}">
  <meta property="og:description" content="${post.metaDescription || post.excerpt}">
  <meta property="og:url" content="${hostUrl}/journal/${post.slug}">
  <meta property="og:image" content="${hostUrl}/${post.coverImage || 'hero-coffee.jpg'}">
  <meta property="article:published_time" content="${post.createdAt}">
  <meta property="article:author" content="${post.author}">
  <meta property="article:section" content="${post.category}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.title}">
  <meta name="twitter:description" content="${post.metaDescription || post.excerpt}">
  <meta name="twitter:image" content="${hostUrl}/${post.coverImage || 'hero-coffee.jpg'}">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- Schema.org JSON-LD Article + LocalBusiness -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${hostUrl}/journal/${post.slug}"
    },
    "headline": "${post.title.replace(/"/g, '\\"')}",
    "description": "${(post.metaDescription || post.excerpt).replace(/"/g, '\\"')}",
    "image": "${hostUrl}/${post.coverImage || 'hero-coffee.jpg'}",
    "author": {
      "@type": "Person",
      "name": "${post.author.replace(/"/g, '\\"')}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SBC (Section-B Coffee)",
      "logo": {
        "@type": "ImageObject",
        "url": "${hostUrl}/sbc-official-logo.png"
      }
    },
    "datePublished": "${post.createdAt}",
    "dateModified": "${post.updatedAt || post.createdAt}"
  }
  </script>

  <link rel="stylesheet" href="/styles.css">

  <style>
    /* Dedicated Single Article Typography & Visual Enhancements */
    :root {
      --article-espresso: #2B1810;
      --article-forest: #0A4D34;
      --article-caramel: #C87D32;
      --article-cream: #FBF8F2;
      --article-parchment: #F4EFE6;
    }

    .article-reading-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--article-caramel), #E89E58);
      width: 0%;
      z-index: 9999;
      transition: width 0.1s linear;
    }

    .article-detail-main {
      background: var(--article-cream);
      padding: 8.5rem 1.5rem 6rem;
      min-height: 100vh;
    }
    .article-container {
      max-width: 860px;
      margin: 0 auto;
    }

    /* Breadcrumbs */
    .article-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      color: #8C7B74;
      margin-bottom: 2rem;
    }
    .article-breadcrumbs a {
      color: var(--article-espresso);
      text-decoration: none;
      transition: color 0.2s;
    }
    .article-breadcrumbs a:hover {
      color: var(--article-caramel);
    }
    .bc-sep {
      color: var(--article-caramel);
    }
    .bc-current {
      color: var(--article-forest);
    }

    /* Article Header */
    .article-header {
      margin-bottom: 2.5rem;
      text-align: left;
    }
    .article-category-badge-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 1.25rem;
    }
    .article-category-pill {
      background: var(--article-forest);
      color: #FFFFFF;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.35rem 1rem;
      border-radius: 999px;
    }
    .article-read-time {
      font-size: 0.82rem;
      color: #8C7B74;
      font-weight: 700;
    }

    .article-title {
      font-size: clamp(2.2rem, 4.5vw, 3.4rem);
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;
      color: var(--article-espresso);
      margin: 0 0 1.25rem;
    }
    .article-lead-excerpt {
      font-size: 1.18rem;
      line-height: 1.6;
      color: #5C4B45;
      margin: 0 0 2rem;
      font-weight: 500;
    }

    .article-byline {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 1rem 0;
      border-top: 1px solid rgba(43, 24, 16, 0.1);
      border-bottom: 1px solid rgba(43, 24, 16, 0.1);
    }
    .article-author-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(10, 77, 52, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }
    .article-author-name {
      display: block;
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--article-espresso);
    }
    .article-date {
      display: block;
      font-size: 0.8rem;
      color: #8C7B74;
      font-weight: 600;
    }

    /* Featured Media Wrap */
    .article-featured-img-wrap {
      margin: 2.5rem 0 3.5rem;
      border-radius: 20px;
      overflow: hidden;
      border: 2px solid var(--article-espresso);
      box-shadow: 6px 10px 0px rgba(43, 24, 16, 0.12);
      background: #1C120C;
    }
    .article-featured-img {
      width: 100%;
      max-height: 520px;
      object-fit: cover;
      display: block;
    }
    .article-img-caption {
      padding: 0.85rem 1.5rem;
      background: #FFFFFF;
      font-size: 0.82rem;
      color: #7A6963;
      font-weight: 600;
      border-top: 1px solid rgba(43, 24, 16, 0.08);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Rich Content Body */
    .article-content-body {
      background: #FFFFFF;
      border: 1.5px solid rgba(43, 24, 16, 0.12);
      border-radius: 20px;
      padding: 3.5rem 3.5rem 4rem;
      box-shadow: 0 8px 30px rgba(43, 24, 16, 0.06);
      font-size: 1.1rem;
      line-height: 1.8;
      color: #2F241F;
    }
    @media (max-width: 768px) {
      .article-content-body {
        padding: 2.25rem 1.5rem 3rem;
        font-size: 1.02rem;
      }
    }

    /* First Paragraph Drop Cap */
    .article-content-body > p:first-of-type::first-letter {
      float: left;
      font-family: 'Caveat', cursive;
      font-size: 4.2rem;
      line-height: 0.8;
      padding: 4px 12px 0 0;
      color: var(--article-caramel);
      font-weight: 700;
    }

    .article-content-body h2,
    .article-content-body h3 {
      color: var(--article-espresso);
      font-weight: 800;
      margin: 2.5rem 0 1rem;
      letter-spacing: -0.02em;
    }
    .article-content-body h2 {
      font-size: 1.7rem;
      border-bottom: 2px solid rgba(200, 125, 50, 0.2);
      padding-bottom: 0.5rem;
    }
    .article-content-body h3 {
      font-size: 1.35rem;
    }
    .article-content-body p {
      margin-bottom: 1.5rem;
    }
    .article-content-body ul,
    .article-content-body ol {
      margin: 1.5rem 0 2rem;
      padding-left: 1.5rem;
    }
    .article-content-body li {
      margin-bottom: 0.65rem;
    }
    .article-content-body blockquote {
      margin: 2.25rem 0;
      padding: 1.5rem 1.75rem;
      background: #FFF9EE;
      border-left: 4px solid var(--article-caramel);
      border-radius: 0 14px 14px 0;
      font-style: italic;
      color: #553414;
      font-size: 1.15rem;
      line-height: 1.6;
    }
    .article-content-body strong {
      color: var(--article-espresso);
    }

    /* Social Share Row */
    .article-share-row {
      margin: 3rem 0;
      padding: 1.5rem 2rem;
      background: #FFFFFF;
      border: 1.5px solid rgba(43, 24, 16, 0.1);
      border-radius: 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
    }
    .share-label {
      font-size: 0.88rem;
      font-weight: 800;
      color: var(--article-espresso);
      margin-right: 0.5rem;
    }
    .share-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--article-parchment);
      border: 1px solid rgba(43, 24, 16, 0.12);
      padding: 0.55rem 1.15rem;
      border-radius: 999px;
      font-family: inherit;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--article-espresso);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .share-btn:hover {
      background: var(--article-forest);
      color: #FFFFFF;
      border-color: var(--article-forest);
    }

    /* Author Guild Box */
    .article-author-box {
      margin: 3.5rem 0;
      background: #FFFFFF;
      border: 2px solid var(--article-espresso);
      border-radius: 20px;
      padding: 2.25rem 2.5rem;
      box-shadow: 6px 8px 0px rgba(43, 24, 16, 0.1);
      display: flex;
      align-items: center;
      gap: 1.75rem;
    }
    @media (max-width: 600px) {
      .article-author-box {
        flex-direction: column;
        text-align: center;
        padding: 2rem 1.5rem;
      }
    }
    .author-box-avatar {
      font-size: 3rem;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(200, 125, 50, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .author-box-name {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--article-espresso);
      margin: 0 0 0.4rem;
    }
    .author-box-bio {
      font-size: 0.92rem;
      line-height: 1.6;
      color: #6C5D57;
      margin: 0;
    }

    /* Related Reads Section */
    .article-related-section {
      margin: 4.5rem 0 3rem;
    }
    .related-section-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--article-espresso);
      margin: 0 0 1.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1.5px solid rgba(43, 24, 16, 0.12);
    }
    .related-posts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.75rem;
    }
    @media (max-width: 680px) {
      .related-posts-grid {
        grid-template-columns: 1fr;
      }
    }
    .related-card {
      background: #FFFFFF;
      border: 1.5px solid rgba(43, 24, 16, 0.1);
      border-radius: 16px;
      padding: 1.75rem;
      box-shadow: 0 6px 20px rgba(43, 24, 16, 0.05);
      transition: all 0.25s ease;
    }
    .related-card:hover {
      transform: translateY(-4px);
      border-color: var(--article-caramel);
      box-shadow: 0 12px 28px rgba(43, 24, 16, 0.1);
    }
    .related-card-link {
      text-decoration: none;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .related-cat {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--article-forest);
      margin-bottom: 0.5rem;
    }
    .related-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--article-espresso);
      line-height: 1.35;
      margin: 0 0 0.65rem;
    }
    .related-desc {
      font-size: 0.88rem;
      color: #6C5D57;
      line-height: 1.5;
      margin: 0 0 1.25rem;
    }
    .related-read-more {
      margin-top: auto;
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--article-caramel);
    }

    /* Back Button */
    .btn-back-journal {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--article-forest);
      color: #FFFFFF;
      font-size: 0.95rem;
      font-weight: 800;
      text-decoration: none;
      padding: 0.85rem 2rem;
      border-radius: 999px;
      box-shadow: 0 4px 16px rgba(10, 77, 52, 0.22);
      transition: all 0.25s ease;
    }
    .btn-back-journal:hover {
      background: #083D29;
      transform: translateX(-4px);
    }
  </style>
</head>
<body class="blog-body">
  
  <!-- Reading Progress Bar -->
  <div id="readProgressBar" class="article-reading-progress"></div>

  <!-- Sticky Minimal Nav -->
  <header id="siteHeader" class="site-header scrolled" role="banner" style="background-color: rgba(251, 248, 242, 0.96); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(10, 77, 52, 0.08); box-shadow: 0 4px 24px rgba(52, 30, 21, 0.08);">
    <div class="nav-container">
      <a href="/" class="nav-brand" aria-label="SBC Home">
        <span class="nav-logo-bold" style="color: var(--article-espresso); text-shadow: none;">SBC</span>
        <span class="nav-brand-sep" style="color: var(--article-caramel);" aria-hidden="true">/</span>
        <span class="nav-logo-sub" style="color: var(--article-forest); text-shadow: none;">SECTION-B COFFEE</span>
      </a>
      <nav class="nav-menu" aria-label="Navigation">
        <a href="/story" class="nav-link" style="color: var(--article-espresso); text-shadow: none;">Story</a>
        <a href="/#menu" class="nav-link" style="color: var(--article-espresso); text-shadow: none;">Menu</a>
        <a href="/journal" class="nav-link active" style="color: var(--article-caramel); font-weight: 800;">Journal</a>
        <a href="/#campuses" class="nav-link" style="color: var(--article-espresso); text-shadow: none;">Campuses</a>
      </nav>
      <div class="nav-actions">
        <div class="nav-order-dropdown" id="navOrderDropdown">
          <button type="button" class="nav-order-trigger" id="navOrderBtn" aria-expanded="false" aria-haspopup="true">
            <span class="order-indicator-dot" aria-hidden="true"></span>
            <span class="order-btn-label">Order Online</span>
            <span class="order-chevron" aria-hidden="true">▾</span>
          </button>
          <div class="nav-order-popover" id="navOrderPopover" role="menu" aria-hidden="true">
            <a href="https://www.swiggy.com" target="_blank" rel="noopener noreferrer" class="nav-popover-item" role="menuitem">
              <span class="popover-icon">🛵</span>
              <div class="popover-meta">
                <span class="popover-title">Swiggy Delivery</span>
                <small class="popover-sub">Indirapuram &amp; Rajendra Nagar</small>
              </div>
              <span class="popover-arrow">↗</span>
            </a>
            <a href="https://www.zomato.com" target="_blank" rel="noopener noreferrer" class="nav-popover-item" role="menuitem">
              <span class="popover-icon">🍽️</span>
              <div class="popover-meta">
                <span class="popover-title">Zomato Delivery</span>
                <small class="popover-sub">Fresh Bakes &amp; Cold Brews</small>
              </div>
              <span class="popover-arrow">↗</span>
            </a>
            <div class="nav-popover-divider"></div>
            <a href="/download-menu" class="nav-popover-item" role="menuitem">
              <span class="popover-icon">📥</span>
              <div class="popover-meta">
                <span class="popover-title">Official Menu (PDF)</span>
                <small class="popover-sub">Direct Download · 44.95 MB</small>
              </div>
              <span class="popover-arrow">↓</span>
            </a>
          </div>
        </div>
        <button id="mobileMenuBtn" class="mobile-toggle-btn" aria-label="Toggle navigation drawer" aria-expanded="false" aria-controls="mobileDrawer">
          <span class="hamburger-bar" style="background-color: var(--article-espresso);"></span>
          <span class="hamburger-bar" style="background-color: var(--article-espresso);"></span>
          <span class="hamburger-bar" style="background-color: var(--article-espresso);"></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile Navigation Drawer -->
  <div id="mobileDrawerBackdrop" class="drawer-backdrop" aria-hidden="true"></div>
  <aside id="mobileDrawer" class="mobile-drawer" aria-label="Mobile Navigation" aria-hidden="true">
    <div class="drawer-header">
      <div class="drawer-brand">
        <span class="drawer-logo-text">SBC</span>
        <span class="drawer-logo-sub">SECTION-B COFFEE</span>
      </div>
      <button id="closeMobileDrawer" class="drawer-close-btn" aria-label="Close navigation drawer">✕</button>
    </div>
    <nav class="drawer-links" aria-label="Mobile Menu Links">
      <a href="/" class="drawer-link">Home</a>
      <a href="/story" class="drawer-link">Our Story</a>
      <a href="/#menu" class="drawer-link">Menu Signatures</a>
      <a href="/journal" class="drawer-link" style="color: var(--article-caramel); font-weight: 800;">Journal &amp; Dispatches</a>
      <a href="/#gallery" class="drawer-link">Community Gallery</a>
      <a href="/#alumni" class="drawer-link">Alumni Reviews</a>
      <a href="/#campuses" class="drawer-link">Our Campuses</a>
    </nav>
    <div class="drawer-delivery">
      <p class="drawer-delivery-title">ORDER DOORSTEP CRAFT</p>
      <div class="drawer-delivery-grid">
        <a href="https://www.swiggy.com" target="_blank" rel="noopener noreferrer" class="nav-pill pill-swiggy" style="justify-content: center; width: 100%;">
          <span>🛵 Order on Swiggy</span>
        </a>
        <a href="https://www.zomato.com" target="_blank" rel="noopener noreferrer" class="nav-pill pill-zomato" style="justify-content: center; width: 100%;">
          <span>🍽️ Order on Zomato</span>
        </a>
      </div>
    </div>
  </aside>

  <main class="article-detail-main">
    <div class="container article-container">
      
      <!-- Breadcrumb Navigation -->
      <nav class="article-breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span class="bc-sep">/</span>
        <a href="/journal">Journal</a>
        <span class="bc-sep">/</span>
        <span class="bc-current">${post.category}</span>
      </nav>

      <!-- Article Header -->
      <header class="article-header">
        <div class="article-category-badge-wrap">
          <span class="article-category-pill">${post.category}</span>
          <span class="article-read-time">⏱ ${post.readTime || '4 min read'}</span>
        </div>
        <h1 class="article-title">${post.title}</h1>
        <p class="article-lead-excerpt">${post.excerpt}</p>
        
        <div class="article-byline">
          <div class="article-author-avatar">✍️</div>
          <div class="article-byline-text">
            <span class="article-author-name">${post.author}</span>
            <span class="article-date">${formattedDate}</span>
          </div>
        </div>
      </header>

      <!-- Article Featured Image -->
      <div class="article-featured-img-wrap">
        <img src="/${post.coverImage || 'hero-coffee.jpg'}" alt="${post.title}" class="article-featured-img">
        <div class="article-img-caption">
          <span>✦</span>
          <span>${annotation}</span>
        </div>
      </div>

      <!-- Article Body Content -->
      <div class="article-content-body">
        ${post.content}
      </div>

      <!-- Social Share Row -->
      <div class="article-share-row">
        <span class="share-label">Share this dispatch:</span>
        <button type="button" class="share-btn" onclick="navigator.clipboard.writeText(window.location.href); alert('✦ Link copied to clipboard!');">📋 Copy Link</button>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(hostUrl + '/journal/' + post.slug)}" target="_blank" rel="noopener noreferrer" class="share-btn">🐦 X / Twitter</a>
        <a href="https://wa.me/?text=${encodeURIComponent(post.title + ' - ' + hostUrl + '/journal/' + post.slug)}" target="_blank" rel="noopener noreferrer" class="share-btn">💬 WhatsApp</a>
      </div>

      <!-- Author Bio Box -->
      <div class="article-author-box">
        <div class="author-box-avatar">🐻</div>
        <div class="author-box-info">
          <h4 class="author-box-name">${post.author}</h4>
          <p class="author-box-bio">
            SBC roasters and craft barista guild. Obsessing over Western Ghats terroir, small-batch medium roasts at 204°C, and building unhurried specialty coffee sanctuaries across Delhi-NCR and Bangalore.
          </p>
        </div>
      </div>

      <!-- Related Reads -->
      ${relatedPosts.length > 0 ? `
      <div class="article-related-section">
        <h3 class="related-section-title">Further Reading From Section-B</h3>
        <div class="related-posts-grid">
          ${relatedPosts.map(rel => `
            <article class="related-card">
              <a href="/journal/${rel.slug}" class="related-card-link">
                <span class="related-cat">${rel.category}</span>
                <h4 class="related-title">${rel.title}</h4>
                <p class="related-desc">${rel.excerpt.slice(0, 110)}...</p>
                <span class="related-read-more">Read Dispatch →</span>
              </a>
            </article>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Back to Journal link -->
      <div class="text-center" style="margin-top: 3.5rem; text-align: center;">
        <a href="/journal" class="btn-back-journal">← Return to All Journal Articles</a>
      </div>

    </div>
  </main>

  <footer class="site-footer" style="background-color: #1A0F0A; color: #FBF8F2; padding: 4rem 1.5rem 3rem;">
    <div class="container" style="max-width: 1200px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: rgba(251, 248, 242, 0.45);">
        <p>© 2026 SBC (SECTION-B COFFEE). All Rights Reserved. Built at Desk 14 <span id="stealthAdminTrigger" title="Class of Section-B" style="cursor: pointer; opacity: 0.35;">·</span></p>
        <p><a href="/journal" style="color: var(--article-caramel); text-decoration: none;">← Back to Journal</a> · <a href="/" style="color: #FFFFFF; text-decoration: underline;">Home ↗</a></p>
      </div>
    </div>
  </footer>

  <script src="/script.js"></script>

  <script>
    // Reading progress bar
    window.addEventListener('scroll', () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / docHeight) * 100;
      const bar = document.getElementById('readProgressBar');
      if (bar) bar.style.width = scrolled + '%';
    });

    // Stealth Admin Secret Trigger
    document.getElementById('stealthAdminTrigger')?.addEventListener('click', () => {
      window.location.href = '/stealth-desk-14';
    });
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.location.href = '/stealth-desk-14';
      }
    });
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// 3. Generate XML Sitemap (/sitemap.xml)
// ---------------------------------------------------------------------------
function generateSitemapXml(hostUrl = 'http://localhost:3005') {
  const posts = getPublishedPosts();
  const today = new Date().toISOString().split('T')[0];

  const postUrls = posts.map(p => `
  <url>
    <loc>${hostUrl}/journal/${p.slug}</loc>
    <lastmod>${(p.updatedAt || p.createdAt || today).split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${hostUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${hostUrl}/story</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${hostUrl}/journal</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${postUrls}
</urlset>`;
}

module.exports = {
  renderBlogDirectory,
  renderArticlePage,
  generateSitemapXml,
  getPublishedPosts,
  getAllPosts,
  getPostBySlug,
  getFaqs
};
