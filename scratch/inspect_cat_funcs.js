const fs = require('fs');
const code = fs.readFileSync('controllers/category.controller.js', 'utf8');
const lines = code.split('\n');

function printFunc(name) {
  const idx = lines.findIndex(l => l.includes(`const ${name}`) || l.includes(`function ${name}`));
  if (idx !== -1) {
    console.log(`=== ${name} (line ${idx + 1}) ===`);
    console.log(lines.slice(idx, idx + 60).join('\n'));
  }
}

printFunc('getCategorySubcategories');
printFunc('getSubcategories');
