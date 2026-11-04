const { execSync } = require('child_process');
const code = execSync('git show ea41765:backend/server.js', { maxBuffer: 15 * 1024 * 1024 }).toString();
const lines = code.split('\n');
const startIdx = lines.findIndex(l => l.includes("app.get('/api/categories'"));
const endIdx = lines.findIndex((l, idx) => idx > startIdx && l.includes("app.post('/api/categories'"));
console.log(`Lines ${startIdx} to ${endIdx}:`);
console.log(lines.slice(startIdx, endIdx).join('\n'));
