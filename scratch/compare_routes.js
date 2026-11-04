const fs = require('fs');
const backup = fs.readFileSync('server_backup_original.js', 'utf8');
const lines = backup.split('\n');

function printRange(start, count) {
  console.log(`=== LINES ${start} to ${start + count} ===`);
  console.log(lines.slice(start - 1, start + count).join('\n'));
}

printRange(4530, 60);
printRange(4660, 40);
printRange(5075, 40);
