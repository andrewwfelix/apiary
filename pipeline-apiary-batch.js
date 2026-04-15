#!/usr/bin/env node

/**
 * pipeline-apiary-batch.js
 * TheApiaryGuide.com — two-pass batch page generator (v1.2)
 *
 * Changes:
 * - Prompts moved to prompts/pass1-system.txt and prompts/pass2-system.txt
 * - Stronger Pass 2 prompt to prevent ```html fences
 * - Cleaner renderPage() using CSS classes
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

// ── Args ──────────────────────────────────────────────────────────────────────

const args       = process.argv.slice(2);
const get        = (flag, fallback) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : fallback; };
const hasFlag    = flag => args.includes(flag);

const SLUG_ARG   = get('--slug', null);
const ALL        = hasFlag('--all');
const DRY        = hasFlag('--dry');
const PASS_ARG   = get('--pass', 'all');
const MAX_PRI    = parseInt(get('--priority', '1'), 10);
const CONCURRENCY = parseInt(get('--concurrency', '1'), 10);

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT         = path.resolve(__dirname);
const MANIFEST     = path.join(ROOT, 'apiary-manifest.json');
const OUTLINES_DIR = path.join(ROOT, 'data', 'outlines');
const PAGES_DIR    = path.join(ROOT, 'data', 'pages');
const DEPLOY_DIR   = path.join(ROOT);
const ENV_PATH     = path.join(ROOT, '.env');
const PROMPTS_DIR  = path.join(ROOT, 'prompts');

// ── Load .env ─────────────────────────────────────────────────────────────────

if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
const API_KEY = process.env.OPENROUTER_API_KEY;

// ── Load config ───────────────────────────────────────────────────────────────

const CONFIG_PATH = path.join(ROOT, 'config.json');
const config      = fs.existsSync(CONFIG_PATH) ? JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) : {};

// ── Load Prompts ──────────────────────────────────────────────────────────────

if (!fs.existsSync(PROMPTS_DIR)) {
  console.error(`✗ Prompts directory not found: ${PROMPTS_DIR}`);
  console.error('   Please create the "prompts" folder and add pass1-system.txt and pass2-system.txt');
  process.exit(1);
}

const PASS1_SYSTEM = fs.readFileSync(path.join(PROMPTS_DIR, 'pass1-system.txt'), 'utf8').trim();
const PASS2_SYSTEM = fs.readFileSync(path.join(PROMPTS_DIR, 'pass2-system.txt'), 'utf8').trim();

// ── Models & Site Config ──────────────────────────────────────────────────────

const PASS1_MODEL = config.models?.pass1 || { model: 'anthropic/claude-sonnet-4-5', maxTokens: 2000, temperature: 0.4 };
const PASS2_MODEL = config.models?.pass2 || { model: 'anthropic/claude-haiku-4-5',  maxTokens: 6000, temperature: 0.5 };

const SITE = {
  name:        config.site?.name        || 'The Apiary Guide',
  domain:      config.site?.domain      || 'theapiaryguide.com',
  tagline:     config.site?.tagline     || 'Everything You Need to Start and Grow Your Hive',
  url:         config.site?.url         || 'https://theapiaryguide.com',
  accentColor: config.site?.accentColor || '#2d5a3d',
};

// ── API call ──────────────────────────────────────────────────────────────────

function callModel(model, systemPrompt, userContent, maxTokens, temperature) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens:  maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent  },
      ],
    });

    const options = {
      hostname: 'openrouter.ai',
      path:     '/api/v1/chat/completions',
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${API_KEY}`,
        'HTTP-Referer':   SITE.url,
        'X-Title':        'TheApiaryGuide Batch',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { reject(new Error(parsed.error.message)); return; }
          resolve(parsed.choices?.[0]?.message?.content?.trim() || '');
        } catch (e) { reject(e); }
      });
    });

    req.setTimeout(90000, () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Parse JSON safely ─────────────────────────────────────────────────────────

function parseJSON(text) {
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try { return JSON.parse(clean); } catch {}
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(clean.slice(start, end + 1)); } catch {}
  }
  try {
    const { jsonrepair } = require('jsonrepair');
    return JSON.parse(jsonrepair(clean));
  } catch {}
  throw new Error('Could not parse JSON response');
}

// ── Improved renderPage() — class-based ───────────────────────────────────────

function renderPage(outline, content, page) {
  const sectionLinks = outline.sections
    ? outline.sections.map(s => 
        `<a href="#${s.id}" class="sidebar-link">${s.heading}</a>`
      ).join('\n      ')
    : '';

  return `<!DOCTYPE html>
<!-- Generated by pipeline-apiary-batch.js v1.2 on ${new Date().toISOString().split('T')[0]} -->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${outline.pageTitle || page.title}</title>
<meta name="description" content="${outline.metaDesc || ''}">
<link rel="canonical" href="${SITE.url}/${page.slug}">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/apiary.css">
</head>
<body>

<nav class="inner-nav">
  <a href="index.html" class="nav-brand">${SITE.name}</a>
  <ul class="nav-links">
    <li><a href="best-beginner-beekeeping-kit.html">Shop</a></li>
    <li><a href="beginners-guide-to-beekeeping.html">Learn</a></li>
    <li><a href="history-of-beekeeping.html">Discover</a></li>
    <li><a href="beekeeping-clubs-directory.html" class="nav-cta">Community</a></li>
  </ul>
</nav>

<!-- INNER HERO -->
<div class="inner-hero">
  <div class="inner-hero-content">
    <div class="section-eyebrow">${page.pillar || 'Guide'}</div>
    <h1 class="page-h1">${outline.h1 || page.title}</h1>
    ${outline.metaDesc ? `<p class="page-intro-desc">${outline.metaDesc}</p>` : ''}
  </div>
</div>

<!-- PAGE LAYOUT -->
<div class="page-layout">
  <main class="page-main">
    ${content}
  </main>

  <aside class="page-sidebar">
    <div class="sidebar-widget">
      <div class="widget-title">On this page</div>
      ${sectionLinks}
    </div>

    <div class="sidebar-widget cta-widget">
      <div class="widget-title">New to beekeeping?</div>
      <p>Start with our complete beginner's guide.</p>
      <a href="beginners-guide-to-beekeeping.html" class="cta-button">Read the guide →</a>
    </div>

    <div class="sidebar-widget">
      <div class="widget-title">Find your club</div>
      <p>Connect with local beekeepers.</p>
      <a href="beekeeping-clubs-directory.html" class="sidebar-link">Browse directory →</a>
    </div>
  </aside>
</div>

<!-- FOOTER -->
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">${SITE.name}</div>
    <div class="footer-tagline">${SITE.tagline}</div>
    <ul class="footer-links">
      <li><a href="index.html">Home</a></li>
      <li><a href="beginners-guide-to-beekeeping.html">Beginners</a></li>
      <li><a href="beekeeping-clubs-directory.html">Community</a></li>
      <li><a href="about.html">About</a></li>
    </ul>
  </div>
  <div class="footer-disclosure">As an Amazon Associate we earn from qualifying purchases. Affiliate links are clearly marked.</div>
</footer>

</body>
</html>`;
}

// ── Process a single page ─────────────────────────────────────────────────────

async function processPage(page) {
  const outlinePath = path.join(OUTLINES_DIR, `${page.slug}.json`);
  const pagePath    = path.join(PAGES_DIR,    `${page.slug}.html`);
  const deployPath  = path.join(DEPLOY_DIR,   `${page.slug}.html`);

  process.stdout.write(`  ↻  ${page.slug}`);

  let outline;

  if (PASS_ARG !== '2' && !fs.existsSync(outlinePath)) {
    const userContent = `Generate a content outline for this page:
Title: ${page.title}
Slug: ${page.slug}
Type: ${page.type}
Pillar: ${page.pillar}
Search intent: ${page.searchIntent}
Notes: ${page.notes || ''}`;

    try {
      const raw = await callModel(PASS1_MODEL.model, PASS1_SYSTEM, userContent, PASS1_MODEL.maxTokens, PASS1_MODEL.temperature);
      outline = parseJSON(raw);
      fs.writeFileSync(outlinePath, JSON.stringify(outline, null, 2), 'utf8');
      process.stdout.write(' [outlined]');
    } catch (e) {
      process.stdout.write(` ✗ Pass 1 failed: ${e.message}\n`);
      return false;
    }
  } else if (fs.existsSync(outlinePath)) {
    outline = JSON.parse(fs.readFileSync(outlinePath, 'utf8'));
    if (PASS_ARG === '2') process.stdout.write(' [outline loaded]');
  }

  if (PASS_ARG === '1') { process.stdout.write(' ✓\n'); return true; }

  // Pass 2
  const userContent2 = `Here is the content outline. Implement it as clean HTML following all instructions:

${JSON.stringify(outline, null, 2)}

Page type: ${page.type}
Additional context: ${page.notes || ''}`;

  let content;
  try {
    content = await callModel(PASS2_MODEL.model, PASS2_SYSTEM, userContent2, PASS2_MODEL.maxTokens, PASS2_MODEL.temperature);
    process.stdout.write(' [written]');
  } catch (e) {
    process.stdout.write(` ✗ Pass 2 failed: ${e.message}\n`);
    return false;
  }

  const html = renderPage(outline, content, page);
  fs.writeFileSync(pagePath, html, 'utf8');
  fs.copyFileSync(pagePath, deployPath);
  process.stdout.write(` ✓  (${html.length} chars)\n`);
  return true;
}

// ── Run batch ─────────────────────────────────────────────────────────────────

async function runBatch(pages, concurrency) {
  const results = [];
  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processPage));
    results.push(...batchResults);
    if (i + concurrency < pages.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  if (!API_KEY && !DRY) {
    console.error('✗ OPENROUTER_API_KEY not set in .env');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  let pages = manifest.pages;

  if (SLUG_ARG) pages = pages.filter(p => p.slug === SLUG_ARG);
  else if (!ALL) pages = pages.filter(p => p.priority <= MAX_PRI);

  [OUTLINES_DIR, PAGES_DIR, PROMPTS_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  console.log(`\nTheApiaryGuide Pipeline v1.2`);
  console.log(`Pages: ${pages.length} | Pass: ${PASS_ARG} | Mode: ${DRY ? 'DRY' : 'LIVE'}`);
  console.log('─'.repeat(55));

  if (DRY) {
    pages.forEach(p => console.log(`  ${p.priority}  ${p.slug}`));
    return;
  }

  const results = await runBatch(pages, CONCURRENCY);
  console.log(`\nGenerated: ${results.filter(Boolean).length}`);
}

run().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});