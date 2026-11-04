const fs = require('fs');
const content = fs.readFileSync('controllers/checkout.controller.js', 'utf8');
const lines = content.split('\n');

const idx = lines.findIndex(l => l.includes('const handleGetCheckout') || l.includes('function handleGetCheckout'));
console.log(lines.slice(idx + 650, idx + 800).join('\n'));
