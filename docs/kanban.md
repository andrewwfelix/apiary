[//]: # (Destination: kanban.md)

# TheApiaryGuide.com — Kanban
==========================================
Last updated: April 15 2026


## Immediate — Fix Before Generating More Pages

- [ ] Fix inner page UI — renderPage() must use apiary.css classes only (no inline styles)
  - Rule: every page = same shell (NAV + HERO + SECTION BLOCKS + FOOTER)
  - Remove sidebar layout, page-layout, page-main, inner-hero from renderPage()
  - Use section-inner, section-eyebrow, section-heading, steps, services-grid, tools-grid
  - Fix duplicate H1 bug on inner pages (SEO issue)
  - Fix nav inconsistency — all pages use exact same <nav> as index.html
- [ ] Add fadeUp animation to inner page heroes (matches index.html)
- [ ] Wire [[AFF:slug]] placeholder replacement in renderPage()
  - Load product-vault.json during Pass 2
  - Replace AFFILIATE_PLACEHOLDER_slug with real affiliate URLs
- [ ] Wire internalLinks from outline into rendered HTML
  - Add Related Guides section at bottom of each page
  - Update Pass 2 system prompt to naturally insert internal links


## High Priority — Before Full 30-Page Run

- [ ] Remove .env from git: git rm --cached .env && git push
- [ ] Verify .gitignore covers: .env, data/outlines/, data/pages/, *.log
- [ ] Add Amazon affiliate ID to config.json
- [ ] Build product-vault.json — seed with priority products from CSV
  - Start with The Tool Belt and The Wardrobe (highest search volume)
  - Use affiliate-manager/dashboard.html to curate products
- [ ] Generate remaining 23 pages: node pipeline-apiary-batch.js --all
- [ ] Deploy to Netlify — point theapiaryguide.com
- [ ] Submit sitemap.xml to GSC
- [ ] Add GA tracking ID to config.json


## Affiliate System

- [ ] Set up affiliate-manager/ folder in repo
  - server.js (Express microservice)
  - vault-manager.js (placeholder injection)
  - dashboard.html (product curator UI)
  - product-vault.json (single source of truth)
- [ ] Seed vault with priority products from apiary-product-links-complete.csv:
  - The Tool Belt: Dadant smoker, Mann Lake smoker, J-hook hive tool
  - The Wardrobe: Guardian ventilated suit, Humble Bee suit, Ultra Breeze jacket
  - The Library: Beekeeping for Dummies, Backyard Beekeeper, Beekeeper's Bible
- [ ] Update pipeline Pass 2 prompt — use [[AFF:slug]] placeholders in content
- [ ] Update renderPage() — replace [[AFF:slug]] with product card HTML at render time
- [ ] Future: Amazon Creators API integration (after 10 qualifying sales)


## Manifest Improvements

- [ ] Add SEO fields to manifest entries (primaryKeyword, secondaryKeywords, targetWordCount)
- [ ] Add affiliate.targetProducts and relatedSlugs fields per page
- [ ] Add parentSlug for hub page relationships
- [ ] Build manifest-factory.js — generates state-level guide entries (50 states)
  - Hold until core 30 pages are live and indexed


## Community & Content

- [ ] Seed clubs directory — 20-30 entries (national orgs + major state clubs)
- [ ] First Beekeeper Spotlight outreach — local clubs, beekeeping Facebook groups
- [ ] ConvertKit email capture — add to index.html and inner pages


## Design & CSS

- [ ] Extend apiary.css with inner page classes matching Apex Search system
  - .report-header style hero for content pages
  - .insight-box for callouts and affiliate highlights
  - Table styles for comparison pages (from competitor-analysis-report.html)
  - .summary-grid for stats and data display
- [ ] Remove all inline styles from renderPage() — zero exceptions
- [ ] Remove bullet points from generated content — DM Sans prose only
- [ ] Review competitor-analysis-report.html as template for content-heavy pages


## Infrastructure

- [ ] Add package.json with scripts (generate, generate:all, generate:pass2)
- [ ] npm install jsonrepair
- [ ] Add sitemap generator script
- [ ] Add --verbose flag to pipeline


## Presentation Deck

- [ ] Screenshot key pages — index, roundup, guide, comparison, directory
- [ ] One-pager: niche, traffic opportunity, revenue model, 30-page roadmap
- [ ] Pipeline architecture slide — two-pass, cost per page, speed


## Future — After Launch

- [ ] State-level guides (50 pages) via manifest-factory.js
- [ ] Expand affiliate vault: The Apothecary (varroa), The Harvest Lab (extractors)
- [ ] Interactive clubs directory (filterable by state — needs JS or WordPress)
- [ ] Beekeeper Spotlight hub — outreach-driven profiles
- [ ] WordPress migration if community features needed or client win


## Done — April 15 2026

- [x] Domain owned: TheApiaryGuide.com
- [x] Git repo live: https://github.com/andrewwfelix/apiary
- [x] 7 priority 1 pages generated and committed
- [x] index.html — faithful Apex Search reproduction with beekeeping content
- [x] apiary.css — extracted from apex-search.html, green accent, cream background
- [x] pipeline-apiary-batch.js — two-pass LLM batch generator, concurrency 1
- [x] apiary-manifest.json — 30 pages defined across 6 types
- [x] config.json — site config + model assignments
- [x] .gitignore created
- [x] README.md with full project context
- [x] style-examples/ — apex-search.html + competitor-analysis-report.html in repo
- [x] affiliate-links CSV — 7 categories, 35+ products catalogued
