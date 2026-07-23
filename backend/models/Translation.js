const mysql = require('mysql2/promise');

let pool = null;

function setPool(mysqlPool) {
  pool = mysqlPool;
}

function getPool() {
  if (!pool) {
    // Fallback: create a new pool using environment variables
    const host = process.env.MYSQL_HOST;
    const user = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD;
    const database = process.env.MYSQL_DATABASE;
    const port = process.env.MYSQL_PORT || 3306;
    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port: parseInt(port),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });
  }
  return pool;
}

const Translation = {
  async createTable() {
    const p = getPool();
    await p.query(`
      CREATE TABLE IF NOT EXISTS translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        translation_key VARCHAR(100) UNIQUE NOT NULL,
        en TEXT DEFAULT NULL,
        hi TEXT DEFAULT NULL,
        mr TEXT DEFAULT NULL,
        gu TEXT DEFAULT NULL,
        bn TEXT DEFAULT NULL,
        ta TEXT DEFAULT NULL,
        te TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  },

  async getAll() {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM translations");
    return rows;
  },

  async getByKey(key) {
    const p = getPool();
    const [rows] = await p.query("SELECT * FROM translations WHERE translation_key = ?", [key]);
    return rows[0] || null;
  },

  async upsert(key, data) {
    const p = getPool();
    const columns = Object.keys(data);
    const values = Object.values(data);
    if (columns.length === 0) return;
    
    const updateClause = columns.map(col => `${col} = VALUES(${col})`).join(', ');
    
    await p.query(`
      INSERT INTO translations (translation_key, ${columns.join(', ')})
      VALUES (?, ${columns.map(() => '?').join(', ')})
      ON DUPLICATE KEY UPDATE ${updateClause}
    `, [key, ...values]);
  }
};

module.exports = { Translation, setPool };
