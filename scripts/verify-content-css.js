const fs = require('node:fs');
const path = require('node:path');

const manifestPath = path.resolve(
  process.argv[2] || path.join('build', 'chrome-mv3-prod', 'manifest.json')
);

if (!fs.existsSync(manifestPath)) {
  console.error(`[verify-content-css] Manifest not found: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const contentScripts = Array.isArray(manifest.content_scripts) ? manifest.content_scripts : [];
const injectedCss = contentScripts.flatMap((entry, index) =>
  (entry.css || []).map((cssFile) => `content_scripts[${index}]: ${cssFile}`)
);

if (injectedCss.length > 0) {
  console.error('[verify-content-css] Content scripts must not inject CSS into host pages:');
  injectedCss.forEach((cssFile) => console.error(`  - ${cssFile}`));
  process.exit(1);
}

console.log('[verify-content-css] Passed: content scripts do not inject CSS.');
