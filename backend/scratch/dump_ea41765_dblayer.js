const { execSync } = require('child_process');
const code = execSync('git show ea41765:backend/server.js', { maxBuffer: 15 * 1024 * 1024 }).toString();
const lines = code.split('\n');

function findSnippet(keyword) {
  console.log(`=== Matches for ${keyword} ===`);
  lines.forEach((l, idx) => {
    if (l.includes(keyword)) {
      console.log(`Line ${idx}: ${l}`);
      console.log(lines.slice(Math.max(0, idx - 2), idx + 15).join('\n'));
      console.log('---');
    }
  });
}

findSnippet('fetchAdminBackend');
findSnippet('getCategories');
