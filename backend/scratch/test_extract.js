const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'server_backup_original.js');
const code = fs.readFileSync(srcFile, 'utf8');
const lines = code.split('\n');

function L(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

function extractHandler(start, end) {
  let chunk = L(start, end).trim();
  const match = chunk.match(/(async\s*\([^\)]*\)\s*=>|\([^\)]*\)\s*=>|async\s+function|function\s*\()/);
  if (match) {
    chunk = chunk.substring(match.index).trim();
  }
  chunk = chunk.replace(/\);(\s*\/\/[^\n]*)?$/, ';');
  if (!chunk.endsWith(';')) chunk += ';';
  return chunk;
}

const h1 = 'const sendOtp = ' + extractHandler(2915, 2980);
console.log('sendOtp ends with:\n' + h1.slice(-50));

const h2 = 'const getAddresses = ' + extractHandler(7592, 7608);
console.log('getAddresses ends with:\n' + h2.slice(-50));
