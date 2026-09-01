const mysql = require('mysql2/promise');

let pool = null;

function setPool(mysqlPool) {
  pool = mysqlPool;
}

function getPool() {
  return pool;
}

const Translation = {
  async createTable() {
    const p = getPool();
    if (!p) return;
    try {
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
          kn TEXT DEFAULT NULL,
          ml TEXT DEFAULT NULL,
          pa TEXT DEFAULT NULL,
          \`or\` TEXT DEFAULT NULL,
          \`as\` TEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    } catch (err) {
      console.warn("[Translation.createTable] Failed:", err.message);
    }
  },

  async getAll() {
    const p = getPool();
    if (!p) return [];
    try {
      const [rows] = await p.query("SELECT * FROM translations");
      return rows;
    } catch (err) {
      console.warn("[Translation.getAll] Failed:", err.message);
      return [];
    }
  },

  async getByKey(key) {
    const p = getPool();
    if (!p) return null;
    try {
      const [rows] = await p.query("SELECT * FROM translations WHERE translation_key = ?", [key]);
      return rows[0] || null;
    } catch (err) {
      console.warn("[Translation.getByKey] Failed:", err.message);
      return null;
    }
  },

  async upsert(key, data) {
    const p = getPool();
    if (!p) return;
    const columns = Object.keys(data);
    const values = Object.values(data);
    if (columns.length === 0) return;
    
    const updateClause = columns.map(col => `\`${col}\` = VALUES(\`${col}\`)`).join(', ');
    
    try {
      await p.query(`
        INSERT INTO translations (translation_key, ${columns.map(c => `\`${c}\``).join(', ')})
        VALUES (?, ${columns.map(() => '?').join(', ')})
        ON DUPLICATE KEY UPDATE ${updateClause}
      `, [key, ...values]);
    } catch (err) {
      console.warn("[Translation.upsert] Failed:", err.message);
    }
  },

  async getUserLanguage(phone) {
    const p = getPool();
    if (!p) return null;
    try {
      const [rows] = await p.query("SELECT language FROM node_users_v2 WHERE phone = ?", [phone]);
      return rows[0] ? rows[0].language : null;
    } catch (err) {
      console.warn("Failed to get user language from DB:", err.message);
      return null;
    }
  }
};

module.exports = { Translation, setPool };
