const fs = require('fs');
const svcCode = fs.readFileSync('controllers/service.controller.js', 'utf8');
const lines = svcCode.split('\n');

function printFunc(name) {
  const idx = lines.findIndex(l => l.includes(`const ${name}`) || l.includes(`function ${name}`));
  if (idx !== -1) {
    console.log(`=== ${name} (around line ${idx + 1}) ===`);
    console.log(lines.slice(idx, idx + 80).join('\n'));
  }
}

printFunc('getAllServices');
printFunc('getCategoryServices');
printFunc('getTrendingServices');
