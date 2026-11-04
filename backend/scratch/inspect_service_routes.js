const fs = require('fs');
const backup = fs.readFileSync('server_backup_original.js', 'utf8');

const lines = backup.split('\n');
console.log('Total lines in backup:', lines.length);

lines.forEach((line, idx) => {
  if (/app\.(get|post)\s*\(\s*['"](\/api\/(services|categories))/.test(line)) {
    console.log(`Line ${idx + 1}: ${line.trim().slice(0, 80)}`);
  }
});
