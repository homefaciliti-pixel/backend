const fs = require('fs');
const backup = fs.readFileSync('server_backup_original.js', 'utf8');

const idx = backup.indexOf('async function getAuthenticatedUser');
if (idx !== -1) {
  console.log(backup.slice(idx, idx + 1500));
}
