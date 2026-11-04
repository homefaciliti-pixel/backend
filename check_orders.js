const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env'});
mysql.createConnection({
  host: process.env.MYSQL_HOST, 
  user: process.env.MYSQL_USER, 
  password: process.env.MYSQL_PASSWORD, 
  database: process.env.MYSQL_DATABASE
}).then(async c => {
  console.log((await c.query('SELECT id, product_id, service_name, price FROM node_orders ORDER BY created_at DESC LIMIT 5'))[0]);
  process.exit(0);
}).catch(e=>console.log(e.message));
