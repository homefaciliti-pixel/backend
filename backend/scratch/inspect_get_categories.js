const fs = require('fs');
const catCode = fs.readFileSync('controllers/category.controller.js', 'utf8');
const lines = catCode.split('\n');

const idx = lines.findIndex(l => l.includes('const getCategories') || l.includes('function getCategories'));
console.log(lines.slice(idx + 240, idx + 350).join('\n'));
