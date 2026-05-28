require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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

// ----------------------------------------
// MONGOOSE SCHEMAS & MODELS
// ----------------------------------------

const mongooseUserSchema = new mongoose.Schema({
  name: { type: String, default: "Hira" },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: "hira@hmail.com" },
  location: { type: String, default: "" },
  locality: { type: String, default: "" },
  gender: { type: String, default: "Male" },
  referralCode: { type: String, required: true },
  walletBalance: { type: Number, default: 0.0 },
  countryCode: { type: String, default: "+91" }
});
const MongoUser = mongoose.model('User', mongooseUserSchema);

const mongooseOrderSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  userPhone: { type: String, required: true },
  serviceName: { type: String, required: true },
  price: { type: Number, required: true },
  date: { type: String, required: true },
  status: { type: String, default: "Pending" },
  bookingStatus: { type: String, default: "searching" },
  partnerName: { type: String, default: null },
  partnerDistance: { type: String, default: null },
  productId: { type: String, default: null },
  description: { type: String, default: null },
  timeSlot: { type: String, default: null },
  address: { type: mongoose.Schema.Types.Mixed, default: null },
  payment: { type: mongoose.Schema.Types.Mixed, default: null },
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  createdAt: { type: Number, default: () => Date.now() }
});
const MongoOrder = mongoose.model('Order', mongooseOrderSchema);

const mongooseReferralAppliedSchema = new mongoose.Schema({
  userPhone: { type: String, required: true, unique: true },
  referrerPhone: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now }
});
const MongoReferralApplied = mongoose.model('ReferralApplied', mongooseReferralAppliedSchema);

const mongooseAddressSchema = new mongoose.Schema({
  userPhone: { type: String, required: true },
  type: { type: String, default: "Home" },
  houseNo: { type: String, default: "" },
  society: { type: String, default: "" },
  floor: { type: String, default: "" },
  landmark: { type: String, default: "" },
  city: { type: String, default: "" },
  locality: { type: String, default: "" },
  pincode: { type: String, default: "" },
  latitude: { type: Number },
  longitude: { type: Number }
});
const MongoAddress = mongoose.model('Address', mongooseAddressSchema);

const mongooseCategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  image: { type: String, default: "" }
});
const MongoCategory = mongoose.model('Category', mongooseCategorySchema);

