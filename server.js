const express = require('express');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const { URL } = require('url');

const app = express();
app.use(express.json({ limit: '1mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }
}

function readDB() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      sites: [],
      categories: ['Frontend', 'Backend', 'DevOps'],
      tags: ['JavaScript', 'React', 'API']
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { sites: [], categories: [], tags: [] };
  }
}

function writeDB(db) {
  ensureDataDir();
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function toAbsoluteUrl(base, possiblyRelative) {
  try {
    return new URL(possiblyRelative, base).toString();
  } catch (_) {
    return possiblyRelative;
  }
}

app.get('/api/sites', (req, res) => {
  const db = readDB();
  res.json({ sites: db.sites });
});

app.post('/api/sites', (req, res) => {
  const { url, title, description, favicon, categories, tags } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  const db = readDB();

  const now = new Date().toISOString();
  const id = Math.random().toString(36).slice(2, 10);
  const site = {
    id,
    url,
    title: title || '',
    description: description || '',
    favicon: favicon || '',
    categories: Array.isArray(categories) ? categories : [],
    tags: Array.isArray(tags) ? tags : [],
    createdAt: now
  };

  // Ensure categories/tags exist in master lists
  site.categories.forEach((c) => {
    if (!db.categories.find((x) => x.toLowerCase() === String(c).toLowerCase())) {
      db.categories.push(String(c));
    }
  });
  site.tags.forEach((t) => {
    if (!db.tags.find((x) => x.toLowerCase() === String(t).toLowerCase())) {
      db.tags.push(String(t));
    }
  });

  db.sites.unshift(site);
  writeDB(db);
  res.status(201).json({ site });
});

app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json({ categories: db.categories });
});

app.post('/api/categories', (req, res) => {
  const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const db = readDB();
  const exists = db.categories.find((c) => c.toLowerCase() === name.toLowerCase());
  if (!exists) {
    db.categories.push(name);
    writeDB(db);
  }
  res.status(exists ? 200 : 201).json({ name });
});

app.get('/api/tags', (req, res) => {
  const db = readDB();
  res.json({ tags: db.tags });
});

app.post('/api/tags', (req, res) => {
  const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const db = readDB();
  const exists = db.tags.find((t) => t.toLowerCase() === name.toLowerCase());
  if (!exists) {
    db.tags.push(name);
    writeDB(db);
  }
  res.status(exists ? 200 : 201).json({ name });
});

app.get('/api/metadata', async (req, res) => {
  const rawUrl = String(req.query.url || '').trim();
  if (!rawUrl) {
    return res.status(400).json({ error: 'url query param is required' });
  }
  let target;
  try {
    target = new URL(rawUrl).toString();
  } catch (_) {
    try {
      target = new URL('http://' + rawUrl).toString();
    } catch (e) {
      return res.status(400).json({ error: 'invalid url' });
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(target, { redirect: 'follow', signal: controller.signal, headers: { 'user-agent': 'MetadataFetcher/1.0' } });
    clearTimeout(timeout);
    const html = await response.text();
    const $ = cheerio.load(html);

    const getMeta = (sel) => {
      const el = $(sel).first();
      const content = el.attr('content');
      return content ? String(content).trim() : '';
    };

    let title = getMeta('meta[property="og:title"]') || $('title').first().text().trim();
    let description = getMeta('meta[name="description"]') || getMeta('meta[property="og:description"]');

    let favicon = '';
    const iconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]'
    ];
    for (const sel of iconSelectors) {
      const href = $(sel).first().attr('href');
      if (href) {
        favicon = toAbsoluteUrl(target, href);
        break;
      }
    }
    if (!favicon) {
      try {
        const u = new URL(target);
        favicon = `${u.origin}/favicon.ico`;
      } catch (_) {}
    }

    res.json({ title, description, favicon });
  } catch (e) {
    res.status(500).json({ error: 'failed to fetch metadata' });
  }
});

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Basic pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'add.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
