const fs = require('fs');
const path = require('path');
const vm = require('vm');

const files = [
  'config.js',
  'adminService.js',
  'odooService.js',
  'admin.js',
  'app.js'
];

let bundleCode = `/* Universal bundle from modular ES6 sources (config.js, adminService.js, odooService.js, admin.js, app.js) */
(function() {
"use strict";
`;

for (const f of files) {
  let content = fs.readFileSync(path.join(__dirname, f), 'utf-8');
  // Strip import statements
  content = content.replace(/^import\s+[^;]+;\s*$/gm, '');
  // Strip export statements (export const, export class, export function, export let, export var)
  content = content.replace(/^export\s+(const|class|function|let|var)\s+/gm, '$1 ');
  // Strip any standalone export { ... };
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
console.log('Successfully bundled to roxytales.bundle.js (size: ' + bundleCode.length + ' bytes)');

// Export Single-Source-of-Truth 24-page story blueprint for backend PDF layout engine
const configSrc = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf-8')
  .replace(/^import\s+[^;]+;\s*$/gm, '')
  .replace(/^export\s+(const|class|function|let|var)\s+/gm, '$1 ')
  .replace(/^export\s*\{[^}]*\};?\s*$/gm, '');
const ctx = vm.createContext({});
vm.runInContext(configSrc + '\nthis.__PAGES_BLUEPRINT = PAGES_BLUEPRINT;', ctx);
const exportedPages = (ctx.__PAGES_BLUEPRINT || []).map((p) => ({
  pageNumber: p.pageNumber,
  id: p.id,
  layoutReservePercent: p.layoutReservePercent || 30,
  isDarkPage: Boolean(p.isDarkPage),
  isScenePage: Boolean(p.isScenePage),
  isCapsulePage: Boolean(p.isCapsulePage),
  isDedicationPage: Boolean(p.isDedicationPage),
  textTemplateEs: p.textTemplateEs || '',
  textTemplateEn: p.textTemplateEn || '',
  subtextEs: p.subtextEs || '',
  subtextEn: p.subtextEn || '',
  ageVariants: p.ageVariants || null,
}));
const blueprintOutPath = path.join(__dirname, 'backend', 'story_blueprint_24p.json');
fs.writeFileSync(blueprintOutPath, JSON.stringify(exportedPages, null, 2) + '\n', 'utf-8');
console.log('Synced 24p blueprint to backend/story_blueprint_24p.json (' + exportedPages.length + ' pages)');
