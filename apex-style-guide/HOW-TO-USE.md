# Apex Search Co. — CSS Setup Guide

## File structure

After extracting, your project should look like this:

```
your-project/
├── global.css                        ← Load on EVERY page
├── apex-search.css                   ← Home / landing page only
├── audit-service.css                 ← Service child pages (audit, visibility, etc.)
├── info-page.css                     ← Informational / text-focused pages
├── competitor-analysis.css           ← Competitor analysis report page
│
├── index.html  (or apex-search.html)
├── audit-service.html
├── info-page.html
└── competitor-analysis-report.html
```

---

## How to link the CSS

Every HTML page needs **two** `<link>` tags in its `<head>`:

1. The shared **global.css**
2. The **page-specific CSS** for that page

### Home / landing page
```html
<head>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="global.css">
  <link rel="stylesheet" href="apex-search.css">
</head>
```

### Service child pages (audit, visibility, analytics, authority)
```html
<head>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="global.css">
  <link rel="stylesheet" href="audit-service.css">
</head>
```

> The `audit-service.css` file covers all visual service child pages (the audit page layout, check grids, callout cards, process steps). Use it for the Visibility, Analytics, and Authority pages too — just swap the HTML content.

### Informational / text pages
```html
<head>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="global.css">
  <link rel="stylesheet" href="info-page.css">
</head>
```

### Competitor analysis report
```html
<head>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="global.css">
  <link rel="stylesheet" href="competitor-analysis.css">
</head>
```

---

## What each file contains

### global.css
Everything shared across the whole site:
- CSS reset
- Design tokens (all colour variables — change these to retheme everything)
- Base body styles and typography
- Navigation bar
- Shared buttons (`.btn-primary`, `.btn-ghost`)
- Breadcrumb
- Section eyebrow pattern
- Status badges (`.badge-green`, `.badge-amber`, `.badge-red`, `.badge-neutral`)
- Footer
- `@keyframes fadeUp` animation
- Base responsive rules

### apex-search.css
Only used on the home/landing page:
- Hero section (two-column layout, stats card)
- How it works steps grid
- Services grid
- Pricing section (dark background)
- Tools grid

### audit-service.css
Used for visual service child pages:
- Breadcrumb spacing
- Hero with audit preview card
- Six-column check grid
- Deliverables list + callout card
- Process steps
- Other services navigation strip

### info-page.css
Used for text-heavy informational pages:
- Two-column page layout (sidebar + main)
- Sticky sidebar with nav and CTA
- Article header (title, meta, intro)
- Prose styles (h2, h3, p, a, strong)
- Pull quote
- Inline callout box
- Definition table
- Checklist
- Next steps card grid

### competitor-analysis.css
Used for the report page:
- Report header with domain chips
- Summary stat grid + insight box
- Keyword gap table with difficulty badges
- Backlink gap grid
- Technical comparison grid (pass/warn/fail)
- Content gap list
- Action plan (three-column dark section)
- Print styles

---

## Customising the theme

All colours are CSS variables in `global.css`. To retheme the entire site, edit just these lines:

```css
:root {
  --ink: #1a1a18;        /* Change to your primary text colour */
  --cream: #f7f5f0;      /* Change to your background colour */
  --accent: #2d5a3d;     /* Change to your brand accent colour */
  --accent-light: #4a8c60;
  --accent-pale: #e8f2ec;
  --rule: #d4cfc4;       /* Border / divider colour */
}
```

Every button, badge, highlight, and accent element on every page will update automatically.

---

## Adding a new service child page

1. Copy `audit-service.html` (the linked version)
2. Keep the `<head>` links unchanged — `global.css` + `audit-service.css`
3. Replace the content inside `<body>` with your new service content
4. The CSS classes (`.check-grid`, `.check-item`, `.process-steps`, `.callout-card`, etc.) all still apply

## Adding a new informational page

1. Copy `info-page.html` (the linked version)
2. Keep the `<head>` links unchanged — `global.css` + `info-page.css`
3. Update the sidebar nav links and breadcrumb
4. Replace the article content inside `.main-content`

---

## Folder paths

If your HTML files are in a subfolder (e.g. `pages/audit.html`), adjust the CSS paths accordingly:

```html
<!-- If HTML is one level deep -->
<link rel="stylesheet" href="../global.css">
<link rel="stylesheet" href="../audit-service.css">
```

Keep all CSS files together in the same root directory for simplicity.
