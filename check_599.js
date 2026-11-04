const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env'});
mysql.createConnection({
  host: process.env.MYSQL_HOST, 
  user: process.env.MYSQL_USER, 
  password: process.env.MYSQL_PASSWORD, 
  database: process.env.MYSQL_DATABASE
}).then(c => c.query('SELECT * FROM node_services WHERE title="599" OR id=599')
  .then(([rows]) => { console.log(rows); process.exit(0); })
  .catch(e=>console.log(e.message)));
