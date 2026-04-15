[//]: # (Destination: apiary/README.md)

# TheApiaryGuide.com
==========================================
Last updated: April 15 2026

---

## Current Status
- Domain: TheApiaryGuide.com (owned)
- Git repo: separate from BooksVersusMovies
- First 7 pages generated via pipeline-apiary-batch.js
- Static HTML site running locally, ready for Netlify deploy
- Stack: static HTML + CSS (presentation build) — WordPress later if client/revenue warrants

---

## Project Overview
- Type: Affiliate + informational content site
- Niche: Beekeeping — passionate community, recurring purchases, underserved online
- Monetization: Amazon Associates (home & garden / outdoor — 3-4.5% commission)
- Goal: Become the definitive beekeeping resource — big fish, small pond
- Current phase: presentation build — generate all 30 pages fast, deploy, show stakeholders

---

## Stack — Current (Presentation Build)
- Platform: Static HTML + CSS
  - Reason: fastest to build, full design control, zero hosting complexity
  - Pipeline generates all pages in minutes at minimal cost
- Hosting: Netlify (free tier)
- CSS: apiary.css — custom design system (honey/hive palette, Playfair Display + Source Serif 4)
- Pipeline: pipeline-apiary-batch.js — two-pass LLM batch generator
  - Pass 1 (Sonnet/Haiku): generates structured outline per page
  - Pass 2 (Haiku): implements outline into full HTML
  - Driven by apiary-manifest.json — 30 pages defined
  - Est. cost for all 30 pages: ~$0.50 total
- Config: config.json — site name, domain, model assignments
- Env: .env — OPENROUTER_API_KEY (same key as BooksVersusMovies)

---

## Stack — Future (If Project Moves Forward)
- Platform: WordPress
- Hosting: SiteGround (~$2.99/mo intro)
- Affiliate plugin: AAWP (~$49/year)
  - Live Amazon pricing, product images, star ratings, compliance
- SEO plugin: Rank Math (free)
- Theme: Astra or Kadence (free)
- Email: ConvertKit — capture from day one
- Transition trigger: client win, revenue milestone, or community features needed

---

## Site Structure — Four Pillars

- Shop
  - Best-of roundups (best beginner kit, best smoker, best suit under $100)
  - Gear comparisons (X vs Y)
  - Single product reviews
  - Seasonal buying guides

- Learn
  - Beginner's complete guide (highest search volume)
  - How-to content (how to inspect a hive, how to harvest honey)
  - Science and biology of bees
  - Common problems and solutions

- Discover
  - History of beekeeping (long-form, evergreen, shareable)
  - Famous beekeepers (Langstroth, etc.)
  - Books about beekeeping (affiliate links to Amazon)
  - Movies and documentaries about bees (affiliate links)
  - The science of honey

- Community
  - Local clubs directory (filterable by state/region) — link bait
  - Beekeeper Spotlight (interview profiles — outreach driven)
  - Events and workshops
  - Submit your club form (interactive)

---

## Beekeeper Spotlight
- Profile local and notable beekeepers — community outreach driven
- Builds relationships and natural backlinks
- Format: short Q&A profile
  - Who are you / how long beekeeping?
  - What got you started?
  - Best advice for beginners?
  - Favorite product?
- Strategic value: featured beekeepers and clubs share and link back
- Outreach: local clubs, beekeeping Facebook groups, Instagram

---

## Community Directory
- Filterable by state/region
- Links to club websites, Facebook groups, associations
- National orgs: American Beekeeping Federation, Honey Bee Health Coalition
- State-level extensions and agriculture departments
- Submit your club form
- Massive link bait — clubs link back when listed

---

## Page Inventory (apiary-manifest.json)
30 pages defined across 6 types:
- roundup (7) — affiliate-heavy best-of lists
- guide (7) — how-to and beginner content
- editorial (4) — history, science, cultural — authority building
- comparison (2) — X vs Y direct comparisons
- directory (3) — clubs, associations, regulations
- spotlight (1) — beekeeper profiles hub

Priority 1 (8 pages) — launch set:
- best-beginner-beekeeping-kit
- best-beekeeping-suits
- langstroth-vs-top-bar-vs-warre
- beginners-guide-to-beekeeping
- beekeeping-clubs-directory
- beekeeping-for-beginners
- about
- (best-beginner-beekeeping-kit — roundup)

---

## Pipeline Architecture

Two-pass batch generation:
- Pass 1 — Sonnet/Haiku architects each page
  - Input: title, type, pillar, search intent, notes from manifest
  - Output: structured JSON outline (sections, headings, affiliate placement)
  - Saved to: data/outlines/<slug>.json
- Pass 2 — Haiku implements the outline
  - Input: outline JSON + shared HTML template
  - Output: complete HTML page
  - Written to: apiary root folder

Commands:
- node pipeline-apiary-batch.js          (priority 1 pages)
- node pipeline-apiary-batch.js --all    (all 30 pages)
- node pipeline-apiary-batch.js --slug X (single page)
- node pipeline-apiary-batch.js --pass 2 (re-render from existing outlines)
- node pipeline-apiary-batch.js --dry    (preview only)

---

## Design System (apiary.css)
- Honey amber (#f5a623) — accent, CTAs, logo, borders
- Hive brown (#1e1208) — header, footer, hero backgrounds
- Cream/parchment — content area backgrounds
- Playfair Display — headings (authoritative, editorial)
- Source Serif 4 — body text (clean, readable)
- Inter — UI elements, nav, badges, labels
- Green buy buttons — matches BooksVersusMovies Book Wins style

---

## Pipeline Clone Strategy
- This project IS the clone proof of concept
- What changes per vertical:
  - config.json (site name, domain, colors)
  - apiary-manifest.json (page inventory)
  - css/<site>.css (design system)
  - Prompt tone in Pass 1/2 system prompts
- What stays the same:
  - pipeline-apiary-batch.js architecture
  - Two-pass Sonnet/Haiku pattern
  - HTML template structure
  - deploy.js workflow
- Other potential verticals:
  - Aquarium planted tanks
  - Van life / car camping
  - Home fermentation and brewing
  - Adaptive and accessible gear
  - Amateur radio (ham radio)

---

## Next Steps
- [ ] Finish generating all 7 priority 1 pages
- [ ] Review pages locally: npx serve .
- [ ] Generate remaining 23 pages: node pipeline-apiary-batch.js --all
- [ ] Point theapiaryguide.com at Netlify — deploy
- [ ] Submit sitemap to GSC
- [ ] Add Amazon affiliate ID to config.json and links
- [ ] Add ConvertKit email capture
- [ ] Build presentation deck
- [ ] Community outreach — first beekeeper spotlight target
- [ ] Clubs directory — seed with 20-30 national/major clubs

---

## Notes
- "Discover" pillar is the strategic differentiator — most affiliate sites
  skip cultural content, this is what builds authority and earns backlinks
- Interactive community features favor WordPress — keep in mind for transition
- Don't repeat BVM mistake — add email capture from day one
- jsonrepair library available in node_modules from BooksVersusMovies — copy
  package.json or run npm install jsonrepair in apiary/ if needed
