const fs = require('fs');
const code = fs.readFileSync('services/category.service.js', 'utf8');
const lines = code.split('\n');

console.log(lines.slice(240, 310).join('\n'));
