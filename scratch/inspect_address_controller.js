const fs = require('fs');
const content = fs.readFileSync('controllers/address.controller.js', 'utf8');
console.log(content);
