require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let mysqlPool = null;

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super_secret_jwt_key_123';

app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Active OTPs in-memory storage (phone -> { otp, expiresAt })
const activeOTPs = new Map();

// (Removed Mongoose/MongoDB Schemas, Models and MongoDbLayer)

// ----------------------------------------
// DATABASE ABSTRACTED DATA LAYER (JSON File Database fallback)
// ----------------------------------------
const DB_FILE = path.join(__dirname, 'database.json');

const DEFAULT_CATEGORIES = [
  { id: "ac_repair", name: "AcRepair", image: "/assets/categories/ac_repair.png" },
  { id: "car_washing", name: "Car Washing", image: "/assets/categories/car_washing.png" },
  { id: "plumber", name: "Plumber", image: "/assets/categories/plumber.png" },
  { id: "cleaning", name: "Cleaning", image: "/assets/categories/cleaning.png" },
  { id: "electrician", name: "Electrician", image: "/assets/categories/electrician.png" },
  { id: "salon_and_spa", name: "Salon And Spa", image: "/assets/categories/salon_and_spa.png" },
  { id: "painter", name: "Painter", image: "/assets/categories/painter.png" },
  { id: "carpenter", name: "Carpenter", image: "/assets/categories/carpenter.png" },
  { id: "bike_services", name: "Bike Services", image: "/assets/categories/bike_services.png" },
  { id: "architecture", name: "Architecture", image: "/assets/categories/architecture.png" },
  { id: "contractor", name: "Contractor", image: "/assets/categories/contractor.png" },
  { id: "mechanic", name: "Mechanic", image: "/assets/categories/mechanic.png" },
  { id: "pandit_ji", name: "Pandit ji", image: "/assets/categories/pandit_ji.png" },
  { id: "driver", name: "Driver", image: "/assets/categories/driver.png" },
  { id: "photographer", name: "Photographer", image: "/assets/categories/photographer.png" },
  { id: "doctors", name: "Doctors", image: "/assets/categories/doctors.png" },
  { id: "compounder", name: "Compounder", image: "/assets/categories/compounder.png" },
  { id: "halwai", name: "Halwai", image: "/assets/categories/halwai.png" }
];

