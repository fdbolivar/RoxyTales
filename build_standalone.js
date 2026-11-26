const fs = require('fs');
const path = require('path');

// 1. Rebuild roxytales.bundle.js
const sourceFiles = ['config.js', 'adminService.js', 'odooService.js', 'admin.js', 'app.js'];
let bundleCode = `/* Universal bundle from modular ES6 sources */\n(function() {\n"use strict";\n`;

for (const f of sourceFiles) {
  let content = fs.readFileSync(path.join(__dirname, f), 'utf-8');
  content = content.replace(/^import\s+[^;]+;\s*$/gm, '');
  content = content.replace(/^export\s+(const|class|function|let|var)\s+/gm, '$1 ');
  content = content.replace(/^export\s*\{[^}]*\};?\s*$/gm, '');
  bundleCode += `\n// === SOURCE: ${f} ===\n` + content + '\n';
}

bundleCode += `
document.addEventListener("DOMContentLoaded", () => {
  window.roxyTalesApp = new RoxyTalesApp();
  window.roxyTalesApp.init();
});
})();
`;

fs.writeFileSync(path.join(__dirname, 'roxytales.bundle.js'), bundleCode, 'utf-8');
console.log('roxytales.bundle.js updated (' + bundleCode.length + ' bytes)');

// 2. Base64 encode images helper
const imageMap = {
  './PublishingImprint/PublishingImprint.jpg': path.join(__dirname, 'PublishingImprint', 'PublishingImprint.jpg'),
  './RoxyCharacter.jpg': path.join(__dirname, 'RoxyCharacter.jpg'),
  './RoxyCharacterSheet.jpg': path.join(__dirname, 'RoxyCharacterSheet.jpg'),
  './Example01.jpg': path.join(__dirname, 'Example01.jpg'),
  './Example02.jpg': path.join(__dirname, 'Example02.jpg'),
  './assets/pages/scene_holiday_tree.jpg': path.join(__dirname, 'assets', 'pages', 'scene_holiday_tree.jpg'),
  './assets/pages/scene_pine_gift.jpg': path.join(__dirname, 'assets', 'pages', 'scene_pine_gift.jpg'),
  './assets/pages/scene_night_lullaby.jpg': path.join(__dirname, 'assets', 'pages', 'scene_night_lullaby.jpg'),
  './assets/pages/scene_hearth_love.jpg': path.join(__dirname, 'assets', 'pages', 'scene_hearth_love.jpg')
};

const base64Map = {};
for (const [relPath, absPath] of Object.entries(imageMap)) {
  if (fs.existsSync(absPath)) {
    const ext = path.extname(absPath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    const b64 = fs.readFileSync(absPath).toString('base64');
    base64Map[relPath] = `data:${ext};base64,${b64}`;
  }
}

// 3. Build standalone HTML
let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
let styles = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf-8');

// Replace local image references in bundleCode and html
let processedBundle = bundleCode;
for (const [relPath, dataUri] of Object.entries(base64Map)) {
  // Replace in bundle
  processedBundle = processedBundle.split(relPath).join(dataUri);
  // Replace in html
  html = html.split(relPath).join(dataUri);
}

// Inline styles
html = html.replace('<link rel="stylesheet" href="./styles.css" />', `<style>\n${styles}\n</style>`);

// Inline script bundle
html = html.replace('<script src="./roxytales.bundle.js"></script>', `<script>\n${processedBundle}\n</script>`);

const standalonePath = path.join(__dirname, 'preview_standalone.html');
fs.writeFileSync(standalonePath, html, 'utf-8');
console.log('preview_standalone.html generated (' + html.length + ' bytes)');

// Also copy to artifact path
const artifactPath = 'C:\\Users\\FBolivar\\.gemini\\antigravity\\brain\\6b067831-6b54-4743-a309-1e6f402a9ed1\\roxytales_studio_preview.html';
fs.writeFileSync(artifactPath, html, 'utf-8');
console.log('Artifact updated: ' + artifactPath);
