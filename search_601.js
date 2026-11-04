const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env'});
mysql.createConnection({
  host: process.env.MYSQL_HOST, 
  user: process.env.MYSQL_USER, 
  password: process.env.MYSQL_PASSWORD, 
  database: process.env.MYSQL_DATABASE
}).then(async c => { 
  const [tables] = await c.query('SHOW TABLES'); 
  for(let t of tables) { 
    const tableName = Object.values(t)[0]; 
    const [cols] = await c.query(`DESCRIBE ${tableName}`); 
    for (let col of cols) { 
      try { 
        const [rows] = await c.query(`SELECT * FROM ${tableName} WHERE ${col.Field} = '601' OR ${col.Field} = 601`); 
        if (rows.length > 0) { 
          console.log(`Found 601 in table ${tableName}, column ${col.Field}`); 
          console.log(rows); 
        } 
      } catch(e) {} 
    } 
  } 
  process.exit(0); 
}).catch(e=>console.log(e.message));
