const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');
const routes = [];
lines.forEach((line, i) => {
  if (/app\.(get|post|put|delete|patch)\s*\(/.test(line)) {
    routes.push((i+1) + ': ' + line.trim().substring(0, 120));
  }
});
console.log('Total routes found:', routes.length);
routes.forEach(r => console.log(r));
