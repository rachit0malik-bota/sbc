// =============================================================================
// Section-B Coffee (SBC) — Dedicated Vercel Serverless Function Handler
// Handles SSR dynamic pages (Journal & Admin) and REST API endpoints.
// Static assets (CSS, JS, images, videos, PDF) are served directly by Vercel CDN.
// =============================================================================
const fs = require('fs');
const path = require('path');
const { renderBlogDirectory, renderArticlePage, generateSitemapXml } = require('../blog_renderer');
const { renderAdminDashboard } = require('../admin_renderer');

// In-memory cache for serverless invocation reuse
const inMemoryCache = {};

function readJson(filename) {
  try {
    const tmpPath = path.join('/tmp', filename);
    if (fs.existsSync(tmpPath)) {
      return JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
    }
  } catch (e) {}

  try {
    const filePath = path.join(__dirname, '..', 'data', filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`[SBC API] Error reading ${filename}:`, err.message);
  }

  return inMemoryCache[filename] || [];
}

function writeJson(filename, data) {
  inMemoryCache[filename] = data;

  try {
    const tmpPath = path.join('/tmp', filename);
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (tmpErr) {
    return true;
  }
}

function parseBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const host = req.headers.host ? `https://${req.headers.host}` : 'https://sectionbcoffee.com';
  const urlObj = new URL(req.url, host);
  const urlPath = urlObj.pathname;
  const params = urlObj.searchParams;

  // 1. Dynamic SSR Journal / Blog Directory
  if (urlPath === '/journal' || urlPath === '/journal/' || urlPath === '/blog' || urlPath === '/blog/') {
    const html = renderBlogDirectory(host);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // 2. Dynamic SSR Article Pages
  if (urlPath.startsWith('/journal/') || urlPath.startsWith('/blog/')) {
    const slug = decodeURIComponent(urlPath.replace(/^\/(journal|blog)\//, '').replace(/\/$/, ''));
    if (slug) {
      const isPreview = params.get('preview') === '1';
      const html = renderArticlePage(slug, host, isPreview);
      if (html) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Dispatch not found');
    return;
  }

  // 3. Stealth Admin Dashboard
  if (urlPath === '/stealth-desk-14' || urlPath === '/admin') {
    const html = renderAdminDashboard();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // 4. REST APIs
  // 4.1 Auth
  if (urlPath === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    if ((body.username === 'desk14' || body.username === 'admin') && body.password === 'SectionB#2021') {
      sendJson(res, 200, { success: true, token: 'sbc_admin_session_token_desk14' });
    } else {
      sendJson(res, 401, { success: false, error: 'Invalid passkey credentials' });
    }
    return;
  }

  // 4.2 Blog Posts
  if (urlPath === '/api/blog/posts') {
    if (req.method === 'GET') {
      const posts = readJson('blog_posts.json');
      sendJson(res, 200, posts);
      return;
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const posts = readJson('blog_posts.json');
      const newPost = {
        id: 'post-' + Date.now(),
        title: body.title || 'Untitled Dispatch',
        slug: body.slug || ('dispatch-' + Date.now()),
        category: body.category || 'Brewing Guides',
        author: body.author || 'Arpit · Founder (Desk 14)',
        readTime: body.readTime || '4 min read',
        published: !!body.published,
        createdAt: new Date().toISOString(),
        coverImage: body.coverImage || 'hero-coffee.jpg',
        primaryKeyword: body.primaryKeyword || '',
        metaTitle: body.metaTitle || body.title,
        metaDescription: body.metaDescription || body.excerpt,
        excerpt: body.excerpt || '',
        content: body.content || ''
      };
      posts.unshift(newPost);
      writeJson('blog_posts.json', posts);
      sendJson(res, 201, newPost);
      return;
    }
  }

  if (urlPath.startsWith('/api/blog/posts/')) {
    const id = urlPath.replace('/api/blog/posts/', '');
    let posts = readJson('blog_posts.json');

    if (req.method === 'PUT') {
      const body = await parseBody(req);
      const idx = posts.findIndex(p => p.id === id);
      if (idx !== -1) {
        posts[idx] = { ...posts[idx], ...body, updatedAt: new Date().toISOString() };
        writeJson('blog_posts.json', posts);
        sendJson(res, 200, posts[idx]);
      } else {
        sendJson(res, 404, { error: 'Post not found' });
      }
      return;
    }

    if (req.method === 'DELETE') {
      posts = posts.filter(p => p.id !== id);
      writeJson('blog_posts.json', posts);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  // 4.3 Gallery
  if (urlPath === '/api/gallery') {
    if (req.method === 'GET') {
      const gallery = readJson('gallery.json');
      const cat = params.get('category');
      const filtered = cat && cat !== 'all' ? gallery.filter(g => g.category === cat) : gallery;
      sendJson(res, 200, filtered);
      return;
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const gallery = readJson('gallery.json');
      const newItem = {
        id: 'gal-' + Date.now(),
        title: body.title || 'Community Snapshot',
        category: body.category || 'workshops',
        categoryLabel: body.categoryLabel || 'Coffee School & Workshops',
        image: body.image || 'interior.jpg',
        video: body.video || '',
        tag: body.tag || '',
        reelHandle: body.reelHandle || '@sectionbcoffee.india',
        caption: body.caption || ''
      };
      gallery.unshift(newItem);
      writeJson('gallery.json', gallery);
      sendJson(res, 201, newItem);
      return;
    }
  }

  if (urlPath.startsWith('/api/gallery/')) {
    const id = urlPath.replace('/api/gallery/', '');
    let gallery = readJson('gallery.json');
    if (req.method === 'DELETE') {
      gallery = gallery.filter(g => g.id !== id);
      writeJson('gallery.json', gallery);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  // 4.4 Reviews
  if (urlPath === '/api/reviews') {
    if (req.method === 'GET') {
      const reviews = readJson('reviews.json');
      const isAdmin = params.get('admin') === '1';
      const output = isAdmin ? reviews : reviews.filter(r => r.status === 'approved');
      sendJson(res, 200, output);
      return;
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const reviews = readJson('reviews.json');
      const initials = (body.name || 'Friend').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      const themes = ['forest', 'caramel', 'espresso'];
      const theme = themes[Math.floor(Math.random() * themes.length)];

      const newReview = {
        id: 'rev-' + Date.now(),
        name: body.name || 'Community Friend',
        role: body.role || 'Class of Section-B · Regular',
        initials,
        theme,
        rating: Math.min(5, Math.max(1, parseInt(body.rating, 10) || 5)),
        quote: body.quote || '',
        favoriteOrder: body.favoriteOrder || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      reviews.unshift(newReview);
      writeJson('reviews.json', reviews);
      sendJson(res, 201, { success: true, ...newReview, message: 'Review received! It will appear once approved by Section-B desk moderators.' });
      return;
    }
  }

  if (urlPath.startsWith('/api/reviews/')) {
    const id = urlPath.replace('/api/reviews/', '');
    let reviews = readJson('reviews.json');

    if (req.method === 'PUT') {
      const body = await parseBody(req);
      const idx = reviews.findIndex(r => r.id === id);
      if (idx !== -1) {
        reviews[idx] = { ...reviews[idx], ...body };
        writeJson('reviews.json', reviews);
        sendJson(res, 200, reviews[idx]);
      } else {
        sendJson(res, 404, { error: 'Review not found' });
      }
      return;
    }

    if (req.method === 'DELETE') {
      reviews = reviews.filter(r => r.id !== id);
      writeJson('reviews.json', reviews);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  // 4.5 FAQs
  if (urlPath === '/api/faqs') {
    if (req.method === 'GET') {
      const faqs = readJson('faqs.json');
      const cat = params.get('category');
      const filtered = cat && cat !== 'All' ? faqs.filter(f => f.category === cat) : faqs;
      sendJson(res, 200, filtered);
      return;
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const faqs = readJson('faqs.json');
      const newFaq = {
        id: 'faq-' + Date.now(),
        question: body.question || 'Untitled Question',
        targetQuery: body.targetQuery || '',
        category: body.category || 'Bean Sourcing & Terroir',
        answer: body.answer || '',
        annotation: body.annotation || '',
        relatedSlug: body.relatedSlug || null,
        order: parseInt(body.order, 10) || (faqs.length + 1),
        createdAt: new Date().toISOString()
      };
      faqs.push(newFaq);
      writeJson('faqs.json', faqs);
      sendJson(res, 201, newFaq);
      return;
    }
  }

  if (urlPath.startsWith('/api/faqs/')) {
    const id = urlPath.replace('/api/faqs/', '');
    let faqs = readJson('faqs.json');

    if (req.method === 'PUT') {
      const body = await parseBody(req);
      const idx = faqs.findIndex(f => f.id === id);
      if (idx !== -1) {
        faqs[idx] = { ...faqs[idx], ...body, updatedAt: new Date().toISOString() };
        writeJson('faqs.json', faqs);
        sendJson(res, 200, faqs[idx]);
      } else {
        sendJson(res, 404, { error: 'FAQ not found' });
      }
      return;
    }

    if (req.method === 'DELETE') {
      faqs = faqs.filter(f => f.id !== id);
      writeJson('faqs.json', faqs);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
};
