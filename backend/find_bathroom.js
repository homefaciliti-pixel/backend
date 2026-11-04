require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT || 3306
  });
  const [rows] = await conn.query("SELECT id, title, price, category_id FROM node_services WHERE title LIKE '%Bathroom%' OR title LIKE '%cleaning%'");
  console.log(rows);
  
  const [catRows] = await conn.query("SELECT id, title FROM node_categories WHERE title LIKE '%Bathroom%' OR title LIKE '%cleaning%'");
  console.log('Categories:', catRows);
  conn.end();
}
run().catch(console.error);
