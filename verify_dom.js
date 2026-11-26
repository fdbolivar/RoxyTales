const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');
const js = fs.readFileSync('app.js', 'utf-8') + fs.readFileSync('admin.js', 'utf-8');

const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
const queriedIds = new Set();
let match;
while ((match = regex.exec(js)) !== null) {
  queriedIds.add(match[1]);
}

// IDs dynamically injected inside template literals (e.g., _buildSinglePageHtml)
const dynamicTemplateIds = new Set([
  'dedicationHeaderLine',
  'dedicationDateLine',
  'dedicationQuoteLine',
  'dedicationSignatureLine',
  'dedicationParchmentCard',
  'pageStoryTextEl',
  'pageSubtextEl',
  'page1AgeBadge',
  'pageTypographyBox',
  'folioChildPetName'
]);

const missing = [];
for (const id of queriedIds) {
  if (dynamicTemplateIds.has(id)) continue;
  const hasId = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  if (!hasId) {
    missing.push(id);
  }
}

console.log(`Queried IDs: ${queriedIds.size}`);
if (missing.length === 0) {
  console.log('ALL queried IDs exist in index.html! (100% matched)');
} else {
  console.error('Missing IDs in index.html:', missing);
  process.exit(1);
}
