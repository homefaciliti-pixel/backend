const mysql = require('mysql2/promise');
require('dotenv').config({path: '../.env'});

async function run() {
  const c = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
  
  await c.query("INSERT IGNORE INTO node_categories (id, title, image, status) VALUES (37, 'Spa', '/assets/icons/spa.png', 1)");
  console.log('Inserted Spa into categories');
  process.exit(0);
}
run();
