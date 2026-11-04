const { execSync } = require('child_process');
const code = execSync('git show ea41765:backend/server.js', { maxBuffer: 15 * 1024 * 1024 }).toString();
const lines = code.split('\n');
const idx = lines.findIndex(l => l.includes("app.get('/api/categories'"));
console.log("Found at line " + idx);
console.log(lines.slice(idx - 5, idx + 80).join('\n'));
