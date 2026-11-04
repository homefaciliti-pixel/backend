const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { DEFAULT_CATEGORIES, STATIC_BOOKING_SLOTS, DB_FILE } = require('./constants');

let mysqlPool = null;
let mysqlReady = false;
let dbMode = "mysql";

async function initMySqlDb() {
  if (process.env.DB_MODE === 'json') {
    console.log("DB_MODE is set to json. Skipping MySQL initialization.");
    return false;
  }
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const port = process.env.MYSQL_PORT || 3306;

  if (!host || !user || !password || !database) {
    console.log("MySQL environment variables are incomplete. Skipping MySQL initialization.");
    return false;
  }

  try {
    console.log(`Attempting connection to MySQL at: ${host}:${port}...`);
    mysqlPool = mysql.createPool({
      host,
      user,
      password,
      database,
      port: parseInt(port),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,         // 5s timeout for fast failover on blocked/unreachable MySQL
      enableKeepAlive: true,        // Keep connections alive
      keepAliveInitialDelay: 10000, // Send keepalive after 10s of idle
    });

    const conn = await mysqlPool.getConnection();
    console.log("Successfully connected to MySQL. Creating tables if not exist...");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_users_v2 (
        phone VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) DEFAULT 'Hira',
        email VARCHAR(100) DEFAULT 'hira@hmail.com',
        location VARCHAR(255) DEFAULT '',
        locality VARCHAR(255) DEFAULT '',
        gender VARCHAR(20) DEFAULT 'Male',
        referralCode VARCHAR(50) NOT NULL,
        walletBalance DECIMAL(10,2) DEFAULT 0.00,
        countryCode VARCHAR(10) DEFAULT '+91',
        language VARCHAR(10) DEFAULT 'en'
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_orders_v2 (
        id INT PRIMARY KEY,
        userPhone VARCHAR(20) NOT NULL,
        serviceName VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        date VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        bookingStatus VARCHAR(50) DEFAULT 'searching',
        partnerName VARCHAR(100) DEFAULT NULL,
        partnerDistance VARCHAR(50) DEFAULT NULL,
        productId VARCHAR(100) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        timeSlot VARCHAR(100) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        payment TEXT DEFAULT NULL,
        razorpayOrderId VARCHAR(100) DEFAULT NULL,
        razorpayPaymentId VARCHAR(100) DEFAULT NULL,
        createdAt BIGINT NOT NULL,
        amcId VARCHAR(50) DEFAULT NULL,
        advancePayment DECIMAL(10,2) DEFAULT 199.00,
        remainingAmount DECIMAL(10,2) DEFAULT 0.00
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_referrals_applied_v2 (
        userPhone VARCHAR(20) PRIMARY KEY,
        referrerPhone VARCHAR(20) NOT NULL,
        appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_saved_cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userPhone VARCHAR(20) NOT NULL,
        cardHolderName VARCHAR(255) NOT NULL,
        cardNumber VARCHAR(50) NOT NULL,
        expiryDate VARCHAR(10) NOT NULL,
        cardType VARCHAR(20) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_addresses_v2 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userPhone VARCHAR(20) NOT NULL,
        type VARCHAR(50) DEFAULT 'Home',
        houseNo VARCHAR(100) DEFAULT '',
        society VARCHAR(255) DEFAULT '',
        floor VARCHAR(50) DEFAULT '',
        landmark VARCHAR(255) DEFAULT '',
        city VARCHAR(255) DEFAULT '',
        locality VARCHAR(255) DEFAULT '',
        pincode VARCHAR(20) DEFAULT '',
        latitude DECIMAL(10,8) DEFAULT NULL,
        longitude DECIMAL(11,8) DEFAULT NULL,
        name VARCHAR(255) DEFAULT '',
        alternateNumber VARCHAR(50) DEFAULT '',
        countryCode VARCHAR(10) DEFAULT '+91'
      )
    `);

    // Schema migrations for name and alternateNumber columns
    try {
      await conn.query("ALTER TABLE node_addresses_v2 ADD COLUMN name VARCHAR(255) DEFAULT ''");
    } catch (err) {
      // Column might already exist
    }
    try {
      await conn.query("ALTER TABLE node_addresses_v2 ADD COLUMN alternateNumber VARCHAR(50) DEFAULT ''");
    } catch (err) {
      // Column might already exist
    }
    try {
      await conn.query("ALTER TABLE node_addresses_v2 ADD COLUMN countryCode VARCHAR(10) DEFAULT '+91'");
    } catch (err) {
      // Column might already exist
    }
    try {
      await conn.query("ALTER TABLE node_orders_v2 ADD COLUMN items TEXT DEFAULT NULL");
    } catch (err) {
      // Column might already exist
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_categories_v2 (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        image VARCHAR(255) DEFAULT ''
      )
    `);

    const [rows] = await conn.query("SELECT COUNT(*) as count FROM node_categories_v2");
    if (rows[0].count === 0) {
      console.log("Seeding default categories in MySQL...");
      for (const cat of DEFAULT_CATEGORIES) {
        await conn.query(
          "INSERT INTO node_categories_v2 (id, name, image) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), image=VALUES(image)",
          [cat.id, cat.name, cat.image]
        );
      }
    } else {
      for (const cat of DEFAULT_CATEGORIES) {
        await conn.query(
          "INSERT INTO node_categories_v2 (id, name, image) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE image=VALUES(image)",
          [cat.id, cat.name, cat.image]
        );
      }
    }

    // Ensure Categories table exists (matching Admin Panel schema)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        parent VARCHAR(255) NOT NULL DEFAULT 'None',
        image VARCHAR(500) NOT NULL DEFAULT '',
        status TINYINT(1) NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Seed default categories into the categories table if empty
    const [catCountRows] = await conn.query("SELECT COUNT(*) as count FROM node_categories");
    if (catCountRows[0].count === 0) {
      console.log("Seeding default categories in MySQL node_categories table...");
      for (const cat of DEFAULT_CATEGORIES) {
        await conn.query(
          "INSERT INTO node_categories (title, parent, image, status) VALUES (?, 'None', ?, 1)",
          [cat.name, cat.image]
        );
      }
    }


    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_contacts_v2 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) DEFAULT '',
        message TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userPhone VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type VARCHAR(10) NOT NULL,
        description VARCHAR(255) DEFAULT NULL,
        senderName VARCHAR(255) DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    try {
      await conn.query("ALTER TABLE node_wallet_transactions ADD COLUMN senderName VARCHAR(255) DEFAULT NULL");
    } catch (err) {
      // Column might already exist
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_amc_subscriptions (
        amcId VARCHAR(50) PRIMARY KEY,
        userPhone VARCHAR(20) NOT NULL,
        category VARCHAR(100) NOT NULL,
        areaSqFt INT NOT NULL,
        floors INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        startDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        endDate TIMESTAMP NOT NULL,
        photoUrl VARCHAR(500) DEFAULT NULL,
        pdfUrl VARCHAR(500) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    try {
      await conn.query("ALTER TABLE node_amc_subscriptions ADD COLUMN photoUrl VARCHAR(500) DEFAULT NULL");
    } catch (err) { /* Column might already exist */ }
    try {
      await conn.query("ALTER TABLE node_amc_subscriptions ADD COLUMN pdfUrl VARCHAR(500) DEFAULT NULL");
    } catch (err) { /* Column might already exist */ }
    try {
      await conn.query("ALTER TABLE node_amc_subscriptions ADD COLUMN note TEXT DEFAULT NULL");
    } catch (err) { /* Column might already exist */ }
    try {
      await conn.query("ALTER TABLE node_amc_subscriptions ADD COLUMN fileUrl VARCHAR(500) DEFAULT NULL");
    } catch (err) { /* Column might already exist */ }
    try {
      await conn.query("ALTER TABLE node_amc_subscriptions ADD COLUMN razorpayOrderId VARCHAR(100) DEFAULT NULL");
    } catch (err) { /* Column might already exist */ }
    try {
      await conn.query("ALTER TABLE node_amc_subscriptions ADD COLUMN razorpayPaymentId VARCHAR(100) DEFAULT NULL");
    } catch (err) { /* Column might already exist */ }

    try {
      await conn.query("ALTER TABLE node_orders_v2 ADD COLUMN amcId VARCHAR(50) DEFAULT NULL");
    } catch (err) {
      // Column might already exist
    }

    try {
      await conn.query("ALTER TABLE node_orders_v2 ADD COLUMN advancePayment DECIMAL(10,2) DEFAULT 199.00");
    } catch (err) {
      // Column might already exist
    }

    try {
      await conn.query("ALTER TABLE node_orders_v2 ADD COLUMN remainingAmount DECIMAL(10,2) DEFAULT 0.00");
    } catch (err) {
      // Column might already exist
    }

    try {
      await conn.query("ALTER TABLE node_orders_v2 ADD COLUMN cancelReason VARCHAR(500) DEFAULT NULL");
    } catch (err) {
      // Column might already exist
    }

    try {
      await conn.query("ALTER TABLE node_users_v2 ADD COLUMN language VARCHAR(10) DEFAULT 'en'");
    } catch (err) {
      // Column might already exist
    }

    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS node_cart (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userPhone VARCHAR(20) NOT NULL,
          productId VARCHAR(100) NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_product (userPhone, productId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } catch (err) {
      console.log("Could not create node_cart table:", err.message);
    }

    // Sync database slots table with 11 hourly slots
    const targetSlots = STATIC_BOOKING_SLOTS.map(s => s.time);
    try {
      const [slotRows] = await conn.query("SELECT * FROM slots ORDER BY id ASC");
      let needSync = false;
      if (slotRows.length !== targetSlots.length) {
        needSync = true;
      } else {
        for (let i = 0; i < targetSlots.length; i++) {
          if (slotRows[i].slot_time !== targetSlots[i]) {
            needSync = true;
            break;
          }
        }
      }

      if (needSync) {
        console.log("Syncing database slots table with 11 slots (9:00 AM to 8:00 PM)...");
        await conn.query("DELETE FROM slots");
        await conn.query("ALTER TABLE slots AUTO_INCREMENT = 1");
        for (const st of targetSlots) {
          await conn.query("INSERT INTO slots (slot_time) VALUES (?)", [st]);
        }
      }
    } catch (slotErr) {
      console.log("Could not sync slots table:", slotErr.message);
    }

    // Auto-delete services requested by user
    try {
      await conn.query("DELETE FROM node_services WHERE title IN ('AC Gas Charging', 'Bike', 'Hair Coloring', 'Hair Cut', 'Furniture Repair')");
      console.log("[Migration] Successfully removed targeted services from node_services table");
    } catch (dbErr) {
      console.log("Could not auto-delete target services:", dbErr.message);
    }


    // Create and seed node_app_version table
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS node_app_version (
          platform VARCHAR(20) PRIMARY KEY,
          latestVersion VARCHAR(20) NOT NULL,
          minSupportedVersion VARCHAR(20) NOT NULL,
          forceUpdate TINYINT(1) DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      const [versionCountRows] = await conn.query("SELECT COUNT(*) as count FROM node_app_version");
      if (versionCountRows[0].count === 0) {
        console.log("Seeding default app versions in MySQL node_app_version table...");
        await conn.query("INSERT INTO node_app_version (platform, latestVersion, minSupportedVersion, forceUpdate) VALUES (?, ?, ?, ?)", ['android', '1.0.2', '1.0.2', 1]);
        await conn.query("INSERT INTO node_app_version (platform, latestVersion, minSupportedVersion, forceUpdate) VALUES (?, ?, ?, ?)", ['ios', '1.0.3', '1.0.3', 1]);
      } else {
        // Enforce Android version to 1.0.2 and update forceUpdate
        await conn.query("UPDATE node_app_version SET latestVersion = '1.0.2', minSupportedVersion = '1.0.2', forceUpdate = 1 WHERE platform = 'android'");
        await conn.query("UPDATE node_app_version SET forceUpdate = 1 WHERE platform = 'ios'");
      }
    } catch (verErr) {
      console.log("Could not initialize node_app_version table:", verErr.message);
    }

    try {
      await conn.query("UPDATE node_users_v2 SET walletBalance = 2000.00 WHERE (phone LIKE '%7799666101%' OR phone LIKE '%7799666101') AND (walletBalance IS NULL OR walletBalance < 2000.00)");
      console.log("[Migration] Ensured wallet balance of 2000.00 for user 7799666101");
    } catch (wErr) {
      console.log("Could not auto-update wallet balance for 7799666101:", wErr.message);
    }

    conn.release();
    console.log("MySQL database setup complete. Running in MySQL mode.");
    dbMode = "mysql";
    mysqlReady = true;
    return true;
  } catch (err) {
    console.error("Failed to connect to MySQL on startup. Falling back:", err.message);
    mysqlPool = null;
    mysqlReady = false;
    return false;
  }
}

// Retry wrapper for MySQL initialization (fast 1-attempt check to prevent hanging Render cold start)
async function initMySqlDbWithRetry(maxRetries = 1) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`MySQL connection attempt ${attempt}/${maxRetries}...`);
    const success = await initMySqlDb();
    if (success) return true;
  }
  console.error(`MySQL connection unreachable/timed out. Running in JSON database mode.`);
  dbMode = "json";
  mysqlReady = false;
  return false;
}

