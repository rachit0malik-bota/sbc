const http = require('http');
const fs = require('fs');
const path = require('path');
const { renderBlogDirectory, renderArticlePage, generateSitemapXml } = require('./blog_renderer');
const { renderAdminDashboard } = require('./admin_renderer');

const PORT = process.env.PORT || 3005;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

// ---------------------------------------------------------------------------
// Helpers for Data Files
// ---------------------------------------------------------------------------
// In-memory fallback cache for serverless environments (e.g. Vercel)
const inMemoryCache = {};

function readJson(filename) {
  try {
    const tmpPath = path.join('/tmp', filename);
    if (fs.existsSync(tmpPath)) {
      return JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
    }
  } catch (e) {}

  try {
    const filePath = path.join(__dirname, 'data', filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
  }

  return inMemoryCache[filename] || [];
}

function writeJson(filename, data) {
  inMemoryCache[filename] = data;

  try {
    const filePath = path.join(__dirname, 'data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    // Vercel serverless read-only filesystem fallback
    try {
      const tmpPath = path.join('/tmp', filename);
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (tmpErr) {
      // In-memory cache is already updated
      return true;
    }
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Request Handler (Local Node.js & Vercel Serverless Function)
// ---------------------------------------------------------------------------
async function handleRequest(req, res) {
  const host = req.headers.host ? `http://${req.headers.host}` : `http://localhost:${PORT}`;
  const [urlPath, queryString] = req.url.split('?');
  const params = new URLSearchParams(queryString || '');

  // 1. Sitemap.xml & Robots.txt
  if (urlPath === '/sitemap.xml') {
    const xml = generateSitemapXml(host);
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xml);
    return;
  }

  if (urlPath === '/robots.txt') {
    const robots = `User-agent: *\nAllow: /\nAllow: /blog\nAllow: /blog/*\nDisallow: /stealth-desk-14\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${host}/sitemap.xml\n`;
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(robots);
    return;
  }

  // 1.5 Official Menu PDF Direct Download
  if (urlPath === '/download-menu' || urlPath === '/menu.pdf') {
    const pdfPath = path.join(__dirname, 'section-b-coffee-menu.pdf');
    if (fs.existsSync(pdfPath)) {
      const stat = fs.statSync(pdfPath);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="Section-B-Coffee-Official-Menu.pdf"'
      });
      const stream = fs.createReadStream(pdfPath);
      stream.pipe(res);
      return;
    }
  }

  // 1.8 Dedicated Story Page Route
  if (urlPath === '/story' || urlPath === '/story/' || urlPath === '/our-story') {
    const storyFile = path.join(__dirname, 'story.html');
    if (fs.existsSync(storyFile)) {
      const html = fs.readFileSync(storyFile, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
  }

  // 2. Dynamic SSR Journal & Blog Directory Routes (/journal, /blog)
  if (urlPath === '/journal' || urlPath === '/journal/' || urlPath === '/blog' || urlPath === '/blog/') {
    const html = renderBlogDirectory(host);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Dynamic SSR Article Routes (/journal/:slug, /blog/:slug)
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
  }

  // 3. Stealth Admin Dashboard Route
  if (urlPath === '/stealth-desk-14' || urlPath === '/admin') {
    const html = renderAdminDashboard();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // -------------------------------------------------------------------------
  // 4. REST API Routes
  // -------------------------------------------------------------------------
  // Auth API
  if (urlPath === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    if ((body.username === 'desk14' || body.username === 'admin') && body.password === 'SectionB#2021') {
      sendJson(res, 200, { success: true, token: 'sbc_admin_session_token_desk14' });
    } else {
      sendJson(res, 401, { success: false, error: 'Invalid passkey credentials' });
    }
    return;
  }

  // Blog API
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

  // Community Gallery API
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

  // Customer Reviews API
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
        status: 'pending', // Requires admin moderation
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

  // -------------------------------------------------------------------------
  // SEO Knowledge Base & Questionnaire (FAQs) API
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 5. Static File Serving with Video Streaming
  // -------------------------------------------------------------------------
  let reqPath = decodeURI(urlPath);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (range && (ext === '.mp4' || ext === '.webm')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      file.on('error', () => file.destroy());
      res.on('close', () => file.destroy());
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });
      const file = fs.createReadStream(filePath);
      file.on('error', () => file.destroy());
      res.on('close', () => file.destroy());
      file.pipe(res);
    }
  });
}

const server = http.createServer(handleRequest);

server.on('clientError', (err, socket) => {
  if (err.code === 'ECONNRESET' || !socket.writable) return;
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

process.on('uncaughtException', (err) => {
  console.error('Handled exception:', err.message);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled rejection:', reason);
});

// Start local server if run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Section-B Coffee server running at http://localhost:${PORT}`);
  });
}

module.exports = handleRequest;
module.exports.server = server;

