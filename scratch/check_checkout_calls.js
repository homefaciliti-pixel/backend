const fs = require('fs');

const code = fs.readFileSync('controllers/checkout.controller.js', 'utf8');

const calls = new Set();
const matches = code.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
for (const m of matches) {
  const name = m[1];
  if (!['if','for','while','switch','catch','function','async','require','console','Object','Array','String','Number','Math','JSON','Promise','res','req','next','process','setTimeout','setInterval','parseInt','parseFloat','isNaN','Boolean','Date'].includes(name)) {
    calls.add(name);
  }
}

const defined = new Set();
const defMatches = code.matchAll(/(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=|let\s+(\w+)\s*=/g);
for (const m of defMatches) defined.add(m[1] || m[2] || m[3]);
const reqMatches = code.matchAll(/\{\s*([^}]+)\s*\}\s*=\s*require/g);
for (const m of reqMatches) {
  m[1].split(',').forEach(s => defined.add(s.trim().split(':')[0].trim().replace(/\n/g,'')));
}

const missing = [...calls].filter(c => !defined.has(c));
console.log('Undefined calls in checkout.controller.js:');
console.log(missing.join(', '));
