const fs = require('fs');
const path = require('path');
const app = require('../app');

// 1. Read all original routes from server_backup_original.js
const code = fs.readFileSync(path.join(__dirname, '..', 'server_backup_original.js'), 'utf8');
const lines = code.split('\n');

const originalRoutes = [];
lines.forEach((line, i) => {
  const clean = line.replace(/\r/, '').trim();
  const m = clean.match(/^app\.(get|post|put|delete)\(([^,]+),/);
  if (m) {
    const method = m[1].toUpperCase();
    let rawPath = m[2].trim();
    if (rawPath.startsWith('[')) {
      const paths = rawPath.replace(/^\[/, '').replace(/\]$/, '').split(',').map(p => p.trim().replace(/^['"]|['"]$/g, ''));
      paths.forEach(p => originalRoutes.push({ line: i + 1, method, path: p }));
    } else {
      const p = rawPath.replace(/^['"]|['"]$/g, '');
      originalRoutes.push({ line: i + 1, method, path: p });
    }
  }
});

console.log('Total original routes to verify:', originalRoutes.length);

// 2. Test each route with Express router matching
function findMatchingRoute(method, testPath) {
  for (const layer of app._router.stack) {
    if (layer.route) {
      if (layer.route.methods[method.toLowerCase()]) {
        if (layer.route.path === testPath || (Array.isArray(layer.route.path) && layer.route.path.includes(testPath))) {
          return true;
        }
      }
    } else if (layer.name === 'router' && layer.handle.stack) {
      // Check prefix
      const matchPrefix = layer.regexp.test(testPath);
      if (matchPrefix) {
        let subPath = testPath;
        if (testPath.startsWith('/api/')) {
          subPath = testPath.substring(4);
        } else if (testPath === '/api') {
          subPath = '/';
        }
        for (const subLayer of layer.handle.stack) {
          if (subLayer.route) {
            if (subLayer.route.methods[method.toLowerCase()]) {
              const paths = Array.isArray(subLayer.route.path) ? subLayer.route.path : [subLayer.route.path];
              for (const p of paths) {
                const pRegex = new RegExp('^' + p.replace(/:[a-zA-Z0-9_]+/g, '[^/]+') + '$');
                if (p === subPath || pRegex.test(subPath)) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
  }
  return false;
}

let allPassed = true;
let missing = [];

originalRoutes.forEach(r => {
  const found = findMatchingRoute(r.method, r.path);
  if (!found) {
    allPassed = false;
    missing.push(r);
    console.log(`❌ MISSING: ${r.method} ${r.path} (from line ${r.line})`);
  } else {
    // console.log(`✓ MATCHED: ${r.method} ${r.path}`);
  }
});

if (allPassed) {
  console.log(`\n🎉 SUCCESS! All ${originalRoutes.length} original routes matched successfully!`);
} else {
  console.log(`\n⚠️ Missing ${missing.length} routes:`);
  console.log(missing);
}