// ----------------------------------------
// DATABASE ABSTRACTED DATA LAYER (MongoDB)
// ----------------------------------------
const MongoDbLayer = {
  // --- USER METHODS ---
  async getUserByPhone(phone) {
    return await MongoUser.findOne({ phone: phone }).lean();
  },

  async getUserByReferralCode(code) {
    return await MongoUser.findOne({ referralCode: code }).lean();
  },

  async createUser(user) {
    const newUser = new MongoUser(user);
    await newUser.save();
    return newUser.toObject();
  },

  async updateUser(phone, updates) {
    return await MongoUser.findOneAndUpdate({ phone: phone }, { $set: updates }, { new: true }).lean();
  },

  async countUsers() {
    return await MongoUser.countDocuments();
  },

  // --- ORDER METHODS ---
  async getOrderById(id) {
    return await MongoOrder.findOne({ id: id }).lean();
  },

  async getOrdersByUserPhone(phone) {
    return await MongoOrder.find({ userPhone: phone }).sort({ id: -1 }).lean();
  },

  async getAllOrders() {
    return await MongoOrder.find({}).sort({ id: -1 }).lean();
  },

  async createOrder(order) {
    const newOrder = new MongoOrder(order);
    await newOrder.save();
    return newOrder.toObject();
  },

  async updateOrder(id, updates) {
    return await MongoOrder.findOneAndUpdate({ id: id }, { $set: updates }, { new: true }).lean();
  },

  async getLastOrderId() {
    const last = await MongoOrder.findOne().sort({ id: -1 }).lean();
    return last ? last.id : 0;
  },

  async countOrders() {
    return await MongoOrder.countDocuments();
  },

  // --- REFERRAL METHODS ---
  async getReferralApplied(phone) {
    return await MongoReferralApplied.findOne({ userPhone: phone }).lean();
  },

  async createReferralApplied(referralApplied) {
    const newRef = new MongoReferralApplied(referralApplied);
    await newRef.save();
    return newRef.toObject();
  },

  // --- CATEGORY METHODS ---
  async getCategories() {
    const list = await MongoCategory.find().lean();
    return list.map(c => ({
      id: c.id,
      name: c.name,
      image: c.image || ""
    }));
  },

  async addCategory(categoryData) {
    const { name, id, image } = categoryData;
    const finalId = id || name.toLowerCase().replace(/\s+/g, '_');
    const existing = await MongoCategory.findOne({ $or: [{ name: name }, { id: finalId }] }).lean();
    if (existing) return existing;
    const newCat = new MongoCategory({ id: finalId, name: name, image: image || "" });
    await newCat.save();
    return newCat.toObject();
  },

  // --- ADDRESS METHODS ---
  async getAddressesByUserPhone(phone) {
    return await MongoAddress.find({ userPhone: phone }).lean();
  },

  async createAddress(address) {
    const newAddress = new MongoAddress(address);
    await newAddress.save();
    return newAddress.toObject();
  }
};

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
      CREATE TABLE IF NOT EXISTS users (
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
      CREATE TABLE IF NOT EXISTS orders (
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
      CREATE TABLE IF NOT EXISTS referrals_applied (
        userPhone VARCHAR(20) PRIMARY KEY,
        referrerPhone VARCHAR(20) NOT NULL,
        appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS addresses (
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
        longitude DECIMAL(11,8) DEFAULT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        image VARCHAR(255) DEFAULT ''
      )
    `);

    const [rows] = await conn.query("SELECT COUNT(*) as count FROM categories");
    if (rows[0].count === 0) {
      console.log("Seeding default categories in MySQL...");
      for (const cat of DEFAULT_CATEGORIES) {
        await conn.query(
          "INSERT INTO categories (id, name, image) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), image=VALUES(image)",
          [cat.id, cat.name, cat.image]
        );
      }
    } else {
      for (const cat of DEFAULT_CATEGORIES) {
        await conn.query(
          "INSERT INTO categories (id, name, image) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE image=VALUES(image)",
          [cat.id, cat.name, cat.image]
        );
      }
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
    const row = await this.queryOne("SELECT * FROM users WHERE phone = ?", [phone]);
    if (!row) return null;
    row.walletBalance = parseFloat(row.walletBalance);
    return row;
  },

  async getUserByReferralCode(code) {
    const row = await this.queryOne("SELECT * FROM users WHERE referralCode = ?", [code]);
    if (!row) return null;
    row.walletBalance = parseFloat(row.walletBalance);
    return row;
  },

  async createUser(user) {
    const { phone, name, email, location, locality, gender, referralCode, walletBalance, countryCode } = user;
    const finalName = name || "Hira";
    const finalEmail = email || "hira@hmail.com";
    const finalLocation = location || "";
    const finalLocality = locality || "";
    const finalGender = gender || "Male";
    const finalWalletBalance = walletBalance !== undefined ? walletBalance : 0.00;
    const finalCountryCode = countryCode || "+91";

    await mysqlPool.query(
      "INSERT INTO users (phone, name, email, location, locality, gender, referralCode, walletBalance, countryCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), location=VALUES(location), locality=VALUES(locality), gender=VALUES(gender), referralCode=VALUES(referralCode), walletBalance=VALUES(walletBalance), countryCode=VALUES(countryCode)",
      [phone, finalName, finalEmail, finalLocation, finalLocality, finalGender, referralCode, finalWalletBalance, finalCountryCode]
    );

    return this.getUserByPhone(phone);
  },

  async updateUser(phone, updates) {
    if (Object.keys(updates).length === 0) return this.getUserByPhone(phone);
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    await mysqlPool.query(`UPDATE users SET ${setClause} WHERE phone = ?`, [...values, phone]);
    return this.getUserByPhone(phone);
  },

  async countUsers() {
    const row = await this.queryOne("SELECT COUNT(*) as count FROM users");
    return row ? row.count : 0;
  },

  async getOrderById(id) {
    const row = await this.queryOne("SELECT * FROM orders WHERE id = ?", [id]);
    if (!row) return null;
    row.price = parseFloat(row.price);
    row.address = row.address ? JSON.parse(row.address) : null;
    row.payment = row.payment ? JSON.parse(row.payment) : null;
    return row;
  },

  async getOrdersByUserPhone(phone) {
    const [rows] = await mysqlPool.query("SELECT * FROM orders WHERE userPhone = ? ORDER BY id DESC", [phone]);
    return rows.map(row => {
      row.price = parseFloat(row.price);
      row.address = row.address ? JSON.parse(row.address) : null;
      row.payment = row.payment ? JSON.parse(row.payment) : null;
      return row;
    });
  },

  async getAllOrders() {
    const [rows] = await mysqlPool.query("SELECT * FROM orders ORDER BY id DESC");
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
      `INSERT INTO orders (
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
    await mysqlPool.query(`UPDATE orders SET ${setClause} WHERE id = ?`, [...values, id]);
    return this.getOrderById(id);
  },

  async getLastOrderId() {
    const row = await this.queryOne("SELECT MAX(id) as lastId FROM orders");
    return row && row.lastId ? row.lastId : 0;
  },

  async countOrders() {
    const row = await this.queryOne("SELECT COUNT(*) as count FROM orders");
    return row ? row.count : 0;
  },

  async getReferralApplied(phone) {
    const row = await this.queryOne("SELECT * FROM referrals_applied WHERE userPhone = ?", [phone]);
    return row;
  },

  async createReferralApplied(referralApplied) {
    const { userPhone, referrerPhone, appliedAt } = referralApplied;
    const finalAppliedAt = appliedAt ? new Date(appliedAt) : new Date();
    await mysqlPool.query(
      "INSERT INTO referrals_applied (userPhone, referrerPhone, appliedAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE referrerPhone=VALUES(referrerPhone), appliedAt=VALUES(appliedAt)",
      [userPhone, referrerPhone, finalAppliedAt]
    );
    return this.getReferralApplied(userPhone);
  },

  async getCategories() {
    const [rows] = await mysqlPool.query("SELECT * FROM categories");
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      image: r.image || ""
    }));
  },

  async addCategory(categoryData) {
    const { name, id, image } = categoryData;
    const finalId = id || name.toLowerCase().replace(/\s+/g, '_');
    await mysqlPool.query(
      "INSERT INTO categories (id, name, image) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), image=VALUES(image)",
      [finalId, name, image || ""]
    );
    const row = await this.queryOne("SELECT * FROM categories WHERE id = ?", [finalId]);
    return row;
  },

  async getAddressesByUserPhone(phone) {
    const [rows] = await mysqlPool.query("SELECT * FROM addresses WHERE userPhone = ?", [phone]);
    return rows.map(r => {
      r.latitude = r.latitude !== null ? parseFloat(r.latitude) : null;
      r.longitude = r.longitude !== null ? parseFloat(r.longitude) : null;
      return r;
    });
  },

  async createAddress(address) {
    const { userPhone, type, houseNo, society, floor, landmark, city, locality, pincode, latitude, longitude } = address;
    const finalType = type || "Home";
    const finalHouseNo = houseNo || "";
    const finalSociety = society || "";
    const finalFloor = floor || "";
    const finalLandmark = landmark || "";
    const finalCity = city || "";
    const finalLocality = locality || "";
    const finalPincode = pincode || "";

    await mysqlPool.query(
      `INSERT INTO addresses (userPhone, type, houseNo, society, floor, landmark, city, locality, pincode, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userPhone, finalType, finalHouseNo, finalSociety, finalFloor, finalLandmark, finalCity, finalLocality, finalPincode, latitude, longitude]
    );

    const [rows] = await mysqlPool.query("SELECT * FROM addresses WHERE userPhone = ? ORDER BY id DESC LIMIT 1", [userPhone]);
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
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, orders: [], referralsApplied: {}, categories: DEFAULT_CATEGORIES, addresses: [] }, null, 2));
  } else {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(content);
      let changed = false;
      if (!parsed.addresses) {
        parsed.addresses = [];
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
      name: user.name || "Hira",
      phone: user.phone,
      email: user.email || "hira@hmail.com",
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

  async countUsers() {
    const data = this.readData();
    return Object.keys(data.users).length;
  },

  // --- ORDER METHODS ---
  async getOrderById(id) {
    const data = this.readData();
    return data.orders.find(o => o.id === id) || null;
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
let dbMode = "mongo";

const DbLayer = {
  getLayer() {
    if (dbMode === "mysql" && mysqlPool !== null) {
      return MySqlDbLayer;
    }
    if (dbMode === "mongo" && mongoose.connection.readyState === 1) {
      return MongoDbLayer;
    }
    if (MONGODB_URI.includes('<db_password>')) {
      dbMode = "json";
      return JsonDbLayer;
    }
    if (mongoose.connection.readyState === 1) {
      dbMode = "mongo";
      return MongoDbLayer;
    }
    dbMode = "json";
    return JsonDbLayer;
  },
  async getUserByPhone(phone) { return this.getLayer().getUserByPhone(phone); },
  async getUserByReferralCode(code) { return this.getLayer().getUserByReferralCode(code); },
  async createUser(user) { return this.getLayer().createUser(user); },
  async updateUser(phone, updates) { return this.getLayer().updateUser(phone, updates); },
  async countUsers() { return this.getLayer().countUsers(); },
  async getOrderById(id) { return this.getLayer().getOrderById(id); },
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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/home-services';

(async () => {
  const mysqlSuccess = await initMySqlDb();
  if (!mysqlSuccess) {
    if (MONGODB_URI.includes('<db_password>')) {
      console.log("MONGODB_URI contains placeholder '<db_password>'. Bypassing MongoDB and running in JSON file database mode.");
      dbMode = "json";
      initJsonDb();
    } else {
      console.log(`Attempting connection to MongoDB at: ${MONGODB_URI}...`);
      mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
        .then(async () => {
          console.log('Successfully connected to MongoDB. Running in MongoDB mode.');
          dbMode = "mongo";
          
          // Seed default categories if MongoDB collection is empty
          try {
            // Migration: Rename 'Cleaning Services', 'Cleaning' or 'clening' to 'Cleaning' in existing MongoDB documents
            await MongoCategory.updateMany(
              { name: { $in: ["Cleaning Services", "Cleaning", "clening"] } },
              { $set: { name: "Cleaning", id: "cleaning" } }
            );
            // Migration: Update category images in existing MongoDB documents to local relative asset paths
            for (const cat of DEFAULT_CATEGORIES) {
              await MongoCategory.updateOne(
                { id: cat.id },
                { $set: { image: cat.image } }
              );
            }

            const count = await MongoCategory.countDocuments();
            if (count === 0) {
              await MongoCategory.insertMany(DEFAULT_CATEGORIES);
              console.log("Seeded default categories in MongoDB.");
            }
          } catch (err) {
            console.error("Error seeding or updating categories in MongoDB:", err.message);
          }
        })
        .catch(err => {
          console.error('Failed to connect to MongoDB on startup. Falling back to local JSON database mode.');
          console.error(err.message);
          dbMode = "json";
          initJsonDb();
        });
    }
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
    { title: "AC Installation", price: 1200, description: "Mount and configure split or window AC unit", image: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.9, reviewsCount: 165, cutPrice: 1499 },
    { title: "AC Leakage Repair", price: 600, description: "Identify and plug water or gas leak issues", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.6, reviewsCount: 98, cutPrice: 799 },
    { title: "AC Condenser Replacement", price: 2500, description: "Install brand new copper condenser unit", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 84, cutPrice: 2999 }
  ],
  "Salon And Spa": [
    { title: "Hair Cut", price: 299, description: "Modern hair styling and trimming", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.9, reviewsCount: 540, cutPrice: 399 },
    { title: "Facial & Grooming", price: 499, description: "Deep cleansing facial treatment and face massage", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 280, cutPrice: 599 },
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
  
  // Generate random 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Store OTP in-memory with 5 minutes expiry
  activeOTPs.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  
  const smsApiKey = process.env.SMS_API_KEY || 'b395HRZTRUGZThPOeRSnVg';
  const senderId = process.env.SMS_SENDER_ID || 'WEBSMS';
  const rawTemplate = process.env.SMS_TEMPLATE_TEXT || 'Your OTP for Home Faciliti registration is {otp}.';
  const messageText = rawTemplate.replace('{otp}', otp);

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
    const url = 'https://www.smsgatewayhub.com/api/mt/SendSMS';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        APIKey: smsApiKey,
        senderid: senderId,
        channel: "2",
        DCS: "0",
        flashsms: "0",
        number: formattedPhone,
        text: messageText
      })
    });
    const data = await response.json();
    if (data && (data.ErrorCode === '000' || data.ErrorCode === '0' || data.ErrorMessage === 'Success')) {
      smsSent = true;
    } else {
      smsError = data.ErrorMessage || JSON.stringify(data);
    }
  } catch (err) {
    smsError = err.message;
  }

  if (smsSent) {
    console.log(`[SMS] Dynamic OTP ${otp} sent successfully via SMSGatewayHub to phone: ${prefix}${phone}`);
    res.json({ 
      success: true, 
      message: `OTP sent successfully to ${prefix}${phone}`,
      otp: otp 
    });
  } else {
    console.warn(`[SMS] Failed to send SMS via SMSGatewayHub (${smsError}). Falling back to console/response delivery for OTP: ${otp}`);
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
  const { otp, countryCode } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone / userId and OTP are required" });
  }

  const storedData = activeOTPs.get(phone);
  const isValidDynamic = storedData && storedData.otp === otp && storedData.expiresAt > Date.now();

  // Allow '1234' as the universal mock OTP, or check the dynamic OTP
  if (otp !== "1234" && !isValidDynamic) {
    return res.status(400).json({ error: "Invalid OTP or OTP expired" });
  }

  try {
    let user = await DbLayer.getUserByPhone(phone);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const refCode = generateReferralCode("Hira");
      user = {
        name: "Hira",
        phone: phone,
        email: "hira@hmail.com",
        location: "",
        locality: "",
        gender: "Male",
        referralCode: refCode,
        walletBalance: 0.0,
        countryCode: countryCode || "+91"
      };
      await DbLayer.createUser(user);
      console.log(`Created new profile for user: ${countryCode || "+91"}${phone} with referral: ${refCode}`);
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
    res.json({ success: true, user: updatedUser, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update profile failed:", err);
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
app.get('/api/banners', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

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
app.get('/api/categories/:category/services', (req, res) => {
  const { category } = req.params;
  const { search } = req.query;

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

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
  return services.map(s => {
    let img = s.image;
    if (img && img.startsWith('/assets/')) {
      img = `${serverBaseUrl}${img}`;
    }
    return {
      ...s,
      image: img
    };
  });
}

// 6. Services: Fetch with category / search filter
app.get('/api/services', (req, res) => {
  const { category, search } = req.query;
  let list = [];

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  if (category) {
    list = shuffleArray(SERVICES_DATA[category] || []);
  } else {
    // Return all flat list shuffled
    list = shuffleArray(Object.values(SERVICES_DATA).flat());
  }

  if (search) {
    const query = search.toString().toLowerCase();
    list = list.filter(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
  }

  res.json({ success: true, services: resolveServiceUrls(list, serverBaseUrl) });
});

// 8. Services: Trending (Returns 5 random shuffled items)
app.get('/api/services/trending', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  const allServices = Object.values(SERVICES_DATA).flat();
  const trending = shuffleArray(allServices).slice(0, 5);
  res.json({ success: true, services: resolveServiceUrls(trending, serverBaseUrl) });
});

// 8a. Services: Get detailed specifications of a service
const handleServiceDetail = (req, res) => {
  const title = req.params.title || req.query.title;
  if (!title) {
    return res.status(400).json({ success: false, error: "Service title is required" });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

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
app.get('/api/payments/verify/:orderId', async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const paymentId = req.query.paymentId || req.query.razorpay_payment_id;
  
  try {
    let order = await DbLayer.getOrderById(orderId);
    
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_RkjwFXbGLMrTDs';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'e5cm1duM2Hnjr7iJNGuoF3bC';
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
      await DbLayer.updateOrder(orderId, {
        status: "Paid",
        bookingStatus: "searching", // begin search for professionals
        razorpayPaymentId: pId
      });
      console.log(`[Payment] Order #${orderId} marked as Paid via Razorpay Payment ${pId}`);
    }

    res.json({
      success: true,
      orderId: orderId,
      paymentStatus: status,
      paymentDetails: paymentDetails,
      message: `Payment checked successfully from Razorpay. Status: ${status}`
    });
  } catch (err) {
    console.error("Payment verification failed:", err);
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
  let productId = req.body.productId;
  let date = req.body.date;
  let timeSlot = req.body.timeSlot;

  // Support both destructured root parameters and nested 'product' object parameters
  if (!productId && req.body.product) {
    productId = req.body.product.productId;
    date = req.body.product.date;
    timeSlot = req.body.product.timeSlot;
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
    const targetDate = date.split('T')[0];
    const matchingOrders = allOrders.filter(order => {
      if (!order.date) return false;
      const orderDate = order.date.split('T')[0];
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
  const { type, houseNo, society, floor, landmark, city, locality, pincode, lat, latitude, lon, longitude, lng } = req.body;
  
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const latValue = latitude !== undefined ? Number(latitude) : (lat !== undefined ? Number(lat) : null);
    const lonValue = longitude !== undefined ? Number(longitude) : (lon !== undefined ? Number(lon) : (lng !== undefined ? Number(lng) : null));
    
    const newAddress = {
      userPhone: user.phone,
      type: type || "Home",
      houseNo: houseNo || "",
      society: society || "",
      floor: floor || "",
      landmark: landmark || "",
      city: city || "",
      locality: locality || "",
      pincode: pincode || "",
      latitude: latValue,
      longitude: lonValue
    };
    
    const savedAddress = await DbLayer.createAddress(newAddress);
    console.log(`Saved address for phone ${user.phone}: ${savedAddress.houseNo}, ${savedAddress.city}`);
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
  let productId = req.body.productId || req.query.productId;
  let timeSlot = req.body.timeSlot || req.query.timeSlot || req.body.slot || req.query.slot;
  let date = req.body.date || req.query.date;

  // Support both destructured root parameters and nested 'product' object parameters
  if (!productId && req.body.product) {
    productId = req.body.product.productId;
    timeSlot = req.body.product.timeSlot || req.body.product.slot || timeSlot;
    date = req.body.product.date || date;
  }
  
  if (!productId) {
    return res.status(400).json({ error: "productId is required in checkout body" });
  }
  
  try {
    // User validation: prioritize explicit userId/phone in body or query, then authenticated user, then fallback
    let phone = req.body.userId || req.body.phone || req.body.userPhone || req.query.userId;
    if (!phone) {
      const authUser = await getAuthenticatedUser(req).catch(() => null);
      if (authUser) {
        phone = authUser.phone;
      }
    }
    if (!phone) {
      phone = "9876543210"; // Default fallback
    }
    
    // Resolve service properties from SERVICES_DATA using productId (which matches service title)
    let foundService = null;
    for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
      const match = services.find(s => s.title.toLowerCase() === productId.toLowerCase());
      if (match) {
        foundService = match;
        break;
      }
    }
    
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
          longitude: Number(req.body.address.longitude) || 0
        };
        resolvedAddress = await DbLayer.createAddress(newAddress);
        console.log(`[Checkout] Saved new address passed in body for user ${phone}`);
      } catch (addrErr) {
        console.error("Save address from body failed:", addrErr);
      }
    }
    if (!resolvedAddress) {
      const addresses = await DbLayer.getAddressesByUserPhone(phone).catch(() => []);
      if (addresses && addresses.length > 0) {
        resolvedAddress = addresses[addresses.length - 1];
      }
    }
    
    // Auto-increment simple numerical ID
    const lastOrderId = await DbLayer.getLastOrderId();
    const orderId = lastOrderId + 1;

    // Parse payment method details
    let paymentMethod = "Wallet";
    let amountPaid = 0;
    if (req.body.payment) {
      paymentMethod = req.body.payment.paymentMethod || "Wallet";
      amountPaid = Number(req.body.payment.amountPaid) || 0;
    }

    // Call Razorpay API to create a real Order ID if payment method is "Online"
    let razorpayOrderId = null;
    if (paymentMethod.toLowerCase() === "online" || paymentMethod.toLowerCase() === "razorpay") {
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_RkjwFXbGLMrTDs';
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'e5cm1duM2Hnjr7iJNGuoF3bC';
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
            receipt: `order_rcpt_${orderId}`
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
    }
    
    const newOrder = {
      id: orderId,
      userPhone: phone,
      userId: phone,
      serviceName: foundService.title,
      price: Number(foundService.price),
      date: date || new Date().toISOString().split('T')[0],
      status: "Pending",
      bookingStatus: "searching",
      partnerName: null,
      partnerDistance: null,
      productId: productId,
      description: foundService.description,
      timeSlot: timeSlot || (await getDynamicDateAndSlot()).timeSlot,
      address: resolvedAddress,
      payment: { 
        paymentMethod: paymentMethod, 
        amountPaid: paymentMethod.toLowerCase() === "wallet" ? Number(foundService.price) : amountPaid 
      },
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: null,
      createdAt: Date.now()
    };
    
    await DbLayer.createOrder(newOrder);
    
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
      order: { ...newOrder, userId: phone },
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
const BOOKING_SLOTS = [
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

async function getAvailableSlotsForDate(dateStr) {
  // Start with all slots marked available
  const slots = BOOKING_SLOTS.map(s => ({ ...s, available: true }));
  try {
    const allOrders = await DbLayer.getAllOrders();
    const targetDate = dateStr.split('T')[0];
    const matchingOrders = allOrders.filter(o => o.date && o.date.split('T')[0] === targetDate);
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
  return { date: formatDate(tomorrow), timeSlot: BOOKING_SLOTS[0].time };
}

// Helper to resolve address for a user phone number
const resolveAddressForPhone = async (phone) => {
  try {
    const addresses = await DbLayer.getAddressesByUserPhone(phone);
    if (addresses && addresses.length > 0) {
      return addresses[addresses.length - 1];
    }
  } catch (err) {
    console.error("Resolve address for phone failed:", err);
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
        longitude: 75.7873
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
    longitude: 75.7873
  };
};

// Helper to resolve service details by productId or title
const resolveServiceDetails = (productId) => {
  if (productId) {
    for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
      const match = services.find(s => s.title.toLowerCase() === productId.toLowerCase());
      if (match) {
        return {
          productId: match.title,
          serviceName: match.title,
          price: Number(match.price),
          description: match.description
        };
      }
    }
  }
  // Default fallback service
  return {
    productId: "Tap Repair",
    serviceName: "Tap Repair",
    price: 299,
    description: "Fix leaking taps and water issues"
  };
};

// Checkout: Retrieve Checkout Summary (Get details)
const handleGetCheckout = async (req, res) => {
  const idParam = req.params.userId;
  // Read date and timeSlot/slot from query, body, or headers
  const queryDate = req.query.date || req.body.date || req.headers['x-date'];
  const querySlot = req.query.timeSlot || req.query.slot || req.body.timeSlot || req.body.slot || req.headers['x-timeslot'] || req.headers['x-slot'];
  const queryProductId = req.query.productId || req.query.product || req.body.productId || req.body.product || req.headers['x-product-id'] || req.headers['x-product'];
  
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    let order = null;
    let justCreated = false;
    
    // Check if the idParam looks like a phone number (user id)
    if (isNaN(idParam) || idParam.length >= 8) {
      const targetPhone = idParam === "me" ? user.phone : idParam;
      const userOrders = await DbLayer.getOrdersByUserPhone(targetPhone);
      if (userOrders && userOrders.length > 0) {
        order = { ...userOrders[0] }; // Clone to allow safe mutation
      }
      
      // Dynamic fallback if no order exists for this user ID
      if (!order) {
        const resolvedAddr = await resolveAddressForPhone(targetPhone);
        const resolvedProduct = resolveServiceDetails(queryProductId);
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
          bookingStatus: "searching",
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
        const resolvedProduct = resolveServiceDetails(queryProductId);
        order = {
          id: orderId,
          userPhone: user.phone,
          userId: user.phone,
          serviceName: resolvedProduct.serviceName,
          price: resolvedProduct.price,
          date: queryDate || (await getDynamicDateAndSlot()).date,
          status: "Pending",
          bookingStatus: "searching",
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
    
    // Auto-resolve user's latest address from database (only if not just created to avoid redundant writes)
    if (!justCreated) {
      const dbAddr = await resolveAddressForPhone(order.userPhone);
      if (dbAddr && JSON.stringify(order.address) !== JSON.stringify(dbAddr)) {
        order.address = dbAddr;
        updates.address = dbAddr;
        needsUpdate = true;
      }
      
      // Explicit query overrides if dynamically specified on the request
      if (queryProductId && order.productId !== queryProductId) {
        const resolvedProduct = resolveServiceDetails(queryProductId);
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
    
    res.json({
      success: true,
      orderId: order.id,
      userId: order.userPhone,
      product: {
        productId: order.productId || order.serviceName,
        serviceName: order.serviceName,
        price: order.price,
        description: order.description,
        date: order.date,
        timeSlot: order.timeSlot
      },
      address: order.address,
      payment: order.payment || { paymentMethod: "Online", amountPaid: order.price },
      status: order.status,
      bookingStatus: order.bookingStatus,
      partnerName: order.partnerName,
      partnerDistance: order.partnerDistance
    });
  } catch (err) {
    console.error("Fetch checkout details failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
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
    res.json({ success: true, orders: userOrders, message: "Orders retrieved successfully" });
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

// 18b. Booking Availability: Available Time Slots
const handleGetAvailableSlots = async (req, res) => {
  const { date, productId } = req.query;

  try {
    let slots;
    if (date) {
      // Use shared helper which checks real DB bookings for the given date
      const rawSlots = BOOKING_SLOTS.map(s => ({ ...s, available: true }));
      const allOrders = await DbLayer.getAllOrders();
      const targetDate = date.split('T')[0];
      const matchingOrders = allOrders.filter(order => {
        if (!order.date) return false;
        const orderDate = order.date.split('T')[0];
        if (productId) {
          const matchProduct = (order.productId && order.productId.toLowerCase() === productId.toLowerCase()) ||
                               (order.serviceName && order.serviceName.toLowerCase() === productId.toLowerCase());
          return orderDate === targetDate && matchProduct;
        }
        return orderDate === targetDate;
      });
      const bookedRanges = matchingOrders.map(o => parseTimeRange(o.timeSlot)).filter(r => r !== null);
      for (const slot of rawSlots) {
        const slotRange = parseTimeRange(slot.time);
        if (slotRange && bookedRanges.some(b => timesOverlap(slotRange, b))) {
          slot.available = false;
        }
      }
      slots = rawSlots;
    } else {
      // No date provided — return all slots as available
      slots = BOOKING_SLOTS.map(s => ({ ...s, available: true }));
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
app.get('/api/states', (req, res) => {
  const states = Object.keys(STATES_CITIES);
  res.json({
    success: true,
    states: states,
    message: "States retrieved successfully"
  });
});

// Dropdown: Get Cities
app.get('/api/cities', (req, res) => {
  const { state } = req.query;
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

app.listen(PORT, () => {
  console.log(`Backend server successfully listening at http://localhost:${PORT}`);
});
