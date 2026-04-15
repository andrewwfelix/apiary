#!/usr/bin/env node

/**
 * pipeline-apiary-batch.js
 * TheApiaryGuide.com — two-pass batch page generator
 *
 * Pass 1 (Sonnet): reads manifest, generates structured outline per page
 * Pass 2 (Haiku):  implements outline into full HTML using shared template
 *
 * Usage:
 *   node pipeline-apiary-batch.js                    (all priority 1 pages)
 *   node pipeline-apiary-batch.js --all              (all 30 pages)
 *   node pipeline-apiary-batch.js --slug best-beginner-beekeeping-kit
 *   node pipeline-apiary-batch.js --priority 2       (priority 1 + 2)
 *   node pipeline-apiary-batch.js --dry              (validate only)
 *   node pipeline-apiary-batch.js --pass 1           (outlines only)
 *   node pipeline-apiary-batch.js --pass 2           (build from existing outlines)
 *
 * Outputs:
 *   data/apiary/outlines/<slug>.json    Pass 1 outline
 *   data/apiary/pages/<slug>.html       Final HTML page
 *   apiary/                             Copy of all pages for deployment
 *
 * Destination: apiary/pipeline-apiary-batch.js
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


// ── Models ────────────────────────────────────────────────────────────────────

const PASS1_MODEL = config.models?.pass1 || { model: 'anthropic/claude-sonnet-4-5', maxTokens: 2000, temperature: 0.4 };
const PASS2_MODEL = config.models?.pass2 || { model: 'anthropic/claude-haiku-4-5',  maxTokens: 6000, temperature: 0.5 };

const SITE = {
  name:        config.site?.name        || 'The Apiary Guide',
  domain:      config.site?.domain      || 'theapiaryguide.com',
  tagline:     config.site?.tagline     || 'Everything You Need to Start and Grow Your Hive',
  url:         config.site?.url         || 'https://theapiaryguide.com',
  accentColor: '#f5a623',
  gaId:        config.site?.gaId        || 'TBD',
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

// ── Pass 1 prompt ─────────────────────────────────────────────────────────────

const PASS1_SYSTEM = `You are a content strategist for TheApiaryGuide.com — a beekeeping affiliate and information site.

Your job is to generate a structured content outline for a single page.
The outline will be handed to a writer (another AI) to implement.
Your outline must be specific, opinionated, and tailored to the page's search intent and affiliate goal.

Return ONLY a JSON object with this structure:
{
  "slug": string,
  "pageTitle": string (50-60 chars, include primary keyword),
  "metaDesc": string (max 155 chars, includes keyword + value proposition),
  "h1": string (punchy display heading),
  "intro": string (2-3 sentences describing what the intro paragraph should cover),
  "sections": [
    {
      "id": string (kebab-case),
      "heading": string (H2),
      "summary": string (2-3 sentences — what this section covers and why),
      "hasAffiliate": boolean,
      "affiliateNote": string (what product to link to, if any)
    }
  ],
  "faqQuestions": [string] (4-6 questions real searchers ask),
  "internalLinks": [string] (2-3 other page slugs on the site to link to)
}

No markdown. No explanation. Raw JSON only.`;

// ── Pass 2 prompt ─────────────────────────────────────────────────────────────

const PASS2_SYSTEM = `You are a content writer for TheApiaryGuide.com — a beekeeping affiliate and information site.

You will receive a structured content outline and must implement it as a complete HTML page.
Follow the outline exactly — use the headings provided, cover what each section summary describes.

WRITING VOICE:
- Friendly, knowledgeable, practical — like advice from an experienced beekeeper
- Specific details, not generic filler
- Clear recommendations with reasons
- Natural affiliate placements — never forced

HTML RULES:
- Return ONLY the content HTML — no DOCTYPE, no <html>, no <head>, no <body> tags
- Use semantic HTML: <h2>, <h3>, <p>, <ul>, <ol>, <strong>
- For affiliate links use: <a href="AFFILIATE_PLACEHOLDER_slug" class="affiliate-link">product name</a>
- For FAQ use: <div class="faq-item"><h3 class="faq-q">Question</h3><p class="faq-a">Answer</p></div>
- Wrap FAQ section in: <div class="faq-section">
- Each section wrapped in: <section id="section-id">
- Intro paragraph wrapped in: <div class="page-intro">

Return ONLY the HTML content. No explanation. No markdown fences.`;

// ── Parse JSON safely ─────────────────────────────────────────────────────────

function parseJSON(text) {
  // Strip markdown fences
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // Direct parse
  try { return JSON.parse(clean); } catch {}

  // Find outermost JSON object
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(clean.slice(start, end + 1)); } catch {}
  }

  // Try jsonrepair if available
  try {
    const { jsonrepair } = require('jsonrepair');
    return JSON.parse(jsonrepair(clean));
  } catch {}

  throw new Error('Could not parse JSON response');
}

// ── Render full HTML page ─────────────────────────────────────────────────────

function renderPage(outline, content, page) {
  const sectionLinks = outline.sections
    ? outline.sections.map(s =>
        `<a href="#${s.id}" class="sidebar-link">${s.heading}</a>`
      ).join('\n      ')
    : '';

  return `<!DOCTYPE html>
<!-- Generated by pipeline-apiary-batch.js v1.0 on ${new Date().toISOString().split('T')[0]} -->
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

<!-- NAV — no backdrop-filter blur on inner pages -->
<nav style="backdrop-filter: none; -webkit-backdrop-filter: none; background: rgba(247,245,240,0.98);">
  <a href="index.html" class="nav-brand">${SITE.name}</a>
  <ul class="nav-links">
    <li><a href="best-beginner-beekeeping-kit.html">Shop</a></li>
    <li><a href="beginners-guide-to-beekeeping.html">Learn</a></li>
    <li><a href="history-of-beekeeping.html">Discover</a></li>
    <li><a href="beekeeping-clubs-directory.html" class="nav-cta">Community</a></li>
  </ul>
</nav>

<!-- PAGE HERO -->
<div style="padding-top: 64px;">
  <div style="padding: 60px 48px 40px; max-width: 1100px; margin: 0 auto;">
    <div class="section-eyebrow">${page.pillar}</div>
    <h1 style="font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300; line-height: 1.1; color: var(--ink); letter-spacing: -0.01em; max-width: 780px; margin-bottom: 16px;">${outline.h1 || page.title}</h1>
    ${outline.metaDesc ? `<p style="font-size: 16px; font-weight: 300; color: var(--ink-mid); line-height: 1.75; max-width: 600px;">${outline.metaDesc}</p>` : ''}
  </div>
</div>

<!-- PAGE CONTENT -->
<div style="max-width: 1100px; margin: 0 auto; padding: 0 48px 100px; display: grid; grid-template-columns: 1fr 300px; gap: 80px; align-items: start;">

  <main style="min-width: 0;">
    ${content}
  </main>

  <aside style="position: sticky; top: 80px;">

    <div style="background: var(--white); border: 1px solid var(--rule); border-radius: 14px; padding: 28px; margin-bottom: 16px;">
      <div style="font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 16px;">On this page</div>
      ${sectionLinks}
    </div>

    <div style="background: var(--ink); border-radius: 14px; padding: 28px; margin-bottom: 16px;">
      <div style="font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: #6a6a64; margin-bottom: 12px;">New to beekeeping?</div>
      <p style="font-size: 13px; font-weight: 300; color: #9a9a94; line-height: 1.65; margin-bottom: 20px;">Start with our complete beginner's guide — everything you need before your first hive.</p>
      <a href="beginners-guide-to-beekeeping.html" style="display: inline-block; font-size: 13px; font-weight: 500; color: var(--ink); background: #7ec99a; padding: 11px 24px; border-radius: 40px; text-decoration: none; transition: background 0.2s;">Read the guide →</a>
    </div>

    <div style="background: var(--white); border: 1px solid var(--rule); border-radius: 14px; padding: 28px;">
      <div style="font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 16px;">Find your club</div>
      <p style="font-size: 13px; font-weight: 300; color: var(--ink-mid); line-height: 1.65; margin-bottom: 16px;">Connect with local beekeepers and associations in your area.</p>
      <a href="beekeeping-clubs-directory.html" style="font-size: 13px; font-weight: 400; color: var(--accent); text-decoration: underline; text-decoration-color: var(--accent-pale);">Browse directory →</a>
    </div>

  </aside>

</div>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div>
      <div class="footer-brand">${SITE.name}</div>
      <div class="footer-tagline">Everything you need to start and grow your hive.</div>
    </div>
    <ul class="footer-links">
      <li><a href="index.html">Home</a></li>
      <li><a href="beginners-guide-to-beekeeping.html">Beginners</a></li>
      <li><a href="beekeeping-clubs-directory.html">Community</a></li>
      <li><a href="about.html">About</a></li>
    </ul>
  </div>
  <div class="footer-disclosure" style="padding: 0 48px;">As an Amazon Associate we earn from qualifying purchases. Affiliate links are clearly marked throughout this site.</div>
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

  // ── Pass 1: Generate outline ─────────────────────────────────────────────
  let outline;

  if (PASS_ARG !== '2' && !fs.existsSync(outlinePath)) {
    const userContent = `Generate a content outline for this page:
Title: ${page.title}
Slug: ${page.slug}
Type: ${page.type}
Pillar: ${page.pillar}
Search intent: ${page.searchIntent}
Notes: ${page.notes}
Site: ${SITE.name} — ${SITE.tagline}`;

    try {
      const raw = await callModel(
        PASS1_MODEL.model, PASS1_SYSTEM, userContent,
        PASS1_MODEL.maxTokens, PASS1_MODEL.temperature
      );
      outline = parseJSON(raw);
      fs.writeFileSync(outlinePath, JSON.stringify(outline, null, 2), 'utf8');
      process.stdout.write(' [outlined]');
    } catch (e) {
      process.stdout.write(` ✗ Pass 1 failed: ${e.message}\n`);
      return false;
    }
  } else if (fs.existsSync(outlinePath)) {
    try {
      outline = JSON.parse(fs.readFileSync(outlinePath, 'utf8'));
      if (PASS_ARG === '2') process.stdout.write(' [outline loaded]');
    } catch (e) {
      process.stdout.write(` ✗ outline parse error: ${e.message}\n`);
      return false;
    }
  }

  if (!outline) {
    process.stdout.write(` ✗ no outline available — run without --pass 2 first\n`);
    return false;
  }

  if (PASS_ARG === '1') { process.stdout.write(' ✓\n'); return true; }

  // ── Pass 2: Generate content ──────────────────────────────────────────────
  const userContent2 = `Implement this content outline as HTML:

${JSON.stringify(outline, null, 2)}

Page type: ${page.type}
Additional context: ${page.notes}`;

  let content;
  try {
    content = await callModel(
      PASS2_MODEL.model, PASS2_SYSTEM, userContent2,
      PASS2_MODEL.maxTokens, PASS2_MODEL.temperature
    );
    process.stdout.write(' [written]');
  } catch (e) {
    process.stdout.write(` ✗ Pass 2 failed: ${e.message}\n`);
    return false;
  }

  // ── Render and write ──────────────────────────────────────────────────────
  const html = renderPage(outline, content, page);
  fs.writeFileSync(pagePath, html, 'utf8');
  fs.copyFileSync(pagePath, deployPath);
  process.stdout.write(` ✓  (${html.length} chars)\n`);
  return true;
}

// ── Concurrency helper ────────────────────────────────────────────────────────

async function runBatch(pages, concurrency) {
  const results = [];
  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processPage));
    results.push(...batchResults);
    if (i + concurrency < pages.length) {
      await new Promise(r => setTimeout(r, 1000)); // brief pause between batches
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

  if (!fs.existsSync(MANIFEST)) {
    console.error(`✗ Manifest not found: ${MANIFEST}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  let pages = manifest.pages;

  // Filter pages
  if (SLUG_ARG) {
    pages = pages.filter(p => p.slug === SLUG_ARG);
  } else if (!ALL) {
    pages = pages.filter(p => p.priority <= MAX_PRI);
  }

  if (pages.length === 0) {
    console.error('✗ No pages matched filters');
    process.exit(1);
  }

  // Create dirs
  [OUTLINES_DIR, PAGES_DIR, DEPLOY_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  console.log(`\npipeline-apiary-batch.js`);
  console.log(`Site:        ${SITE.name}`);
  console.log(`Pages:       ${pages.length}`);
  console.log(`Pass:        ${PASS_ARG}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Mode:        ${DRY ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Est. cost:   ~$${(pages.length * 0.03).toFixed(2)}`);
  console.log(`${'─'.repeat(55)}`);

  if (DRY) {
    pages.forEach(p => console.log(`  ${p.priority}  ${p.slug}  [${p.type}]`));
    console.log(`\n[DRY] Run without --dry to generate.`);
    return;
  }

  const results = await runBatch(pages, CONCURRENCY);
  const passed  = results.filter(Boolean).length;
  const failed  = results.length - passed;

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`  Generated: ${passed}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`\n✓ Pages written to apiary/`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review pages in apiary/ folder`);
  console.log(`  2. Deploy: point theapiaryguide.com at this folder on Netlify`);
  console.log(`  3. Submit sitemap to GSC`);
}

run().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