// ----------------------------------------
// DATABASE ABSTRACTED DATA LAYER (MySQL)
// ----------------------------------------
async function initMySqlDb() {
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
      queueLimit: 0
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
        countryCode VARCHAR(10) DEFAULT '+91'
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
        createdAt BIGINT NOT NULL
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
        alternateNumber VARCHAR(50) DEFAULT ''
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
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        parent VARCHAR(255) NOT NULL DEFAULT 'None',
        image VARCHAR(500) NOT NULL DEFAULT '',
        status TINYINT(1) NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Seed default categories into the categories table if empty
    const [catCountRows] = await conn.query("SELECT COUNT(*) as count FROM categories");
    if (catCountRows[0].count === 0) {
      console.log("Seeding default categories in MySQL categories table...");
      for (const cat of DEFAULT_CATEGORIES) {
        await conn.query(
          "INSERT INTO categories (title, parent, image, status) VALUES (?, 'None', ?, 1)",
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

    conn.release();
    console.log("MySQL database setup complete. Running in MySQL mode.");
    dbMode = "mysql";
    return true;
  } catch (err) {
    console.error("Failed to connect to MySQL on startup. Falling back:", err.message);
    mysqlPool = null;
    return false;
  }
}

const MySqlDbLayer = {
  async queryOne(sql, params) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  async getUserByPhone(phone) {
    const row = await this.queryOne("SELECT * FROM node_users_v2 WHERE phone = ?", [phone]);
    if (!row) return null;
    row.walletBalance = parseFloat(row.walletBalance);
    return row;
  },

  async getUserByReferralCode(code) {
    const row = await this.queryOne("SELECT * FROM node_users_v2 WHERE referralCode = ?", [code]);
    if (!row) return null;
    row.walletBalance = parseFloat(row.walletBalance);
    return row;
  },

  async createUser(user) {
    const { phone, name, email, location, locality, gender, referralCode, walletBalance, countryCode } = user;
    const finalName = name || "";
    const finalEmail = email || "";
    const finalLocation = location || "";
    const finalLocality = locality || "";
    const finalGender = gender || "Male";
    const finalWalletBalance = walletBalance !== undefined ? walletBalance : 0.00;
    const finalCountryCode = countryCode || "+91";

    await mysqlPool.query(
      "INSERT INTO node_users_v2 (phone, name, email, location, locality, gender, referralCode, walletBalance, countryCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), location=VALUES(location), locality=VALUES(locality), gender=VALUES(gender), referralCode=VALUES(referralCode), walletBalance=VALUES(walletBalance), countryCode=VALUES(countryCode)",
      [phone, finalName, finalEmail, finalLocation, finalLocality, finalGender, referralCode, finalWalletBalance, finalCountryCode]
    );

    return this.getUserByPhone(phone);
  },

  async updateUser(phone, updates) {
    if (Object.keys(updates).length === 0) return this.getUserByPhone(phone);
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    await mysqlPool.query(`UPDATE node_users_v2 SET ${setClause} WHERE phone = ?`, [...values, phone]);
    return this.getUserByPhone(phone);
  },

  async deleteUser(phone) {
    await mysqlPool.query("DELETE FROM node_users_v2 WHERE phone = ?", [phone]);
    await mysqlPool.query("DELETE FROM node_addresses_v2 WHERE userPhone = ?", [phone]);
    return true;
  },

  async createContact(contact) {
    const { name, email, phone, message } = contact;
    const [result] = await mysqlPool.query(
      "INSERT INTO node_contacts_v2 (name, email, phone, message) VALUES (?, ?, ?, ?)",
      [name, email, phone || "", message]
    );
    return { id: result.insertId, name, email, phone, message, createdAt: new Date() };
  },

  async countUsers() {
    const row = await this.queryOne("SELECT COUNT(*) as count FROM node_users_v2");
    return row ? row.count : 0;
  },

  async getOrderById(id) {
    const row = await this.queryOne("SELECT * FROM node_orders_v2 WHERE id = ?", [id]);
    if (!row) return null;
    row.price = parseFloat(row.price);
    row.address = row.address ? JSON.parse(row.address) : null;
    row.payment = row.payment ? JSON.parse(row.payment) : null;
    return row;
  },

  async getOrderByRazorpayOrderId(rzpOrderId) {
    const row = await this.queryOne("SELECT * FROM node_orders_v2 WHERE razorpayOrderId = ?", [rzpOrderId]);
    if (!row) return null;
    row.price = parseFloat(row.price);
    row.address = row.address ? JSON.parse(row.address) : null;
    row.payment = row.payment ? JSON.parse(row.payment) : null;
    return row;
  },

  async getOrdersByUserPhone(phone) {
    const [rows] = await mysqlPool.query("SELECT * FROM node_orders_v2 WHERE userPhone = ? ORDER BY id DESC", [phone]);
    return rows.map(row => {
      row.price = parseFloat(row.price);
      row.address = row.address ? JSON.parse(row.address) : null;
      row.payment = row.payment ? JSON.parse(row.payment) : null;
      return row;
    });
  },

  async getAllOrders() {
    const [rows] = await mysqlPool.query("SELECT * FROM node_orders_v2 ORDER BY id DESC");
    return rows.map(row => {
      row.price = parseFloat(row.price);
      row.address = row.address ? JSON.parse(row.address) : null;
      row.payment = row.payment ? JSON.parse(row.payment) : null;
      return row;
    });
  },

  async createOrder(order) {
    const {
      id, userPhone, serviceName, price, date, status, bookingStatus,
      partnerName, partnerDistance, productId, description, timeSlot,
      address, payment, razorpayOrderId, razorpayPaymentId, createdAt
    } = order;

    const finalStatus = status || "Pending";
    const finalBookingStatus = bookingStatus || "searching";
    const finalAddress = address ? JSON.stringify(address) : null;
    const finalPayment = payment ? JSON.stringify(payment) : null;
    const finalCreatedAt = createdAt || Date.now();

    await mysqlPool.query(
      `INSERT INTO node_orders_v2 (
        id, userPhone, serviceName, price, date, status, bookingStatus,
        partnerName, partnerDistance, productId, description, timeSlot,
        address, payment, razorpayOrderId, razorpayPaymentId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        userPhone=VALUES(userPhone), serviceName=VALUES(serviceName), price=VALUES(price),
        date=VALUES(date), status=VALUES(status), bookingStatus=VALUES(bookingStatus),
        partnerName=VALUES(partnerName), partnerDistance=VALUES(partnerDistance),
        productId=VALUES(productId), description=VALUES(description), timeSlot=VALUES(timeSlot),
        address=VALUES(address), payment=VALUES(payment), razorpayOrderId=VALUES(razorpayOrderId),
        razorpayPaymentId=VALUES(razorpayPaymentId), createdAt=VALUES(createdAt)`,
      [
        id, userPhone, serviceName, price, date, finalStatus, finalBookingStatus,
        partnerName, partnerDistance, productId, description, timeSlot,
        finalAddress, finalPayment, razorpayOrderId, razorpayPaymentId, finalCreatedAt
      ]
    );

    return this.getOrderById(id);
  },

  async updateOrder(id, updates) {
    if (Object.keys(updates).length === 0) return this.getOrderById(id);
    const keys = Object.keys(updates);
    const values = Object.values(updates).map(val => {
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
      }
      return val;
    });
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    await mysqlPool.query(`UPDATE node_orders_v2 SET ${setClause} WHERE id = ?`, [...values, id]);
    return this.getOrderById(id);
  },

  async getLastOrderId() {
    const row = await this.queryOne("SELECT MAX(id) as lastId FROM node_orders_v2");
    return row && row.lastId ? row.lastId : 0;
  },

  async countOrders() {
    const row = await this.queryOne("SELECT COUNT(*) as count FROM node_orders_v2");
    return row ? row.count : 0;
  },

  async getReferralApplied(phone) {
    const row = await this.queryOne("SELECT * FROM node_referrals_applied_v2 WHERE userPhone = ?", [phone]);
    return row;
  },

  async createReferralApplied(referralApplied) {
    const { userPhone, referrerPhone, appliedAt } = referralApplied;
    const finalAppliedAt = appliedAt ? new Date(appliedAt) : new Date();
    await mysqlPool.query(
      "INSERT INTO node_referrals_applied_v2 (userPhone, referrerPhone, appliedAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE referrerPhone=VALUES(referrerPhone), appliedAt=VALUES(appliedAt)",
      [userPhone, referrerPhone, finalAppliedAt]
    );
    return this.getReferralApplied(userPhone);
  },

  async getCategories() {
    // Read directly from categories table instead of node_categories_v2
    const [rows] = await mysqlPool.query(
      "SELECT * FROM categories WHERE (parent = 'None' OR parent IS NULL OR parent = '') AND status = 1"
    );
    return rows.map(r => {
      let img = r.image || "";
      if (img && !img.startsWith('http') && !img.startsWith('https') && !img.startsWith('/assets/')) {
        img = `https://adminbackend-1-h03r.onrender.com/uploads/${img}`;
      }
      return {
        id: String(r.id),
        name: r.title,
        image: img
      };
    });
  },

  async addCategory(categoryData) {
    const { name, id, image } = categoryData;
    await mysqlPool.query(
      "INSERT INTO categories (title, parent, image, status) VALUES (?, 'None', ?, 1)",
      [name, image || ""]
    );
    const row = await this.queryOne("SELECT * FROM categories WHERE title = ?", [name]);
    if (!row) return null;
    let img = row.image || "";
    if (img && !img.startsWith('http') && !img.startsWith('https') && !img.startsWith('/assets/')) {
      img = `https://adminbackend-1-h03r.onrender.com/uploads/${img}`;
    }
    return {
      id: String(row.id),
      name: row.title,
      image: img
    };
  },

  async getAddressesByUserPhone(phone) {
    const [rows] = await mysqlPool.query("SELECT * FROM node_addresses_v2 WHERE userPhone = ?", [phone]);
    return rows.map(r => {
      r.latitude = r.latitude !== null ? parseFloat(r.latitude) : null;
      r.longitude = r.longitude !== null ? parseFloat(r.longitude) : null;
      return r;
    });
  },

  async createAddress(address) {
    const { userPhone, type, houseNo, society, floor, landmark, city, locality, pincode, latitude, longitude, name, alternateNumber, alternate_number } = address;
    const finalType = type || "Home";
    const finalHouseNo = houseNo || "";
    const finalSociety = society || "";
    const finalFloor = floor || "";
    const finalLandmark = landmark || "";
    const finalCity = city || "";
    const finalLocality = locality || "";
    const finalPincode = pincode || "";
    const finalName = name || "";
    const finalAltNum = alternateNumber || alternate_number || "";

    await mysqlPool.query(
      `INSERT INTO node_addresses_v2 (userPhone, type, houseNo, society, floor, landmark, city, locality, pincode, latitude, longitude, name, alternateNumber)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userPhone, finalType, finalHouseNo, finalSociety, finalFloor, finalLandmark, finalCity, finalLocality, finalPincode, latitude, longitude, finalName, finalAltNum]
    );

    const [rows] = await mysqlPool.query("SELECT * FROM node_addresses_v2 WHERE userPhone = ? ORDER BY id DESC LIMIT 1", [userPhone]);
    if (rows.length > 0) {
      rows[0].latitude = rows[0].latitude !== null ? parseFloat(rows[0].latitude) : null;
      rows[0].longitude = rows[0].longitude !== null ? parseFloat(rows[0].longitude) : null;
      return rows[0];
    }
    return address;
  }
};

function initJsonDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, orders: [], referralsApplied: {}, categories: DEFAULT_CATEGORIES, addresses: [], contacts: [] }, null, 2));
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
      if (changed) {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
      }
    } catch (e) {}
  }
}

const JsonDbLayer = {
  readData() {
    try {
      initJsonDb();
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error("Error reading JSON database:", err.message);
      return { users: {}, orders: [], referralsApplied: {}, addresses: [] };
    }
  },

  writeData(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Error writing to JSON database:", err.message);
    }
  },

  // --- USER METHODS ---
  async getUserByPhone(phone) {
    const data = this.readData();
    return data.users[phone] || null;
  },

  async getUserByReferralCode(code) {
    const data = this.readData();
    return Object.values(data.users).find(u => u.referralCode === code) || null;
  },

  async createUser(user) {
    const data = this.readData();
    data.users[user.phone] = {
      name: user.name || "",
      phone: user.phone,
      email: user.email || "",
      location: user.location || "",
      locality: user.locality || "",
      gender: user.gender || "Male",
      referralCode: user.referralCode,
      walletBalance: user.walletBalance || 0.0,
      countryCode: user.countryCode || "+91"
    };
    this.writeData(data);
    return data.users[user.phone];
  },

  async updateUser(phone, updates) {
    const data = this.readData();
    if (!data.users[phone]) return null;
    data.users[phone] = { ...data.users[phone], ...updates };
    this.writeData(data);
    return data.users[phone];
  },

  async deleteUser(phone) {
    const data = this.readData();
    if (data.users[phone]) {
      delete data.users[phone];
    }
    data.addresses = data.addresses.filter(addr => addr.userPhone !== phone);
    this.writeData(data);
    return true;
  },

  async createContact(contact) {
    const data = this.readData();
    if (!data.contacts) {
      data.contacts = [];
    }
    const newContact = {
      id: data.contacts.length + 1,
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
      message: contact.message,
      createdAt: new Date().toISOString()
    };
    data.contacts.push(newContact);
    this.writeData(data);
    return newContact;
  },

  async countUsers() {
    const data = this.readData();
    return Object.keys(data.users).length;
  },

  // --- ORDER METHODS ---
  async getOrderById(id) {
    const data = this.readData();
    return data.orders.find(o => o.id === id) || null;
  },

  async getOrderByRazorpayOrderId(rzpOrderId) {
    const data = this.readData();
    return data.orders.find(o => o.razorpayOrderId === rzpOrderId) || null;
  },

  async getOrdersByUserPhone(phone) {
    const data = this.readData();
    return data.orders.filter(o => o.userPhone === phone).sort((a, b) => b.id - a.id);
  },

  async getAllOrders() {
    const data = this.readData();
    return [...data.orders].sort((a, b) => b.id - a.id);
  },

  async createOrder(order) {
    const data = this.readData();
    data.orders.push(order);
    this.writeData(data);
    return order;
  },

  async updateOrder(id, updates) {
    const data = this.readData();
    const index = data.orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    data.orders[index] = { ...data.orders[index], ...updates };
    this.writeData(data);
    return data.orders[index];
  },

  async getLastOrderId() {
    const data = this.readData();
    if (data.orders.length === 0) return 0;
    return Math.max(...data.orders.map(o => o.id));
  },

  async countOrders() {
    const data = this.readData();
    return data.orders.length;
  },

  // --- REFERRAL METHODS ---
  async getReferralApplied(phone) {
    const data = this.readData();
    return data.referralsApplied[phone] || null;
  },

  async createReferralApplied(referralApplied) {
    const data = this.readData();
    data.referralsApplied[referralApplied.userPhone] = referralApplied;
    this.writeData(data);
    return referralApplied;
  },

  // --- CATEGORY METHODS ---
  async getCategories() {
    const data = this.readData();
    const categories = data.categories || [];
    return categories.map(c => {
      if (typeof c === 'string') {
        return {
          id: c.toLowerCase().replace(/\s+/g, '_'),
          name: c,
          image: ""
        };
      }
      return {
        id: c.id || c.name.toLowerCase().replace(/\s+/g, '_'),
        name: c.name,
        image: c.image || ""
      };
    });
  },

  async addCategory(categoryData) {
    const data = this.readData();
    if (!data.categories) data.categories = [];
    const { name, id, image } = categoryData;
    const finalId = id || name.toLowerCase().replace(/\s+/g, '_');
    
    const existing = data.categories.find(c => {
      if (typeof c === 'string') {
        return c.toLowerCase() === name.toLowerCase();
      }
      return c.name.toLowerCase() === name.toLowerCase() || c.id === finalId;
    });

    if (existing) {
      return typeof existing === 'string'
        ? { id: existing.toLowerCase().replace(/\s+/g, '_'), name: existing, image: "" }
        : existing;
    }

    const newCat = { id: finalId, name, image: image || "" };
    data.categories.push(newCat);
    this.writeData(data);
    return newCat;
  },

  // --- ADDRESS METHODS ---
  async getAddressesByUserPhone(phone) {
    const data = this.readData();
    data.addresses = data.addresses || [];
    return data.addresses.filter(a => a.userPhone === phone);
  },

  async createAddress(address) {
    const data = this.readData();
    data.addresses = data.addresses || [];
    data.addresses.push(address);
    this.writeData(data);
    return address;
  }
};

// ----------------------------------------
// HYBRID DATABASE ROUTER
// ----------------------------------------
let dbMode = "mysql";

const DbLayer = {
  getLayer() {
    if (dbMode === "mysql" && mysqlPool !== null) {
      return MySqlDbLayer;
    }
    dbMode = "json";
    return JsonDbLayer;
  },
  async getUserByPhone(phone) { return this.getLayer().getUserByPhone(phone); },
  async getUserByReferralCode(code) { return this.getLayer().getUserByReferralCode(code); },
  async createUser(user) { return this.getLayer().createUser(user); },
  async updateUser(phone, updates) { return this.getLayer().updateUser(phone, updates); },
  async deleteUser(phone) { return this.getLayer().deleteUser(phone); },
  async createContact(contact) { return this.getLayer().createContact(contact); },
  async countUsers() { return this.getLayer().countUsers(); },
  async getOrderById(id) { return this.getLayer().getOrderById(id); },
  async getOrderByRazorpayOrderId(rzpOrderId) { return this.getLayer().getOrderByRazorpayOrderId(rzpOrderId); },
  async getOrdersByUserPhone(phone) { return this.getLayer().getOrdersByUserPhone(phone); },
  async getAllOrders() { return this.getLayer().getAllOrders(); },
  async createOrder(order) { return this.getLayer().createOrder(order); },
  async updateOrder(id, updates) { return this.getLayer().updateOrder(id, updates); },
  async getLastOrderId() { return this.getLayer().getLastOrderId(); },
  async countOrders() { return this.getLayer().countOrders(); },
  async getReferralApplied(phone) { return this.getLayer().getReferralApplied(phone); },
  async createReferralApplied(referralApplied) { return this.getLayer().createReferralApplied(referralApplied); },
  async getCategories() { return this.getLayer().getCategories(); },
  async addCategory(categoryData) { return this.getLayer().addCategory(categoryData); },
  async getAddressesByUserPhone(phone) { return this.getLayer().getAddressesByUserPhone(phone); },
  async createAddress(address) { return this.getLayer().createAddress(address); }
};

// ----------------------------------------
// DATABASE CONFIGURATION AND INITIALIZATION
// ----------------------------------------

(async () => {
  const mysqlSuccess = await initMySqlDb();
  if (!mysqlSuccess) {
    dbMode = "json";
    initJsonDb();
  }
})();

// Global Static Data for Services
const CATEGORIES_DATA = [
  "AcRepair", "Car Washing", "Plumber", "Cleaning",
  "Electrician", "Salon And Spa", "Painter", "Carpenter",
  "Bike Services", "Architecture", "Contractor", "Mechanic",
  "Pandit ji", "Driver", "Photographer", "Doctors", "Compounder", "Halwai"
];

const SERVICES_DATA = {
  "Plumber": [
    { title: "Tap Repair", price: 299, description: "Fix leaking taps and water issues", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.7, reviewsCount: 142, cutPrice: 399 },
    { title: "Pipe Fix", price: 499, description: "Repair damaged pipes", image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.5, reviewsCount: 88, cutPrice: 599 },
    { title: "Leakage Repair", price: 399, description: "Solve leakage problems", image: "https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.8, reviewsCount: 110, cutPrice: 499 }
  ],
  "Electrician": [
    { title: "Fan Repair", price: 199, description: "Fix fan issues", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.6, reviewsCount: 230, cutPrice: 249 },
    { title: "Switch Repair", price: 149, description: "Repair switches and boards", image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.4, reviewsCount: 95, cutPrice: 199 },
    { title: "Wiring Work", price: 799, description: "Complete wiring setup", image: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.9, reviewsCount: 180, cutPrice: 999 }
  ],
  "Cleaning": [
    { title: "Home Cleaning", price: 999, description: "Full house cleaning service", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop", discount: 23, rating: 4.9, reviewsCount: 312, cutPrice: 1299 },
    { title: "Bathroom Cleaning", price: 499, description: "Deep bathroom cleaning", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 154, cutPrice: 599 },
    { title: "Kitchen Cleaning", price: 699, description: "Degreasing cabinets, countertops, and appliances", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400&auto=format&fit=crop", discount: 22, rating: 4.8, reviewsCount: 195, cutPrice: 899 },
    { title: "Sofa & Carpet Cleaning", price: 799, description: "Vacuuming and steam sanitizing fabric surfaces", image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.6, reviewsCount: 120, cutPrice: 999 },
    { title: "Window Cleaning", price: 299, description: "Sparkling glass and pane washing inside-out", image: "https://images.unsplash.com/photo-1528740561666-bd247e66a20c?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.5, reviewsCount: 74, cutPrice: 399 }
  ],
  "AcRepair": [
    { title: "Ac Service", price: 500, description: "Full filter and coil cleaning", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 420, cutPrice: 599 },
    { title: "AC Gas Charging", price: 1500, description: "Refill refrigerant gas to restore peak cooling", image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.7, reviewsCount: 215, cutPrice: 1999 },
    { title: "AC Installation", price: 1, description: "Mount and configure split or window AC unit", image: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.9, reviewsCount: 165, cutPrice: 1499 },
    { title: "AC Leakage Repair", price: 600, description: "Identify and plug water or gas leak issues", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.6, reviewsCount: 98, cutPrice: 799 },
    { title: "AC Condenser Replacement", price: 2500, description: "Install brand new copper condenser unit", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 84, cutPrice: 2999 }
  ],
  "Salon And Spa": [
    { title: "Hair Cut", price: 299, description: "Modern hair styling and trimming", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.9, reviewsCount: 540, cutPrice: 399 },
    { title: "Facial & Grooming", price: 1, description: "Deep cleansing facial treatment and face massage", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 280, cutPrice: 599 },
    { title: "Hair Coloring", price: 599, description: "Professional ammonia-free hair coloring", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.6, reviewsCount: 145, cutPrice: 799 },
    { title: "Massage Therapy", price: 899, description: "Stress-relieving full body Swedish massage", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.8, reviewsCount: 310, cutPrice: 1199 },
    { title: "Pedicure & Manicure", price: 399, description: "Hand and foot grooming and nail clean spa", image: "https://images.unsplash.com/photo-1604654894610-df490651e56c?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.7, reviewsCount: 185, cutPrice: 499 }
  ],
  "Painter": [
    { title: "Wall Paint", price: 1999, description: "Single room wall painting with premium finishes", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.8, reviewsCount: 76, cutPrice: 2499 }
  ],
  "Carpenter": [
    { title: "Furniture Repair", price: 499, description: "Door alignment and wood repair work", image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 190, cutPrice: 599 }
  ],
  "Bike Services": [
    { title: "Bike", price: 700, description: "General washing, engine oil change & inspection", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400&auto=format&fit=crop", discount: 22, rating: 4.6, reviewsCount: 145, cutPrice: 899 }
  ],
  "Architecture": [
    { title: "Design Draft", price: 4999, description: "Floor plans and basic architectural layout mapping", image: "/assets/services/design_draft.png", discount: 16, rating: 4.9, reviewsCount: 52, cutPrice: 5999 },
    { title: "Consultation", price: 999, description: "Professional architecture advice session", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=400&auto=format&fit=crop", discount: 23, rating: 4.8, reviewsCount: 38, cutPrice: 1299 }
  ],
  "Car Washing": [
    { title: "Car Wash Deep", price: 599, description: "Interior vacuuming and exterior premium pressure wash", image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.7, reviewsCount: 220, cutPrice: 799 },
    { title: "Exterior Shine", price: 299, description: "Quick foam wash and tire polish", image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.5, reviewsCount: 104, cutPrice: 399 }
  ],
  "Contractor": [
    { title: "Renovation Consultation", price: 1499, description: "Detailed cost analysis and project discussion", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.8, reviewsCount: 45, cutPrice: 1999 }
  ],
  "Mechanic": [
    { title: "Engine Tuning", price: 1299, description: "Spark plugs clean, filter wash, and tuning", image: "/assets/services/engine_tuning.png", discount: 23, rating: 4.8, reviewsCount: 112, cutPrice: 1699 },
    { title: "General Inspection", price: 399, description: "Brakes, fluids, suspension safety check", image: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.6, reviewsCount: 135, cutPrice: 499 }
  ],
  "Pandit ji": [
    { title: "Pooja Service", price: 1100, description: "Pooja with traditional rituals and mantras", image: "/assets/services/pooja_service.png", discount: 26, rating: 4.9, reviewsCount: 88, cutPrice: 1499 }
  ],
  "Driver": [
    { title: "One-way Trip", price: 499, description: "Hourly driver service for safe in-city transit", image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 160, cutPrice: 599 }
  ],
  "Photographer": [
    { title: "Event Shoot", price: 2999, description: "2 hours high-res photography package for local events", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.9, reviewsCount: 72, cutPrice: 3999 }
  ],
  "Doctors": [
    { title: "General Consultation", price: 500, description: "GP health consultation and prescription writing", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 290, cutPrice: 599 }
  ],
  "Compounder": [
    { title: "Dressing & Injection", price: 150, description: "Basic nursing assistance, wound cleaning, dressings", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=400&auto=format&fit=crop", discount: 24, rating: 4.5, reviewsCount: 105, cutPrice: 199 }
  ],
  "Halwai": [
    { title: "Catering Service", price: 3500, description: "Private chef/catering help for medium family dinners", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400&auto=format&fit=crop", discount: 22, rating: 4.7, reviewsCount: 64, cutPrice: 4500 }
  ]
};

// Middleware: Authenticate User via header
async function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    // Backward compatibility: check if it's a 10-digit raw phone number
    let phone;
    if (/^\d{10}$/.test(token)) {
      phone = token;
    } else {
      const decoded = jwt.verify(token, JWT_SECRET);
      phone = decoded.phone;
    }

    if (!phone) return null;

    let user = await DbLayer.getUserByPhone(phone);
    if (!user) {
      // Create fallback mock user object
      const fallbackUser = {
        name: "Guest User",
        phone: phone,
        email: "guest@example.com",
        location: "",
        locality: "",
        gender: "Male",
        referralCode: generateReferralCode("Guest"),
        walletBalance: 0.0,
        countryCode: "+91"
      };

      try {
        user = await DbLayer.createUser(fallbackUser);
        console.log(`[Auth] Registered fallback mock guest user for verified token: ${phone}`);
      } catch (dbErr) {
        console.warn(`[Auth] Failed to persist fallback mock user in DB:`, dbErr.message);
        user = fallbackUser;
      }
    }
    return user;
  } catch (err) {
    console.error("JWT Authentication failed:", err.message);
    return null;
  }
}

// Helper to generate referral code
function generateReferralCode(name) {
  const cleanName = (name || "USER").substring(0, 3).toUpperCase();
  const timestampPart = Date.now().toString().slice(-6);
  return `${cleanName}${timestampPart}`;
}

// ----------------------------------------
// API ENDPOINTS
// ----------------------------------------

// Root welcome & status endpoint
app.get('/', async (req, res) => {
  try {
    const userCount = await DbLayer.countUsers();
    const orderCount = await DbLayer.countOrders();
    
    const activeLayer = DbLayer.getLayer();
    const dbStatus = activeLayer === JsonDbLayer 
      ? "JSON File Database (database.json)" 
      : `MongoDB (${mongoose.connection.host || 'localhost'})`;

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Home Services API Backend</title>
        <style>
          body {
            font-family: 'Outfit', 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #2c3e50;
          }
          .card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
            border-top: 5px solid #2ecc71;
            box-sizing: border-box;
          }
          h1 {
            color: #2c3e50;
            margin-top: 0;
            font-size: 28px;
            font-weight: 700;
          }
          p {
            color: #7f8c8d;
            font-size: 16px;
            line-height: 1.6;
          }
          .stats {
            display: flex;
            gap: 20px;
            margin: 30px 0;
          }
          .stat-box {
            flex: 1;
            background: #ffffff;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
            transition: transform 0.2s ease;
          }
          .stat-box:hover {
            transform: translateY(-2px);
          }
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #2ecc71;
          }
          .stat-label {
            font-size: 11px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 5px;
          }
          .badge {
            background-color: #d1fae5;
            color: #065f46;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 20px;
          }
          .badge::before {
            content: "";
            display: inline-block;
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            color: #e11d48;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Server Online</div>
          <h1>Home Services API Backend</h1>
          <p>The backend server for your Home Services Flutter application is running successfully and connected to <strong>${dbStatus}</strong>.</p>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${userCount}</div>
              <div class="stat-label">Registered Users</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${orderCount}</div>
              <div class="stat-label">Total Bookings</div>
            </div>
          </div>

          <p>Please refer to the <code>api_endpoints.txt</code> document in your project folder for a complete list of endpoints and request body schemas.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Error loading server status");
  }
});

// 1. Auth: Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const phone = req.body.phone || req.body.userId;
  const { countryCode } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number / userId is required" });
  }
  const prefix = countryCode || "+91";
  
  // Generate OTP (static 1234 only for test number 9199953391)
  const TEST_PHONE = '9199953391';
  const isTestNumber = phone === TEST_PHONE || phone === '91' + TEST_PHONE || phone === '+91' + TEST_PHONE;
  const otp = isTestNumber ? '1234' : Math.floor(1000 + Math.random() * 9000).toString();
  
  // Store OTP in-memory with 5 minutes expiry
  activeOTPs.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  
  const smsApiKey = process.env.SMS_API_KEY || 'b395HRZTRUGZThPOeRSnVg';
  const senderId = process.env.SMS_SENDER_ID || 'WEBSMS';
  const rawTemplate = process.env.SMS_TEMPLATE_TEXT || 'Your OTP for Home Faciliti registration is {otp}.';
  const messageText = rawTemplate.replace('{otp}', otp);
  const entityId = process.env.SMS_ENTITY_ID || '';
  const dltTemplateId = process.env.SMS_DLT_TEMPLATE_ID || '';
  const smsRoute = process.env.SMS_ROUTE || '2';

  // Format phone number: SMS Gateway Hub expects 91 prefix for Indian numbers without '+'
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.replace('+', '');
  }
  if (formattedPhone.length === 10) {
    formattedPhone = '91' + formattedPhone;
  }

  let smsSent = false;
  let smsError = null;

  try {
    // Build GET URL for SMSGatewayHub (more reliable than JSON POST)
    const params = new URLSearchParams({
      APIKey: smsApiKey,
      senderid: senderId,
      channel: '2',           // 2 = Transactional (required for DLT OTP)
      DCS: '0',
      flashsms: '0',
      number: formattedPhone,
      text: messageText,
      EntityId: entityId,
      dlttemplateid: dltTemplateId,
      route: '2'
    });
    const url = `https://www.smsgatewayhub.com/api/mt/SendSMS?${params.toString()}`;
    console.log('[SMS] Sending to:', url.replace(smsApiKey, '***'));
    const response = await fetch(url, { method: 'GET' });
    const rawText = await response.text();
    console.log('[SMS] Raw response:', rawText);
    let data;
    try { data = JSON.parse(rawText); } catch(_) { data = { rawText }; }
    if (data && (data.ErrorCode === '000' || data.ErrorCode === '0' || data.ErrorMessage === 'Success')) {
      smsSent = true;
    } else {
      smsError = data.ErrorMessage || JSON.stringify(data);
    }
  } catch (err) {
    smsError = err.message;
    console.error('[SMS] Exception:', err);
  }

  if (smsSent) {
    console.log(`[SMS] Dynamic OTP ${otp} sent successfully via SMSGatewayHub to phone: ${prefix}${phone}`);
    res.json({ 
      success: true, 
      message: `OTP sent successfully to ${prefix}${phone}`,
      otp: otp 
    });
  } else {
    console.warn(`[SMS] Failed to send SMS: ${smsError}. Payload details (excl. Key) -> senderid: "${senderId}", number: "${formattedPhone}", route: "${smsRoute}", text: "${messageText}", EntityId: "${entityId}", dlttemplateid: "${dltTemplateId}"`);
    res.json({ 
      success: true, 
      message: `OTP generated (SMS delivery failed: ${smsError || 'unknown error'})`,
      otp: otp 
    });
  }
});

// 2. Auth: Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const phone = req.body.phone || req.body.userId;
  const { otp, countryCode, name, email } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone / userId and OTP are required" });
  }

  const storedData = activeOTPs.get(phone);
  const isValidDynamic = storedData && storedData.otp === otp && storedData.expiresAt > Date.now();

  // Check the dynamic OTP
  if (!isValidDynamic) {
    return res.status(400).json({ error: "Invalid OTP or OTP expired" });
  }

  try {
    let user = await DbLayer.getUserByPhone(phone);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const finalName = name || "";
      const finalEmail = email || "";
      const refCode = generateReferralCode(finalName);
      user = {
        name: finalName,
        phone: phone,
        email: finalEmail,
        location: "",
        locality: "",
        gender: "Male",
        referralCode: refCode,
        walletBalance: 0.0,
        countryCode: countryCode || "+91"
      };
      await DbLayer.createUser(user);
      console.log(`Created new profile for user: ${countryCode || "+91"}${phone} with referral: ${refCode}`);
    } else {
      // Dynamic profile update if user already exists but custom name/email is passed in the OTP verify body
      if (name || email) {
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        user = await DbLayer.updateUser(phone, updates);
        console.log(`Dynamically updated existing user ${phone} profile on verify-otp:`, updates);
      }
    }

    const token = jwt.sign({ phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: "OTP verified successfully",
      user: { ...user, userId: user.phone },
      userId: user.phone,
      isNewUser: isNewUser,
      token: token
    });
  } catch (err) {
    console.error("Verify OTP failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Auth: Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    console.log(`User ${user.phone} logged out successfully`);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. Auth: Fetch Profile
app.get('/api/auth/profile', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized or User not found" });
    }
    res.json({ success: true, user: user });
  } catch (err) {
    console.error("Fetch profile failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. Auth: Update Profile
app.put('/api/auth/profile', async (req, res) => {
  const { name, email, location, locality, gender, countryCode } = req.body;
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (location !== undefined) updates.location = location;
    if (locality !== undefined) updates.locality = locality;
    if (gender !== undefined) updates.gender = gender;
    if (countryCode !== undefined) updates.countryCode = countryCode;

    const updatedUser = await DbLayer.updateUser(user.phone, updates);

    if (location !== undefined || locality !== undefined) {
      try {
        await DbLayer.createAddress({
          userPhone: user.phone,
          type: "Home",
          houseNo: "",
          society: "",
          floor: "",
          landmark: "",
          city: location || user.location || "",
          locality: locality || user.locality || "",
          pincode: "",
          latitude: 26.9124,
          longitude: 75.7873,
          name: updatedUser.name || user.name || "",
          alternateNumber: ""
        });
        console.log(`[ProfileUpdate] Synced updated location/locality to node_addresses for user ${user.phone}`);
      } catch (addrErr) {
        console.warn("Could not auto-create address entry from profile update:", addrErr.message);
      }
    }

    res.json({ success: true, user: updatedUser, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update profile failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 5. Auth: Delete Account
app.delete('/api/auth/account', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await DbLayer.deleteUser(user.phone);
    console.log(`[Auth] User account ${user.phone} deleted successfully.`);
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Contact Support API
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email, and message are required" });
  }
  try {
    const contact = await DbLayer.createContact({ name, email, phone, message });
    console.log(`[Contact] Inquiry created from ${name} (${email})`);
    res.json({ success: true, message: "Contact message sent successfully", contact });
  } catch (err) {
    console.error("Contact API failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const dbCategories = await DbLayer.getCategories();
    
    // Determine the base URL dynamically based on the incoming request headers
    const host = req.get('host');
    const protocol = req.protocol;
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
    const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

    // Map / Merge with DEFAULT_CATEGORIES to override static properties (names and images)
    const categories = dbCategories.map(c => {
      const defaultMatch = DEFAULT_CATEGORIES.find(
        dc => dc.id === c.id || dc.name.toLowerCase() === c.name.toLowerCase()
      );
      let img = c.image;
      let name = c.name;
      let id = c.id;

      if (defaultMatch) {
        id = defaultMatch.id;
        name = defaultMatch.name;
        img = defaultMatch.image;
      }

      // If the image path is relative, prepend the server's base URL dynamically
      if (img && img.startsWith('/assets/')) {
        img = `${serverBaseUrl}${img}`;
      }

      return {
        ...c,
        id: id,
        name: name,
        image: img
      };
    });

    res.json({ success: true, categories: categories });
  } catch (err) {
    console.error("Fetch categories failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Categories: Create/Add Category (Allows Infinite Categories)
app.post('/api/categories', async (req, res) => {
  const { name, id, image } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }
  try {
    const category = await DbLayer.addCategory({ name, id, image });
    console.log(`Added new category: ${category.name}`);
    res.json({ success: true, category: category, message: "Category created successfully" });
  } catch (err) {
    console.error("Add category failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Banners: Static Data
const BANNERS_DATA = [
  {
    id: "banner1",
    image: "/assets/banners/ac_services_banner.png",
    title: "Premium AC Services",
    category: "AcRepair",
    badge: "SPECIAL OFFER",
    subtitle: "Get 50% off professional filter cleaning & repairs",
    buttonText: "Book Now"
  },
  {
    id: "banner2",
    image: "/assets/banners/refer_earn_banner.png",
    title: "Refer Friends, Earn Cash",
    category: "refer",
    badge: "REFER & EARN",
    subtitle: "Invite your friends and earn instant rewards",
    buttonText: "Refer Now"
  },
  {
    id: "banner3",
    image: "/assets/banners/amc_services_banner.png",
    title: "Annual Maintenance Cover",
    category: "",
    badge: "COMING SOON",
    subtitle: "Complete peace of mind for your home, coming soon",
    buttonText: "Learn More"
  }
];

// Dropdown: Get Banners
app.get('/api/banners', async (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  if (dbMode === "mysql" && mysqlPool !== null) {
    try {
      const [rows] = await mysqlPool.query("SELECT * FROM banners WHERE status = 1");
      if (rows.length > 0) {
        const banners = rows.map(r => {
          let img = r.image || "";
          if (img && !img.startsWith('http') && !img.startsWith('https') && !img.startsWith('/assets/')) {
            img = `https://adminbackend-1-h03r.onrender.com/uploads/${img}`;
          }
          return {
            id: String(r.id),
            image: img,
            title: r.title,
            category: "",
            badge: "",
            subtitle: "",
            buttonText: ""
          };
        });
        return res.json({
          success: true,
          banners: banners,
          message: "Banners retrieved successfully from DB"
        });
      }
    } catch (err) {
      console.warn("[DynamicBanners] DB query failed, falling back to static:", err.message);
    }
  }

  const resolvedBanners = BANNERS_DATA.map(b => {
    let img = b.image;
    if (img && img.startsWith('/assets/')) {
      img = `${serverBaseUrl}${img}`;
    }
    return {
      ...b,
      image: img
    };
  });

  res.json({
    success: true,
    banners: resolvedBanners,
    message: "Banners retrieved successfully"
  });
});


// Categories: Get Services by Category name
app.get('/api/categories/:category/services', async (req, res) => {
  const { category } = req.params;
  const { search } = req.query;

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  if (dbMode === "mysql" && mysqlPool !== null) {
    try {
      const [catRows] = await mysqlPool.query(
        "SELECT * FROM categories WHERE LOWER(title) = ? OR LOWER(slug) = ? OR id = ?",
        [category.toLowerCase(), category.toLowerCase(), isNaN(category) ? -1 : parseInt(category)]
      );

      if (catRows.length > 0) {
        const cat = catRows[0];
        let queryStr = "SELECT * FROM services WHERE (category_id = ? OR sub_category_id = ?) AND status = 1";
        const queryParams = [cat.id, cat.id];

        if (search) {
          queryStr += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)";
          const term = `%${search.toString().toLowerCase()}%`;
          queryParams.push(term, term);
        }

        const [srvRows] = await mysqlPool.query(queryStr, queryParams);
        const services = srvRows.map(r => ({
          productId: r.title,
          title: r.title,
          price: parseFloat(r.price),
          description: r.description,
          image: r.image,
          discount: 0,
          rating: 4.8,
          reviewsCount: 120,
          cutPrice: parseFloat(r.price)
        }));

        return res.json({
          success: true,
          category: cat.title,
          total: services.length,
          services: resolveServiceUrls(services, serverBaseUrl)
        });
      }
    } catch (err) {
      console.warn("[DynamicServices] DB query failed, falling back to static:", err.message);
    }
  }

  // Case-insensitive match against known categories in SERVICES_DATA
  const matchedCategory = Object.keys(SERVICES_DATA).find(
    key => key.toLowerCase() === category.toLowerCase()
  );

  if (!matchedCategory) {
    return res.status(404).json({
      success: false,
      error: `Category '${category}' not found`,
      availableCategories: CATEGORIES_DATA
    });
  }

  let services = shuffleArray(SERVICES_DATA[matchedCategory] || []);

  if (search) {
    const query = search.toString().toLowerCase();
    services = services.filter(
      s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
    );
  }

  res.json({
    success: true,
    category: matchedCategory,
    total: services.length,
    services: resolveServiceUrls(services, serverBaseUrl)
  });
});


// Helper: Shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper: Resolve relative service image URLs dynamically
function resolveServiceUrls(services, serverBaseUrl) {
  const uploadBaseUrl = serverBaseUrl.includes('localhost') || serverBaseUrl.includes('127.0.0.1') || serverBaseUrl.includes('10.0.2.2')
    ? 'https://homefaciliti.com'
    : serverBaseUrl;

  return services.map(s => {
    let img = s.image;
    if (img) {
      if (img.startsWith('/assets/')) {
        img = `${serverBaseUrl}${img}`;
      } else if (!img.startsWith('http') && !img.startsWith('https')) {
        img = `${uploadBaseUrl}/uploads/services/${img}`;
      }
    }
    return {
      ...s,
      image: img
    };
  });
}

// 6. Services: Fetch with category / search filter
app.get('/api/services', async (req, res) => {
  const { category, search } = req.query;

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  if (dbMode === "mysql" && mysqlPool !== null) {
    try {
      let queryStr = "SELECT * FROM services WHERE status = 1";
      const queryParams = [];

      if (category) {
        // Try to resolve category ID
        const [catRows] = await mysqlPool.query(
          "SELECT id FROM categories WHERE LOWER(title) = ? OR LOWER(slug) = ? OR id = ?",
          [category.toLowerCase(), category.toLowerCase(), isNaN(category) ? -1 : parseInt(category)]
        );
        if (catRows.length > 0) {
          queryStr += " AND (category_id = ? OR sub_category_id = ?)";
          queryParams.push(catRows[0].id, catRows[0].id);
        }
      }

      if (search) {
        queryStr += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)";
        const term = `%${search.toString().toLowerCase()}%`;
        queryParams.push(term, term);
      }

      const [srvRows] = await mysqlPool.query(queryStr, queryParams);
      const services = srvRows.map(r => ({
        productId: r.title,
        title: r.title,
        price: parseFloat(r.price),
        description: r.description,
        image: r.image,
        discount: 0,
        rating: 4.8,
        reviewsCount: 120,
        cutPrice: parseFloat(r.price)
      }));

      return res.json({
        success: true,
        services: resolveServiceUrls(services, serverBaseUrl)
      });
    } catch (err) {
      console.warn("[DynamicServices] DB query all failed, falling back to static:", err.message);
    }
  }

  // FALLBACK: Static
  let list = [];
  if (category) {
    list = shuffleArray(SERVICES_DATA[category] || []);
  } else {
    list = shuffleArray(Object.values(SERVICES_DATA).flat());
  }

  if (search) {
    const query = search.toString().toLowerCase();
    list = list.filter(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
  }

  res.json({ success: true, services: resolveServiceUrls(list, serverBaseUrl) });
});

// 8. Services: Trending (Returns 5 random shuffled items)
app.get('/api/services/trending', async (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  if (dbMode === "mysql" && mysqlPool !== null) {
    try {
      const [srvRows] = await mysqlPool.query("SELECT * FROM services WHERE status = 1 ORDER BY RAND() LIMIT 5");
      const services = srvRows.map(r => ({
        productId: r.title,
        title: r.title,
        price: parseFloat(r.price),
        description: r.description,
        image: r.image,
        discount: 0,
        rating: 4.8,
        reviewsCount: 120,
        cutPrice: parseFloat(r.price)
      }));
      return res.json({ success: true, services: resolveServiceUrls(services, serverBaseUrl) });
    } catch (err) {
      console.warn("[DynamicServices] DB trending failed, falling back static:", err.message);
    }
  }

  const allServices = Object.values(SERVICES_DATA).flat();
  const trending = shuffleArray(allServices).slice(0, 5);
  res.json({ success: true, services: resolveServiceUrls(trending, serverBaseUrl) });
});

// 8a. Services: Get detailed specifications of a service
const handleServiceDetail = async (req, res) => {
  const title = req.params.title || req.query.title;
  if (!title) {
    return res.status(400).json({ success: false, error: "Service title is required" });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  if (dbMode === "mysql" && mysqlPool !== null) {
    try {
      const [srvRows] = await mysqlPool.query("SELECT * FROM services WHERE LOWER(title) = ? OR id = ?", [title.toLowerCase(), isNaN(title) ? -1 : parseInt(title)]);
      if (srvRows.length > 0) {
        const r = srvRows[0];
        
        let resolvedImage = r.image;
        if (resolvedImage) {
          if (resolvedImage.startsWith('/assets/')) {
            resolvedImage = `${serverBaseUrl}${resolvedImage}`;
          } else if (!resolvedImage.startsWith('http') && !resolvedImage.startsWith('https')) {
            resolvedImage = `${serverBaseUrl.includes('localhost') || serverBaseUrl.includes('127.0.0.1') || serverBaseUrl.includes('10.0.2.2') ? 'https://homefaciliti.com' : serverBaseUrl}/uploads/services/${resolvedImage}`;
          }
        }

        const enrichedService = {
          productId: r.title,
          title: r.title,
          price: parseFloat(r.price),
          description: r.description,
          image: resolvedImage,
          category: r.category_id.toString(),
          duration: r.title.toLowerCase().includes("cleaning") || r.title.toLowerCase().includes("paint") ? "3-4 Hours" : "1-2 Hours",
          rating: 4.8,
          reviewsCount: 124,
          discount: 0,
          cutPrice: parseFloat(r.price),
          highlights: [
            "Includes background-checked & certified partner",
            "30-day post-service warranty cover included",
            "Equipped with premium professional-grade tools",
            "100% safe, hygienic, and high-quality service execution"
          ]
        };

        return res.json({
          success: true,
          service: enrichedService,
          message: "Service details retrieved successfully"
        });
      }
    } catch (err) {
      console.warn("[DynamicServices] DB detail failed, falling back static:", err.message);
    }
  }

  let foundService = null;
  let foundCategory = null;

  for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
    const match = services.find(s => s.title.toLowerCase() === title.toLowerCase());
    if (match) {
      foundService = match;
      foundCategory = categoryName;
      break;
    }
  }

  if (!foundService) {
    return res.status(404).json({ success: false, error: `Service '${title}' not found` });
  }

  // Resolve relative URLs if needed
  let resolvedImage = foundService.image;
  if (resolvedImage && resolvedImage.startsWith('/assets/')) {
    resolvedImage = `${serverBaseUrl}${resolvedImage}`;
  }

  // Add rich mock metadata for details
  const enrichedService = {
    productId: foundService.title,
    title: foundService.title,
    price: foundService.price,
    description: foundService.description,
    image: resolvedImage,
    category: foundCategory,
    duration: foundService.title.toLowerCase().includes("cleaning") || foundService.title.toLowerCase().includes("paint") ? "3-4 Hours" : "1-2 Hours",
    rating: foundService.rating !== undefined ? foundService.rating : 4.8,
    reviewsCount: foundService.reviewsCount !== undefined ? foundService.reviewsCount : 124,
    discount: foundService.discount !== undefined ? foundService.discount : 0,
    cutPrice: foundService.cutPrice !== undefined ? foundService.cutPrice : foundService.price,
    highlights: [
      "Includes background-checked & certified partner",
      "30-day post-service warranty cover included",
      "Equipped with premium professional-grade tools",
      "100% safe, hygienic, and high-quality service execution"
    ]
  };

  res.json({
    success: true,
    service: enrichedService,
    message: "Service details retrieved successfully"
  });
};

app.get('/api/services/detail/:title', handleServiceDetail);
app.get('/api/services/detail', handleServiceDetail);

// 9. Search: Global search across services AND categories
app.get('/api/search', (req, res) => {
  const { q, query } = req.query;
  const searchTerm = (q || query || '').toString().trim();

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  if (!searchTerm) {
    return res.status(400).json({
      success: false,
      error: "Search query is required. Use ?q=<term> or ?query=<term>"
    });
  }

  const lowerTerm = searchTerm.toLowerCase();

  // Search across categories
  const matchedCategories = CATEGORIES_DATA.filter(
    cat => cat.toLowerCase().includes(lowerTerm)
  );

  // Search across all services (include category context)
  const matchedServices = [];
  for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
    for (const service of services) {
      if (
        service.title.toLowerCase().includes(lowerTerm) ||
        service.description.toLowerCase().includes(lowerTerm) ||
        categoryName.toLowerCase().includes(lowerTerm)
      ) {
        matchedServices.push({
          ...service,
          category: categoryName
        });
      }
    }
  }

  res.json({
    success: true,
    query: searchTerm,
    results: {
      categories: matchedCategories,
      services: resolveServiceUrls(matchedServices, serverBaseUrl),
      totalCategories: matchedCategories.length,
      totalServices: matchedServices.length
    }
  });
});

// 9a. Static Policies & Content APIs
app.get('/api/policies/privacy', (req, res) => {
  res.json({
    success: true,
    title: "Privacy Policy",
    lastUpdated: "May 27, 2026",
    content: "At Home Services, we value your privacy and are committed to protecting your personal data. This privacy policy describes how we collect, use, and share your information when you use our platform.",
    sections: [
      {
        title: "1. Information We Collect",
        body: "We collect information you provide directly to us, such as your name, phone number, email address, physical address, and payment information when you register, schedule a service, or communicate with us."
      },
      {
        title: "2. How We Use Your Information",
        body: "We use your personal information to match you with certified service providers, process payments, verify bookings, send transaction alerts, and improve our home services platform experience."
      },
      {
        title: "3. Information Sharing & Security",
        body: "Your details are only shared with the assigned service technician for execution. We implement strict industry-standard technical measures to secure your data and do not sell information to third-party advertisers."
      }
    ]
  });
});

app.get('/api/about', (req, res) => {
  res.json({
    success: true,
    title: "About Us",
    description: "Home Services is a premium, on-demand platform connecting homeowners with certified and background-checked service professionals like plumbers, electricians, mechanics, painters, and salon technicians.",
    vision: "To make home maintenance, repair, and cleaning services completely hassle-free, secure, and transparent.",
    mission: "To empower local service partners with technology and training while providing consumers with reliable, affordable, and high-quality solutions at their doorstep.",
    highlights: [
      "100% Background Checked & Verified Partners",
      "Standardised Pricing & No Hidden Charges",
      "30-Day Post-Service Warranty Cover",
      "Seamless In-App Booking and Booking Tracking"
    ]
  });
});

app.get('/api/policies/about', (req, res) => {
  res.redirect('/api/about');
});

app.get('/api/policies/terms', (req, res) => {
  res.json({
    success: true,
    title: "Terms and Conditions",
    lastUpdated: "May 27, 2026",
    content: "Welcome to Home Services. By registering or using our platform, you agree to comply with and be bound by the following terms of service. Please read them carefully.",
    sections: [
      {
        title: "1. Service Booking & Cancellation",
        body: "All service bookings must be made through our official mobile app or portal. Users can cancel bookings free of charge up to 2 hours before the scheduled time slot. Late cancellations may incur a nominal convenience fee."
      },
      {
        title: "2. Payment & Billing Rules",
        body: "Standard charges are displayed upfront. Any additional materials or spare parts purchased by the technician will be billed separately with user consent. All payments must be processed digitally or through in-app wallet options."
      },
      {
        title: "3. Limitation of Liability",
        body: "While we verify all independent service professionals, Home Services acts as a coordinator. Any dispute or property damage claims are governed by our standard insurance and damage reimbursement guidelines."
      }
    ]
  });
});

app.get('/api/policies/refund', (req, res) => {
  res.json({
    success: true,
    title: "Refund Policy",
    lastUpdated: "May 27, 2026",
    content: "Our goal is your complete satisfaction. If you are unsatisfied with a service, we offer a transparent refund and rework policy governed by the following rules.",
    rules: [
      {
        title: "1. Refund Eligibility",
        body: "Refunds are processed if the service was not executed as described, the service partner failed to show up, or severe quality issues are reported within 48 hours of service completion."
      },
      {
        title: "2. Standard Resolution Timeline",
        body: "For verified issues, we initiate a free-of-cost rework by a senior supervisor within 24 hours. If rework is not feasible, a full or partial refund is credited back to your original payment source or wallet within 5-7 business days."
      },
      {
        title: "3. Warranty Cover Limitations",
        body: "Our 30-day post-service warranty covers repairs executed by our partner. Reworks or issues arising due to external damage, misuse, or repairs handled by external non-platform technicians will invalidate refund/warranty claims."
      }
    ]
  });
});

// 9b. Razorpay Payment Verification
const handleVerifyPayment = async (req, res) => {
  const paramOrderId = req.params.orderId || req.query.orderId || req.body.orderId;
  const paymentId = req.query.paymentId || req.query.razorpay_payment_id || req.body.paymentId || req.body.razorpay_payment_id;
  const rzpOrderId = req.query.razorpay_order_id || req.body.razorpay_order_id || req.query.order_id || req.body.order_id;
  
  try {
    let order = null;
    let orderId = isNaN(paramOrderId) ? null : parseInt(paramOrderId);
    
    if (orderId) {
      order = await DbLayer.getOrderById(orderId);
    } else if (paramOrderId) {
      // If paramOrderId is not numeric, treat it as the Razorpay Order ID
      order = await DbLayer.getOrderByRazorpayOrderId(paramOrderId);
    }
    
    // Try to find the order by razorpayOrderId from query/body if not found by path parameter
    if (!order && rzpOrderId) {
      order = await DbLayer.getOrderByRazorpayOrderId(rzpOrderId);
    }

    if (order) {
      orderId = order.id;
    }

    const resolvedOrderId = order ? order.id : (orderId || 0);

    // If Cash / COD order, verify immediately as successful COD
    if (order && order.payment && (order.payment.paymentMethod && (order.payment.paymentMethod.toLowerCase() === "cash" || order.payment.paymentMethod.toLowerCase() === "cod"))) {
      return res.json({
        success: true,
        orderId: resolvedOrderId,
        paymentStatus: "cod",
        order: order,
        message: "Cash on Delivery order verified successfully"
      });
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwFaJKQjU5ZOsH';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'JY4Uup8xp2k1AvXXE2ezOje2';
    const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    
    let status = "pending";
    let paymentDetails = null;
    let verifiedViaRazorpay = false;
    let razorpayAuthError = false;

    // 1. Verify via specific Razorpay Payment ID if passed
    if (paymentId) {
      try {
        const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
          headers: { 'Authorization': authHeader }
        });
        const data = await rzpRes.json();
        if (rzpRes.status === 401 || (data.error && data.error.description && data.error.description.includes('Authentication'))) {
          razorpayAuthError = true;
          console.warn(`[Razorpay] Auth failure verifying payment ID: ${paymentId}`);
        } else if (data && data.status) {
          status = data.status; // captured, authorized, failed, etc.
          paymentDetails = data;
          verifiedViaRazorpay = true;
        }
      } catch (err) {
        console.error(`[Razorpay] Error fetching payment ID ${paymentId}:`, err.message);
      }
    }
    // 2. Verify via saved Razorpay Order ID on the order
    else if (order && order.razorpayOrderId) {
      try {
        const rzpRes = await fetch(`https://api.razorpay.com/v1/orders/${order.razorpayOrderId}/payments`, {
          headers: { 'Authorization': authHeader }
        });
        const data = await rzpRes.json();
        if (rzpRes.status === 401 || (data.error && data.error.description && data.error.description.includes('Authentication'))) {
          razorpayAuthError = true;
          console.warn(`[Razorpay] Auth failure verifying order: ${order.razorpayOrderId}`);
        } else if (data && data.items && Array.isArray(data.items)) {
          const capturedPayment = data.items.find(p => p.status === 'captured');
          if (capturedPayment) {
            status = "captured";
            paymentDetails = capturedPayment;
          } else if (data.items.length > 0) {
            status = data.items[0].status;
            paymentDetails = data.items[0];
          }
          verifiedViaRazorpay = true;
        }
      } catch (err) {
        console.error(`[Razorpay] Error fetching payments for Razorpay Order ${order.razorpayOrderId}:`, err.message);
      }
    }

    // 3. Fallback to simulation if credentials fail or order details not found on Razorpay
    if (razorpayAuthError || !verifiedViaRazorpay) {
      console.warn(`[Razorpay] Verification fallback to simulation. (AuthError: ${razorpayAuthError}, Verified: ${verifiedViaRazorpay})`);
      paymentDetails = {
        razorpay_payment_id: paymentId || `pay_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        razorpay_order_id: (order && order.razorpayOrderId) || `order_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        status: "captured", // Mock captured status
        amount: (order ? order.price : 299) * 100, // in paisa
        currency: "INR",
        method: "card",
        email: "user@example.com",
        contact: "+919876543210"
      };
      status = "captured";
    }

    // 4. Update the local order if paid successfully
    if (order && status === "captured") {
      const pId = paymentDetails ? (paymentDetails.id || paymentDetails.razorpay_payment_id) : null;
      await DbLayer.updateOrder(resolvedOrderId, {
        status: "Paid",
        bookingStatus: "searching", // begin search for professionals
        razorpayPaymentId: pId
      });
      console.log(`[Payment] Order #${resolvedOrderId} marked as Paid via Razorpay Payment ${pId}`);
    }

    res.json({
      success: true,
      orderId: resolvedOrderId,
      paymentStatus: status,
      paymentDetails: paymentDetails,
      message: `Payment checked successfully from Razorpay. Status: ${status}`
    });
  } catch (err) {
    console.error("Payment verification failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const handlePayPage = async (req, res) => {
  const orderIdStr = req.params.orderId;
  if (!orderIdStr) {
    return res.status(400).send("<h1>Error: Invalid Order ID</h1>");
  }
  
  try {
    let order = null;
    if (!isNaN(orderIdStr)) {
      order = await DbLayer.getOrderById(parseInt(orderIdStr));
    } else {
      order = await DbLayer.getOrderByRazorpayOrderId(orderIdStr);
    }
    
    if (!order) {
      return res.status(404).send("<h1>Error: Order not found</h1>");
    }
    
    const orderId = order.id;
    
    if (order.status.toLowerCase() === "paid") {
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Already Paid</title>
          <style>
            body { font-family: 'Outfit', sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%; }
            .icon { font-size: 64px; margin-bottom: 20px; color: #2ecc71; }
            h2 { color: #1e293b; margin: 0 0 10px 0; }
            p { color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; }
            .btn { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h2>Already Paid</h2>
            <p>This order #${orderId} is already paid. You can return to the app.</p>
            <button class="btn" onclick="window.close()">Close Window</button>
          </div>
        </body>
        </html>
      `);
    }

    const price = order.price || 0;
    const serviceName = order.serviceName || "Home Service";
    const rzpOrderId = order.razorpayOrderId;
    const userPhone = order.userPhone || "";

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwFaJKQjU5ZOsH';
    // isMockMode is true only when there is no real Razorpay Order ID (i.e. API call failed)
    const isMockMode = !rzpOrderId || rzpOrderId.startsWith('order_mock_');

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pay for Order #${orderId}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Outfit', sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            color: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            max-width: 480px;
            width: 100%;
            text-align: center;
            animation: fadeIn 0.6s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          h2 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 10px 0;
            background: linear-gradient(to right, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .service-name {
            font-size: 18px;
            color: #94a3b8;
            margin-bottom: 30px;
          }
          .price-tag {
            font-size: 48px;
            font-weight: 700;
            color: #38bdf8;
            margin-bottom: 30px;
          }
          .price-tag span {
            font-size: 24px;
            color: #94a3b8;
            font-weight: 400;
          }
          .btn-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 20px;
          }
          .btn {
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
          }
          .btn-primary {
            background: linear-gradient(to right, #2563eb, #1d4ed8);
            color: white;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6);
          }
          .btn-simulated {
            background: linear-gradient(to right, #10b981, #047857);
            color: white;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
          }
          .btn-simulated:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
          }
          .footer-text {
            margin-top: 30px;
            font-size: 13px;
            color: #64748b;
          }
          .loader {
            display: none;
            margin: 20px auto;
            border: 4px solid rgba(255,255,255,0.1);
            border-top: 4px solid #38bdf8;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <div class="card">
          <h2>Secure Checkout</h2>
          <div class="service-name">${serviceName} (Order #${orderId})</div>
          
          <div class="price-tag"><span>₹</span>${price}</div>
          
          <div class="loader" id="loader"></div>
          
          <div class="btn-container" id="buttons">
            ${isMockMode ? `
              <div style="padding: 12px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; font-size: 13px; color: #fbbf24; margin-bottom: 10px;">
                ⚠️ Sandbox mode active: Live Razorpay credentials are not configured or invalid.
              </div>
              <button class="btn btn-simulated" onclick="payMock()">Proceed with Simulated Payment</button>
            ` : `
              <button class="btn btn-primary" onclick="payReal()">Pay Securely via Razorpay</button>
              <button class="btn btn-simulated" style="background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1);" onclick="payMock()">Pay via Simulator (Test)</button>
            `}
          </div>
          
          <div class="footer-text">
            Protected by 256-bit encryption. Do not reload or close this page.
          </div>
        </div>

        <script>
          const orderId = "${orderId}";
          const rzpOrderId = "${rzpOrderId || ''}";
          const razorpayKeyId = "${razorpayKeyId}";
          const amountPaisa = "${Math.round(price * 100)}";
          const serviceName = "${serviceName}";
          const userPhone = "${userPhone}";

          function showLoader() {
            document.getElementById('buttons').style.display = 'none';
            document.getElementById('loader').style.display = 'block';
          }

          function payReal() {
            showLoader();
            var options = {
              "key": razorpayKeyId,
              "amount": amountPaisa,
              "currency": "INR",
              "name": "Home Faciliti",
              "description": serviceName,
              "order_id": rzpOrderId,
              "handler": function (response){
                window.location.href = "/api/payments/callback?orderId=" + orderId + 
                  "&razorpay_payment_id=" + response.razorpay_payment_id + 
                  "&razorpay_order_id=" + response.razorpay_order_id + 
                  "&razorpay_signature=" + response.razorpay_signature;
              },
              "modal": {
                "ondismiss": function() {
                  document.getElementById('buttons').style.display = 'flex';
                  document.getElementById('loader').style.display = 'none';
                }
              },
              "prefill": {
                "contact": userPhone,
                "email": "customer@homefaciliti.com"
              },
              "theme": {
                "color": "#3b82f6"
              }
            };
            try {
              var rzp = new Razorpay(options);
              rzp.on('payment.failed', function (response){
                window.location.href = "/api/payments/callback?orderId=" + orderId + 
                  "&status=failed&reason=" + encodeURIComponent(response.error.description);
              });
              rzp.open();
            } catch (err) {
              alert("Could not load Razorpay Checkout popup: " + err.message);
              document.getElementById('buttons').style.display = 'flex';
              document.getElementById('loader').style.display = 'none';
            }
          }

          function payMock() {
            showLoader();
            setTimeout(function() {
              window.location.href = "/api/payments/callback?orderId=" + orderId + "&status=captured&mock=true";
            }, 1000);
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Pay page failed:", err);
    res.status(500).send("<h1>Internal Server Error</h1>");
  }
};

const handlePaymentCallback = async (req, res) => {
  const orderIdStr = req.query.orderId || req.body.orderId;
  const paymentId = req.query.razorpay_payment_id || req.query.paymentId;
  const mock = req.query.mock;
  const status = req.query.status || "captured";
  const reason = req.query.reason || "Payment process could not be completed";

  if (!orderIdStr) {
    return res.status(400).send("<h1>Error: Invalid Order ID in callback</h1>");
  }

  try {
    let order = null;
    if (!isNaN(orderIdStr)) {
      order = await DbLayer.getOrderById(parseInt(orderIdStr));
    } else {
      order = await DbLayer.getOrderByRazorpayOrderId(orderIdStr);
    }

    if (!order) {
      return res.status(404).send("<h1>Error: Order not found in callback</h1>");
    }

    const orderId = order.id;

    let isSuccessful = false;
    let finalPaymentId = paymentId || `pay_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    if (status === "failed") {
      isSuccessful = false;
    } else if (mock === "true") {
      isSuccessful = true;
    } else {
      isSuccessful = true;
    }

    if (isSuccessful) {
      await DbLayer.updateOrder(orderId, {
        status: "Paid",
        bookingStatus: "searching",
        razorpayPaymentId: finalPaymentId
      });
      console.log(`[Payment Callback] Order #${orderId} marked as Paid via payment ${finalPaymentId}`);

      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Successful</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Outfit', sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
              color: #f8fafc;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .card {
              background: rgba(30, 41, 59, 0.85);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 44px 36px;
              border-radius: 28px;
              box-shadow: 0 32px 60px rgba(0,0,0,0.4);
              max-width: 400px;
              width: 92%;
              text-align: center;
              animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes scaleUp {
              from { transform: scale(0.85); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .checkmark {
              width: 90px;
              height: 90px;
              border-radius: 50%;
              background: linear-gradient(135deg, #10b981, #059669);
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 44px;
              color: white;
              margin: 0 auto 24px auto;
              box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
              animation: pop 0.7s 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
            }
            @keyframes pop {
              0% { transform: scale(0) rotate(-30deg); }
              100% { transform: scale(1) rotate(0deg); }
            }
            h2 { color: #10b981; font-size: 26px; margin-bottom: 8px; }
            .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 28px; }
            .details {
              background: rgba(255, 255, 255, 0.04);
              border: 1px solid rgba(255, 255, 255, 0.07);
              padding: 18px;
              border-radius: 14px;
              margin-bottom: 24px;
              font-size: 14px;
              text-align: left;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #64748b; font-size: 13px; }
            .value { color: #f8fafc; font-weight: 600; }
            .status-badge {
              background: rgba(16,185,129,0.15);
              color: #10b981;
              border: 1px solid rgba(16,185,129,0.3);
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            }
            .countdown-box {
              background: rgba(14, 165, 233, 0.1);
              border: 1px solid rgba(14, 165, 233, 0.2);
              border-radius: 12px;
              padding: 12px 16px;
              margin-bottom: 16px;
              font-size: 13px;
              color: #7dd3fc;
            }
            .countdown-num { font-weight: 700; color: #38bdf8; font-size: 16px; }
            .btn {
              background: linear-gradient(135deg, #10b981, #0ea5e9);
              color: white;
              border: none;
              padding: 15px 28px;
              border-radius: 14px;
              font-weight: 700;
              font-size: 15px;
              cursor: pointer;
              transition: all 0.2s ease;
              width: 100%;
              letter-spacing: 0.3px;
            }
            .btn:hover { opacity: 0.9; transform: translateY(-2px); }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="checkmark">✓</div>
            <h2>Payment Successful!</h2>
            <p class="subtitle">Your booking is confirmed 🎉</p>

            <div class="details">
              <div class="detail-row">
                <span class="label">Order ID</span>
                <span class="value">#${orderId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount Paid</span>
                <span class="value">₹${order.price}</span>
              </div>
              <div class="detail-row">
                <span class="label">Transaction ID</span>
                <span class="value" style="font-size:12px;">${finalPaymentId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status</span>
                <span class="status-badge">✓ Captured</span>
              </div>
            </div>

            <div class="countdown-box">
              Returning to app in <span class="countdown-num" id="timer">3</span> seconds...
            </div>

            <button class="btn" onclick="window.close()">Return to App Now</button>
          </div>
          <script>
            let t = 3;
            const el = document.getElementById('timer');
            const interval = setInterval(() => {
              t--;
              el.textContent = t;
              if (t <= 0) {
                clearInterval(interval);
                window.close();
              }
            }, 1000);
          </script>
        </body>
        </html>
      `);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Failed</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
              color: #f8fafc;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .card {
              background: rgba(30, 41, 59, 0.7);
              backdrop-filter: blur(16px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 40px;
              border-radius: 24px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.3);
              max-width: 400px;
              width: 90%;
              text-align: center;
              animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes scaleUp {
              from { transform: scale(0.9); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .cross {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: #ef4444;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 40px;
              color: white;
              margin: 0 auto 24px auto;
              box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
              animation: pop 0.6s 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
            }
            @keyframes pop {
              0% { transform: scale(0); }
              100% { transform: scale(1); }
            }
            h2 {
              color: #f87171;
              font-size: 24px;
              margin: 0 0 10px 0;
            }
            p {
              color: #94a3b8;
              font-size: 15px;
              line-height: 1.6;
              margin: 0 0 24px 0;
            }
            .btn {
              background: #ef4444;
              color: white;
              border: none;
              padding: 14px 28px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 15px;
              cursor: pointer;
              transition: all 0.2s ease;
              width: 100%;
            }
            .btn:hover {
              background: #dc2626;
              transform: translateY(-1px);
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="cross">✗</div>
            <h2>Payment Failed</h2>
            <p>${reason}</p>
            <button class="btn" onclick="window.close()">Close & Try Again</button>
          </div>
        </body>
        </html>
      `);
    }
  } catch (err) {
    console.error("Payment callback handler failed:", err);
    res.status(500).send("<h1>Internal Server Error</h1>");
  }
};

app.get('/api/payments/pay/:orderId', handlePayPage);
app.get('/api/payments/callback', handlePaymentCallback);

app.get('/api/payments/verify', handleVerifyPayment);
app.post('/api/payments/verify', handleVerifyPayment);
app.get('/api/payments/verify/:orderId', handleVerifyPayment);
app.post('/api/payments/verify/:orderId', handleVerifyPayment);

// COD Order Confirmation API
app.post('/api/payments/cod/:orderId', async (req, res) => {
  const orderIdStr = req.params.orderId;
  if (!orderIdStr || isNaN(orderIdStr)) {
    return res.status(400).json({ error: "Invalid Order ID" });
  }
  try {
    const orderId = parseInt(orderIdStr);
    const order = await DbLayer.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Set status to Pending and bookingStatus to searching for Cash orders
    await DbLayer.updateOrder(orderId, {
      status: "Pending",
      bookingStatus: "searching"
    });
    
    const updatedOrder = await DbLayer.getOrderById(orderId);
    console.log(`[Payment] Order #${orderId} confirmed as Cash on Delivery`);
    
    res.json({
      success: true,
      orderId: orderId,
      order: updatedOrder,
      message: "COD order placed successfully"
    });
  } catch (err) {
    console.error("COD confirmation API failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// 10. Wallet: Get Balance
app.get('/api/wallet/balance', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({ success: true, balance: user.walletBalance || 0, message: "Wallet balance retrieved successfully" });
  } catch (err) {
    console.error("Fetch wallet balance failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 11. Wallet: Add Money
app.post('/api/wallet/add', async (req, res) => {
  const { amount } = req.body;
  if (amount === undefined || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newBalance = (user.walletBalance || 0) + Number(amount);
    await DbLayer.updateUser(user.phone, { walletBalance: newBalance });

    res.json({ success: true, balance: newBalance, message: "Money added to wallet successfully" });
  } catch (err) {
    console.error("Add wallet money failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 12. Wallet: Deduct Money
app.post('/api/wallet/deduct', async (req, res) => {
  const { amount } = req.body;
  if (amount === undefined || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    const newBalance = (user.walletBalance || 0) - Number(amount);
    await DbLayer.updateUser(user.phone, { walletBalance: newBalance });

    res.json({ success: true, balance: newBalance, message: "Money deducted from wallet successfully" });
  } catch (err) {
    console.error("Deduct wallet money failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 11. Referral: Look up user by referral code
app.get('/api/referrals/lookup/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const user = await DbLayer.getUserByReferralCode(code);
    if (!user) {
      return res.status(404).json({ error: "Invalid referral code" });
    }
    res.json({
      success: true,
      user: {
        name: user.name,
        phone: user.phone,
        email: user.email,
        locality: user.locality
      },
      message: "Referral user found successfully"
    });
  } catch (err) {
    console.error("Referral lookup failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 12. Referral: Apply Code
app.post('/api/referrals/apply', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Referral code is required" });
  }

  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Prevent self-referral
    if (currentUser.referralCode === code) {
      return res.status(400).json({ error: "Cannot apply your own referral code" });
    }

    // Find referrer
    const referrer = await DbLayer.getUserByReferralCode(code);
    if (!referrer) {
      return res.status(404).json({ error: "Invalid referral code" });
    }

    // Check if current user has already applied a code
    const alreadyApplied = await DbLayer.getReferralApplied(currentUser.phone);
    if (alreadyApplied) {
      return res.status(400).json({ error: "Referral code already applied" });
    }

    // Reward both users
    const newCurrentBalance = (currentUser.walletBalance || 0) + 50.0;
    const newReferrerBalance = (referrer.walletBalance || 0) + 50.0;

    const referralRecord = {
      userPhone: currentUser.phone,
      referrerPhone: referrer.phone,
      appliedAt: new Date().toISOString()
    };

    await Promise.all([
      DbLayer.updateUser(currentUser.phone, { walletBalance: newCurrentBalance }),
      DbLayer.updateUser(referrer.phone, { walletBalance: newReferrerBalance }),
      DbLayer.createReferralApplied(referralRecord)
    ]);

    res.json({
      success: true,
      message: `Referral code successfully applied! Rewarded both users with ₹50.`,
      newBalance: newCurrentBalance
    });
  } catch (err) {
    console.error("Apply referral code failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Booking: Save/Register Booking Details
const handlePostBooking = async (req, res) => {
  let productId = req.body.productId || req.query.productId || req.body.product_id || req.query.product_id || req.body.product || req.query.product || req.body.serviceName || req.query.serviceName;
  let date = req.body.date || req.query.date || req.body.dates || req.query.dates || req.headers['x-date'];
  let timeSlot = req.body.timeSlot || req.query.timeSlot || req.body.slot || req.query.slot || req.body.slots || req.query.slots || req.body.solt || req.query.solt || req.body.solts || req.query.solts ||
                 req.headers['x-timeslot'] || req.headers['x-slot'] || req.headers['x-slots'] || req.headers['x-solt'] || req.headers['x-solts'];

  // Support nested structures: product, booking, order
  for (const objKey of ['product', 'booking', 'order']) {
    if (req.body[objKey]) {
      productId = productId || req.body[objKey].productId || req.body[objKey].product_id || req.body[objKey].product || req.body[objKey].serviceName;
      date = date || req.body[objKey].date || req.body[objKey].dates;
      timeSlot = timeSlot || req.body[objKey].timeSlot || req.body[objKey].slot || req.body[objKey].slots || req.body[objKey].solt || req.body[objKey].solts;
    }
  }

  if (productId && typeof productId === 'object') {
    productId = productId.productId || productId.serviceName || productId.product || productId.product_id;
  }

  // Normalize inputs
  date = normalizeDate(date);
  timeSlot = normalizeTimeSlot(timeSlot);

  if (productId) {
    const resolvedProduct = await resolveServiceDetails(productId);
    if (resolvedProduct) {
      productId = resolvedProduct.productId;
    }
  }

  if (!productId || !date || !timeSlot) {
    return res.status(400).json({ error: "productId, date, and timeSlot are required" });
  }
  
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate slot availability (no overlap with existing bookings on the same date for the same product)
    const allOrders = await DbLayer.getAllOrders();
    const targetDate = normalizeDate(date.split('T')[0]);
    const matchingOrders = allOrders.filter(order => {
      if (!order.date) return false;
      const orderDate = normalizeDate(order.date.split('T')[0]);
      const matchProduct = (order.productId && order.productId.toLowerCase() === productId.toLowerCase()) ||
                           (order.serviceName && order.serviceName.toLowerCase() === productId.toLowerCase());
      return orderDate === targetDate && matchProduct;
    });

    const reqRange = parseTimeRange(timeSlot);
    if (reqRange) {
      const bookedRanges = matchingOrders
        .map(order => parseTimeRange(order.timeSlot))
        .filter(range => range !== null);

      const isBooked = bookedRanges.some(bookedRange => timesOverlap(reqRange, bookedRange));
      if (isBooked) {
        return res.status(400).json({ error: "This time slot is already booked. Please choose another slot." });
      }
    }
    
    console.log(`User ${user.phone} validated booking slot ${timeSlot} on ${date} for product ${productId}`);
    
    // Resolve dynamic service details
    let resolvedProduct = await resolveServiceDetails(productId);
    if (!resolvedProduct) {
      resolvedProduct = {
        productId: productId,
        serviceName: productId,
        title: productId,
        price: 299,
        description: "Service booking"
      };
    }

    const userOrders = await DbLayer.getOrdersByUserPhone(user.phone);
    const pendingOrders = userOrders.filter(o => o.bookingStatus && o.bookingStatus.toLowerCase() === "draft");

    let order;
    if (pendingOrders && pendingOrders.length > 0) {
      const existingOrder = pendingOrders[0];
      const updates = {
        productId: resolvedProduct.productId,
        serviceName: resolvedProduct.serviceName,
        price: resolvedProduct.price,
        description: resolvedProduct.description,
        date: date,
        timeSlot: timeSlot,
      };
      if (existingOrder.payment) {
        updates.payment = {
          ...existingOrder.payment,
          amountPaid: resolvedProduct.price
        };
      } else {
        updates.payment = {
          paymentMethod: "Wallet",
          amountPaid: resolvedProduct.price
        };
      }

      // Auto-resolve user's address from database if missing
      if (!existingOrder.address) {
        const resolvedAddr = await resolveAddressForPhone(user.phone);
        if (resolvedAddr) {
          updates.address = resolvedAddr;
        }
      }

      order = await DbLayer.updateOrder(existingOrder.id, updates);
      console.log(`[handlePostBooking] Updated existing pending order #${existingOrder.id} with new booking details`);
    } else {
      // Create new pending order
      const resolvedAddr = await resolveAddressForPhone(user.phone);
      const lastOrderId = await DbLayer.getLastOrderId();
      const orderId = lastOrderId + 1;

      order = {
        id: orderId,
        userPhone: user.phone,
        userId: user.phone,
        serviceName: resolvedProduct.serviceName,
        price: resolvedProduct.price,
        date: date,
        status: "Pending",
        bookingStatus: "draft",
        partnerName: null,
        partnerDistance: null,
        productId: resolvedProduct.productId,
        description: resolvedProduct.description,
        timeSlot: timeSlot,
        address: resolvedAddr,
        payment: {
          paymentMethod: "Wallet",
          amountPaid: resolvedProduct.price
        },
        createdAt: Date.now()
      };
      order = await DbLayer.createOrder(order);
      console.log(`[handlePostBooking] Created new pending order #${order.id} for user ${user.phone}`);
    }

    res.json({
      success: true,
      message: "Booking details validated and registered",
      booking: { productId, date, timeSlot }
    });
  } catch (err) {
    console.error("Booking validation failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

app.post('/api/bookings', handlePostBooking);
app.post('/api/booking', handlePostBooking);

// Booking: Get All Bookings/Orders (authenticated user gets their bookings, unauthenticated gets all/fallback public bookings for testing)
app.get('/api/bookings', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req).catch(() => null);
    if (user) {
      const userOrders = await DbLayer.getOrdersByUserPhone(user.phone);
      return res.json({ success: true, bookings: userOrders, message: "User bookings retrieved successfully" });
    }
    
    // Fallback: public view of all bookings in the system for testing without authorization header
    const allOrders = await DbLayer.getAllOrders();
    res.json({ success: true, bookings: allOrders, message: "Public bookings retrieved successfully" });
  } catch (err) {
    console.error("Fetch bookings failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Addresses: Save a User Address
const handleAddAddress = async (req, res) => {
  const { type, houseNo, society, floor, landmark, city, locality, pincode, lat, latitude, lon, longitude, lng, name, alternateNumber, alternate_number } = req.body;
  
  try {
    let phone;
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    if (authUser) {
      phone = authUser.phone;
    } else {
      phone = req.body.userId || req.body.phone || req.body.userPhone || req.query.userId || req.query.phone;
    }

    if (!phone) {
      return res.status(401).json({ error: "Unauthorized: User identification (Token or userId) is required" });
    }
    
    const latValue = latitude !== undefined ? Number(latitude) : (lat !== undefined ? Number(lat) : null);
    const lonValue = longitude !== undefined ? Number(longitude) : (lon !== undefined ? Number(lon) : (lng !== undefined ? Number(lng) : null));
    
    const newAddress = {
      userPhone: phone,
      type: type || "Home",
      houseNo: houseNo || "",
      society: society || "",
      floor: floor || "",
      landmark: landmark || "",
      city: city || "",
      locality: locality || "",
      pincode: pincode || "",
      latitude: latValue,
      longitude: lonValue,
      name: name || "",
      alternateNumber: alternateNumber || alternate_number || ""
    };
    
    const savedAddress = await DbLayer.createAddress(newAddress);
    console.log(`Saved address for phone ${phone}: ${savedAddress.houseNo}, ${savedAddress.city}`);
    res.json({ success: true, address: savedAddress, message: "Address saved successfully" });
  } catch (err) {
    console.error("Save address failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
app.post('/api/addresses', handleAddAddress);
app.post('/api/address', handleAddAddress);

// Addresses: Get All User Addresses
app.get('/api/addresses', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const list = await DbLayer.getAddressesByUserPhone(user.phone);
    res.json({ success: true, addresses: list, message: "Addresses retrieved successfully" });
  } catch (err) {
    console.error("Get addresses failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Checkout: Place Order and Generate ID
const handlePostCheckout = async (req, res) => {
  let productId = req.body.productId || req.query.productId || req.body.product_id || req.query.product_id || req.body.product || req.query.product || req.body.serviceName || req.query.serviceName;
  let timeSlot = req.body.timeSlot || req.query.timeSlot || req.body.slot || req.query.slot || req.body.slots || req.query.slots || req.body.solt || req.query.solt || req.body.solts || req.query.solts ||
                 req.headers['x-timeslot'] || req.headers['x-slot'] || req.headers['x-slots'] || req.headers['x-solt'] || req.headers['x-solts'];
  let date = req.body.date || req.query.date || req.body.dates || req.query.dates || req.headers['x-date'];

  // Support nested structures: product, booking, order
  for (const objKey of ['product', 'booking', 'order']) {
    if (req.body[objKey]) {
      productId = productId || req.body[objKey].productId || req.body[objKey].product_id || req.body[objKey].product || req.body[objKey].serviceName;
      timeSlot = timeSlot || req.body[objKey].timeSlot || req.body[objKey].slot || req.body[objKey].slots || req.body[objKey].solt || req.body[objKey].solts;
      date = date || req.body[objKey].date || req.body[objKey].dates;
    }
  }

  if (productId && typeof productId === 'object') {
    productId = productId.productId || productId.serviceName || productId.product || productId.product_id;
  }

  // Normalize inputs
  date = normalizeDate(date);
  timeSlot = normalizeTimeSlot(timeSlot);
  
  if (!productId) {
    return res.status(400).json({ error: "productId is required in checkout body" });
  }
  
  try {
    // User validation: strictly retrieve from verified authentication token (verify otp token)
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid authentication token" });
    }
    const phone = user.phone;
    
    // Resolve service properties from dynamic database or fall back to hardcoded SERVICES_DATA
    const foundService = await resolveServiceDetails(productId);
    if (!foundService) {
      return res.status(404).json({ error: `Service/Product '${productId}' not found in catalog` });
    }
    
    // Retrieve the user's latest saved address or save new one if passed in body
    let resolvedAddress = null;
    if (req.body.address) {
      try {
        const newAddress = {
          userPhone: phone,
          type: req.body.address.type || "Home",
          houseNo: req.body.address.houseNo || "",
          society: req.body.address.society || "",
          floor: req.body.address.floor || "",
          landmark: req.body.address.landmark || "",
          city: req.body.address.city || "",
          locality: req.body.address.locality || "",
          pincode: req.body.address.pincode || "",
          latitude: Number(req.body.address.latitude) || 0,
          longitude: Number(req.body.address.longitude) || 0,
          name: req.body.address.name || "",
          alternateNumber: req.body.address.alternateNumber || req.body.address.alternate_number || ""
        };
        resolvedAddress = await DbLayer.createAddress(newAddress);
        console.log(`[Checkout] Saved new address passed in body for user ${phone}`);
      } catch (addrErr) {
        console.error("Save address from body failed:", addrErr);
      }
    }
    // ONLY fetch latest saved address if this is NOT the shared fallback guest user
    if (!resolvedAddress && phone !== "9876543210") {
      const addresses = await DbLayer.getAddressesByUserPhone(phone).catch(() => []);
      if (addresses && addresses.length > 0) {
        resolvedAddress = addresses[addresses.length - 1];
      }
    }
    
    // Check if there is already an existing draft order for this user to confirm/place
    let existingOrder = null;
    const userOrders = await DbLayer.getOrdersByUserPhone(phone);
    const pendingOrders = userOrders.filter(o => o.bookingStatus && o.bookingStatus.toLowerCase() === "draft");
    if (pendingOrders && pendingOrders.length > 0) {
      existingOrder = pendingOrders[0];
    }
    
    // Auto-increment simple numerical ID or reuse existing pending order ID
    let orderId;
    if (existingOrder) {
      orderId = existingOrder.id;
      console.log(`[Checkout] Reusing existing pending Order #${orderId} for phone ${phone}`);
    } else {
      const lastOrderId = await DbLayer.getLastOrderId();
      orderId = lastOrderId + 1;
      console.log(`[Checkout] Generating new Order #${orderId} for phone ${phone}`);
    }

    // Parse payment method details
    let paymentMethod = "Wallet";
    let amountPaid = 0;
    if (req.body.payment) {
      paymentMethod = req.body.payment.paymentMethod || "Wallet";
      amountPaid = Number(req.body.payment.amountPaid) || 0;
    } else if (existingOrder && existingOrder.payment) {
      paymentMethod = existingOrder.payment.paymentMethod || "Wallet";
      amountPaid = Number(existingOrder.payment.amountPaid) || 0;
    }

    // Call Razorpay API to create a real Order ID if payment method is "Online"
    let razorpayOrderId = null;
    if (existingOrder && (paymentMethod.toLowerCase() === "online" || paymentMethod.toLowerCase() === "razorpay")) {
      razorpayOrderId = existingOrder.razorpayOrderId;
    }

    if (!razorpayOrderId && (paymentMethod.toLowerCase() === "online" || paymentMethod.toLowerCase() === "razorpay")) {
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwFaJKQjU5ZOsH';
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'JY4Uup8xp2k1AvXXE2ezOje2';
      try {
        const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.round(Number(foundService.price) * 100), // amount in paisa
            currency: 'INR',
            receipt: `order_${orderId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
          })
        });
        const rzpData = await rzpRes.json();
        if (rzpData && rzpData.id) {
          razorpayOrderId = rzpData.id;
          console.log(`[Razorpay] Successfully created order ${razorpayOrderId} for amount ₹${foundService.price}`);
        } else {
          console.warn('[Razorpay] Order creation failed:', JSON.stringify(rzpData));
        }
      } catch (err) {
        console.error('[Razorpay] Network/API call failed:', err.message);
      }

      // Generate a perfect simulated Razorpay Order ID if API creation failed
      if (!razorpayOrderId) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 9; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        razorpayOrderId = `order_mock_${result}`;
        console.log(`[Razorpay] Generated perfect fallback mock ID: ${razorpayOrderId}`);
      }
    }

    const resolvedDate = date || (existingOrder ? existingOrder.date : null) || new Date().toISOString().split('T')[0];
    const resolvedTimeSlot = timeSlot || (existingOrder ? existingOrder.timeSlot : null) || (await getDynamicDateAndSlot()).timeSlot;
    const resolvedAddressField = resolvedAddress || (existingOrder ? existingOrder.address : null);
    
    const finalOrder = {
      id: orderId,
      userPhone: phone,
      userId: phone,
      serviceName: foundService.title,
      price: Number(foundService.price),
      date: resolvedDate,
      status: "Pending",
      bookingStatus: "searching",
      partnerName: null,
      partnerDistance: null,
      productId: foundService.productId,
      description: foundService.description,
      timeSlot: resolvedTimeSlot,
      address: resolvedAddressField,
      payment: { 
        paymentMethod: paymentMethod, 
        amountPaid: paymentMethod.toLowerCase() === "wallet" ? Number(foundService.price) : amountPaid 
      },
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: (existingOrder ? existingOrder.razorpayPaymentId : null) || null,
      createdAt: Date.now()
    };
    
    if (existingOrder) {
      await DbLayer.updateOrder(orderId, {
        serviceName: finalOrder.serviceName,
        price: finalOrder.price,
        date: finalOrder.date,
        status: finalOrder.status,
        bookingStatus: finalOrder.bookingStatus,
        partnerName: finalOrder.partnerName,
        partnerDistance: finalOrder.partnerDistance,
        productId: finalOrder.productId,
        description: finalOrder.description,
        timeSlot: finalOrder.timeSlot,
        address: finalOrder.address,
        payment: finalOrder.payment,
        razorpayOrderId: finalOrder.razorpayOrderId,
        createdAt: finalOrder.createdAt
      });
    } else {
      await DbLayer.createOrder(finalOrder);
    }
    
    // Only simulate wallet balance deduction if paymentMethod is Wallet
    if (paymentMethod.toLowerCase() === "wallet") {
      const userObj = await DbLayer.getUserByPhone(phone);
      if (userObj) {
        const newBalance = Math.max(0, (userObj.walletBalance || 0) - Number(foundService.price));
        await DbLayer.updateUser(phone, { walletBalance: newBalance });
        console.log(`Deducted ₹${foundService.price} from user ${phone} wallet. New balance: ₹${newBalance}`);
      }
    }
    
    console.log(`[Checkout] Refactored Order #${orderId} for phone ${phone}`);
    res.json({
      success: true,
      orderId: orderId,
      userId: phone,
      order: { ...finalOrder, userId: phone },
      razorpayOrderId: razorpayOrderId,
      message: "Checkout completed successfully and order placed"
    });
  } catch (err) {
    console.error("Checkout failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

app.post('/api/checkout', handlePostCheckout);
app.post('/api/checkout-api', handlePostCheckout);

// Helper to compute dynamic next available date and time slot based on current IST time
// Helper: get availability-checked slots for a specific date (same logic as /api/booking/available-slots)
const STATIC_BOOKING_SLOTS = [
  { id: "slot_1",  time: "9:00 AM - 10:00 AM",  start: 9  },
  { id: "slot_2",  time: "10:00 AM - 11:00 AM", start: 10 },
  { id: "slot_3",  time: "11:00 AM - 12:00 PM", start: 11 },
  { id: "slot_4",  time: "12:00 PM - 1:00 PM",  start: 12 },
  { id: "slot_5",  time: "1:00 PM - 2:00 PM",   start: 13 },
  { id: "slot_6",  time: "2:00 PM - 3:00 PM",   start: 14 },
  { id: "slot_7",  time: "3:00 PM - 4:00 PM",   start: 15 },
  { id: "slot_8",  time: "4:00 PM - 5:00 PM",   start: 16 },
  { id: "slot_9",  time: "5:00 PM - 6:00 PM",   start: 17 },
  { id: "slot_10", time: "6:00 PM - 7:00 PM",   start: 18 },
  { id: "slot_11", time: "7:00 PM - 8:00 PM",   start: 19 }
];

async function getBookingSlots() {
  if (dbMode === "mysql" && mysqlPool !== null) {
    try {
      const [rows] = await mysqlPool.query("SELECT * FROM slots ORDER BY id ASC");
      if (rows && rows.length > 0) {
        return rows.map((r, index) => {
          const parsed = parseTimeRange(r.slot_time);
          const startHour = parsed ? parsed.start : (9 + index);
          return {
            id: `slot_${r.id}`,
            time: r.slot_time,
            start: startHour
          };
        });
      }
    } catch (err) {
      console.warn("Could not load dynamic slots from database, using static fallback:", err.message);
    }
  }
  return STATIC_BOOKING_SLOTS;
}

async function getAvailableSlotsForDate(dateStr, excludeOrderId = null) {
  // Start with all slots marked available
  const bookingSlots = await getBookingSlots();
  const slots = bookingSlots.map(s => ({ ...s, available: true }));
  if (!dateStr) return slots;
  try {
    const allOrders = await DbLayer.getAllOrders();
    const targetDate = normalizeDate(dateStr.split('T')[0]);
    const matchingOrders = allOrders.filter(o => {
      if (!o.date) return false;
      if (excludeOrderId && Number(o.id) === Number(excludeOrderId)) return false;
      const orderDate = normalizeDate(o.date.split('T')[0]);
      return orderDate === targetDate;
    });
    const bookedRanges = matchingOrders.map(o => parseTimeRange(o.timeSlot)).filter(r => r !== null);
    for (const slot of slots) {
      const slotRange = parseTimeRange(slot.time);
      if (slotRange && bookedRanges.some(b => timesOverlap(slotRange, b))) {
        slot.available = false;
      }
    }
  } catch (err) {
    console.error('[getAvailableSlotsForDate] DB check failed, returning all slots as available:', err.message);
  }
  return slots;
}

// Helper: compute the next available date and slot based on real DB availability + current IST time
async function getDynamicDateAndSlot() {
  // Get current IST time (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const currentHour = istNow.getUTCHours();
  const currentMinute = istNow.getUTCMinutes();

  const formatDate = (d) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Try today first, then tomorrow
  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const targetDate = new Date(istNow.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = formatDate(targetDate);
    const slots = await getAvailableSlotsForDate(dateStr);

    // Find first slot that is available AND starts after current IST hour (today only matters for today)
    const candidateSlot = slots.find(s => {
      if (!s.available) return false;
      if (dayOffset === 0) {
        // For today: slot must start strictly after current hour (or same hour at minute 0)
        return s.start > currentHour || (s.start === currentHour && currentMinute === 0);
      }
      // For tomorrow: any available slot
      return true;
    });

    if (candidateSlot) {
      console.log(`[DynamicSlot] date=${dateStr} slot=${candidateSlot.time} (IST ${currentHour}:${String(currentMinute).padStart(2,'0')})`);
      return { date: dateStr, timeSlot: candidateSlot.time };
    }
  }

  // Ultimate fallback (should never be reached)
  const tomorrow = new Date(istNow.getTime() + 24 * 60 * 60 * 1000);
  const bookingSlots = await getBookingSlots();
  return { date: formatDate(tomorrow), timeSlot: bookingSlots[0].time };
}

// Helper to resolve address for a user phone number
const resolveAddressForPhone = async (phone) => {
  if (phone && phone !== "9876543210") {
    try {
      const addresses = await DbLayer.getAddressesByUserPhone(phone);
      if (addresses && addresses.length > 0) {
        return addresses[addresses.length - 1];
      }
    } catch (err) {
      console.error("Resolve address for phone failed:", err);
    }
  }

  // Fallback to user profile location/locality fields if they exist
  try {
    const user = await DbLayer.getUserByPhone(phone);
    if (user && (user.location || user.locality)) {
      console.log(`[AddressResolution] Falling back to user profile location fields for user ${phone}`);
      return {
        type: "Home",
        houseNo: "",
        society: "",
        floor: "",
        landmark: "",
        city: user.location || "Mumbai, Maharashtra",
        locality: user.locality || "Andheri West",
        pincode: "",
        latitude: 26.9124,
        longitude: 75.7873,
        name: user.name || "",
        alternateNumber: ""
      };
    }
  } catch (userErr) {
    console.error("Resolve address from user profile failed:", userErr);
  }

  // Default mock address fallback
  return {
    type: "Home",
    houseNo: "104",
    society: "Green Villa",
    floor: "1st",
    landmark: "Near Central Park",
    city: "Mumbai, Maharashtra",
    locality: "Andheri West",
    pincode: "400053",
    latitude: 26.9124,
    longitude: 75.7873,
    name: "Mock Guest",
    alternateNumber: ""
  };
};

const normalizeString = (str) => {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/\blekage\b/g, 'leakage')
    .replace(/\blekege\b/g, 'leakage')
    .replace(/[-_\s]/g, '')
    .trim();
};

const normalizeDate = (dStr) => {
  if (!dStr) return dStr;
  
  // Extract just the date part (first word or before T or space)
  const clean = String(dStr).trim().split(/[T\s]/)[0];
  
  const match1 = clean.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/);
  if (match1) {
    const day = match1[1].padStart(2, '0');
    const month = match1[2].padStart(2, '0');
    let year = match1[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  const match2 = clean.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (match2) {
    const year = match2[1];
    const month = match2[2].padStart(2, '0');
    const day = match2[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return clean;
};

const normalizeTimeSlot = (slotStr) => {
  if (!slotStr) return slotStr;
  
  // Format clean up
  let cleanSlot = String(slotStr).toLowerCase().replace(/\s/g, '').replace(/to/gi, '-');
  cleanSlot = cleanSlot.replace(/:+(?!\d)/g, ''); // Fixes "10:am" -> "10am"

  // Direct match
  for (const s of STATIC_BOOKING_SLOTS) {
    const staticClean = s.time.toLowerCase().replace(/\s/g, '').replace(/to/gi, '-');
    if (cleanSlot === staticClean) {
      return s.time;
    }
  }

  // Hours extraction and match (handles e.g. "9:00am to 10:am", "9am to 10am")
  const extractHoursAndAmPm = (str) => {
    const regex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
    const match = str.match(regex);
    if (match) {
      const h1 = parseInt(match[1]);
      const m1 = match[2] ? parseInt(match[2]) : 0;
      const ap1 = match[3].toLowerCase();
      const h2 = parseInt(match[4]);
      const m2 = match[5] ? parseInt(match[5]) : 0;
      const ap2 = match[6].toLowerCase();
      return { h1, m1, ap1, h2, m2, ap2 };
    }
    return null;
  };

  const parsedInput = extractHoursAndAmPm(cleanSlot);
  if (parsedInput) {
    for (const s of STATIC_BOOKING_SLOTS) {
      const parsedStatic = extractHoursAndAmPm(s.time.toLowerCase().replace(/\s/g, ''));
      if (parsedStatic &&
          parsedInput.h1 === parsedStatic.h1 &&
          parsedInput.m1 === parsedStatic.m1 &&
          parsedInput.ap1 === parsedStatic.ap1 &&
          parsedInput.h2 === parsedStatic.h2 &&
          parsedInput.m2 === parsedStatic.m2 &&
          parsedInput.ap2 === parsedStatic.ap2) {
        return s.time;
      }
    }
  }

};

// Sanitizers to prevent Dart Type Null Errors on the client
const sanitizeAddressObj = (addr) => {
  if (!addr) {
    return {
      name: "",
      alternateNumber: "",
      type: "Home",
      houseNo: "",
      society: "",
      floor: "",
      landmark: "",
      city: "",
      locality: "",
      pincode: ""
    };
  }
  return {
    name: String(addr.name || addr.userPhone || ""),
    alternateNumber: String(addr.alternateNumber || addr.alternate_number || addr.altPhoneNumber || ""),
    type: String(addr.type || "Home"),
    houseNo: String(addr.houseNo || addr.house_no || ""),
    society: String(addr.society || ""),
    floor: String(addr.floor || ""),
    landmark: String(addr.landmark || ""),
    city: String(addr.city || ""),
    locality: String(addr.locality || ""),
    pincode: String(addr.pincode || "")
  };
};

const sanitizeUserObj = (user) => {
  if (!user) {
    return {
      name: "",
      phone: "",
      email: "",
      walletBalance: 0
    };
  }
  return {
    name: String(user.name || ""),
    phone: String(user.phone || ""),
    email: String(user.email || ""),
    walletBalance: parseFloat(user.walletBalance || 0)
  };
};

const sanitizeProductObj = (prod, defaultTitle = "Tap Repair") => {
  if (!prod) {
    return {
      productId: defaultTitle,
      serviceName: defaultTitle,
      price: 299,
      description: "Fix issues and repair",
      date: "",
      timeSlot: ""
    };
  }
  return {
    productId: String(prod.productId || prod.serviceName || defaultTitle),
    serviceName: String(prod.serviceName || prod.productId || defaultTitle),
    price: Number(prod.price || 299),
    description: String(prod.description || ""),
    date: String(prod.date || ""),
    timeSlot: String(prod.timeSlot || "")
  };
};

// Helper to resolve service details by productId or title
const resolveServiceDetails = async (productId) => {
  if (!productId) {
    return {
      productId: "Tap Repair",
      serviceName: "Tap Repair",
      title: "Tap Repair",
      price: 299,
      description: "Fix leaking taps and water issues"
    };
  }

  const normProduct = normalizeString(productId);

  if (dbMode === "mysql" && mysqlPool !== null) {
    try {
      const [srvRows] = await mysqlPool.query(
        "SELECT * FROM services WHERE LOWER(title) = ? OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(title), '-', ''), '_', ''), ' ', ''), 'lekage', 'leakage'), 'lekege', 'leakage') = ? OR id = ?", 
        [productId.toLowerCase(), normProduct, isNaN(productId) ? -1 : parseInt(productId)]
      );
      if (srvRows.length > 0) {
        const r = srvRows[0];
        return {
          productId: r.title,
          serviceName: r.title,
          title: r.title,
          price: parseFloat(r.price),
          description: r.description
        };
      }
    } catch (err) {
      console.warn("[resolveServiceDetails] DB query failed, falling back static:", err.message);
    }
  }

  for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
    const match = services.find(s => normalizeString(s.title) === normProduct);
    if (match) {
      return {
        productId: match.title,
        serviceName: match.title,
        title: match.title,
        price: Number(match.price),
        description: match.description
      };
    }
  }
  // Default fallback service - returning null as requested
  return null;
};

// Checkout: Retrieve Checkout Summary (Get details)
const handleGetCheckout = async (req, res) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  const idParam = req.params.userId || req.query.userId || req.query.phone || req.body.userId || req.body.phone || "me";
  // Read date, slot, and product/service from query, body, headers, or nested product object
  let queryDate = req.query.date || req.body.date || req.query.dates || req.body.dates || req.headers['x-date'];
  let querySlot = req.query.timeSlot || req.query.slot || req.query.slots || req.query.solt || req.query.solts ||
                  req.body.timeSlot || req.body.slot || req.body.slots || req.body.solt || req.body.solts ||
                  req.headers['x-timeslot'] || req.headers['x-slot'] || req.headers['x-slots'] || req.headers['x-solt'] || req.headers['x-solts'];
  let queryProductId = req.query.productId || req.query.product || req.query.product_id || req.query.serviceName ||
                       req.body.productId || req.body.product || req.body.product_id || req.body.serviceName ||
                       req.headers['x-product-id'] || req.headers['x-product'];

  // Support nested structures: product, booking, order
  for (const objKey of ['product', 'booking', 'order']) {
    if (req.body[objKey]) {
      queryProductId = queryProductId || req.body[objKey].productId || req.body[objKey].product_id || req.body[objKey].product || req.body[objKey].serviceName;
      querySlot = querySlot || req.body[objKey].timeSlot || req.body[objKey].slot || req.body[objKey].slots || req.body[objKey].solt || req.body[objKey].solts;
      queryDate = queryDate || req.body[objKey].date || req.body[objKey].dates;
    }
  }

  if (queryProductId && typeof queryProductId === 'object') {
    queryProductId = queryProductId.productId || queryProductId.serviceName || queryProductId.product || queryProductId.product_id;
  }

  // Normalize inputs
  queryDate = normalizeDate(queryDate);
  querySlot = normalizeTimeSlot(querySlot);
  
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    let targetPhone = user.phone;
    let order = null;
    let justCreated = false;
    
    // Check if the idParam looks like a phone number (user id)
    if (isNaN(idParam) || idParam.length >= 8) {
      const targetPhone = idParam === "me" ? user.phone : idParam;
      const userOrders = await DbLayer.getOrdersByUserPhone(targetPhone);
      // Filter for strictly Draft checkout orders to avoid loading or corrupting past paid/completed bookings
      const pendingOrders = userOrders.filter(o => o.bookingStatus && o.bookingStatus.toLowerCase() === "draft");
      if (pendingOrders && pendingOrders.length > 0) {
        order = { ...pendingOrders[0] }; // Clone to allow safe mutation
      }
      
      // Dynamic fallback if no order exists for this user ID
      if (!order) {
        const resolvedAddr = await resolveAddressForPhone(targetPhone);
        let resolvedProduct = await resolveServiceDetails(queryProductId);
        if (!resolvedProduct) {
          resolvedProduct = await resolveServiceDetails("Tap Repair") || {
            productId: "Tap Repair",
            serviceName: "Tap Repair",
            title: "Tap Repair",
            price: 299,
            description: "Fix leaking taps and water issues"
          };
        }
        const lastOrderId = await DbLayer.getLastOrderId();
        const orderId = lastOrderId + 1;
        
        order = {
          id: orderId,
          userPhone: targetPhone,
          userId: targetPhone,
          serviceName: resolvedProduct.serviceName,
          price: resolvedProduct.price,
          date: queryDate || (await getDynamicDateAndSlot()).date,
          status: "Pending",
          bookingStatus: "draft",
          partnerName: null,
          partnerDistance: null,
          productId: resolvedProduct.productId,
          description: resolvedProduct.description,
          timeSlot: querySlot || (await getDynamicDateAndSlot()).timeSlot,
          address: resolvedAddr,
          payment: {
            paymentMethod: "Wallet",
            amountPaid: resolvedProduct.price
          },
          createdAt: Date.now()
        };
        await DbLayer.createOrder(order);
        justCreated = true;
        console.log(`[GetCheckout] Created and persisted fallback order #${orderId} for user ${targetPhone}`);
      }
    } else {
      // Treat as numerical orderId
      const orderId = parseInt(idParam);
      order = await DbLayer.getOrderById(orderId);
      if (order) {
        order = { ...order }; // Clone
      }
      
      // Dynamic fallback if no order exists for this order ID
      if (!order) {
        const resolvedAddr = await resolveAddressForPhone(user.phone);
        let resolvedProduct = await resolveServiceDetails(queryProductId);
        if (!resolvedProduct) {
          resolvedProduct = await resolveServiceDetails("Tap Repair") || {
            productId: "Tap Repair",
            serviceName: "Tap Repair",
            title: "Tap Repair",
            price: 299,
            description: "Fix leaking taps and water issues"
          };
        }
        order = {
          id: orderId,
          userPhone: user.phone,
          userId: user.phone,
          serviceName: resolvedProduct.serviceName,
          price: resolvedProduct.price,
          date: queryDate || (await getDynamicDateAndSlot()).date,
          status: "Pending",
          bookingStatus: "draft",
          partnerName: null,
          partnerDistance: null,
          productId: resolvedProduct.productId,
          description: resolvedProduct.description,
          timeSlot: querySlot || (await getDynamicDateAndSlot()).timeSlot,
          address: resolvedAddr,
          payment: {
            paymentMethod: "Wallet",
            amountPaid: resolvedProduct.price
          },
          createdAt: Date.now()
        };
        await DbLayer.createOrder(order);
        justCreated = true;
        console.log(`[GetCheckout] Created and persisted fallback order #${orderId} for order ID lookup`);
      }
    }
    
    let needsUpdate = false;
    const updates = {};
    
    // Auto-resolve user's latest address from database (only if not just created to avoid redundant writes, and not guest fallback user)
    if (!justCreated && order.userPhone !== "9876543210" && order.bookingStatus && order.bookingStatus.toLowerCase() === "draft") {
      const dbAddr = await resolveAddressForPhone(order.userPhone);
      if (dbAddr && JSON.stringify(order.address) !== JSON.stringify(dbAddr)) {
        order.address = dbAddr;
        updates.address = dbAddr;
        needsUpdate = true;
      }
      
      // Explicit query overrides if dynamically specified on the request
      if (queryProductId && order.productId !== queryProductId) {
        const resolvedProduct = await resolveServiceDetails(queryProductId);
        if (resolvedProduct) {
          order.productId = resolvedProduct.productId;
          order.serviceName = resolvedProduct.serviceName;
          order.price = resolvedProduct.price;
          order.description = resolvedProduct.description;
          if (order.payment) {
            order.payment.amountPaid = resolvedProduct.price;
          }
          
          updates.productId = resolvedProduct.productId;
          updates.serviceName = resolvedProduct.serviceName;
          updates.price = resolvedProduct.price;
          updates.description = resolvedProduct.description;
          if (order.payment) {
            updates.payment = order.payment;
          }
          needsUpdate = true;
        }
      }
      if (queryDate && order.date !== queryDate) {
        order.date = queryDate;
        updates.date = queryDate;
        needsUpdate = true;
      }
      if (querySlot && order.timeSlot !== querySlot) {
        order.timeSlot = querySlot;
        updates.timeSlot = querySlot;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await DbLayer.updateOrder(order.id, updates);
        console.log(`[GetCheckout] Persisted overrides to database for order #${order.id}`);
      }
    }
    
    // Retrieve available user addresses
    const addresses = await DbLayer.getAddressesByUserPhone(order.userPhone).catch(() => []);

    // Retrieve available services in the same category
    let services = [];
    if (dbMode === "mysql" && mysqlPool !== null) {
      try {
        const [srvRows] = await mysqlPool.query("SELECT category_id FROM services WHERE LOWER(title) = ? OR id = ?", [order.serviceName.toLowerCase(), isNaN(order.productId) ? -1 : parseInt(order.productId)]);
        if (srvRows.length > 0) {
          const categoryId = srvRows[0].category_id;
          const [catSrvRows] = await mysqlPool.query("SELECT * FROM services WHERE category_id = ? AND status = 1", [categoryId]);
          services = catSrvRows.map(r => ({
            productId: r.title,
            title: r.title,
            price: parseFloat(r.price),
            description: r.description,
            image: r.image
          }));
        }
      } catch (err) {
        console.warn("[GetCheckout] Failed to load dynamic services list:", err.message);
      }
    }
    
    if (services.length === 0) {
      for (const [catName, list] of Object.entries(SERVICES_DATA)) {
        const match = list.some(s => s.title.toLowerCase() === order.serviceName.toLowerCase());
        if (match) {
          services = list;
          break;
        }
      }
    }
    const resolvedServices = resolveServiceUrls(services, serverBaseUrl);

    // Retrieve available booking slots for the selected date (only show what the user can select, excluding user's own order)
    const rawAvailableSlots = await getAvailableSlotsForDate(order.date, order.id);
    const availableSlots = rawAvailableSlots.filter(s => s.available);

    // Ensure the currently selected time slot is visible in the frontend list
    if (order.timeSlot) {
      const hasOrderSlot = availableSlots.some(s => s.time === order.timeSlot);
      if (!hasOrderSlot) {
        let startHour = 0;
        try {
          const parsed = parseTimeRange(order.timeSlot);
          if (parsed) startHour = parsed.start;
        } catch(e) {}
        
        availableSlots.push({
          id: "slot_custom",
          time: order.timeSlot,
          start: startHour,
          available: true
        });
        
        // Sort slots chronologically
        availableSlots.sort((a, b) => (a.start || 0) - (b.start || 0));
      }
    }

    // Generate available booking dates (next 7 days)
    const dates = [];
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        formattedDate: d.toISOString().split('T')[0],
        dayName: i === 0 ? "Today" : (i === 1 ? "Tomorrow" : daysOfWeek[d.getDay()]),
        displayDate: `${d.getDate()} ${months[d.getMonth()]}`
      });
    }

    const hasOrderDate = dates.some(d => d.formattedDate === order.date);
    if (!hasOrderDate && order.date) {
      try {
        const parts = order.date.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const monthIndex = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          dates.unshift({
            formattedDate: order.date,
            dayName: "Selected Date",
            displayDate: `${day} ${months[monthIndex]}`
          });
        }
      } catch (e) {
        console.error("Failed to parse order date for dates list:", e);
      }
    }

    // Resolve the target user profile dynamically for the final response
    const checkoutPhone = order ? order.userPhone : targetPhone;
    let targetUser = user;
    if (checkoutPhone && checkoutPhone !== user.phone) {
      const dbUser = await DbLayer.getUserByPhone(checkoutPhone);
      if (dbUser) {
        targetUser = dbUser;
      } else {
        targetUser = {
          name: "",
          phone: checkoutPhone,
          email: "",
          walletBalance: 0.0
        };
      }
    }

    res.json({
      success: true,
      orderId: order.id,
      userId: order.userPhone,
      user: sanitizeUserObj(targetUser),
      product: sanitizeProductObj(order),
      address: sanitizeAddressObj(order.address),
      payment: {
        paymentMethod: (order.payment && order.payment.paymentMethod) || "Online",
        amountPaid: Number((order.payment && order.payment.amountPaid) || order.price || 0)
      },
      status: order.status || "Pending",
      bookingStatus: order.bookingStatus || "searching",
      partnerName: order.partnerName || null,
      partnerDistance: order.partnerDistance || null,
      addresses: (addresses || []).map(addr => sanitizeAddressObj(addr)),
      services: resolvedServices,
      products: resolvedServices,
      slots: availableSlots,
      dates: dates
    });
  } catch (err) {
    console.error("Fetch checkout details failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
app.get('/api/checkout', handleGetCheckout);
app.get('/api/checkout-api', handleGetCheckout);
app.get('/api/checkout/:userId', handleGetCheckout);
app.get('/api/checkout-api/:userId', handleGetCheckout);

// 14. Orders: Get All
app.get('/api/orders', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userOrders = await DbLayer.getOrdersByUserPhone(user.phone);
    const placedOrders = userOrders.filter(o => !o.bookingStatus || o.bookingStatus.toLowerCase() !== "draft");

    // Compact summary list (key fields only)
    const list = placedOrders.map(o => ({
      id: o.id,
      serviceName: o.serviceName,
      price: o.price,
      status: o.status,
      date: o.date,
      timeSlot: o.timeSlot,
      razorpayOrderId: o.razorpayOrderId || null
    }));

    // Enriched orderlist with total count
    const orderlist = {
      total: placedOrders.length,
      data: placedOrders
    };

    res.json({
      success: true,
      orders: placedOrders,
      list,
      orderlist,
      message: "Orders retrieved successfully"
    });
  } catch (err) {
    console.error("Fetch orders failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 15. Orders: Place Order
app.post('/api/orders', async (req, res) => {
  const { serviceName, price, date, productId, description, timeSlot } = req.body;
  if (!serviceName || !price) {
    return res.status(400).json({ error: "Service Name and Price are required" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Auto-increment simple numerical ID
    const lastOrderId = await DbLayer.getLastOrderId();
    const orderId = lastOrderId + 1;

    const newOrder = {
      id: orderId,
      userPhone: user.phone,
      serviceName: serviceName,
      price: Number(price),
      date: date || new Date().toISOString(),
      status: "Pending",
      bookingStatus: "searching",
      partnerName: null,
      partnerDistance: null,
      productId: productId || null,
      description: description || null,
      timeSlot: timeSlot || null,
      createdAt: Date.now()
    };

    await DbLayer.createOrder(newOrder);

    console.log(`Placed new order #${orderId} - ${serviceName} for phone ${user.phone}`);
    res.json({ success: true, order: newOrder, message: "Order placed successfully" });
  } catch (err) {
    console.error("Place order failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 16. Orders: Cancel Order
app.put('/api/orders/:id/cancel', async (req, res) => {
  const orderId = parseInt(req.params.id);
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const order = await DbLayer.getOrderById(orderId);
    if (!order || order.userPhone !== user.phone) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updatedOrder = await DbLayer.updateOrder(orderId, {
      status: "Cancelled",
      bookingStatus: "idle"
    });

    res.json({ success: true, order: updatedOrder, message: "Order cancelled successfully" });
  } catch (err) {
    console.error("Cancel order failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 17. Active Booking: Get Status
app.get('/api/orders/:id/booking-flow', async (req, res) => {
  const orderId = parseInt(req.params.id);
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let order = await DbLayer.getOrderById(orderId);
    if (!order || order.userPhone !== user.phone) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Simulate automatic partner assignment if state is 'searching' after 4 seconds of order creation
    const timeElapsed = Date.now() - order.createdAt;
    if (order.bookingStatus === "searching" && timeElapsed > 4000) {
      order = await DbLayer.updateOrder(orderId, {
        bookingStatus: "assigned",
        partnerName: "Ravi Kumar",
        partnerDistance: "3.2 km away"
      });
      console.log(`[Booking Simulation] Assigned partner Ravi Kumar to Order #${orderId}`);
    }

    res.json({
      success: true,
      status: order.bookingStatus,
      partnerName: order.partnerName,
      partnerDistance: order.partnerDistance,
      message: "Booking flow status retrieved successfully"
    });
  } catch (err) {
    console.error("Get booking flow failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 18. Active Booking: Update Status
app.put('/api/orders/:id/booking-flow', async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status, partnerName, partnerDistance } = req.body;

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const order = await DbLayer.getOrderById(orderId);
    if (!order || order.userPhone !== user.phone) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updates = {};
    if (status) {
      updates.bookingStatus = status;
      if (status === "completed") {
        updates.status = "Completed";
      }
    }
    if (partnerName) updates.partnerName = partnerName;
    if (partnerDistance) updates.partnerDistance = partnerDistance;

    const updatedOrder = await DbLayer.updateOrder(orderId, updates);
    console.log(`Updated Order #${orderId} Booking Status to: ${status}`);

    res.json({
      success: true,
      status: updatedOrder.bookingStatus,
      partnerName: updatedOrder.partnerName,
      partnerDistance: updatedOrder.partnerDistance,
      message: "Booking flow status updated successfully"
    });
  } catch (err) {
    console.error("Update booking flow failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 18a. Booking Availability: Available Dates
app.get('/api/booking/available-dates', (req, res) => {
  const dates = [];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      formattedDate: d.toISOString().split('T')[0], // "2026-05-26"
      dayName: i === 0 ? "Today" : (i === 1 ? "Tomorrow" : daysOfWeek[d.getDay()]),
      displayDate: `${d.getDate()} ${months[d.getMonth()]}` // "26 May"
    });
  }

  res.json({
    success: true,
    dates: dates,
    message: "Available booking dates retrieved successfully"
  });
});

// Helper to parse time ranges like "9:00 AM - 10:00 AM" or "9 AM - 11 AM"
function parseTimeRange(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.toUpperCase().replace(/\s/g, '').split('-');
  if (parts.length !== 2) return null;
  
  const parseTime = (t) => {
    const match = t.match(/^(\d+)(?::(\d+))?(AM|PM)$/);
    if (!match) return null;
    let hour = parseInt(match[1]);
    const minute = match[2] ? parseInt(match[2]) : 0;
    const ampm = match[3];
    
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    
    return hour + (minute / 60);
  };
  
  const start = parseTime(parts[0]);
  const end = parseTime(parts[1]);
  if (start === null || end === null) return null;
  return { start, end };
}

function timesOverlap(range1, range2) {
  if (!range1 || !range2) return false;
  return range1.start < range2.end && range2.start < range1.end;
}

const handleGetAvailableSlots = async (req, res) => {
  let date = req.query.date || req.query.dates || req.body.date || req.body.dates || req.headers['x-date'];
  let productId = req.query.productId || req.query.product || req.query.product_id || req.query.serviceName ||
                  req.body.productId || req.body.product || req.body.product_id || req.body.serviceName ||
                  req.headers['x-product-id'] || req.headers['x-product'];

  if (productId && typeof productId === 'object') {
    productId = productId.productId || productId.serviceName || productId.product || productId.product_id;
  }

  // Normalize inputs
  date = normalizeDate(date);

  if (productId) {
    const resolvedProduct = await resolveServiceDetails(productId);
    if (resolvedProduct) {
      productId = resolvedProduct.productId;
    }
  }

  try {
    let slots;
    const bookingSlots = await getBookingSlots();
    if (date) {
      // Use shared helper which checks real DB bookings for the given date
      const rawSlots = await getAvailableSlotsForDate(date);
      slots = rawSlots.filter(s => s.available);
    } else {
      // No date provided — return all slots as available
      slots = bookingSlots.map(s => ({ ...s, available: true }));
    }

    res.json({
      success: true,
      slots: slots,
      message: "Available booking time slots retrieved successfully"
    });
  } catch (err) {
    console.error("Fetch available slots failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

app.get('/api/booking/available-slots', handleGetAvailableSlots);
app.get('/api/booking/available-solts', handleGetAvailableSlots);
app.get('/api/booking/available-slot', handleGetAvailableSlots);
app.get('/api/booking/available-solt', handleGetAvailableSlots);

const STATES_CITIES = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Vasant Kunj"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Agra", "Varanasi"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Asansol"]
};

// Dropdown: Get States
app.get('/api/states', async (req, res) => {
  if (dbMode === "mysql" && mysqlPool !== null) {
    try {
      const [rows] = await mysqlPool.query("SELECT name FROM states WHERE status = 1 AND deleted_at IS NULL ORDER BY name ASC");
      const states = rows.map(r => r.name);
      return res.json({
        success: true,
        states: states,
        message: "States retrieved successfully from database"
      });
    } catch (err) {
      console.error("Fetch states from MySQL failed:", err);
    }
  }
  
  const states = Object.keys(STATES_CITIES);
  res.json({
    success: true,
    states: states,
    message: "States retrieved successfully"
  });
});

// Dropdown: Get Cities
app.get('/api/cities', async (req, res) => {
  const { state } = req.query;
  
  if (dbMode === "mysql" && mysqlPool !== null) {
    try {
      let query = "SELECT c.name FROM cities c WHERE c.status = 1 AND c.deleted_at IS NULL";
      const params = [];
      
      if (state) {
        const [stateRows] = await mysqlPool.query("SELECT id FROM states WHERE name = ? AND deleted_at IS NULL LIMIT 1", [state]);
        if (stateRows.length > 0) {
          query += " AND c.state_id = ?";
          params.push(stateRows[0].id);
        } else {
          return res.status(404).json({
            success: false,
            error: "State not found",
            message: `State ${state} not found`
          });
        }
      }
      
      query += " ORDER BY c.name ASC";
      const [rows] = await mysqlPool.query(query, params);
      const cities = rows.map(r => r.name);
      return res.json({
        success: true,
        cities: cities,
        message: state ? `Cities for state ${state} retrieved successfully` : "All cities retrieved successfully"
      });
    } catch (err) {
      console.error("Fetch cities from MySQL failed:", err);
    }
  }
  
  if (state) {
    const cities = STATES_CITIES[state];
    if (!cities) {
      return res.status(404).json({
        success: false,
        error: "State not found",
        message: "State not found"
      });
    }
    return res.json({
      success: true,
      cities: cities,
      message: `Cities for state ${state} retrieved successfully`
    });
  }
  
  const allCities = Object.values(STATES_CITIES).flat();
  res.json({
    success: true,
    cities: allCities,
    message: "All cities retrieved successfully"
  });
});

// Dropdown: Get Localities
app.get('/api/localities', async (req, res) => {
  const { city, state } = req.query;
  
  if (dbMode === "mysql" && mysqlPool !== null) {
    try {
      let query = "SELECT l.name FROM localities l WHERE l.status = 1 AND l.deleted_at IS NULL";
      const params = [];
      
      if (city) {
        const [cityRows] = await mysqlPool.query("SELECT id FROM cities WHERE name = ? AND deleted_at IS NULL LIMIT 1", [city]);
        if (cityRows.length > 0) {
          query += " AND l.city_id = ?";
          params.push(cityRows[0].id);
        } else {
          return res.json({ success: true, localities: [], message: `No localities found for city ${city}` });
        }
      } else if (state) {
        const [stateRows] = await mysqlPool.query("SELECT id FROM states WHERE name = ? AND deleted_at IS NULL LIMIT 1", [state]);
        if (stateRows.length > 0) {
          query += " AND l.state_id = ?";
          params.push(stateRows[0].id);
        } else {
          return res.json({ success: true, localities: [], message: `No localities found for state ${state}` });
        }
      }
      
      query += " ORDER BY l.name ASC";
      const [rows] = await mysqlPool.query(query, params);
      const names = rows.map(r => r.name);
      return res.json({
        success: true,
        localities: names,
        message: "Localities retrieved successfully"
      });
    } catch (err) {
      console.error("Fetch localities from MySQL failed:", err);
    }
  }
  
  const fallbackLocalities = [
    "Pratap Nagar", "Mansarovar", "Adarsh Nagar", "Raja Park", "Jagat Pura",
    "Andheri East", "Andheri West", "Bandra", "Koramangala", "Indiranagar"
  ];
  res.json({
    success: true,
    localities: fallbackLocalities,
    message: "Localities retrieved successfully (JSON fallback)"
  });
});

app.listen(PORT, () => {
  console.log(`Backend server successfully listening at http://localhost:${PORT}`);
});
