const fs = require('fs');
const content = fs.readFileSync('controllers/checkout.controller.js', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(850, 900).join('\n'));
