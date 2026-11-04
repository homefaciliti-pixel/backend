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
  const match = chunk.match(/(async\s*\(\s*req|\(\s*req|async\s+function|function\s*\()/);
  if (match) {
    chunk = chunk.substring(match.index).trim();
  }
  chunk = chunk.replace(/\);(\s*\/\/[^\n]*)?$/, ';');
  if (!chunk.endsWith(';')) chunk += ';';
  return chunk;
}

const chunk = extractHandler(6472, 6586);
console.log('Result for amc subscribe:');
console.log(chunk.slice(0, 80));
console.log('...');
console.log(chunk.slice(-60));
