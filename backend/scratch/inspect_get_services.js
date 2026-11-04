const fs = require('fs');

const svcCode = fs.readFileSync('controllers/service.controller.js', 'utf8');
const catCode = fs.readFileSync('controllers/category.controller.js', 'utf8');

console.log('--- service.controller.js: uses fetchAdminBackendServices?');
console.log(svcCode.includes('fetchAdminBackendServices'));

console.log('--- category.controller.js: uses fetchAdminBackendServices?');
console.log(catCode.includes('fetchAdminBackendServices'));

// Let's check getServices in service.controller.js
const lines = svcCode.split('\n');
lines.forEach((l, i) => {
  if (l.includes('const getServices') || l.includes('function getServices')) {
    console.log('getServices at line', i + 1);
    console.log(lines.slice(i, i + 50).join('\n'));
  }
});
