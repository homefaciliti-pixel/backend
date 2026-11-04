const { execSync } = require('child_process');
const code = execSync('git show ea41765:backend/server.js', { maxBuffer: 15 * 1024 * 1024 }).toString();
const lines = code.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('resolveDynamicCategoryImageUrl') || l.includes('getLocalCategoryAssetUrl') || l.includes('sanitizeServiceDbObj')) {
    console.log(`Line ${idx}: ${l}`);
    console.log(lines.slice(Math.max(0, idx - 2), idx + 20).join('\n'));
    console.log('---');
  }
});
