const fs = require('fs');
const backup = fs.readFileSync('server_backup_original.js', 'utf8');

const idx = backup.indexOf("res.json({\n      success: true,\n      orderId: order.id");
if (idx !== -1) {
  console.log('Found res.json in server_backup_original.js:');
  console.log(backup.slice(idx, idx + 2000));
} else {
  // search for orderId: order.id
  const idx2 = backup.indexOf('orderId: order.id');
  if (idx2 !== -1) {
    console.log('Found at idx2:');
    console.log(backup.slice(idx2 - 100, idx2 + 1500));
  }
}
