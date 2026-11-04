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
  const [rows] = await conn.query("SELECT * FROM node_services WHERE price = '599' OR price = 599 OR title LIKE '%Bathroom%'");
  console.log(rows);
  conn.end();
}
run().catch(console.error);
