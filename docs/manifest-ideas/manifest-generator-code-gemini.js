/**
 * manifest-factory.js
 * Generates bulk page entries for apiary-manifest.json
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, 'apiary-manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// ── Templates for Bulk Generation ─────────────────────────────────────────────

const US_STATES = ['Maryland', 'Virginia', 'Pennsylvania', 'New York', 'Texas']; // Expand this to 50

/**
 * Generates localized "Beekeeping in [State]" pages
 */
function generateLocalGuides() {
  return US_STATES.map(state => ({
    slug: `beekeeping-in-${state.toLowerCase().replace(/ /g, '-')}`,
    title: `Beekeeping in ${state}: A Complete Regional Guide`,
    type: "guide",
    pillar: "local",
    priority: 3,
    searchIntent: "informational",
    notes: `Focus on ${state} specific climate, native nectar flows, and state-level registration laws. Link to ${state} beekeeping associations.`
  }));
}

/**
 * Generates technical "Comparison" pages
 */
const COMPARISONS = [
  ['Trek Marlin 7', 'Trek Verve 2'], // Example of your interests influencing tech comparisons
  ['Langstroth', 'Flow Hive'],
  ['Plastic Frames', 'Beeswax Foundation']
];

function generateComparisons() {
  return COMPARISONS.map(([itemA, itemB]) => ({
    slug: `${itemA.toLowerCase().replace(/ /g, '-')}-vs-${itemB.toLowerCase().replace(/ /g, '-')}`,
    title: `${itemA} vs ${itemB}: Which is Better for Your Hive?`,
    type: "comparison",
    pillar: "shop",
    priority: 2,
    searchIntent: "research",
    notes: `Head-to-head comparison of ${itemA} and ${itemB}. Focus on durability, price, and ease of use for beginners.`
  }));
}

// ── Execution ────────────────────────────────────────────────────────────────

const newPages = [
  ...generateLocalGuides(),
  ...generateComparisons()
];

// Append to manifest while avoiding duplicates
newPages.forEach(newPage => {
  if (!manifest.pages.find(p => p.slug === newPage.slug)) {
    manifest.pages.push(newPage);
  }
});

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`Added ${newPages.length} pages to the manifest.`);