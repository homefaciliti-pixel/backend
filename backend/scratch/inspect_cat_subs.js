const fs = require('fs');
const code = fs.readFileSync('controllers/category.controller.js', 'utf8');
const lines = code.split('\n');

const idx = lines.findIndex(l => l.includes('const getCategorySubcategories'));
console.log(lines.slice(idx, idx + 70).join('\n'));
