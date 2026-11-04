const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env'});
mysql.createConnection({
  host: process.env.MYSQL_HOST, 
  user: process.env.MYSQL_USER, 
  password: process.env.MYSQL_PASSWORD, 
  database: process.env.MYSQL_DATABASE
}).then(async c => {
  console.log('Categories:', (await c.query('SELECT * FROM node_categories WHERE id=599 OR title="599"'))[0]);
  console.log('Trending:', (await c.query('SELECT * FROM trending_services WHERE id=599 OR title="599"').catch(e=>[[]]))[0]);
  process.exit(0);
});
