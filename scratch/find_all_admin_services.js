const fs = require('fs');
const backup = fs.readFileSync('server_backup_original.js', 'utf8');

const regex = /fetchAdminBackendServices/g;
let m;
while ((m = regex.exec(backup)) !== null) {
  // get line number
  const lineNo = backup.slice(0, m.index).split('\n').length;
  console.log(`Line ${lineNo}:`);
  console.log(backup.slice(Math.max(0, m.index - 100), Math.min(backup.length, m.index + 250)));
  console.log('----------------------------------------------------');
}
