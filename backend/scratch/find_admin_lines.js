const fs = require('fs');
const backup = fs.readFileSync('server_backup_original.js', 'utf8');

const regex = /adminbackend|fetchAdminBackend/gi;
let m;
const lines = backup.split('\n');
const foundLines = new Set();
while ((m = regex.exec(backup)) !== null) {
  const lineNo = backup.slice(0, m.index).split('\n').length;
  foundLines.add(lineNo);
}

console.log('Found on lines:', [...foundLines].sort((a,b)=>a-b));
foundLines.forEach(l => {
  console.log(`Line ${l}: ${lines[l - 1].trim().slice(0, 100)}`);
});
