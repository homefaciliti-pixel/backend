const fs = require('fs');
const content = fs.readFileSync('controllers/booking.controller.js', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(290, 360).join('\n'));
