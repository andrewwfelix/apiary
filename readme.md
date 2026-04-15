# TheApiaryGuide.com
==========================================
Last updated: April 15 2026
Repo: https://github.com/andrewwfelix/apiary

---

## Current Status
- 7 pages generated and live in repo (priority 1)
- Static HTML site — ready for Netlify deploy
- Design system: Apex Search Co. aesthetic (Cormorant Garamond + DM Sans, forest green accent)
- Pipeline working end to end — outlines in data/outlines/, pages at root
- Next: generate remaining 23 pages, deploy to Netlify, add affiliate IDs

---

## Project Overview
- Domain: TheApiaryGuide.com (owned)
- Type: Affiliate + informational content site
- Niche: Beekeeping — passionate community, recurring purchases, underserved online
- Monetization: Amazon Associates (home & garden / outdoor — 3-4.5%)
- Goal: Become the definitive beekeeping resource — big fish, small pond
- Current phase: presentation build — generate all 30 pages, deploy, show stakeholders
- Future: WordPress migration if client win or community features needed

---

## Stack
- Platform: Static HTML + CSS (presentation build)
- Hosting: Netlify (free tier) — not yet deployed
- CSS: css/apiary.css — Apex Search design system with green accent
- Fonts: Cormorant Garamond (display) + DM Sans (body) via Google Fonts
- Pipeline: pipeline-apiary-batch.js — two-pass LLM batch generator
- Config: config.json — site name, domain, model assignments (not in repo)
- Env: .env — OPENROUTER_API_KEY (not in repo — never commit this)

---

## Pipeline Architecture

Two-pass batch generation driven by apiary-manifest.json:

- Pass 1 — Haiku/Sonnet architects each page
  - Input: title, type, pillar, search intent, notes from manifest
  - Output: structured JSON outline saved to data/outlines/<slug>.json
- Pass 2 — Haiku implements the outline
  - Input: outline JSON + HTML template in renderPage()
  - Output: complete HTML page written to root folder

Commands (run from apiary/ folder):
- node pipeline-apiary-batch.js              (priority 1 pages — default)
- node pipeline-apiary-batch.js --all        (all 30 pages)
- node pipeline-apiary-batch.js --slug X     (single page)
- node pipeline-apiary-batch.js --pass 2     (re-render from existing outlines)
- node pipeline-apiary-batch.js --dry        (preview only, no API calls)

---

## Site Structure — Four Pillars

- Shop      — best-of roundups, gear comparisons, buying guides (affiliate-heavy)
- Learn     — beginner guides, how-to, seasonal calendar, science
- Discover  — history, famous beekeepers, books, documentaries (link bait)
- Community — clubs directory (filterable), Beekeeper Spotlight, events

---

## Beekeeper Spotlight
- Profile local and notable beekeepers — community outreach driven
- Format: Q&A (background, origin story, advice, favourite product)
- Strategic value: featured beekeepers share and link back
- Outreach: local clubs, beekeeping Facebook groups, Instagram

---

## Community Directory
- Clubs filterable by state/region
- National orgs: American Beekeeping Federation, Honey Bee Health Coalition
- Submit your club form (interactive — needs JS or WordPress)
- Biggest link bait asset on the site

---

## Page Inventory (apiary-manifest.json)
30 pages across 6 types. Priority 1 (7 pages) generated:
- best-beginner-beekeeping-kit      (roundup)
- best-beekeeping-suits             (roundup)
- langstroth-vs-top-bar-vs-warre    (comparison)
- beginners-guide-to-beekeeping     (guide)
- beekeeping-clubs-directory        (directory)
- beekeeping-for-beginners          (guide)
- about                             (editorial)

Remaining 23 pages at priority 2-3 — run node pipeline-apiary-batch.js --all

---

## Design System
- Based exactly on Apex Search Co. (style-examples/apex-search.html)
- Forest green accent: #2d5a3d / #4a8c60
- Cream background: #f7f5f0
- Cormorant Garamond serif headings (lightweight, editorial)
- DM Sans body (clean, minimal)
- Eyebrow line pattern on all section headers
- Index page: fixed nav with backdrop blur, hero grid, stats card
- Inner pages: no blur, sticky sidebar, Cormorant heading, green CTA block

---

## Files
- index.html                    — homepage (Apex Search layout)
- css/apiary.css                — shared stylesheet (extracted from apex-search.html)
- pipeline-apiary-batch.js      — batch page generator
- apiary-manifest.json          — 30-page inventory with types and notes
- config.json                   — site config + model assignments (not in repo)
- .env                          — API key (not in repo — add to .gitignore)
- data/outlines/                — Pass 1 JSON outlines (can be regenerated)
- data/pages/                   — intermediate Pass 2 HTML (same as root pages)
- style-examples/               — reference designs

---

## Next Steps
- [ ] Remove .env from git tracking: git rm --cached .env
- [ ] Update .gitignore to exclude data/outlines/, data/pages/, .env
- [ ] Add Amazon affiliate ID to config.json
- [ ] Generate remaining 23 pages: node pipeline-apiary-batch.js --all
- [ ] Deploy to Netlify — point theapiaryguide.com
- [ ] Submit sitemap to GSC
- [ ] Add ConvertKit email capture
- [ ] First Beekeeper Spotlight outreach
- [ ] Seed clubs directory with 20-30 national/major clubs
- [ ] Build presentation deck

---

## UI Notes
- index.html looks great — Apex Search design faithfully reproduced
- Inner pages (generated by renderPage() in pipeline-apiary-batch.js) are less polished
  - Currently using inline styles rather than proper CSS classes
  - Need to extend apiary.css with inner page classes (.inner-hero, .inner-layout, etc.)
  - Then update renderPage() to use those classes instead of inline styles
  - Goal: inner pages should feel like a continuation of index.html, not a different site
  - This is a next-session priority before the full 30-page run

## Notes
- Discover pillar is the strategic differentiator — builds authority and earns backlinks
- Interactive community features (filterable directory, submission forms) favor WordPress
- Don't repeat BVM mistake — add email capture from day one
- jsonrepair available if needed: npm install jsonrepair
- This repo is a template for future vertical sites — swap config.json and manifest
