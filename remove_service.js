const fs = require('fs');

['database.json', 'database_seed.json'].forEach(file => {
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data && data.services) {
      const initialLen = data.services.length;
      data.services = data.services.filter(s => s.title !== 'Bathroom cleaning');
      if (data.services.length < initialLen) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        console.log(`Removed from ${file}`);
      }
    }
  }
});