function initJsonDb() {
  const seedFile = path.join(__dirname, 'database_seed.json');
  let seedData = null;
  if (fs.existsSync(seedFile)) {
    try {
      seedData = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
    } catch (e) {
      console.warn("Failed to parse database_seed.json:", e.message);
    }
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDb = seedData || { users: {}, orders: [], referralsApplied: {}, categories: DEFAULT_CATEGORIES, addresses: [], contacts: [], cart: [], services: [], banners: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
  } else {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(content);
      let changed = false;
      if (!parsed.addresses) {
        parsed.addresses = [];
        changed = true;
      }
      if (!parsed.contacts) {
        parsed.contacts = [];
        changed = true;
      }
      
      if (seedData) {
        if (seedData.categories && seedData.categories.length > 0) {
          parsed.categories = seedData.categories;
          changed = true;
        }
        if (seedData.services && seedData.services.length > 0) {
          parsed.services = seedData.services;
          changed = true;
        }
        if (seedData.banners && seedData.banners.length > 0) {
          parsed.banners = seedData.banners;
          changed = true;
        }
      } else {
        if (!parsed.categories) {
          parsed.categories = DEFAULT_CATEGORIES;
          changed = true;
        } else {
          // Migration: Update names and images if they are outdated in JSON db
          parsed.categories = parsed.categories.map(c => {
            if (c.name === "Cleaning Services" || c.name === "clening" || c.id === "clening") {
              c.name = "Cleaning";
              c.id = "cleaning";
              c.image = "/assets/categories/cleaning.png";
              changed = true;
            }
            const defaultMatch = DEFAULT_CATEGORIES.find(dc => dc.id === c.id);
            if (defaultMatch && c.image !== defaultMatch.image) {
              c.image = defaultMatch.image;
              changed = true;
            }
            return c;
          });
        }
      }

      if (!parsed.appVersion) {
        parsed.appVersion = {
          android: { latestVersion: "1.0.2", minSupportedVersion: "1.0.2", forceUpdate: true },
          ios: { latestVersion: "1.0.3", minSupportedVersion: "1.0.3", forceUpdate: true }
        };
        changed = true;
      }
      if (!parsed.cart) {
        parsed.cart = [];
        changed = true;
      }
      if (!parsed.services) {
        parsed.services = [];
        changed = true;
      }
      if (!parsed.banners) {
        parsed.banners = [];
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.error("Failed to parse or update DB file:", e.message);
    }
  }
}

module.exports = {
  getMysqlPool: () => mysqlPool,
  getMysqlReady: () => mysqlReady,
  setMysqlReady: (val) => { mysqlReady = val; },
  getDbMode: () => dbMode,
  setDbMode: (val) => { dbMode = val; },
  initMySqlDb,
  initMySqlDbWithRetry,
  initJsonDb
};
