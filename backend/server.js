require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { translate } = require('./helpers/translate');
const { localizeCategory, localizeService, localizeAddress, runContentI18nMigration } = require('./helpers/contentI18n');

const getLocalCategoryAssetUrl = (name, serverBaseUrl) => {
  const norm = (name || '').toLowerCase().trim();
  let file = 'plumber_3d.png';
  
  if (norm.includes('plumb')) file = 'plumber_3d.png';
  else if (norm.includes('electric')) file = 'electrician_3d.png';
  else if (norm === 'salon' || norm.includes('salon')) file = 'salon_3d.jpg';
  else if (norm.includes('spa')) file = 'spa_3d.png';
  else if (norm.includes('clean')) file = 'cleaning_3d.jpg';
  else if (norm.includes('architect') || norm.includes('arch')) file = 'architecture_3d.png';
  else if (norm.includes('carpen') || norm.includes('wood')) file = 'carpenter_3d.jpg';
  else if (norm.includes('car') || norm.includes('wash')) file = 'car_washing_3d.jpg';
  else if (norm.includes('mechanic')) file = 'mechanic_3d.png';
  else if (norm.includes('ac') || norm.includes('air')) file = 'ac_repair_3d.jpg';
  else if (norm.includes('paint')) file = 'painter_3d.jpg';
  else if (norm.includes('bike') || norm.includes('motor')) file = 'bike_services_3d.jpg';
  else if (norm.includes('driver')) file = 'driver_3d.jpg';
  else if (norm.includes('photo')) file = 'photographer_3d.jpg';
  else if (norm.includes('doctor') || norm.includes('doc')) file = 'doctor_3d.png';
  else if (norm.includes('compound') || norm.includes('nurse')) file = 'compounder_3d.png';
  else if (norm.includes('halwai') || norm.includes('cater')) file = 'caters_3d.jpg';
  else if (norm.includes('contract')) file = 'contractor_3d.png';
  else if (norm.includes('pandit') || norm.includes('puja') || norm.includes('pooja')) file = 'pandat_ji_3d.png';
  else if (norm.includes('pest')) file = 'pest_control_3d.jpg';
  else if (norm.includes('solar')) file = 'solar_3d.png';
  else if (norm.includes('tax')) file = 'tax_consultancy_3d.jpg';
  else if (norm.includes('advocate') || norm.includes('legal')) file = 'advocate_3d.jpg';
  else if (norm.includes('interior')) file = 'interior_design_3d.png';
  else if (norm.includes('repair')) file = 'repairing_3d.jpg';
  
  return `${serverBaseUrl}/assets/categories/${file}`;
};

const getLocalBannerAssetUrl = (title, serverBaseUrl) => {
  const norm = (title || '').toLowerCase().trim();
  let file = 'refer_earn_banner.png';
  
  if (norm.includes('ac') || norm.includes('foam')) {
    file = 'ac_services_banner.png';
  } else if (norm.includes('clean') || norm.includes('home') || norm.includes('annual')) {
    file = 'amc_services_banner.png';
  } else {
    file = 'refer_earn_banner.png';
  }
  
  return `${serverBaseUrl}/assets/banners/${file}`;
};

const resolveDynamicCategoryImageUrl = (c, serverBaseUrl) => {
  let img = c.image || "";

  let cleanFilename = "";
  if (img.includes('adminbackend-1-h03r.onrender.com')) {
    cleanFilename = path.basename(img);
  } else if (img && !img.startsWith('http://') && !img.startsWith('https://') && !img.startsWith('/assets/')) {
    cleanFilename = img.replace(/^\/+/, '').replace(/^uploads\//, '');
  }

  // Only return /uploads/ URL if a custom uploaded file exists in backend/uploads/
  if (cleanFilename) {
    const localUploadPath = path.join(__dirname, 'uploads', cleanFilename);
    if (fs.existsSync(localUploadPath) && fs.statSync(localUploadPath).size > 0) {
      return `${serverBaseUrl}/uploads/${cleanFilename}`;
    }
  }

  if (img && img.startsWith('/assets/')) {
    return `${serverBaseUrl}${img}`;
  }

  // Default: Always return 3D Isometric Icon asset URL from assets/categories/
  return getLocalCategoryAssetUrl(c.name || c.title || '', serverBaseUrl);
};

const resolveDynamicBannerImageUrl = (b, serverBaseUrl) => {
  let img = b.image || b.bannerImage || b.imageUrl || b.photo || b.url || b.rawImage || "";

  let cleanFilename = "";
  if (img.includes('adminbackend-1-h03r.onrender.com')) {
    cleanFilename = path.basename(img);
  } else if (img && !img.startsWith('http://') && !img.startsWith('https://') && !img.startsWith('/assets/')) {
    cleanFilename = img.replace(/^\/+/, '').replace(/^uploads\//, '');
  }

  if (cleanFilename) {
    const localUploadPath = path.join(__dirname, 'uploads', cleanFilename);
    if (fs.existsSync(localUploadPath) && fs.statSync(localUploadPath).size > 0) {
      return `${serverBaseUrl}/uploads/${cleanFilename}`;
    }
  }

  if (img && img.startsWith('/assets/')) {
    return `${serverBaseUrl}${img}`;
  }

  return getLocalBannerAssetUrl(b.title || '', serverBaseUrl);
};

// Multer storage config for AMC document uploads
const amcStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'amc');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const amcUpload = multer({
  storage: amcStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WEBP images and PDF files are allowed'));
  }
});

function safeJsonParse(str, fallback = null) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    if (typeof str === 'string' && str.trim().length > 0) {
      return { houseNo: str, society: "", city: "", locality: "", landmark: "", pincode: "", name: "", alternateNumber: "", countryCode: "" };
    }
    return fallback;
  }
}

function parseOrderNumbers(row) {
  if (!row) return null;
  row.price = row.price !== undefined && row.price !== null ? Math.round(Number(row.price)) : 299;
  row.address = safeJsonParse(row.address);
  row.payment = safeJsonParse(row.payment);
  row.items = safeJsonParse(row.items) || [];
  row.advancePayment = row.advancePayment !== undefined && row.advancePayment !== null ? Math.round(Number(row.advancePayment)) : 199;
  row.remainingAmount = row.remainingAmount !== undefined && row.remainingAmount !== null ? Math.round(Number(row.remainingAmount)) : 0;
  return row;
}

let mysqlPool = null;
let mysqlReady = false; // true only after verified successful connection

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super_secret_jwt_key_123';

app.use(cors());
app.use(express.json());

// Deployment version tracker
const DEPLOY_VERSION = '2026-09-11-v2-3d-fix';
app.get('/api/version', (req, res) => res.json({ version: DEPLOY_VERSION, timestamp: new Date().toISOString() }));

// Multilingual System Middleware & Routes
const languageMiddleware = require('./middleware/language');
const languageRouter = require('./routes/language');
app.use(languageMiddleware);
app.use('/api', languageRouter);

app.use('/assets', express.static(path.join(__dirname, 'assets')));

const readDataFromJsonDb = () => {
  try {
    const p = path.join(__dirname, 'database.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.warn("Failed to read database.json:", e.message);
  }
  return null;
};

// Smart static, proxy & fallback middleware for /uploads
app.use('/uploads', async (req, res, next) => {
  const relPath = req.path.replace(/^\/+/, '');
  if (!relPath) return next();

  // 1. Check if newly uploaded file exists in backend/uploads/ (from Admin Panel)
  const uploadsPath = path.join(__dirname, 'uploads', relPath);
  if (fs.existsSync(uploadsPath) && fs.statSync(uploadsPath).size > 0) {
    return res.sendFile(uploadsPath);
  }

  // 2. Direct match in assets/categories/, assets/banners/, or assets/services/
  const catPath = path.join(__dirname, 'assets', 'categories', relPath);
  if (fs.existsSync(catPath)) return res.sendFile(catPath);

  const bannerPath = path.join(__dirname, 'assets', 'banners', relPath);
  if (fs.existsSync(bannerPath)) return res.sendFile(bannerPath);

  const srvPath = path.join(__dirname, 'assets', 'services', relPath);
  if (fs.existsSync(srvPath)) return res.sendFile(srvPath);

  // 3. Fallback logic: Match default 3D Isometric Category Icons & Banners
  const norm = relPath.toLowerCase();

  function sendCategoryFile(res, targetFilename) {
    const catDir = path.join(__dirname, 'assets', 'categories');
    const targetLower = targetFilename.toLowerCase();
    try {
      const files = fs.readdirSync(catDir);
      const match = files.find(f => f.toLowerCase() === targetLower);
      if (match) {
        return res.sendFile(path.join(catDir, match));
      }
    } catch (e) {}
    return res.sendFile(path.join(catDir, 'plumber_3d.png'));
  }

  // Car Washing
  if (norm.includes('1786447188981') || norm.includes('car') || norm.includes('wash') || norm.includes('auto') || norm.includes('detailing')) {
    return sendCategoryFile(res, 'car_washing_3d.jpg');
  }
  // Plumber
  if (norm.includes('1786436206314') || norm.includes('plumb') || norm.includes('tap') || norm.includes('pipe') || norm.includes('sink')) {
    return sendCategoryFile(res, 'plumber_3d.png');
  }
  // Electrician
  if (norm.includes('1786436786199') || norm.includes('wire') || norm.includes('electr') || norm.includes('fan') || norm.includes('switch')) {
    return sendCategoryFile(res, 'electrician_3d.png');
  }
  // Salon
  if (norm.includes('1786435950565') || norm.includes('salon') || norm.includes('hair') || norm.includes('beauty') || norm.includes('makeup')) {
    return sendCategoryFile(res, 'salon_3d.jpg');
  }
  // Spa
  if (norm.includes('1786442488680') || norm.includes('spa') || norm.includes('massage')) {
    return sendCategoryFile(res, 'spa_3d.png');
  }
  // Architecture / Interior
  if (norm.includes('1786446437586') || norm.includes('1786450010056') || norm.includes('architect') || norm.includes('interior') || norm.includes('draft')) {
    return sendCategoryFile(res, 'architecture_3d.png');
  }
  // Carpenter
  if (norm.includes('1786446696715') || norm.includes('carpen') || norm.includes('wood') || norm.includes('furniture')) {
    return sendCategoryFile(res, 'carpenter_3d.jpg');
  }
  // Mechanic
  if (norm.includes('1786447506154') || norm.includes('mechanic') || norm.includes('engine') || norm.includes('motor')) {
    return sendCategoryFile(res, 'mechanic_3d.png');
  }
  // AC Repair
  if (norm.includes('1786443552623') || norm.includes('ac') || norm.includes('cool')) {
    return sendCategoryFile(res, 'ac_repair_3d.jpg');
  }
  // Advocate
  if (norm.includes('1786443775719') || norm.includes('advocate') || norm.includes('legal') || norm.includes('lawyer')) {
    return sendCategoryFile(res, 'advocate_3d.jpg');
  }
  // Compounder
  if (norm.includes('1786444894705') || norm.includes('compound') || norm.includes('nurse')) {
    return sendCategoryFile(res, 'compounder_3d.png');
  }
  // Doctor
  if (norm.includes('1786449409020') || norm.includes('doctor') || norm.includes('health')) {
    return sendCategoryFile(res, 'doctor_3d.png');
  }
  // Catering / Halwai
  if (norm.includes('1786448684632') || norm.includes('cater') || norm.includes('chef') || norm.includes('halwai')) {
    return sendCategoryFile(res, 'caters_3d.jpg');
  }
  // Driver
  if (norm.includes('1786449239057') || norm.includes('driver')) {
    return sendCategoryFile(res, 'driver_3d.jpg');
  }
  // Pest Control
  if (norm.includes('1786450312316') || norm.includes('pest')) {
    return sendCategoryFile(res, 'pest_control_3d.jpg');
  }
  // Photographer
  if (norm.includes('1786450771532') || norm.includes('photo')) {
    return sendCategoryFile(res, 'photographer_3d.jpg');
  }
  // Painter
  if (norm.includes('1786451019343') || norm.includes('paint') || norm.includes('color')) {
    return sendCategoryFile(res, 'painter_3d.jpg');
  }
  // Repairing
  if (norm.includes('1786451422502') || norm.includes('repair')) {
    return sendCategoryFile(res, 'repairing_3d.jpg');
  }
  // Solar
  if (norm.includes('1786451601583') || norm.includes('solar') || norm.includes('panel')) {
    return sendCategoryFile(res, 'solar_3d.png');
  }
  // Tax Consultancy
  if (norm.includes('1786451938166') || norm.includes('tax')) {
    return sendCategoryFile(res, 'tax_consultancy_3d.jpg');
  }
  // Contractor
  if (norm.includes('1786452243309') || norm.includes('contract')) {
    return sendCategoryFile(res, 'contractor_3d.png');
  }
  // Pandit Ji
  if (norm.includes('1786452463146') || norm.includes('pandit') || norm.includes('pooja') || norm.includes('puja')) {
    return sendCategoryFile(res, 'pandat_ji_3d.png');
  }
  // Cleaning
  if (norm.includes('1786435733935') || norm.includes('clean')) {
    return sendCategoryFile(res, 'cleaning_3d.jpg');
  }
  // Iron Works / Welding
  if (norm.includes('1788515844051') || norm.includes('1786452895272') || norm.includes('iron') || norm.includes('weld')) {
    return sendCategoryFile(res, 'velding_icon_3d.png');
  }

  // Banner Matches (Direct HTTP 200 OK Banner PNG files)
  if (norm.includes('1787722971478') || norm.includes('ganesh') || norm.includes('chaturthi') || (norm.includes('banner') && norm.includes('ac'))) return res.sendFile(path.join(__dirname, 'assets', 'banners', 'ac_services_banner.png'));
  if (norm.includes('1787722479893') || norm.includes('amc') || norm.includes('home') || norm.includes('swayam')) return res.sendFile(path.join(__dirname, 'assets', 'banners', 'amc_services_banner.png'));
  if (norm.includes('refer') || norm.includes('earn') || norm.includes('banner') || norm.includes('1788783070948')) return res.sendFile(path.join(__dirname, 'assets', 'banners', 'refer_earn_banner.png'));

  // 4. Check if uploaded file exists in backend/assets/uploads/
  const assetsUploadsPath = path.join(__dirname, 'assets', 'uploads', relPath);
  if (fs.existsSync(assetsUploadsPath) && fs.statSync(assetsUploadsPath).size > 0) {
    return res.sendFile(assetsUploadsPath);
  }

  // Default Fallback
  sendCategoryFile(res, 'plumber_3d.png');
});

function getCanonicalPhone(phone) {
  if (!phone) return "";
  const clean = String(phone).replace(/\D/g, '');
  return clean.length >= 10 ? clean.substring(clean.length - 10) : clean;
}

// Active OTPs in-memory storage (phone -> { otp, expiresAt })
const activeOTPsMap = new Map();
const activeOTPs = {
  get(key) { return activeOTPsMap.get(getCanonicalPhone(key)); },
  set(key, val) { activeOTPsMap.set(getCanonicalPhone(key), val); return this; },
  delete(key) { return activeOTPsMap.delete(getCanonicalPhone(key)); },
  has(key) { return activeOTPsMap.has(getCanonicalPhone(key)); },
  clear() { activeOTPsMap.clear(); },
  values() { return activeOTPsMap.values(); },
  keys() { return activeOTPsMap.keys(); },
  entries() { return activeOTPsMap.entries(); },
  get size() { return activeOTPsMap.size; },
  [Symbol.iterator]() { return activeOTPsMap[Symbol.iterator](); }
};

// Active checkout draft bookings in-memory storage (phone -> draftOrderObject)
const draftOrdersMap = new Map();
const draftOrders = {
  get(key) { return draftOrdersMap.get(getCanonicalPhone(key)); },
  set(key, val) { draftOrdersMap.set(getCanonicalPhone(key), val); return this; },
  delete(key) { return draftOrdersMap.delete(getCanonicalPhone(key)); },
  has(key) { return draftOrdersMap.has(getCanonicalPhone(key)); },
  clear() { draftOrdersMap.clear(); },
  values() { return draftOrdersMap.values(); },
  keys() { return draftOrdersMap.keys(); },
  entries() { return draftOrdersMap.entries(); },
  get size() { return draftOrdersMap.size; },
  [Symbol.iterator]() { return draftOrdersMap[Symbol.iterator](); }
};
const isMockPaymentAllowed = () => {
  if (process.env.ALLOW_MOCK_PAYMENTS === "true") {
    return true;
  }
  if (process.env.ALLOW_MOCK_PAYMENTS === "false") {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwFaJKQjU5ZOsH';
  if (keyId.startsWith("rzp_live_")) {
    return false;
  }
  return true;
};
let lastSmsDebug = { timestamp: null, url: null, response: null, error: null };
const debugLogs = [];

// (Removed Mongoose/MongoDB Schemas, Models and MongoDbLayer)

// Centralized SMS helper using SMS Gateway Hub
const sendSMS = async (phone, messageText, templateId) => {
  const smsApiKey = process.env.SMS_API_KEY || 'b395HRZTRUGZThPOeRSnVg';
  const senderId = process.env.SMS_SENDER_ID || 'HMFCLI';
  const entityId = process.env.SMS_ENTITY_ID || '1201173444411453897';
  const dltTemplateId = templateId || process.env.SMS_DLT_TEMPLATE_ID || '1207173589889308632';

  // Format phone number: SMS Gateway Hub expects 91 prefix for Indian numbers without '+'
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.replace('+', '');
  }
  if (formattedPhone.length === 10) {
    formattedPhone = '91' + formattedPhone;
  }

  try {
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
    lastSmsDebug = {
      timestamp: new Date().toISOString(),
      url: url.replace(smsApiKey, '***'),
      response: null,
      error: null
    };
    console.log('[SMS] Sending request to:', url.replace(smsApiKey, '***'));
    const response = await fetch(url, { method: 'GET' });
    const rawText = await response.text();
    console.log('[SMS] Gateway Hub response:', rawText);
    lastSmsDebug.response = rawText;
    return { success: true, response: rawText };
  } catch (err) {
    console.error('[SMS] Send failed:', err.message);
    lastSmsDebug.error = err.message;
    return { success: false, error: err.message };
  }
};

// Booking Status SMS Trigger dispatcher
const handleBookingStatusSmsTrigger = async (order, oldStatus, newStatus) => {
  const phone = order.userPhone;
  const orderId = order.id;
  const serviceName = order.serviceName || order.productId || "Service";

  const oldS = (oldStatus || '').toLowerCase();
  const newS = (newStatus || '').toLowerCase();

  if (oldS === newS) return; // No change

  // Case 1: Booking Placed / Confirmed
  if ((oldS === '' || oldS === 'draft') && (newS === 'searching' || newS === 'accepted')) {
    const templateId = process.env.SMS_TEMPLATE_PLACED_ID || '1207173589889308632';
    const templateText = process.env.SMS_TEMPLATE_PLACED_TEXT || `Your booking for {serviceName} is confirmed with order ID #{orderId}. Thank You, Super Home`;
    const message = templateText.replace(/{orderId}/g, orderId).replace(/{serviceName}/g, serviceName).replace(/{#var#}/g, orderId);
    await sendSMS(phone, message, templateId);
  }

  // Case 2: Partner Assigned
  if (oldS === 'searching' && newS === 'accepted') {
    const partnerName = order.partnerName || "Our Expert Partner";
    const templateId = process.env.SMS_TEMPLATE_ACCEPTED_ID || '1207173589889308632';
    const templateText = process.env.SMS_TEMPLATE_ACCEPTED_TEXT || `Expert partner {partnerName} has been assigned to your order #{orderId}. Thank You, Super Home`;
    const message = templateText.replace(/{orderId}/g, orderId).replace(/{partnerName}/g, partnerName).replace(/{#var#}/g, partnerName);
    await sendSMS(phone, message, templateId);
  }

  // Case 3: Work Completed
  if (newS === 'completed') {
    const templateId = process.env.SMS_TEMPLATE_COMPLETED_ID || '1207173589889308632';
    const templateText = process.env.SMS_TEMPLATE_COMPLETED_TEXT || `Your service for order #{orderId} has been successfully completed. Thank You, Super Home`;
    const message = templateText.replace(/{orderId}/g, orderId).replace(/{#var#}/g, orderId);
    await sendSMS(phone, message, templateId);
  }

  // Case 4: Booking Cancelled
  if (newS === 'cancelled') {
    const templateId = process.env.SMS_TEMPLATE_CANCELLED_ID || '1207173589889308632';
    const templateText = process.env.SMS_TEMPLATE_CANCELLED_TEXT || `Your booking order #{orderId} has been cancelled. Thank You, Super Home`;
    const message = templateText.replace(/{orderId}/g, orderId).replace(/{#var#}/g, orderId);
    await sendSMS(phone, message, templateId);
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

const MySqlDbLayer = {
  async queryOne(sql, params) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  async getUserByPhone(phone) {
    const row = await this.queryOne("SELECT * FROM node_users_v2 WHERE phone IN (?) LIMIT 1", [getPhoneVariants(phone)]);
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
    const { phone, name, email, location, locality, gender, referralCode, walletBalance, countryCode, language } = user;
    const finalName = name || "";
    const finalEmail = email || "";
    const finalLocation = location || "";
    const finalLocality = locality || "";
    const finalGender = gender || "Male";
    const finalWalletBalance = walletBalance !== undefined ? walletBalance : 0.00;
    const finalCountryCode = countryCode || "+91";
    const finalLanguage = language || "en";

    await mysqlPool.query(
      "INSERT INTO node_users_v2 (phone, name, email, location, locality, gender, referralCode, walletBalance, countryCode, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), location=VALUES(location), locality=VALUES(locality), gender=VALUES(gender), referralCode=VALUES(referralCode), walletBalance=VALUES(walletBalance), countryCode=VALUES(countryCode), language=VALUES(language)",
      [phone, finalName, finalEmail, finalLocation, finalLocality, finalGender, referralCode, finalWalletBalance, finalCountryCode, finalLanguage]
    );

    return this.getUserByPhone(phone);
  },

  async updateUser(phone, updates) {
    const user = await this.getUserByPhone(phone);
    const targetPhone = user ? user.phone : phone;
    if (Object.keys(updates).length === 0) return user;
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    await mysqlPool.query(`UPDATE node_users_v2 SET ${setClause} WHERE phone = ?`, [...values, targetPhone]);
    return this.getUserByPhone(targetPhone);
  },

  async deleteUser(phone) {
    const user = await this.getUserByPhone(phone);
    const targetPhone = user ? user.phone : phone;
    await mysqlPool.query("DELETE FROM node_users_v2 WHERE phone = ?", [targetPhone]);
    await mysqlPool.query("DELETE FROM node_addresses_v2 WHERE userPhone = ?", [targetPhone]);
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
    return parseOrderNumbers(row);
  },

  async getOrderByRazorpayOrderId(rzpOrderId) {
    const row = await this.queryOne("SELECT * FROM node_orders_v2 WHERE razorpayOrderId = ?", [rzpOrderId]);
    return parseOrderNumbers(row);
  },

  async getOrdersByUserPhone(phone) {
    const [rows] = await mysqlPool.query("SELECT * FROM node_orders_v2 WHERE userPhone IN (?) ORDER BY id DESC", [getPhoneVariants(phone)]);
    return rows.map(row => parseOrderNumbers(row));
  },

  async getAllOrders() {
    const [rows] = await mysqlPool.query("SELECT * FROM node_orders_v2 ORDER BY id DESC");
    return rows.map(row => parseOrderNumbers(row));
  },

  async getWalletTransactions(phone) {
    const [rows] = await mysqlPool.query("SELECT * FROM node_wallet_transactions WHERE userPhone IN (?) ORDER BY id DESC", [getPhoneVariants(phone)]);
    return rows.map(row => {
      row.amount = parseFloat(row.amount);
      return row;
    });
  },

  async createWalletTransaction(tx) {
    const { userPhone, amount, type, description, senderName } = tx;
    await mysqlPool.query(
      "INSERT INTO node_wallet_transactions (userPhone, amount, type, description, senderName) VALUES (?, ?, ?, ?, ?)",
      [userPhone, amount, type, description, senderName || null]
    );
  },

  async getAmcSubscriptions(phone) {
    const [rows] = await mysqlPool.query("SELECT * FROM node_amc_subscriptions WHERE userPhone IN (?) ORDER BY startDate DESC", [getPhoneVariants(phone)]);
    return rows;
  },

  async createAmcSubscription(sub) {
    const { amcId, userPhone, category, areaSqFt, floors, price, endDate, photoUrl, pdfUrl, note, fileUrl, status } = sub;
    await mysqlPool.query(
      "INSERT INTO node_amc_subscriptions (amcId, userPhone, category, areaSqFt, floors, price, endDate, photoUrl, pdfUrl, note, fileUrl, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [amcId, userPhone, category, areaSqFt, floors, price, endDate, photoUrl || null, pdfUrl || null, note || null, fileUrl || null, status || 'pending_payment']
    );
  },

  async getAmcSubscriptionById(amcId) {
    const row = await this.queryOne("SELECT * FROM node_amc_subscriptions WHERE amcId = ?", [amcId]);
    return row;
  },

  async updateAmcSubscription(amcId, updates) {
    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(updates)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
    values.push(amcId);
    await mysqlPool.query(
      `UPDATE node_amc_subscriptions SET ${fields.join(', ')} WHERE amcId = ?`,
      values
    );
  },

  async countAmcBookingsCompleted(amcId) {
    const row = await this.queryOne("SELECT COUNT(*) as count FROM node_orders_v2 WHERE amcId = ? AND status = 'Completed'", [amcId]);
    return row ? row.count : 0;
  },

  async countAmcBookingsInCurrentMonth(amcId) {
    const row = await this.queryOne(
      `SELECT COUNT(*) as count FROM node_orders_v2 
       WHERE amcId = ? AND (status IS NULL OR LOWER(status) != 'cancelled') 
       AND (
         DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m') 
         OR 
         DATE_FORMAT(FROM_UNIXTIME(createdAt / 1000), '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
       )`,
      [amcId]
    );
    return row ? row.count : 0;
  },

  async getAmcSubscriptionByCategory(phone, category) {
    const row = await this.queryOne(
      "SELECT * FROM node_amc_subscriptions WHERE userPhone IN (?) AND category = ? AND status = 'active' AND endDate > NOW() LIMIT 1",
      [getPhoneVariants(phone), category]
    );
    return row;
  },

  async updateAmcSubscription(amcId, updates) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.getAmcSubscriptionById(amcId);
    const sets = keys.map(k => `${k} = ?`).join(", ");
    const values = keys.map(k => updates[k]);
    await mysqlPool.query(`UPDATE node_amc_subscriptions SET ${sets} WHERE amcId = ?`, [...values, amcId]);
    return this.getAmcSubscriptionById(amcId);
  },

  async getSavedCards(phone) {
    const [rows] = await mysqlPool.query("SELECT * FROM node_saved_cards WHERE userPhone IN (?) ORDER BY createdAt DESC", [getPhoneVariants(phone)]);
    return rows;
  },

  async createSavedCard(card) {
    const { userPhone, cardHolderName, cardNumber, expiryDate, cardType } = card;
    const [result] = await mysqlPool.query(
      "INSERT INTO node_saved_cards (userPhone, cardHolderName, cardNumber, expiryDate, cardType) VALUES (?, ?, ?, ?, ?)",
      [userPhone, cardHolderName, cardNumber, expiryDate, cardType]
    );
    return { id: result.insertId, ...card };
  },

  async createOrder(order) {
    const {
      id, userPhone, serviceName, price, date, status, bookingStatus,
      partnerName, partnerDistance, productId, description, timeSlot,
      address, payment, razorpayOrderId, razorpayPaymentId, createdAt,
      amcId, advancePayment, remainingAmount, items
    } = order;

    const finalStatus = status || "Pending";
    const finalBookingStatus = bookingStatus || "searching";
    const finalAddress = address ? JSON.stringify(address) : null;
    const finalPayment = payment ? JSON.stringify(payment) : null;
    const finalItems = items ? JSON.stringify(items) : null;
    const finalCreatedAt = createdAt || Date.now();
    const finalAmcId = amcId || null;
    const finalAdvance = advancePayment !== undefined ? advancePayment : 199.00;
    const finalRemaining = remainingAmount !== undefined ? remainingAmount : 0.00;

    await mysqlPool.query(
      `INSERT INTO node_orders_v2 (
        id, userPhone, serviceName, price, date, status, bookingStatus,
        partnerName, partnerDistance, productId, description, timeSlot,
        address, payment, razorpayOrderId, razorpayPaymentId, createdAt, amcId,
        advancePayment, remainingAmount, items
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        userPhone=VALUES(userPhone), serviceName=VALUES(serviceName), price=VALUES(price),
        date=VALUES(date), status=VALUES(status), bookingStatus=VALUES(bookingStatus),
        partnerName=VALUES(partnerName), partnerDistance=VALUES(partnerDistance),
        productId=VALUES(productId), description=VALUES(description), timeSlot=VALUES(timeSlot),
        address=VALUES(address), payment=VALUES(payment), razorpayOrderId=VALUES(razorpayOrderId),
        razorpayPaymentId=VALUES(razorpayPaymentId), createdAt=VALUES(createdAt), amcId=VALUES(amcId),
        advancePayment=VALUES(advancePayment), remainingAmount=VALUES(remainingAmount), items=VALUES(items)`,
      [
        id, userPhone, serviceName, price, date, finalStatus, finalBookingStatus,
        partnerName, partnerDistance, productId, description, timeSlot,
        finalAddress, finalPayment, razorpayOrderId, razorpayPaymentId, finalCreatedAt, finalAmcId,
        finalAdvance, finalRemaining, finalItems
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
    // Read directly from node_categories table
    const [rows] = await mysqlPool.query(
      "SELECT * FROM node_categories WHERE status = 1"
    );
    return rows.map(r => {
      let img = r.image || "";
      if (img && !img.startsWith('http') && !img.startsWith('https') && !img.startsWith('/assets/')) {
        img = `https://adminbackend-1-h03r.onrender.com/uploads/${img.replace(/^uploads\//, '')}`;
      }
      return {
        ...r,
        id: String(r.id),
        name: r.title,
        image: img
      };
    });
  },

  async addCategory(categoryData) {
    const { name, id, image } = categoryData;
    await mysqlPool.query(
      "INSERT INTO node_categories (title, parent, image, status) VALUES (?, 'None', ?, 1)",
      [name, image || ""]
    );
    const row = await this.queryOne("SELECT * FROM node_categories WHERE title = ?", [name]);
    if (!row) return null;
    let img = row.image || "";
    if (img && !img.startsWith('http') && !img.startsWith('https') && !img.startsWith('/assets/')) {
      img = `https://adminbackend-1-h03r.onrender.com/uploads/${img.replace(/^uploads\//, '')}`;
    }
    return {
      id: String(row.id),
      name: row.title,
      image: img
    };
  },

  async updateCategory(id, categoryData) {
    const { name, title, image, status } = categoryData;
    const catTitle = title || name || "";
    await mysqlPool.query(
      "UPDATE node_categories SET title = IFNULL(?, title), image = IFNULL(?, image), status = IFNULL(?, status) WHERE id = ?",
      [catTitle || null, image || null, status !== undefined ? status : 1, id]
    );
    return { id: String(id), name: catTitle, image: image || "" };
  },

  async deleteCategory(id) {
    await mysqlPool.query("DELETE FROM node_categories WHERE id = ?", [id]);
    return true;
  },

  async addBanner(bannerData) {
    const { title, image, bannerImage, category, badge, subtitle, buttonText } = bannerData;
    const bannerImg = image || bannerImage || "";
    const [res] = await mysqlPool.query(
      "INSERT INTO node_banners (title, image, category, badge, subtitle, buttonText) VALUES (?, ?, ?, ?, ?, ?)",
      [title || "", bannerImg, category || "", badge || "", subtitle || "", buttonText || "Book Now"]
    );
    return { id: String(res.insertId), ...bannerData, image: bannerImg };
  },

  async updateBanner(id, bannerData) {
    const { title, image, bannerImage, category, badge, subtitle, buttonText } = bannerData;
    const bannerImg = image || bannerImage || "";
    await mysqlPool.query(
      "UPDATE node_banners SET title = IFNULL(?, title), image = IFNULL(?, image), category = IFNULL(?, category), badge = IFNULL(?, badge), subtitle = IFNULL(?, subtitle), buttonText = IFNULL(?, buttonText) WHERE id = ?",
      [title || null, bannerImg || null, category || null, badge || null, subtitle || null, buttonText || null, id]
    );
    return { id: String(id), ...bannerData };
  },

  async deleteBanner(id) {
    await mysqlPool.query("DELETE FROM node_banners WHERE id = ?", [id]);
    return true;
  },

  async addService(serviceData) {
    const { title, name, category, category_id, price, description, image } = serviceData;
    const srvTitle = title || name || "";
    const [res] = await mysqlPool.query(
      "INSERT INTO node_services (title, category_id, price, description, image, status) VALUES (?, ?, ?, ?, ?, 1)",
      [srvTitle, category_id || 1, price || 0, description || "", image || ""]
    );
    return { id: String(res.insertId), title: srvTitle, price, image };
  },

  async updateService(id, serviceData) {
    const { title, name, price, description, image, status } = serviceData;
    const srvTitle = title || name || null;
    await mysqlPool.query(
      "UPDATE node_services SET title = IFNULL(?, title), price = IFNULL(?, price), description = IFNULL(?, description), image = IFNULL(?, image), status = IFNULL(?, status) WHERE id = ?",
      [srvTitle, price || null, description || null, image || null, status !== undefined ? status : 1, id]
    );
    return { id: String(id), ...serviceData };
  },

  async deleteService(id) {
    await mysqlPool.query("DELETE FROM node_services WHERE id = ?", [id]);
    return true;
  },

  async getAddressesByUserPhone(phone) {
    const [rows] = await mysqlPool.query("SELECT * FROM node_addresses_v2 WHERE userPhone IN (?)", [getPhoneVariants(phone)]);
    return rows.map(r => {
      r.latitude = r.latitude !== null ? parseFloat(r.latitude) : null;
      r.longitude = r.longitude !== null ? parseFloat(r.longitude) : null;
      r.countryCode = r.countryCode || "+91";
      return r;
    });
  },

  async createAddress(address) {
    const { userPhone, type, houseNo, society, floor, landmark, city, locality, pincode, latitude, longitude, name, alternateNumber, alternate_number, countryCode, country_code } = address;
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
    const finalCountryCode = countryCode || country_code || "+91";

    await mysqlPool.query(
      `INSERT INTO node_addresses_v2 (userPhone, type, houseNo, society, floor, landmark, city, locality, pincode, latitude, longitude, name, alternateNumber, countryCode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userPhone, finalType, finalHouseNo, finalSociety, finalFloor, finalLandmark, finalCity, finalLocality, finalPincode, latitude, longitude, finalName, finalAltNum, finalCountryCode]
    );

    const [rows] = await mysqlPool.query("SELECT * FROM node_addresses_v2 WHERE userPhone = ? ORDER BY id DESC LIMIT 1", [userPhone]);
    if (rows.length > 0) {
      rows[0].latitude = rows[0].latitude !== null ? parseFloat(rows[0].latitude) : null;
      rows[0].longitude = rows[0].longitude !== null ? parseFloat(rows[0].longitude) : null;
      rows[0].countryCode = rows[0].countryCode || "+91";
      return rows[0];
    }
    return address;
  },

  async getAppVersion() {
    const [rows] = await mysqlPool.query("SELECT * FROM node_app_version");
    const result = {};
    rows.forEach(r => {
      result[r.platform] = {
        latestVersion: r.latestVersion,
        minSupportedVersion: r.minSupportedVersion,
        forceUpdate: r.forceUpdate === 1
      };
    });
    return result;
  },

  async updateAppVersion(platform, updates) {
    const fields = [];
    const params = [];
    if (updates.latestVersion !== undefined) {
      fields.push("latestVersion = ?");
      params.push(updates.latestVersion);
    }
    if (updates.minSupportedVersion !== undefined) {
      fields.push("minSupportedVersion = ?");
      params.push(updates.minSupportedVersion);
    }
    if (updates.forceUpdate !== undefined) {
      fields.push("forceUpdate = ?");
      params.push(updates.forceUpdate ? 1 : 0);
    }
    if (fields.length === 0) return;
    params.push(platform);
    await mysqlPool.query(
      `UPDATE node_app_version SET ${fields.join(", ")} WHERE platform = ?`,
      params
    );
  },

  async getCart(phone) {
    const [rows] = await mysqlPool.query("SELECT * FROM node_cart WHERE userPhone = ?", [phone]);
    return rows;
  },

  async addToCart(phone, productId, quantity) {
    await mysqlPool.query(
      "INSERT INTO node_cart (userPhone, productId, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)",
      [phone, productId, quantity]
    );
    return this.getCart(phone);
  },

  async updateCartItem(phone, productId, quantity) {
    if (quantity <= 0) {
      return this.removeFromCart(phone, productId);
    }
    await mysqlPool.query(
      "INSERT INTO node_cart (userPhone, productId, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)",
      [phone, productId, quantity]
    );
    return this.getCart(phone);
  },

  async removeFromCart(phone, productId) {
    await mysqlPool.query("DELETE FROM node_cart WHERE userPhone = ? AND productId = ?", [phone, productId]);
    return this.getCart(phone);
  },

  async clearCart(phone) {
    await mysqlPool.query("DELETE FROM node_cart WHERE userPhone = ?", [phone]);
    return [];
  }
};

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
      countryCode: user.countryCode || "+91",
      language: user.language || "en"
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

  async getWalletTransactions(phone) {
    const data = this.readData();
    data.wallet_transactions = data.wallet_transactions || [];
    return data.wallet_transactions.filter(tx => tx.userPhone === phone).sort((a, b) => b.id - a.id);
  },

  async createWalletTransaction(tx) {
    const data = this.readData();
    data.wallet_transactions = data.wallet_transactions || [];
    const nextId = data.wallet_transactions.length > 0 ? Math.max(...data.wallet_transactions.map(t => t.id || 0)) + 1 : 1;
    const newTx = {
      id: nextId,
      userPhone: tx.userPhone,
      amount: parseFloat(tx.amount),
      type: tx.type,
      description: tx.description || "",
      senderName: tx.senderName || null,
      createdAt: tx.createdAt || new Date().toISOString()
    };
    data.wallet_transactions.push(newTx);
    this.writeData(data);
    return newTx;
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

  async updateCategory(id, categoryData) {
    const data = this.readData();
    if (!data.categories) data.categories = [];
    const idx = data.categories.findIndex(c => String(c.id) === String(id) || (c.name && c.name.toLowerCase() === (categoryData.name || '').toLowerCase()));
    if (idx !== -1) {
      data.categories[idx] = { ...data.categories[idx], ...categoryData, id: String(id) };
    } else {
      data.categories.push({ id: String(id), ...categoryData });
    }
    this.writeData(data);
    return categoryData;
  },

  async deleteCategory(id) {
    const data = this.readData();
    if (data.categories) {
      data.categories = data.categories.filter(c => String(c.id) !== String(id));
      this.writeData(data);
    }
    return true;
  },

  async addBanner(bannerData) {
    const data = this.readData();
    if (!data.banners) data.banners = [];
    const newId = bannerData.id || String(Date.now());
    const newBanner = { ...bannerData, id: String(newId) };
    data.banners.push(newBanner);
    this.writeData(data);
    return newBanner;
  },

  async updateBanner(id, bannerData) {
    const data = this.readData();
    if (!data.banners) data.banners = [];
    const idx = data.banners.findIndex(b => String(b.id) === String(id));
    if (idx !== -1) {
      data.banners[idx] = { ...data.banners[idx], ...bannerData, id: String(id) };
    } else {
      data.banners.push({ id: String(id), ...bannerData });
    }
    this.writeData(data);
    return bannerData;
  },

  async deleteBanner(id) {
    const data = this.readData();
    if (data.banners) {
      data.banners = data.banners.filter(b => String(b.id) !== String(id));
      this.writeData(data);
    }
    return true;
  },

  async addService(serviceData) {
    const data = this.readData();
    if (!data.services) data.services = [];
    const newId = serviceData.id || Date.now();
    const newSrv = { ...serviceData, id: newId, title: serviceData.title || serviceData.name || "" };
    data.services.push(newSrv);
    this.writeData(data);
    return newSrv;
  },

  async updateService(id, serviceData) {
    const data = this.readData();
    if (!data.services) data.services = [];
    const idx = data.services.findIndex(s => String(s.id) === String(id) || (s.title && s.title.toLowerCase() === (serviceData.title || '').toLowerCase()));
    if (idx !== -1) {
      data.services[idx] = { ...data.services[idx], ...serviceData, id: id };
    } else {
      data.services.push({ id: id, ...serviceData });
    }
    this.writeData(data);
    return serviceData;
  },

  async deleteService(id) {
    const data = this.readData();
    if (data.services) {
      data.services = data.services.filter(s => String(s.id) !== String(id));
      this.writeData(data);
    }
    return true;
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
  },

  async getAppVersion() {
    const data = this.readData();
    return data.appVersion || {
      android: { latestVersion: "1.0.2", minSupportedVersion: "1.0.2", forceUpdate: true },
      ios: { latestVersion: "1.0.3", minSupportedVersion: "1.0.3", forceUpdate: true }
    };
  },

  async updateAppVersion(platform, updates) {
    const data = this.readData();
    if (!data.appVersion) {
      data.appVersion = {
        android: { latestVersion: "1.0.2", minSupportedVersion: "1.0.2", forceUpdate: true },
        ios: { latestVersion: "1.0.3", minSupportedVersion: "1.0.3", forceUpdate: true }
      };
    }
    if (!data.appVersion[platform]) {
      data.appVersion[platform] = { latestVersion: "1.0.0", minSupportedVersion: "1.0.0", forceUpdate: true };
    }
    if (updates.latestVersion !== undefined) data.appVersion[platform].latestVersion = updates.latestVersion;
    if (updates.minSupportedVersion !== undefined) data.appVersion[platform].minSupportedVersion = updates.minSupportedVersion;
    if (updates.forceUpdate !== undefined) data.appVersion[platform].forceUpdate = !!updates.forceUpdate;
    this.writeData(data);
  },

  async getAmcSubscriptions(phone) {
    const data = this.readData();
    data.amc_subscriptions = data.amc_subscriptions || [];
    return data.amc_subscriptions.filter(s => s.userPhone === phone);
  },

  async createAmcSubscription(sub) {
    const data = this.readData();
    data.amc_subscriptions = data.amc_subscriptions || [];
    data.amc_subscriptions.push(sub);
    this.writeData(data);
  },

  async getAmcSubscriptionById(amcId) {
    const data = this.readData();
    data.amc_subscriptions = data.amc_subscriptions || [];
    return data.amc_subscriptions.find(s => s.amcId === amcId) || null;
  },

  async countAmcBookingsCompleted(amcId) {
    const data = this.readData();
    return data.orders.filter(o => o.amcId === amcId && o.status === 'Completed').length;
  },

  async countAmcBookingsInCurrentMonth(amcId) {
    const data = this.readData();
    const currentMonthStr = new Date().toISOString().substring(0, 7); // "YYYY-MM"
    return data.orders.filter(o => o.amcId === amcId && o.status !== 'Cancelled' && (String(o.date).substring(0, 7) === currentMonthStr)).length;
  },

  async getAmcSubscriptionByCategory(phone, category) {
    const data = this.readData();
    data.amc_subscriptions = data.amc_subscriptions || [];
    const nowStr = new Date().toISOString();
    return data.amc_subscriptions.find(s => s.userPhone === phone && s.category === category && s.status === 'active' && s.endDate > nowStr) || null;
  },

  async updateAmcSubscription(amcId, updates) {
    const data = this.readData();
    data.amc_subscriptions = data.amc_subscriptions || [];
    const idx = data.amc_subscriptions.findIndex(s => s.amcId === amcId);
    if (idx !== -1) {
      data.amc_subscriptions[idx] = { ...data.amc_subscriptions[idx], ...updates };
      this.writeData(data);
      return data.amc_subscriptions[idx];
    }
    return null;
  },

  async getSavedCards(phone) {
    const data = this.readData();
    data.saved_cards = data.saved_cards || [];
    return data.saved_cards.filter(c => c.userPhone === phone);
  },

  async createSavedCard(card) {
    const data = this.readData();
    data.saved_cards = data.saved_cards || [];
    const newCard = { id: Date.now(), ...card };
    data.saved_cards.push(newCard);
    this.writeData(data);
    return newCard;
  },

  async getCart(phone) {
    const data = this.readData();
    data.cart = data.cart || [];
    return data.cart.filter(item => item.userPhone === phone);
  },

  async addToCart(phone, productId, quantity) {
    const data = this.readData();
    data.cart = data.cart || [];
    const existing = data.cart.find(item => item.userPhone === phone && item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      data.cart.push({ userPhone: phone, productId, quantity });
    }
    this.writeData(data);
    return this.getCart(phone);
  },

  async updateCartItem(phone, productId, quantity) {
    if (quantity <= 0) {
      return this.removeFromCart(phone, productId);
    }
    const data = this.readData();
    data.cart = data.cart || [];
    const existing = data.cart.find(item => item.userPhone === phone && item.productId === productId);
    if (existing) {
      existing.quantity = quantity;
    } else {
      data.cart.push({ userPhone: phone, productId, quantity });
    }
    this.writeData(data);
    return this.getCart(phone);
  },

  async removeFromCart(phone, productId) {
    const data = this.readData();
    data.cart = data.cart || [];
    data.cart = data.cart.filter(item => !(item.userPhone === phone && item.productId === productId));
    this.writeData(data);
    return this.getCart(phone);
  },

  async clearCart(phone) {
    const data = this.readData();
    data.cart = data.cart || [];
    data.cart = data.cart.filter(item => item.userPhone !== phone);
    this.writeData(data);
    return [];
  }
};

// ----------------------------------------
// HYBRID DATABASE ROUTER
// ----------------------------------------
let dbMode = "mysql";

// Helper function to execute DB method with instant JSON failover on MySQL connection error
async function executeDbMethod(methodName, ...args) {
  if (dbMode === "mysql" && mysqlReady && MySqlDbLayer && typeof MySqlDbLayer[methodName] === 'function') {
    try {
      return await MySqlDbLayer[methodName](...args);
    } catch (err) {
      console.warn(`[DbLayer.${methodName}] MySQL query failed (${err.message}). Falling back to JSON database.`);
      mysqlReady = false;
      dbMode = "json";
    }
  }
  return await JsonDbLayer[methodName](...args);
}

const DbLayer = {
  getLayer() {
    if (dbMode === "mysql" && mysqlReady) {
      return MySqlDbLayer;
    }
    dbMode = "json";
    return JsonDbLayer;
  },
  async getUserByPhone(phone) { return executeDbMethod('getUserByPhone', phone); },
  async getUserByReferralCode(code) { return executeDbMethod('getUserByReferralCode', code); },
  async createUser(user) { return executeDbMethod('createUser', user); },
  async updateUser(phone, updates) { return executeDbMethod('updateUser', phone, updates); },
  async deleteUser(phone) { return executeDbMethod('deleteUser', phone); },
  async createContact(contact) { return executeDbMethod('createContact', contact); },
  async countUsers() { return executeDbMethod('countUsers'); },
  async getOrderById(id) { return executeDbMethod('getOrderById', id); },
  async getOrderByRazorpayOrderId(rzpOrderId) { return executeDbMethod('getOrderByRazorpayOrderId', rzpOrderId); },
  async getOrdersByUserPhone(phone) { return executeDbMethod('getOrdersByUserPhone', phone); },
  async getAllOrders() { return executeDbMethod('getAllOrders'); },
  async createOrder(order) {
    const newOrder = await executeDbMethod('createOrder', order);
    if (newOrder && newOrder.bookingStatus !== 'draft' && newOrder.bookingStatus !== 'Draft') {
      try {
        await handleBookingStatusSmsTrigger(newOrder, null, newOrder.bookingStatus);
      } catch (smsErr) {
        console.error("[SMS Trigger] Error sending booking status SMS:", smsErr.message);
      }
    }
    return newOrder;
  },
  async updateOrder(id, updates) {
    const prevOrder = await executeDbMethod('getOrderById', id);
    const updatedOrder = await executeDbMethod('updateOrder', id, updates);
    if (updatedOrder && prevOrder) {
      try {
        await handleBookingStatusSmsTrigger(updatedOrder, prevOrder.bookingStatus, updatedOrder.bookingStatus);
      } catch (smsErr) {
        console.error("[SMS Trigger] Error sending booking status SMS:", smsErr.message);
      }
    }
    return updatedOrder;
  },
  async getLastOrderId() { return executeDbMethod('getLastOrderId'); },
  async countOrders() { return executeDbMethod('countOrders'); },
  async getReferralApplied(phone) { return executeDbMethod('getReferralApplied', phone); },
  async createReferralApplied(referralApplied) { return executeDbMethod('createReferralApplied', referralApplied); },
  async getCategories() { return executeDbMethod('getCategories'); },
  async addCategory(categoryData) { return executeDbMethod('addCategory', categoryData); },
  async updateCategory(id, categoryData) { return executeDbMethod('updateCategory', id, categoryData); },
  async deleteCategory(id) { return executeDbMethod('deleteCategory', id); },
  async addBanner(bannerData) { return executeDbMethod('addBanner', bannerData); },
  async updateBanner(id, bannerData) { return executeDbMethod('updateBanner', id, bannerData); },
  async deleteBanner(id) { return executeDbMethod('deleteBanner', id); },
  async addService(serviceData) { return executeDbMethod('addService', serviceData); },
  async updateService(id, serviceData) { return executeDbMethod('updateService', id, serviceData); },
  async deleteService(id) { return executeDbMethod('deleteService', id); },
  async getAddressesByUserPhone(phone) { return executeDbMethod('getAddressesByUserPhone', phone); },
  async createAddress(address) { return executeDbMethod('createAddress', address); },
  async getAppVersion() { return executeDbMethod('getAppVersion'); },
  async updateAppVersion(platform, updates) { return executeDbMethod('updateAppVersion', platform, updates); },
  async getWalletTransactions(phone) { return executeDbMethod('getWalletTransactions', phone); },
  async createWalletTransaction(tx) { return executeDbMethod('createWalletTransaction', tx); },
  async getAmcSubscriptions(phone) { return executeDbMethod('getAmcSubscriptions', phone); },
  async createAmcSubscription(sub) { return executeDbMethod('createAmcSubscription', sub); },
  async getAmcSubscriptionById(amcId) { return executeDbMethod('getAmcSubscriptionById', amcId); },
  async countAmcBookingsCompleted(amcId) { return executeDbMethod('countAmcBookingsCompleted', amcId); },
  async countAmcBookingsInCurrentMonth(amcId) { return executeDbMethod('countAmcBookingsInCurrentMonth', amcId); },
  async getAmcSubscriptionByCategory(phone, category) { return executeDbMethod('getAmcSubscriptionByCategory', phone, category); },
  async updateAmcSubscription(amcId, updates) { return executeDbMethod('updateAmcSubscription', amcId, updates); },
  async getSavedCards(phone) { return executeDbMethod('getSavedCards', phone); },
  async createSavedCard(card) { return executeDbMethod('createSavedCard', card); },
  async getCart(phone) { return executeDbMethod('getCart', phone); },
  async addToCart(phone, productId, quantity) { return executeDbMethod('addToCart', phone, productId, quantity); },
  async updateCartItem(phone, productId, quantity) { return executeDbMethod('updateCartItem', phone, productId, quantity); },
  async removeFromCart(phone, productId) { return executeDbMethod('removeFromCart', phone, productId); },
  async clearCart(phone) { return executeDbMethod('clearCart', phone); }
};

// ----------------------------------------
// DATABASE CONFIGURATION AND INITIALIZATION
// ----------------------------------------

(async () => {
  const mysqlSuccess = await initMySqlDbWithRetry();
  if (!mysqlSuccess) {
    dbMode = "json";
    mysqlReady = false;
    initJsonDb();
  }
  // Only pass pool to translation engine if DB is actually ready
  const poolForExtras = mysqlReady ? mysqlPool : null;
  if (mysqlReady && poolForExtras) {
    try {
      const { initTranslationEngine } = require('./helpers/translate');
      await initTranslationEngine(poolForExtras);
    } catch (err) {
      console.error("Failed to initialize translation engine in startup IIFE:", err.message);
    }
    try {
      await runContentI18nMigration(poolForExtras);
    } catch (err) {
      console.error("Failed to run content i18n migration in startup IIFE:", err.message);
    }
  } else {
    console.log("MySQL unavailable on startup. Skipping translation engine DB setup and running in pure JSON database mode.");
  }
})();

// Global Static Data for Services
const CATEGORIES_DATA = [
  "AcRepair", "Car Washing", "Plumber", "Cleaning",
  "Electrician", "Salon And Spa", "Painter", "Carpenter",
  "Bike Services", "Architecture", "Contractor", "Mechanic",
  "Pandit ji", "Driver", "Photographer", "Doctors", "Compounder", "Halwai", "Pest Control", "Repairing"
];

const AMC_SUPPORTED_CATEGORIES = [
  "Repairing", "Plumber", "Electrician", "Painter", "Carpenter", "Architecture", "Contractor", "Pest Control"
];

// Helper to map category names to canonical camelCase/spaced names in CATEGORIES_DATA
function getCanonicalCategoryName(categoryName) {
  if (!categoryName) return "Plumber";
  const cleanName = categoryName.toLowerCase().replace(/[\s\-_]/g, '');
  for (const cat of CATEGORIES_DATA) {
    const cleanCat = cat.toLowerCase().replace(/[\s\-_]/g, '');
    if (cleanName === cleanCat || cleanName.includes(cleanCat) || cleanCat.includes(cleanName)) {
      return cat;
    }
  }
  return categoryName;
}

const SERVICES_DATA = {
  "Plumber": [
    { title: "Tap Repair", price: 299, description: "Fix leaking taps and water issues", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.7, reviewsCount: 142, cutPrice: 399 },
    { title: "Pipe Fix", price: 499, description: "Repair damaged pipes", image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.5, reviewsCount: 88, cutPrice: 599 }
  ],
  "Electrician": [
    { title: "Fan Repair", price: 199, description: "Fix fan issues", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.6, reviewsCount: 230, cutPrice: 249 },
    { title: "Switch Repair", price: 149, description: "Repair switches and boards", image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.4, reviewsCount: 95, cutPrice: 199 },
    { title: "Wiring Work", price: 799, description: "Complete wiring setup", image: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.9, reviewsCount: 180, cutPrice: 999 }
  ],
  "Cleaning": [
    { title: "Home Cleaning", price: 999, description: "Full house cleaning service", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop", discount: 23, rating: 4.9, reviewsCount: 312, cutPrice: 1299 },
    { title: "Bathroom Cleaning", price: 499, description: "Deep bathroom cleaning", image: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 154, cutPrice: 599 },
    { title: "Sofa & Carpet Cleaning", price: 799, description: "Vacuuming and steam sanitizing fabric surfaces", image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.6, reviewsCount: 120, cutPrice: 999 },
    { title: "Window Cleaning", price: 299, description: "Sparkling glass and pane washing inside-out", image: "https://images.unsplash.com/photo-1528740561666-bd247e66a20c?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.5, reviewsCount: 74, cutPrice: 399 }
  ],
  "AcRepair": [
    { title: "Ac Service", price: 500, description: "Full filter and coil cleaning", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 420, cutPrice: 599 },
    { title: "AC Installation", price: 1, description: "Mount and configure split or window AC unit", image: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.9, reviewsCount: 165, cutPrice: 1499 },
    { title: "AC Leakage Repair", price: 600, description: "Identify and plug water or gas leak issues", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.6, reviewsCount: 98, cutPrice: 799 },
    { title: "AC Condenser Replacement", price: 2500, description: "Install brand new copper condenser unit", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 84, cutPrice: 2999 }
  ],
  "Salon And Spa": [
    { title: "Facial & Grooming", price: 1, description: "Deep cleansing facial treatment and face massage", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 280, cutPrice: 599 },
    { title: "Massage Therapy", price: 899, description: "Stress-relieving full body Swedish massage", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.8, reviewsCount: 310, cutPrice: 1199 },
    { title: "Pedicure & Manicure", price: 399, description: "Hand and foot grooming and nail clean spa", image: "https://images.unsplash.com/photo-1604654894610-df490651e56c?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.7, reviewsCount: 185, cutPrice: 499 }
  ],
  "Painter": [
    { title: "Wall Paint", price: 1999, description: "Single room wall painting with premium finishes", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.8, reviewsCount: 76, cutPrice: 2499 }
  ],
  "Carpenter": [],
  "Bike Services": [],
  "Architecture": [
    { title: "Design Draft", price: 4999, description: "Floor plans and basic architectural layout mapping", image: "/assets/services/design_draft.png", discount: 16, rating: 4.9, reviewsCount: 52, cutPrice: 5999 }
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
  if (!token) return null;

  try {
    let phone;
    const cleanDigits = token.replace(/\D/g, '');
    if (cleanDigits.length === 10) {
      phone = cleanDigits;
    } else if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
      phone = cleanDigits.substring(2);
    } else {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        phone = decoded.phone || decoded.userId || decoded.id;
        if (phone) {
          const digits = String(phone).replace(/\D/g, '');
          phone = digits.length === 12 && digits.startsWith('91') ? digits.substring(2) : digits;
        }
      } catch (jwtErr) {
        if (cleanDigits.length >= 10) {
          phone = cleanDigits.slice(-10);
        }
      }
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
    req.authError = err.message;
    return null;
  }
}

// Helper to generate referral code
function generateReferralCode(name) {
  const cleanName = (name || "USER").substring(0, 3).toUpperCase();
  const timestampPart = Date.now().toString().slice(-6);
  return `${cleanName}${timestampPart}`;
}

// Debug endpoint for database seed verification
app.get('/api/debug/db', (req, res) => {
  const seedFile = path.join(__dirname, 'database_seed.json');
  const seedExists = fs.existsSync(seedFile);
  let seedContent = null;
  if (seedExists) {
    try {
      seedContent = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
    } catch (e) {
      seedContent = { error: e.message };
    }
  }
  
  let dbContent = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      dbContent = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      dbContent = { error: e.message };
    }
  }

  res.json({
    seedExists,
    seedFile,
    DB_FILE,
    hasSeedBanners: seedContent ? (seedContent.banners ? seedContent.banners.length : 'no banners key') : 'no seed content',
    dbBannersCount: dbContent ? (dbContent.banners ? dbContent.banners.length : 'no banners key') : 'no db content',
  });
});

// Root welcome & status endpoint
app.get('/', async (req, res) => {
  try {
    // Only query DB for stats if actually connected, otherwise show 0
    let userCount = 0;
    let orderCount = 0;
    try {
      userCount = await DbLayer.countUsers();
      orderCount = await DbLayer.countOrders();
    } catch (statErr) {
      console.warn("[RootRoute] Could not fetch stats (DB unavailable):", statErr.message);
    }
    
    const activeLayer = DbLayer.getLayer();
    const dbStatus = activeLayer === MySqlDbLayer 
      ? "MySQL Database (homefaciliti.com)" 
      : (activeLayer === JsonDbLayer ? "JSON File Database (database.json)" : "Unknown Database");

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
    console.error("Error on root route:", err);
    res.status(500).send("Error loading server status: " + err.message);
  }
});

// Debug endpoint for SMS config and last sent status
app.get('/api/debug/sms-config', (req, res) => {
  res.json({
    config: {
      smsApiKey: (process.env.SMS_API_KEY || 'b395HRZTRUGZThPOeRSnVg').substring(0, 4) + '***',
      senderId: process.env.SMS_SENDER_ID || 'HMFCLI',
      entityId: process.env.SMS_ENTITY_ID || '1201173444411453897',
      dltTemplateId: process.env.SMS_DLT_TEMPLATE_ID || '1207173589889308632',
      smsRoute: process.env.SMS_ROUTE || '2',
      rawTemplate: process.env.SMS_TEMPLATE_TEXT || 'Your OTP for registering on Superhome is: {#var#}. This code is valid for the next 10 minutes. Thank You, Super Home'
    },
    lastSmsDebug
  });
});

// Debug endpoint for booking logs
app.get('/api/debug/logs', (req, res) => {
  res.json({ success: true, logs: debugLogs });
});

function validatePhoneNumberLength(phone, prefix) {
  const country = countriesList.find(c => c.dialCode === prefix);
  if (!country) return true;

  let cleanNumber = phone.trim().replace(/\D/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = cleanNumber.substring(1);
  }
  const dialDigits = prefix.replace(/\D/g, '');
  if (dialDigits && cleanNumber.startsWith(dialDigits) && cleanNumber.length > dialDigits.length) {
    const tempNum = cleanNumber.substring(dialDigits.length);
    if (tempNum.length === country.phoneLength) {
      cleanNumber = tempNum;
    }
  }
  return cleanNumber.length === country.phoneLength;
}

function getExpectedPhoneLength(prefix) {
  const country = countriesList.find(c => c.dialCode === prefix);
  return country ? country.phoneLength : 10;
}

function getCountryNameByPrefix(prefix) {
  const country = countriesList.find(c => c.dialCode === prefix);
  return country ? country.name : "this country";
}

// 1. Auth: Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const phone = req.body.phone || req.body.userId;
  const { countryCode } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number / userId is required" });
  }
  const prefix = countryCode || "+91";
  
  if (!validatePhoneNumberLength(phone, prefix)) {
    const expected = getExpectedPhoneLength(prefix);
    const countryName = getCountryNameByPrefix(prefix);
    return res.status(400).json({
      error: `Phone number for ${countryName} must be ${expected} digits long.`
    });
  }
  
  // Generate OTP (static 1234 only for test number 9199953391)
  const TEST_PHONE = '9199953391';
  const isTestNumber = phone === TEST_PHONE || phone === '91' + TEST_PHONE || phone === '+91' + TEST_PHONE;
  const otp = isTestNumber ? '1234' : Math.floor(1000 + Math.random() * 9000).toString();
  
  // Store OTP in-memory with 5 minutes expiry
  activeOTPs.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  
  const dltTemplateId = process.env.SMS_DLT_TEMPLATE_ID || '1207173589889308632';
  const rawTemplate = process.env.SMS_TEMPLATE_TEXT || 'Your OTP for registering on Superhome is: {#var#}. This code is valid for the next 10 minutes. Thank You, Super Home';
  
  let messageText = rawTemplate.replace('{otp}', otp).replace('{#var#}', otp);
  if (dltTemplateId === '1207173589889308632') {
    messageText = `Your OTP for registering on Superhome is: ${otp}. This code is valid for the next 10 minutes. Thank You, Super Home`;
  }

  const result = await sendSMS(phone, messageText, dltTemplateId);
  let smsSent = result.success;
  let smsError = result.error;

  if (result.success) {
    let data;
    try { data = JSON.parse(result.response); } catch(_) { data = { rawText: result.response }; }
    if (data && (data.ErrorCode === '000' || data.ErrorCode === '0' || data.ErrorMessage === 'Success')) {
      smsSent = true;
    } else {
      smsSent = false;
      smsError = data.ErrorMessage || JSON.stringify(data);
      lastSmsDebug.error = smsError;
    }
  }

  if (smsSent) {
    console.log(`[SMS] Dynamic OTP ${otp} sent successfully via SMSGatewayHub to phone: ${prefix}${phone}`);
    res.json({ 
      success: true, 
      message: translate("otp_sent", req.lang),
      otp: otp 
    });
  } else {
    console.warn(`[SMS] Failed to send SMS: ${smsError}. Phone: "${phone}", text: "${messageText}", dlttemplateid: "${dltTemplateId}"`);
    res.json({ 
      success: true, 
      message: translate("otp_sent", req.lang),
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
    return res.status(400).json({ error: translate("invalid_otp", req.lang) });
  }

  try {
    let user = await DbLayer.getUserByPhone(phone);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const finalName = name || "";
      const finalEmail = email || "";
      const refCode = generateReferralCode(finalName);
      const reqLanguage = req.body.language || req.body.lang || "en";
      user = {
        name: finalName,
        phone: phone,
        email: finalEmail,
        location: "",
        locality: "",
        gender: "Male",
        referralCode: refCode,
        walletBalance: 0.0,
        countryCode: countryCode || "+91",
        language: reqLanguage
      };
      await DbLayer.createUser(user);
      console.log(`Created new profile for user: ${countryCode || "+91"}${phone} with referral: ${refCode}`);
    } else {
      // Dynamic profile update if user already exists but custom name/email/language is passed in the OTP verify body
      const reqLanguage = req.body.language || req.body.lang;
      if (name || email || reqLanguage) {
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (reqLanguage) updates.language = reqLanguage;
        user = await DbLayer.updateUser(phone, updates);
        console.log(`Dynamically updated existing user ${phone} profile on verify-otp:`, updates);
      }
    }

    const token = jwt.sign({ phone: user.phone }, JWT_SECRET);
    const referralApplied = await DbLayer.getReferralApplied(user.phone);
    const referralAppliedStatus = referralApplied ? 1 : 0;

    res.json({
      success: true,
      message: translate("login_success", req.lang),
      user: { ...user, userId: user.phone },
      userId: user.phone,
      isNewUser: isNewUser,
      referralAppliedStatus: referralAppliedStatus,
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
    res.json({ success: true, message: translate("logout_success", req.lang) });
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
  const { name, email, location, locality, gender, countryCode, language } = req.body;
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
    if (language !== undefined) updates.language = language;

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
          alternateNumber: "",
          countryCode: updatedUser.countryCode || user.countryCode || "+91"
        });
        console.log(`[ProfileUpdate] Synced updated location/locality to node_addresses for user ${user.phone}`);
      } catch (addrErr) {
        console.warn("Could not auto-create address entry from profile update:", addrErr.message);
      }
    }

    res.json({ success: true, user: updatedUser, message: translate("profile_updated", req.lang) });
  } catch (err) {
    console.error("Update profile failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4b. Global: Get Languages (Public list of supported languages: English & Hindi)
app.get('/api/languages', (req, res) => {
  const languagesList = [
    { "code": "en", "name": "English", "nativeName": "English" },
    { "code": "hi", "name": "Hindi", "nativeName": "हिन्दी" },
    { "code": "gu", "name": "Gujarati", "nativeName": "ગુજરાતી" },
    { "code": "mr", "name": "Marathi", "nativeName": "मराठी" },
    { "code": "ta", "name": "Tamil", "nativeName": "தமிழ்" },
    { "code": "te", "name": "Telugu", "nativeName": "తెలుగు" },
    { "code": "kn", "name": "Kannada", "nativeName": "కన్నడ" },
    { "code": "ml", "name": "Malayalam", "nativeName": "മലയാളം" },
    { "code": "bn", "name": "Bengali", "nativeName": "বাংলা" },
    { "code": "pa", "name": "Punjabi", "nativeName": "ਪੰਜਾਬੀ" },
    { "code": "or", "name": "Odia", "nativeName": "ଓଡ଼ିଆ" },
    { "code": "as", "name": "Assamese", "nativeName": "অসমীয়া" }
  ];
  res.json({
    success: true,
    languages: languagesList,
    message: "Languages list retrieved successfully"
  });
});

// 4c. Auth: Update User Language Preference
app.post('/api/auth/language', async (req, res) => {
  const { language } = req.body;
  if (!language) {
    return res.status(400).json({ error: "language is required in request body" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updatedUser = await DbLayer.updateUser(user.phone, { language: String(language).trim() });
    res.json({
      success: true,
      user: updatedUser,
      message: translate("language_updated", req.lang)
    });
  } catch (err) {
    console.error("Update language failed:", err);
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
    res.json({ success: true, message: translate("account_deleted", req.lang) });
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
    res.json({ success: true, message: translate("contact_sent", req.lang), contact });
  } catch (err) {
    console.error("Contact API failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Generic Admin Panel Image Upload Endpoint
const generalUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uniqueSuffix}${ext}`);
  }
});
const generalUpload = multer({ storage: generalUploadStorage });

app.post(['/api/upload', '/upload'], generalUpload.any(), (req, res) => {
  const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;
  const fileUrl = `${serverBaseUrl}/uploads/${file.filename}`;

  console.log(`[Upload] Image uploaded successfully: ${file.filename} (field: ${file.fieldname})`);
  res.json({
    success: true,
    url: fileUrl,
    image: fileUrl,
    imageUrl: fileUrl,
    filename: file.filename
  });
});

// Category Admin Routes
app.post('/api/categories', async (req, res) => {
  const { name, title, id, image } = req.body;
  const categoryName = title || name;
  if (!categoryName) {
    return res.status(400).json({ error: "Category name is required" });
  }
  try {
    const category = await DbLayer.addCategory({ name: categoryName, title: categoryName, id, image });
    console.log(`[Admin] Category created/updated: ${categoryName}`);
    res.json({ success: true, category, data: category, message: "Category created successfully" });
  } catch (err) {
    console.error("Add category failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const category = await DbLayer.updateCategory(id, req.body);
    console.log(`[Admin] Category ${id} updated:`, req.body.name || req.body.title);
    res.json({ success: true, category, data: category, message: "Category updated successfully" });
  } catch (err) {
    console.error("Update category failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await DbLayer.deleteCategory(id);
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error("Delete category failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Banner Admin Routes
app.post('/api/banners', async (req, res) => {
  try {
    const banner = await DbLayer.addBanner(req.body);
    console.log(`[Admin] Banner created:`, req.body.title);
    res.json({ success: true, banner, data: banner, message: "Banner created successfully" });
  } catch (err) {
    console.error("Add banner failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put('/api/banners/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const banner = await DbLayer.updateBanner(id, req.body);
    console.log(`[Admin] Banner ${id} updated:`, req.body.title);
    res.json({ success: true, banner, data: banner, message: "Banner updated successfully" });
  } catch (err) {
    console.error("Update banner failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete('/api/banners/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await DbLayer.deleteBanner(id);
    res.json({ success: true, message: "Banner deleted successfully" });
  } catch (err) {
    console.error("Delete banner failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Service Admin Routes
app.post('/api/services', async (req, res) => {
  try {
    const service = await DbLayer.addService(req.body);
    console.log(`[Admin] Service created:`, req.body.title || req.body.name);
    res.json({ success: true, service, data: service, message: "Service created successfully" });
  } catch (err) {
    console.error("Add service failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const service = await DbLayer.updateService(id, req.body);
    console.log(`[Admin] Service ${id} updated:`, req.body.title || req.body.name);
    res.json({ success: true, service, data: service, message: "Service updated successfully" });
  } catch (err) {
    console.error("Update service failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await DbLayer.deleteService(id);
    res.json({ success: true, message: "Service deleted successfully" });
  } catch (err) {
    console.error("Delete service failed:", err);
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

    const categories = dbCategories.map(c => {
      const img = resolveDynamicCategoryImageUrl(c, serverBaseUrl);
      const localizedObj = localizeCategory(c, req.lang);

      return {
        ...c,
        id: String(localizedObj.id || c.id || ''),
        name: String(localizedObj.name || c.name || c.title || ''),
        title: String(localizedObj.name || c.title || c.name || ''),
        image: String(img || '')
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
    title: "AC Foam Jet Service",
    category: "AcRepair",
    badge: "100% FREE",
    subtitle: "Professional foam jet deep cleaning for your AC - absolutely FREE!",
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
  let dbBanners = [];
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  try {
    if (mysqlReady) {
      const [rows] = await mysqlPool.query("SELECT * FROM node_banners ORDER BY id ASC");
      if (rows && rows.length > 0) {
        dbBanners = rows.map(r => {
          const img = resolveDynamicBannerImageUrl(r, serverBaseUrl);

          return {
            id: String(r.id),
            image: img,
            bannerImage: img,
            imageUrl: img,
            photo: img,
            url: img,
            rawImage: r.image || "",
            title: r.title || "",
            category: r.category || "",
            badge: r.badge || "",
            subtitle: r.subtitle || "",
            buttonText: r.buttonText || "Book Now"
          };
        });
      }
    } else {
      // JSON fallback: load from database.json
      try {
        const data = DbLayer.getLayer().readData ? DbLayer.getLayer().readData() : null;
        if (data && data.banners && data.banners.length > 0) {
          dbBanners = data.banners.map(b => {
            const img = resolveDynamicBannerImageUrl(b, serverBaseUrl);
            return {
              ...b,
              image: img,
              bannerImage: img,
              imageUrl: img,
              photo: img,
              url: img
            };
          });
        }
      } catch (jsonErr) {
        console.warn("[DynamicBanners] JSON fallback read failed:", jsonErr.message);
      }
    }
  } catch (err) {
    console.warn("[DynamicBanners] DB query failed:", err.message);
  }

  if (dbBanners.length === 0) {
    dbBanners = BANNERS_DATA.map(b => ({
      ...b,
      bannerImage: b.image,
      imageUrl: b.image,
      photo: b.image,
      url: b.image
    }));
  }

  res.json({
    success: true,
    banners: dbBanners,
    data: dbBanners,
    message: translate("banners_retrieved", req.lang)
  });
});

// Trending Services Endpoint (Returns Category ID and Category Info)
app.get('/api/services/trending', async (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  let trendingList = [];

  // 1. Try MySQL Database
  if (mysqlReady) {
    try {
      const [rows] = await mysqlPool.query(
        "SELECT s.*, c.title as cat_name FROM node_services s LEFT JOIN node_categories c ON s.category_id = c.id WHERE s.status IN (0, 1) ORDER BY s.id ASC LIMIT 20"
      );
      if (rows && rows.length > 0) {
        trendingList = rows.map(r => {
          const sanitized = sanitizeServiceDbObj(r, serverBaseUrl);
          const catId = String(r.category_id || r.category || '1');
          const catName = String(r.cat_name || r.categoryName || r.category || 'Plumber');
          return {
            ...sanitized,
            categoryId: catId,
            category_id: catId,
            category: catId,
            categoryName: catName
          };
        });
      }
    } catch (err) {
      console.warn("[TrendingServices] MySQL query failed:", err.message);
    }
  }

  // 2. JSON Database Fallback
  if (trendingList.length === 0) {
    try {
      const data = DbLayer.getLayer().readData ? DbLayer.getLayer().readData() : null;
      if (data && data.services && data.services.length > 0) {
        const cats = data.categories || [];
        const catMap = {};
        cats.forEach(c => { catMap[String(c.id)] = c.name || c.title; });

        trendingList = data.services.slice(0, 20).map(s => {
          const catId = String(s.category || s.categoryId || '1');
          const catName = String(s.categoryName || catMap[catId] || s.category || 'Service');
          return {
            ...s,
            id: String(s.id),
            serviceId: String(s.id),
            title: String(s.title || s.name || ''),
            name: String(s.name || s.title || ''),
            price: Number(s.price || 0),
            description: String(s.description || ''),
            categoryId: catId,
            category_id: catId,
            category: catId,
            categoryName: catName,
            image: s.image || "/uploads/1782367898826-830124248.jpg"
          };
        });
      }
    } catch (jsonErr) {
      console.warn("[TrendingServices] JSON fallback failed:", jsonErr.message);
    }
  }

  // 3. Guaranteed Static Fallback (Ensures backend NEVER returns 0 trending services)
  if (trendingList.length === 0) {
    trendingList = [
      { id: "101", serviceId: "101", title: "AC Foam Jet Service", price: 499, description: "Professional foam jet deep cleaning for your AC", category: "38", categoryId: "38", category_id: "38", categoryName: "AC Repair", image: "/uploads/1782370871985-653299335.jpg" },
      { id: "102", serviceId: "102", title: "2BHK Deep Cleaning", price: 999, description: "Complete home deep cleaning by verified professionals", category: "7", categoryId: "7", category_id: "7", categoryName: "Cleaning", image: "/uploads/1782379281899-302488180.jpg" },
      { id: "103", serviceId: "103", title: "House Wiring Electrician", price: 699, description: "Expert electrician for all electrical installation & repair", category: "3", categoryId: "3", category_id: "3", categoryName: "Electrician", image: "/uploads/1782368297524-943557893.jpg" },
      { id: "104", serviceId: "104", title: "professional Plumber", price: 499, description: "Fix pipe leakages, taps, and plumbing installations", category: "1", categoryId: "1", category_id: "1", categoryName: "Plumber", image: "/uploads/1782367898826-830124248.jpg" },
      { id: "105", serviceId: "105", title: "Women Haircut", price: 249, description: "Professional salon services at your doorstep", category: "5", categoryId: "5", category_id: "5", categoryName: "Salon", image: "/uploads/1782392839781-267721012.jpg" },
      { id: "106", serviceId: "106", title: "Basic Car Wash (Exterior Only)", price: 249, description: "Exterior car body wash with shampoo and tyre cleaning", category: "27", categoryId: "27", category_id: "27", categoryName: "Car Washing", image: "/uploads/1782369487901-215785215.jpg" }
    ];
  }

  const finalTrending = resolveServiceUrls(trendingList, serverBaseUrl).map(s => {
    const catId = String(s.categoryId || s.category_id || s.category || '1');
    return {
      ...s,
      categoryId: catId,
      category_id: catId,
      category: catId
    };
  });

  res.json({
    success: true,
    total: finalTrending.length,
    services: finalTrending,
    data: finalTrending
  });
});

// Categories: Get Services by Category name
app.get('/api/categories/:category/services', async (req, res) => {
  const { category } = req.params;
  const { search } = req.query;

  const normCatStr = (s) => (s || '').toString().toLowerCase()
    .replace(/&/g, 'and')
    .replace(/cater'?s?/g, 'halwai')
    .replace(/[\s\-_']/g, '');

  const cleanCategory = normCatStr(category);

  const STATIC_CAT_ID_MAP = {
    '1': 'Plumber',
    '3': 'Electrician',
    '5': 'Salon And Spa',
    '7': 'Cleaning',
    '9': 'Architecture',
    '11': 'Carpenter',
    '27': 'Car Washing',
    '29': 'Mechanic',
    '37': 'Salon And Spa',
    '38': 'AcRepair',
    '40': 'Compounder',
    '41': 'Halwai',
    '42': 'Driver',
    '43': 'Doctors',
    '46': 'Pest Control',
    '48': 'Photographer',
    '49': 'Painter',
    '50': 'Repairing',
    '57': 'Contractor',
    '58': 'Pandit ji'
  };

  let mappedCatName = STATIC_CAT_ID_MAP[category.trim()] || category;

  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  const statusParam = req.query.status || req.body.status;
  const isAmcMode = statusParam === "AMC";

  let dbServices = [];

  // 1. Check MySQL if available
  if (mysqlReady) {
    try {
      const [catRows] = await mysqlPool.query(
        "SELECT * FROM node_categories WHERE LOWER(title) = ? OR id = ? OR REPLACE(REPLACE(REPLACE(LOWER(title), ' ', ''), '-', ''), '_', '') = ? OR LOWER(title) = ?",
        [category.toLowerCase(), isNaN(category) ? -1 : parseInt(category), cleanCategory, mappedCatName.toLowerCase()]
      );

      if (catRows.length > 0) {
        const cat = catRows[0];
        let queryStr = "SELECT * FROM node_services WHERE (category_id = ? OR LOWER(category) = ? OR REPLACE(REPLACE(REPLACE(LOWER(category), ' ', ''), '-', ''), '_', '') = ?) AND status IN (0, 1)";
        const queryParams = [cat.id, (cat.title || cat.name || '').toLowerCase(), cleanCategory];

        if (search) {
          queryStr += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)";
          const term = `%${search.toString().toLowerCase()}%`;
          queryParams.push(term, term);
        }

        const [srvRows] = await mysqlPool.query(queryStr, queryParams);
        dbServices = srvRows.map(r => sanitizeServiceDbObj(r, serverBaseUrl));
      }
    } catch (err) {
      console.warn("[DynamicServices] DB query failed:", err.message);
    }
  }

  // 2. Check database.json
  let jsonServices = [];
  let matchedCatTitle = mappedCatName;

  try {
    const data = readDataFromJsonDb();
    if (data && data.categories && data.services) {
      const cats = data.categories || [];
      const catObj = cats.find(c => 
        c.id.toString() === category.toString() || 
        (c.name && c.name.toLowerCase() === category.toLowerCase()) ||
        (c.title && c.title.toLowerCase() === category.toLowerCase()) ||
        (c.name && normCatStr(c.name) === cleanCategory) ||
        (c.title && normCatStr(c.title) === cleanCategory) ||
        (c.name && normCatStr(c.name) === normCatStr(mappedCatName)) ||
        (c.name && (normCatStr(c.name).includes(cleanCategory) || cleanCategory.includes(normCatStr(c.name)))) ||
        c.id.toString() === cleanCategory
      );

      if (catObj) {
        matchedCatTitle = catObj.name || catObj.title || mappedCatName;
        const catIdStr = catObj.id.toString();
        const catNameClean = normCatStr(matchedCatTitle);
        jsonServices = data.services.filter(s => {
          if (!s || !s.category) return false;
          const sCatStr = s.category.toString();
          const sCatClean = normCatStr(sCatStr);
          return sCatStr === catIdStr || sCatClean === catNameClean || sCatClean === cleanCategory || sCatClean === normCatStr(mappedCatName);
        });
      }
    }
  } catch (err) {
    console.warn("Failed to load category services from JSON database fallback:", err.message);
  }

  // 3. Resolve static SERVICES_DATA
  const cleanMatchedCat = normCatStr(matchedCatTitle);
  const matchedCategoryKey = Object.keys(SERVICES_DATA).find(
    key => normCatStr(key) === cleanMatchedCat ||
           normCatStr(key) === cleanCategory ||
           normCatStr(key).includes(cleanCategory) ||
           cleanCategory.includes(normCatStr(key))
  );
  let staticServices = matchedCategoryKey ? SERVICES_DATA[matchedCategoryKey] : [];

  if (search) {
    const query = search.toString().toLowerCase();
    staticServices = staticServices.filter(
      s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
    );
    jsonServices = jsonServices.filter(
      s => (s.title || s.name || '').toLowerCase().includes(query) || (s.description || '').toLowerCase().includes(query)
    );
  }

  // 4. Merge DB, JSON, and Static services avoiding duplicate titles
  const existingTitles = new Set(dbServices.map(s => (s.title || s.name || '').toLowerCase()));
  
  for (const js of jsonServices) {
    const titleKey = (js.title || js.name || '').toLowerCase();
    if (titleKey && !existingTitles.has(titleKey)) {
      existingTitles.add(titleKey);
      dbServices.push(js);
    }
  }

  for (const st of staticServices) {
    const titleKey = (st.title || st.name || '').toLowerCase();
    if (titleKey && !existingTitles.has(titleKey)) {
      existingTitles.add(titleKey);
      dbServices.push(st);
    }
  }

  if (dbServices.length === 0) {
    return res.status(404).json({
      success: false,
      error: `Category '${category}' not found`,
      availableCategories: CATEGORIES_DATA
    });
  }

  const finalServices = resolveServiceUrls(dbServices, serverBaseUrl).map(s => {
    if (isAmcMode) {
      return { ...s, price: 0, status: "AMC" };
    }
    return s;
  });

  const localizedFinalServices = finalServices.map(s => localizeService(s, req.lang));
  const catLocalized = localizeCategory({ id: category, name: matchedCatTitle, title: matchedCatTitle }, req.lang);

  res.json({
    success: true,
    category: catLocalized.name || catLocalized.title,
    status: isAmcMode ? "AMC" : "Regular",
    total: localizedFinalServices.length,
    services: localizedFinalServices
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

// Helper: Sanitize database service row into a standard service object
const sanitizeServiceDbObj = (r, serverBaseUrl) => {
  const dbPrice = parseFloat(r.price);
  const discountVal = r.discount !== null && r.discount !== undefined ? parseFloat(r.discount) : 0.00;
  let finalPrice = dbPrice;
  let cutPrice = dbPrice;
  let displayDiscount = 0;
  if (discountVal > 0) {
    finalPrice = Math.max(0, dbPrice - discountVal);
    displayDiscount = dbPrice > 0 ? Math.round((discountVal / dbPrice) * 100) : 0;
    displayDiscount = Math.min(100, displayDiscount);
  }

  let dbHighlights = [];
  if (r.highlights) {
    try {
      dbHighlights = typeof r.highlights === 'string' ? JSON.parse(r.highlights) : r.highlights;
    } catch (e) {
      console.warn("Failed to parse highlights:", e.message);
    }
  }
  if (!Array.isArray(dbHighlights)) {
    dbHighlights = [];
  }

  // Consistent rating resolution
  const finalRating = r.rating !== null && r.rating !== undefined ? parseFloat(r.rating) : 4.8;

  // Consistent pseudo-random reviews count based on service ID
  const reviewsCount = 50 + (parseInt(r.id) * 17) % 250; 

  let resolvedImage = r.image || "";
  if (resolvedImage) {
    if (resolvedImage.startsWith('/assets/')) {
      resolvedImage = `${serverBaseUrl}${resolvedImage}`;
    } else if (!resolvedImage.startsWith('http') && !resolvedImage.startsWith('https')) {
      if (!resolvedImage.includes('/')) {
        resolvedImage = `https://adminbackend-1-h03r.onrender.com/uploads/${resolvedImage}`;
      } else {
        resolvedImage = `${serverBaseUrl.includes('localhost') || serverBaseUrl.includes('127.0.0.1') || serverBaseUrl.includes('10.0.2.2') ? 'https://homefaciliti.com' : serverBaseUrl}/uploads/services/${resolvedImage}`;
      }
    }
  }

  const defaultHighlights = [
    "Includes background-checked & certified partner",
    "30-day post-service warranty cover included",
    "Equipped with premium professional-grade tools",
    "100% safe, hygienic, and high-quality service execution"
  ];
  const finalHighlights = dbHighlights.length > 0 ? dbHighlights : defaultHighlights;

  const serviceObj = {
    id: r.id ? parseInt(r.id) : null,
    serviceId: r.id ? parseInt(r.id) : null,
    productDbId: r.id ? parseInt(r.id) : null,
    productId: r.title,
    title: r.title,
    name: r.title,
    productName: r.title,
    product_name: r.title,
    serviceName: r.title,
    price: finalPrice,
    description: r.description || "",
    productDescription: r.description || "",
    product_description: r.description || "",
    image: resolvedImage,
    discount: displayDiscount,
    rating: finalRating,
    reviewsCount: reviewsCount,
    cutPrice: cutPrice,
    isHighlighted: r.isHighlighted !== null && r.isHighlighted !== undefined ? String(r.isHighlighted) : "false",
    highlights: finalHighlights,
    category: r.category_id ? r.category_id.toString() : "",
    categoryId: r.category_id ? r.category_id.toString() : "",
    duration: r.title.toLowerCase().includes("cleaning") || r.title.toLowerCase().includes("paint") ? "3-4 Hours" : "1-2 Hours",
  };
  for (const lang of ['hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'pa', 'or', 'as']) {
    if (r[`title_${lang}`]) serviceObj[`title_${lang}`] = r[`title_${lang}`];
    if (r[`name_${lang}`]) serviceObj[`name_${lang}`] = r[`name_${lang}`];
    if (r[`description_${lang}`]) serviceObj[`description_${lang}`] = r[`description_${lang}`];
  }
  return serviceObj;
};

const getHdFallbackServiceImageUrl = (title, categoryName) => {
  const t = (title || '').toLowerCase();
  const c = (categoryName || '').toLowerCase();

  if (t.includes('plumb') || t.includes('tap') || t.includes('pipe') || t.includes('drain') || t.includes('leak') || t.includes('basin') || t.includes('toilet') || t.includes('tank')) {
    return "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('electric') || t.includes('wire') || t.includes('switch') || t.includes('fan') || t.includes('light') || t.includes('fuse') || t.includes('mcb') || t.includes('inverter') || t.includes('meter') || t.includes('wiring')) {
    return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('ac') || t.includes('air condition') || t.includes('cool') || t.includes('foam') || t.includes('gas charging') || t.includes('compressor')) {
    return "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('car wash') || t.includes('car spa') || t.includes('car detail') || t.includes('foam wash') || t.includes('auto wash') || c.includes('car')) {
    return "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('clean') || t.includes('scrub') || t.includes('sofa') || t.includes('bathroom') || t.includes('kitchen') || t.includes('carpet') || t.includes('deep')) {
    return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('salon') || t.includes('hair') || t.includes('facial') || t.includes('makeup') || t.includes('waxing') || t.includes('manicure') || t.includes('pedicure') || t.includes('threading') || c.includes('salon')) {
    return "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('spa') || t.includes('massage') || t.includes('therapy') || c.includes('spa')) {
    return "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('paint') || t.includes('wall') || t.includes('texture') || t.includes('putty') || c.includes('paint')) {
    return "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('carpent') || t.includes('wood') || t.includes('furniture') || t.includes('door') || t.includes('window') || t.includes('lock') || c.includes('carpent')) {
    return "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('mechanic') || t.includes('bike') || t.includes('engine') || t.includes('brake') || t.includes('clutch') || t.includes('oil') || c.includes('mechanic')) {
    return "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('pest') || t.includes('termite') || t.includes('cockroach') || t.includes('bedbug') || c.includes('pest')) {
    return "https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('photo') || t.includes('camera') || t.includes('shoot') || t.includes('wedding') || c.includes('photo')) {
    return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('pandit') || t.includes('puja') || t.includes('pooja') || t.includes('hawan') || c.includes('pandit')) {
    return "https://images.unsplash.com/photo-1609137144813-7d9921338f24?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('doctor') || t.includes('consultation') || t.includes('medical') || t.includes('health') || c.includes('doctor')) {
    return "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('driver') || t.includes('ride') || t.includes('trip') || c.includes('driver')) {
    return "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('solar') || t.includes('panel') || t.includes('sun') || c.includes('solar')) {
    return "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('architect') || t.includes('interior') || t.includes('design') || t.includes('space') || t.includes('commercial') || c.includes('architect')) {
    return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('contractor') || t.includes('renovation') || t.includes('building') || t.includes('civil') || c.includes('contractor')) {
    return "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=500&auto=format&fit=crop";
  }
  if (t.includes('cater') || t.includes('halwai') || t.includes('food') || t.includes('chef') || c.includes('cater')) {
    return "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=500&auto=format&fit=crop";
  }

  return "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=500&auto=format&fit=crop";
};

// Helper: Resolve relative service image URLs dynamically
function resolveServiceUrls(services, serverBaseUrl) {
  if (!Array.isArray(services)) return [];
  return services.map(s => {
    let img = s.image || s.serviceImage || s.productImage || s.photo || "";
    if (!img || img.includes('adminbackend-1-h03r') || img.endsWith('/uploads/1') || img === '1') {
      img = getHdFallbackServiceImageUrl(s.title || s.name || '', s.category || '');
    } else if (img.startsWith('http://') || img.startsWith('https://')) {
      // Valid HTTP/HTTPS image URL
    } else if (img.startsWith('/assets/')) {
      img = `${serverBaseUrl}${img}`;
    } else {
      const cleanFilename = img.replace(/^\/+/, '').replace(/^uploads\//, '');
      img = `${serverBaseUrl}/uploads/${cleanFilename}`;
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

  const cleanCategory = category ? category.toLowerCase().replace(/[\s\-_]/g, '') : "";

  if (dbMode === "mysql" && mysqlReady) {
    try {
      let queryStr = "SELECT * FROM node_services WHERE status IN (0, 1)";
      const queryParams = [];

      if (category) {
        // Try to resolve category ID
        const [catRows] = await mysqlPool.query(
          "SELECT id FROM node_categories WHERE LOWER(title) = ? OR id = ? OR REPLACE(REPLACE(REPLACE(LOWER(title), ' ', ''), '-', ''), '_', '') = ?",
          [category.toLowerCase(), isNaN(category) ? -1 : parseInt(category), cleanCategory]
        );
        if (catRows.length > 0) {
          queryStr += " AND category_id = ?";
          queryParams.push(catRows[0].id);
        } else {
          queryStr += " AND category_id = -1";
        }
      }

      if (search) {
        queryStr += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)";
        const term = `%${search.toString().toLowerCase()}%`;
        queryParams.push(term, term);
      }

      const [srvRows] = await mysqlPool.query(queryStr, queryParams);
      const dbServices = srvRows.map(r => sanitizeServiceDbObj(r, serverBaseUrl));

      // Merge with static services
      let staticList = [];
      if (category) {
        const matchedStaticCategory = Object.keys(SERVICES_DATA).find(
          key => key.toLowerCase().replace(/[\s\-_]/g, '') === cleanCategory
        );
        if (matchedStaticCategory) {
          staticList = SERVICES_DATA[matchedStaticCategory] || [];
        }
      } else {
        staticList = Object.values(SERVICES_DATA).flat();
      }

      if (search) {
        const query = search.toString().toLowerCase();
        staticList = staticList.filter(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
      }

      const dbTitles = new Set(dbServices.map(s => s.title.toLowerCase()));
      const uniqueStatic = staticList.filter(s => !dbTitles.has(s.title.toLowerCase()));
      const mergedServices = [...dbServices, ...uniqueStatic];

      return res.json({
        success: true,
        services: resolveServiceUrls(mergedServices, serverBaseUrl).map(s => localizeService(s, req.lang))
      });
    } catch (err) {
      console.warn("[DynamicServices] DB query all failed, falling back to static:", err.message);
    }
  }

  // FALLBACK: Load from database.json if available
  let list = [];
  let loadedFromDb = false;
  try {
    const data = DbLayer.getLayer().readData ? DbLayer.getLayer().readData() : null;
    if (data && data.services && data.services.length > 0) {
      list = data.services;
      loadedFromDb = true;
      
      // Filter by category
      if (category) {
        const cats = data.categories || [];
        const matchedCat = cats.find(c => 
          c.id.toString() === category.toString() || 
          c.name.toLowerCase() === category.toLowerCase() || 
          c.id.toString() === cleanCategory
        );
        if (matchedCat) {
          list = list.filter(s => s.category.toString() === matchedCat.id.toString());
        } else {
          list = list.filter(s => s.category.toString() === category.toString());
        }
      }
    }
  } catch (err) {
    console.warn("Failed to load fallback services from JSON file:", err.message);
  }

  if (!loadedFromDb) {
    if (category) {
      const matchedStaticCategory = Object.keys(SERVICES_DATA).find(
        key => key.toLowerCase().replace(/[\s\-_]/g, '') === cleanCategory
      );
      list = shuffleArray(matchedStaticCategory ? SERVICES_DATA[matchedStaticCategory] : []);
    } else {
      list = shuffleArray(Object.values(SERVICES_DATA).flat());
    }
  }

  if (search) {
    const query = search.toString().toLowerCase();
    list = list.filter(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
  }

  res.json({ success: true, services: resolveServiceUrls(list, serverBaseUrl).map(s => localizeService(s, req.lang)) });
});


// 8. Services: Trending (1st = AC Free Checkup ₹0 fixed, rest 4 = random from DB)
app.get('/api/services/trending', async (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  // Default AC Foam Jet Service fallback object
  let acFreeService = {
    productId: 'AC Foam Jet Service',
    title: 'AC Foam Jet Service',
    price: 499,
    description: 'Deep clean your AC with professional foam jet technology. Removes dust, bacteria & improves cooling efficiency.',
    image: `${serverBaseUrl}/assets/categories/ac_repair.png`,
    discount: 0,
    rating: 4.9,
    reviewsCount: 240,
    cutPrice: 499,
    category: 'AcRepair',
    highlights: []
  };

  if (dbMode === "mysql" && mysqlReady) {
    try {
      // 1. Fetch dynamic details for "AC Foam Jet Service" if it exists in the database
      const [acRows] = await mysqlPool.query("SELECT * FROM node_services WHERE title = 'AC Foam Jet Service' LIMIT 1");
      if (acRows.length > 0) {
        acFreeService = sanitizeServiceDbObj(acRows[0], serverBaseUrl);
      }

      // 2. Fetch 4 random other services
      const [srvRows] = await mysqlPool.query("SELECT * FROM node_services WHERE status IN (0, 1) AND title != 'AC Foam Jet Service' ORDER BY RAND() LIMIT 4");
      const dbServices = srvRows.map(r => sanitizeServiceDbObj(r, serverBaseUrl));

      // If less than 4 from DB, fill with static services
      if (dbServices.length < 4) {
        const allStatic = Object.values(SERVICES_DATA).flat();
        const shuffledStatic = shuffleArray(allStatic);
        const dbTitles = new Set(dbServices.map(s => s.title.toLowerCase()));
        dbTitles.add('ac foam jet service');
        for (const s of shuffledStatic) {
          if (dbServices.length >= 4) break;
          if (!dbTitles.has(s.title.toLowerCase())) {
            dbServices.push(s);
            dbTitles.add(s.title.toLowerCase());
          }
        }
      }

      return res.json({ success: true, services: resolveServiceUrls([acFreeService, ...dbServices], serverBaseUrl).map(s => localizeService(s, req.lang)) });
    } catch (err) {
      console.warn("[DynamicServices] DB trending failed, falling back static:", err.message);
    }
  }

  const allServices = Object.values(SERVICES_DATA).flat();
  const trending = [acFreeService, ...shuffleArray(allServices).slice(0, 4)];
  res.json({ success: true, services: resolveServiceUrls(trending, serverBaseUrl).map(s => localizeService(s, req.lang)) });
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

  const statusParam = req.query.status || req.body.status;
  let hasActiveAmc = false;
  let detectedCategory = null;

  if (dbMode === "mysql" && mysqlReady) {
    try {
      const cleanTitle = title.toLowerCase().replace(/[\s\-_]/g, '');
      const [srvRows] = await mysqlPool.query(
        "SELECT * FROM node_services WHERE LOWER(title) = ? OR LOWER(title_hi) = ? OR id = ? OR REPLACE(REPLACE(REPLACE(LOWER(title), ' ', ''), '-', ''), '_', '') = ? OR REPLACE(REPLACE(REPLACE(LOWER(title_hi), ' ', ''), '-', ''), '_', '') = ?",
        [title.toLowerCase(), title.toLowerCase(), isNaN(title) ? -1 : parseInt(title), cleanTitle, cleanTitle]
      );
      if (srvRows.length > 0) {
        const r = srvRows[0];
        const enrichedService = sanitizeServiceDbObj(r, serverBaseUrl);
        
        hasActiveAmc = statusParam === "AMC";

        if (hasActiveAmc) {
          enrichedService.price = 0;
          enrichedService.status = "AMC";
        }

        return res.json({
          success: true,
          service: localizeService(enrichedService, req.lang),
          status: hasActiveAmc ? "AMC" : "Regular",
          message: translate("service_details_retrieved", req.lang)
        });
      }
    } catch (err) {
      console.warn("[DynamicServices] DB detail failed, falling back static:", err.message);
    }
  }

  let foundService = null;
  let foundCategory = null;

  // Try loading from database.json first
  try {
    const data = readDataFromJsonDb();
    if (data && data.services && data.services.length > 0) {
      const cleanTitle = title.toLowerCase().replace(/[\s\-_]/g, '');
      const match = data.services.find(s => 
        s.title.toLowerCase() === title.toLowerCase() || 
        s.id.toString() === title.toString() ||
        s.title.toLowerCase().replace(/[\s\-_]/g, '') === cleanTitle
      );
      if (match) {
        foundService = match;
        // Resolve category name from ID
        const cats = data.categories || [];
        const catObj = cats.find(c => c.id.toString() === match.category.toString());
        foundCategory = catObj ? catObj.name : match.category;
      }
    }
  } catch (err) {
    console.warn("Failed to load service detail from JSON fallback:", err.message);
  }

  // Fallback to static SERVICES_DATA if not found in database.json
  if (!foundService) {
    for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
      const match = services.find(s => s.title.toLowerCase() === title.toLowerCase());
      if (match) {
        foundService = match;
        foundCategory = categoryName;
        break;
      }
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

  hasActiveAmc = statusParam === "AMC";

  // Add rich mock metadata for details
  const enrichedService = {
    productId: foundService.title || foundService.productId,
    title: foundService.title,
    price: hasActiveAmc ? 0 : Number(foundService.price),
    status: hasActiveAmc ? "AMC" : "Regular",
    description: foundService.description || foundService.productDescription || "",
    image: resolvedImage,
    category: foundCategory,
    categoryId: foundService.categoryId || foundService.category,
    duration: foundService.duration || (foundService.title.toLowerCase().includes("cleaning") || foundService.title.toLowerCase().includes("paint") ? "3-4 Hours" : "1-2 Hours"),
    rating: foundService.rating !== undefined ? parseFloat(foundService.rating) : 4.8,
    reviewsCount: foundService.reviewsCount !== undefined ? parseInt(foundService.reviewsCount) : 124,
    discount: foundService.discount !== undefined ? parseFloat(foundService.discount) : 0,
    cutPrice: foundService.cutPrice !== undefined ? parseFloat(foundService.cutPrice) : Number(foundService.price),
    highlights: foundService.highlights || [
      "Includes background-checked & certified partner",
      "30-day post-service warranty cover included",
      "Equipped with premium professional-grade tools",
      "100% safe, hygienic, and high-quality service execution"
    ]
  };

  res.json({
    success: true,
    service: localizeService(enrichedService, req.lang),
    status: hasActiveAmc ? "AMC" : "Regular",
    message: translate("service_details_retrieved", req.lang)
  });
};

app.get('/api/services/detail/:title', handleServiceDetail);
app.get('/api/services/detail', handleServiceDetail);

// 9. Search: Global search across services AND categories
app.get('/api/search', async (req, res) => {
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

  if (dbMode === "mysql" && mysqlReady) {
    try {
      // 1. Search categories in DB
      const [catRows] = await mysqlPool.query(
        "SELECT * FROM node_categories WHERE status = 1 AND LOWER(title) LIKE ?",
        [`%${lowerTerm}%`]
      );
      const dbCategories = catRows.map(c => {
        const cleanName = c.title.toLowerCase().replace(/[\s\-_]/g, '');
        const defaultMatch = DEFAULT_CATEGORIES.find(dc => {
          const cleanDcId = dc.id.toLowerCase().replace(/[\s\-_]/g, '');
          const cleanDcName = dc.name.toLowerCase().replace(/[\s\-_]/g, '');
          return cleanDcId === cleanName || cleanDcName === cleanName || String(c.id) === String(dc.id);
        });
        let img = c.image || "";
        if (img && !img.startsWith('http') && !img.startsWith('https') && !img.startsWith('/assets/')) {
          img = `https://adminbackend-1-h03r.onrender.com/uploads/${img}`;
        }
        let name = c.title;
        let id = String(c.id);
        if (defaultMatch) {
          id = defaultMatch.id;
          name = defaultMatch.name;
          if (!img || img.trim() === '') {
            img = defaultMatch.image;
          }
        }
        if (img && img.startsWith('/assets/')) {
          img = `${serverBaseUrl}${img}`;
        }
        return { id, name, image: img };
      });

      // 2. Search services in DB
      const [srvRows] = await mysqlPool.query(
        `SELECT s.*, c.title as category_title 
         FROM node_services s 
         LEFT JOIN node_categories c ON s.category_id = c.id 
         WHERE s.status IN (0, 1) AND (LOWER(s.title) LIKE ? OR LOWER(s.description) LIKE ? OR LOWER(c.title) LIKE ?)`,
        [`%${lowerTerm}%`, `%${lowerTerm}%`, `%${lowerTerm}%`]
      );
      const dbServices = srvRows.map(r => {
        const srv = sanitizeServiceDbObj(r, serverBaseUrl);
        return {
          ...srv,
          category: r.category_title || ""
        };
      });

      // Merge with static search results
      const staticCategories = CATEGORIES_DATA.filter(cat => cat.toLowerCase().includes(lowerTerm));
      const staticServices = [];
      for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
        for (const service of services) {
          if (
            service.title.toLowerCase().includes(lowerTerm) ||
            service.description.toLowerCase().includes(lowerTerm) ||
            categoryName.toLowerCase().includes(lowerTerm)
          ) {
            staticServices.push({
              ...service,
              category: categoryName
            });
          }
        }
      }

      // Merge categories
      const catNames = new Set(dbCategories.map(c => c.name.toLowerCase()));
      const uniqueStaticCats = staticCategories.filter(cat => !catNames.has(cat.toLowerCase())).map(cat => {
        const defaultMatch = DEFAULT_CATEGORIES.find(dc => dc.name.toLowerCase() === cat.toLowerCase());
        let img = defaultMatch ? defaultMatch.image : "";
        if (img && img.startsWith('/assets/')) {
          img = `${serverBaseUrl}${img}`;
        }
        return {
          id: defaultMatch ? defaultMatch.id : cat.toLowerCase().replace(/\s+/g, '_'),
          name: cat,
          image: img
        };
      });
      const finalCategories = [...dbCategories, ...uniqueStaticCats];

      // Merge services
      const srvTitles = new Set(dbServices.map(s => s.title.toLowerCase()));
      const uniqueStaticSrvs = staticServices.filter(s => !srvTitles.has(s.title.toLowerCase()));
      const finalServices = [...dbServices, ...uniqueStaticSrvs];

      return res.json({
        success: true,
        query: searchTerm,
        results: {
          categories: finalCategories,
          services: resolveServiceUrls(finalServices, serverBaseUrl),
          totalCategories: finalCategories.length,
          totalServices: finalServices.length
        }
      });
    } catch (err) {
      console.warn("[Search] DB search failed, falling back static:", err.message);
    }
  }

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
      categories: matchedCategories.map(cat => {
        const defaultMatch = DEFAULT_CATEGORIES.find(dc => dc.name.toLowerCase() === cat.toLowerCase());
        let img = defaultMatch ? defaultMatch.image : "";
        if (img && img.startsWith('/assets/')) {
          img = `${serverBaseUrl}${img}`;
        }
        return {
          id: defaultMatch ? defaultMatch.id : cat.toLowerCase().replace(/\s+/g, '_'),
          name: cat,
          image: img
        };
      }),
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
    const isAmcPay = (paramOrderId && String(paramOrderId).toUpperCase().startsWith("AMC")) || 
                     (rzpOrderId && String(rzpOrderId).toUpperCase().startsWith("AMC"));
    
    if (isAmcPay) {
      let amcSub = null;
      if (paramOrderId && String(paramOrderId).toUpperCase().startsWith("AMC")) {
        amcSub = await DbLayer.getAmcSubscriptionById(paramOrderId);
      }
      if (!amcSub && rzpOrderId) {
        const [rows] = await mysqlPool.query("SELECT * FROM node_amc_subscriptions WHERE razorpayOrderId = ?", [rzpOrderId]);
        if (rows.length > 0) {
          amcSub = rows[0];
        }
      }

      if (!amcSub) {
        return res.status(404).json({ error: "AMC subscription not found for payment verification" });
      }

      const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwFaJKQjU5ZOsH';
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'JY4Uup8xp2k1AvXXE2ezOje2';
      const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
      
      let status = "pending";
      let paymentDetails = null;
      let verifiedViaRazorpay = false;
      let razorpayAuthError = false;

      if (paymentId) {
        try {
          const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': authHeader }
          });
          const data = await rzpRes.json();
          if (rzpRes.status === 401 || (data.error && data.error.description && data.error.description.includes('Authentication'))) {
            razorpayAuthError = true;
          } else if (data && data.status) {
            status = data.status;
            paymentDetails = data;
            verifiedViaRazorpay = true;
          }
        } catch (err) {
          console.error(`[Razorpay AMC] Error fetching payment ID ${paymentId}:`, err.message);
        }
      } else if (amcSub.razorpayOrderId) {
        try {
          const rzpRes = await fetch(`https://api.razorpay.com/v1/orders/${amcSub.razorpayOrderId}/payments`, {
            headers: { 'Authorization': authHeader }
          });
          const data = await rzpRes.json();
          if (rzpRes.status === 401 || (data.error && data.error.description && data.error.description.includes('Authentication'))) {
            razorpayAuthError = true;
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
          console.error(`[Razorpay AMC] Error fetching payments for Razorpay Order ${amcSub.razorpayOrderId}:`, err.message);
        }
      }

      if (razorpayAuthError || !verifiedViaRazorpay) {
        if (!isMockPaymentAllowed()) {
          status = "failed";
        } else {
          paymentDetails = {
            razorpay_payment_id: paymentId || `pay_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
            razorpay_order_id: amcSub.razorpayOrderId || `order_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
            status: "captured",
            amount: Number(amcSub.price) * 100,
            currency: "INR"
          };
          status = "captured";
        }
      }

      if (status === "captured") {
        const pId = paymentDetails ? (paymentDetails.id || paymentDetails.razorpay_payment_id) : null;
        await DbLayer.updateAmcSubscription(amcSub.amcId, {
          status: "active",
          razorpayPaymentId: pId
        });
        console.log(`[Payment Verify] AMC subscription ${amcSub.amcId} verified and set to active via payment ${pId}`);
      }

      return res.json({
        success: status === "captured",
        orderId: amcSub.amcId,
        paymentStatus: status,
        paymentDetails: paymentDetails,
        message: status === "captured"
          ? `AMC Subscription payment verified successfully. Status: ${status}`
          : `Payment verification failed. Status: ${status}`
      });
    }

    let order = null;
    let isDraft = false;
    let orderId = isNaN(paramOrderId) ? null : parseInt(paramOrderId);
    
    if (orderId) {
      order = await DbLayer.getOrderById(orderId);
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.id === orderId) {
            order = draft;
            isDraft = true;
            break;
          }
        }
      }
    } else if (paramOrderId) {
      // If paramOrderId is not numeric, treat it as the Razorpay Order ID
      order = await DbLayer.getOrderByRazorpayOrderId(paramOrderId);
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.razorpayOrderId === paramOrderId) {
            order = draft;
            isDraft = true;
            break;
          }
        }
      }
    }
    
    // Try to find the order by razorpayOrderId from query/body if not found by path parameter
    if (!order && rzpOrderId) {
      order = await DbLayer.getOrderByRazorpayOrderId(rzpOrderId);
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.razorpayOrderId === rzpOrderId) {
            order = draft;
            isDraft = true;
            break;
          }
        }
      }
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
      if (!isMockPaymentAllowed()) {
        console.error(`[Razorpay] Verification failed. Fallback simulation is disabled in this environment. (AuthError: ${razorpayAuthError}, Verified: ${verifiedViaRazorpay})`);
        status = "failed";
      } else {
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
    }

    // 4. Update the local order if paid successfully
    if (order && status === "captured") {
      const pId = paymentDetails ? (paymentDetails.id || paymentDetails.razorpay_payment_id) : null;
      if (isDraft) {
        order.status = "Paid";
        order.bookingStatus = "searching";
        order.razorpayPaymentId = pId;
        await DbLayer.createOrder(order);
        draftOrders.delete(order.userPhone);
        console.log(`[Payment] Promoting draft order #${resolvedOrderId} to database as Paid via Razorpay Payment ${pId}`);
      } else {
        await DbLayer.updateOrder(resolvedOrderId, {
          status: "Paid",
          bookingStatus: "searching", // begin search for professionals
          razorpayPaymentId: pId
        });
        console.log(`[Payment] Order #${resolvedOrderId} marked as Paid via Razorpay Payment ${pId}`);
      }
      if (order && order.userPhone) {
        await DbLayer.clearCart(order.userPhone).catch(() => {});
        await saveUserRawCartItems(order.userPhone, []).catch(() => {});
        console.log(`[Cart] Cleared cart for user ${order.userPhone} after payment verification`);
      }
    }

    res.json({
      success: status === "captured" || status === "cod",
      orderId: resolvedOrderId,
      paymentStatus: status,
      paymentDetails: paymentDetails,
      message: (status === "captured" || status === "cod")
        ? `Payment checked successfully from Razorpay. Status: ${status}`
        : `Payment verification failed. Status: ${status}`
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
      const numId = parseInt(orderIdStr);
      order = await DbLayer.getOrderById(numId);
      // Also check in-memory draft orders (online payment orders not yet confirmed)
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.id === numId) {
            order = draft;
            break;
          }
        }
      }
    } else {
      order = await DbLayer.getOrderByRazorpayOrderId(orderIdStr);
      // Also check in-memory draft orders
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.razorpayOrderId === orderIdStr) {
            order = draft;
            break;
          }
        }
      }
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
            ${isMockPaymentAllowed() ? (isMockMode ? `
              <div style="padding: 12px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; font-size: 13px; color: #fbbf24; margin-bottom: 10px;">
                ⚠️ Sandbox mode active: Live Razorpay credentials are not configured or invalid.
              </div>
              <button class="btn btn-simulated" onclick="payMock()">Proceed with Simulated Payment</button>
            ` : `
              <button class="btn btn-primary" onclick="payReal()">Pay Securely via Razorpay</button>
              <button class="btn btn-simulated" style="background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1);" onclick="payMock()">Pay via Simulator (Test)</button>
            `) : (isMockMode ? `
              <div style="padding: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; font-size: 13px; color: #ef4444; margin-bottom: 10px;">
                ❌ Payment unavailable: Live Razorpay credentials are not configured.
              </div>
            ` : `
              <button class="btn btn-primary" onclick="payReal()">Pay Securely via Razorpay</button>
            `)}
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
    let isDraftOrder = false;
    let order = null;
    if (!isNaN(orderIdStr)) {
      const numId = parseInt(orderIdStr);
      order = await DbLayer.getOrderById(numId);
      // Also check in-memory draft orders (online payment orders pending confirmation)
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.id === numId) {
            order = draft;
            isDraftOrder = true;
            break;
          }
        }
      }
    } else {
      order = await DbLayer.getOrderByRazorpayOrderId(orderIdStr);
      // Also check in-memory draft orders
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.razorpayOrderId === orderIdStr) {
            order = draft;
            isDraftOrder = true;
            break;
          }
        }
      }
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
      if (!isMockPaymentAllowed()) {
        return res.status(400).send("<h1>Error: Simulated payments are disabled in this environment.</h1>");
      }
      isSuccessful = true;
    } else {
      isSuccessful = true;
    }

    if (isSuccessful) {
      if (isDraftOrder) {
        // Draft order (online payment, not yet in DB) – promote it to the database
        order.status = "Paid";
        order.bookingStatus = "searching";
        order.razorpayPaymentId = finalPaymentId;
        await DbLayer.createOrder(order);
        draftOrders.delete(order.userPhone);
        console.log(`[Payment Callback] Promoted draft order #${orderId} to database as Paid via payment ${finalPaymentId}`);
      } else {
        await DbLayer.updateOrder(orderId, {
          status: "Paid",
          bookingStatus: "searching",
          razorpayPaymentId: finalPaymentId
        });
        console.log(`[Payment Callback] Order #${orderId} marked as Paid via payment ${finalPaymentId}`);
      }

      if (order && order.userPhone) {
        await DbLayer.clearCart(order.userPhone).catch(() => {});
        await saveUserRawCartItems(order.userPhone, []).catch(() => {});
        console.log(`[Cart] Cleared cart for user ${order.userPhone} on payment callback`);
      }

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
    let order = await DbLayer.getOrderById(orderId);
    let isDraft = false;
    
    if (!order) {
      // Look in draftOrders in-memory map
      for (const draft of draftOrders.values()) {
        if (draft.id === orderId) {
          order = draft;
          isDraft = true;
          break;
        }
      }
    }
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    let updatedOrder;
    if (isDraft) {
      // Promote draft order to database
      order.status = "Pending";
      order.bookingStatus = "searching";
      order.payment = {
        paymentMethod: "Cash",
        amountPaid: 0
      };
      updatedOrder = await DbLayer.createOrder(order);
      draftOrders.delete(order.userPhone);
      console.log(`[Payment] Promoted draft order #${orderId} to database as Cash on Delivery`);
    } else {
      await DbLayer.updateOrder(orderId, {
        status: "Pending",
        bookingStatus: "searching",
        payment: {
          paymentMethod: "Cash",
          amountPaid: 0
        }
      });
      updatedOrder = await DbLayer.getOrderById(orderId);
      console.log(`[Payment] Order #${orderId} confirmed as Cash on Delivery`);
    }
    
    if (order && order.userPhone) {
      await DbLayer.clearCart(order.userPhone).catch(() => {});
      await saveUserRawCartItems(order.userPhone, []).catch(() => {});
      console.log(`[Cart] Cleared cart for user ${order.userPhone} on COD confirmation`);
    }
    
    res.json({
      success: true,
      orderId: orderId,
      order: updatedOrder,
      message: translate("booking_success", req.lang)
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
    await DbLayer.createWalletTransaction({
      userPhone: user.phone,
      amount: Number(amount),
      type: 'credit',
      description: 'Money added to wallet'
    });

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
    await DbLayer.createWalletTransaction({
      userPhone: user.phone,
      amount: Number(amount),
      type: 'debit',
      description: 'Money deducted from wallet'
    });

    res.json({ success: true, balance: newBalance, message: "Money deducted from wallet successfully" });
  } catch (err) {
    console.error("Deduct wallet money failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 12a. Wallet: Get Transaction History
app.get('/api/wallet/history', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const transactions = await DbLayer.getWalletTransactions(user.phone);
    
    // Calculate the total sum of transactions to find any untracked starting balance
    const transactionSum = transactions.reduce((sum, tx) => {
      if (tx.type === 'credit') {
        return sum + Number(tx.amount);
      } else {
        return sum - Number(tx.amount);
      }
    }, 0);

    const currentBalance = Number(user.walletBalance || 0);
    const discrepancy = currentBalance - transactionSum;

    if (discrepancy > 0) {
      transactions.push({
        id: 0,
        amount: discrepancy,
        type: 'credit',
        description: 'Starting wallet balance',
        senderName: null,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const mappedTransactions = transactions.map(tx => {
      return {
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        senderName: tx.senderName || user.name || "Guest User",
        createdAt: tx.createdAt
      };
    });

    res.json({
      success: true,
      transactions: mappedTransactions,
      message: "Wallet transactions retrieved successfully"
    });
  } catch (err) {
    console.error("Fetch wallet history failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Helper to resolve clean numeric string Category ID by category name
const getCategoryIdByName = (catName) => {
  if (!catName) return "1";
  const loc = localizeCategory({ name: catName }, 'en');
  return String(loc.id || "1");
};

// 12b. AMC: Get Plans
app.get('/api/amc/plans', (req, res) => {
  const plans = AMC_SUPPORTED_CATEGORIES.map(categoryName => {
    const catId = getCategoryIdByName(categoryName);
    const locCat = localizeCategory({ name: categoryName, id: catId }, req.lang);
    const isHi = (req.lang === 'hi');
    return {
      category: locCat.name,
      categoryId: catId,
      category_id: catId,
      catId: catId,
      id: catId,
      baseRatePerSqFt: 1.0,
      price: 1.0,
      description: isHi 
        ? `${locCat.name} के लिए वार्षिक रखरखाव अनुबंध (AMC)। प्रति वर्ष 12 मुफ्त सेवाएँ। बेस रेट: ₹1/वर्ग फुट।`
        : `Annual Maintenance Contract for ${locCat.name}. Free 12 services per year. Base price: ₹1 per sq feet.`
    };
  });
  res.json({ 
    success: true, 
    plans,
    message: (req.lang === 'hi') ? "AMC प्लान्स सफलतापूर्ण प्राप्त हुए" : undefined
  });
});

// 12c. AMC: Subscribe to Plan
app.post('/api/amc/subscribe', amcUpload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]), async (req, res) => {
  const { category, areaSqFt, floors, note, notes, price, file, document } = req.body;
  if (!category || !areaSqFt || !floors || areaSqFt <= 0 || floors <= 0) {
    return res.status(400).json({ error: "category, areaSqFt and floors are required and must be positive numbers" });
  }

  if (!AMC_SUPPORTED_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "This category does not support AMC subscriptions" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user already has an active subscription for this category
    const existing = await DbLayer.getAmcSubscriptionByCategory(user.phone, category);
    if (existing) {
      return res.status(400).json({ error: `You already have an active AMC subscription for ${category} (AMC ID: ${existing.amcId})` });
    }

    // Build file URLs if uploaded
    const serverBase = `${req.protocol}://${req.get('host')}`;
    const photoFile = req.files && req.files['photo'] && req.files['photo'][0];
    const imageFile = req.files && req.files['image'] && req.files['image'][0];
    const pdfFile = req.files && req.files['pdf'] && req.files['pdf'][0];
    const fileFile = req.files && req.files['file'] && req.files['file'][0];
    const docFile = req.files && req.files['document'] && req.files['document'][0];

    // Resolve a single combined fileUrl dynamically from any uploaded file or body text parameter
    let resolvedFileUrl = null;
    if (photoFile) {
      resolvedFileUrl = `${serverBase}/uploads/amc/${photoFile.filename}`;
    } else if (imageFile) {
      resolvedFileUrl = `${serverBase}/uploads/amc/${imageFile.filename}`;
    } else if (pdfFile) {
      resolvedFileUrl = `${serverBase}/uploads/amc/${pdfFile.filename}`;
    } else if (fileFile) {
      resolvedFileUrl = `${serverBase}/uploads/amc/${fileFile.filename}`;
    } else if (docFile) {
      resolvedFileUrl = `${serverBase}/uploads/amc/${docFile.filename}`;
    } else if (req.body.photo) {
      resolvedFileUrl = req.body.photo;
    } else if (req.body.image) {
      resolvedFileUrl = req.body.image;
    } else if (req.body.pdf) {
      resolvedFileUrl = req.body.pdf;
    } else if (req.body.file) {
      resolvedFileUrl = req.body.file;
    } else if (req.body.document) {
      resolvedFileUrl = req.body.document;
    }

    const resolvedNote = note || notes || null;

    // Calculate price: fallback to formula (areaSqFt * ₹1/sq ft * floors) if not passed in body
    const ratePerSqFt = 1.0;
    const totalPrice = price !== undefined && price !== "" ? Number(price) : (Number(areaSqFt) * 1 * Number(floors));

    // Generate unique AMC ID
    const amcId = `AMC${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    const catId = getCategoryIdByName(category);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1); // 1 year validity

    const newSub = {
      amcId,
      userPhone: user.phone,
      category,
      categoryId: catId,
      category_id: catId,
      catId: catId,
      id: catId,
      areaSqFt: Number(areaSqFt),
      floors: Number(floors),
      price: totalPrice,
      status: 'pending_payment',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      photoUrl: resolvedFileUrl,
      pdfUrl: resolvedFileUrl,
      fileUrl: resolvedFileUrl,
      note: resolvedNote
    };

    await DbLayer.createAmcSubscription(newSub);

    res.json({
      success: true,
      orderId: amcId,
      order_id: amcId,
      amcId: amcId,
      message: `Successfully subscribed to AMC for ${category}! Valid for 1 year with 12 free bookings.`,
      subscription: {
        ...newSub,
        orderId: amcId,
        order_id: amcId
      }
    });
  } catch (err) {
    console.error("AMC subscription failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 12d. AMC: Get Active & Available Subscriptions
app.get('/api/amc/subscriptions', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const subscriptions = (await DbLayer.getAmcSubscriptions(user.phone))
      .filter(s => s.status === 'active');

    // Map each subscription to include completed bookings progress count, categoryId, and monthly limit checks
    const activeSubscriptions = await Promise.all(subscriptions.map(async (sub) => {
      const completedCount = await DbLayer.countAmcBookingsCompleted(sub.amcId);
      const currentMonthCount = await DbLayer.countAmcBookingsInCurrentMonth(sub.amcId);
      const catId = getCategoryIdByName(sub.category);
      const locCat = localizeCategory({ name: sub.category, id: catId }, req.lang);
      const isHi = (req.lang === 'hi');
      
      return {
        amcId: sub.amcId,
        userPhone: sub.userPhone,
        category: locCat.name,
        categoryId: catId,
        category_id: catId,
        catId: catId,
        id: catId,
        areaSqFt: sub.areaSqFt,
        floors: sub.floors,
        price: parseFloat(sub.price),
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        completedCount,
        currentMonthCount,
        monthlyLimit: 1,
        canBookThisMonth: currentMonthCount < 1,
        totalAllowed: 12,
        progressMessage: isHi 
          ? `12 में से ${completedCount} सेवाएँ पूर्ण (प्रति माह 1 सेवा की सीमा)` 
          : `${completedCount} complete out of 12 (Limit: 1 service per month)`,
        photoUrl: sub.photoUrl,
        pdfUrl: sub.pdfUrl,
        fileUrl: sub.fileUrl || sub.photoUrl || sub.pdfUrl,
        note: sub.note,
        buttons: {
          bookService: isHi ? `सेवा बुक करें (₹0 पर)` : `Book Service (at ₹0)`,
          renewService: isHi ? `सेवा रिन्यू करें` : `Renew Service`
        }
      };
    }));

    // Find which categories do NOT have an active subscription
    const now = new Date();
    const subscribedCategories = subscriptions
      .filter(s => s.status === 'active' && new Date(s.endDate) > now)
      .map(s => s.category);

    const availablePlans = AMC_SUPPORTED_CATEGORIES
      .filter(cat => !subscribedCategories.includes(cat))
      .map(cat => {
        const catId = getCategoryIdByName(cat);
        const locCat = localizeCategory({ name: cat, id: catId }, req.lang);
        const isHi = (req.lang === 'hi');
        
        return {
          category: locCat.name,
          categoryId: catId,
          category_id: catId,
          catId: catId,
          id: catId,
          baseRatePerSqFt: 1.0,
          price: 1.0,
          description: isHi 
            ? `${locCat.name} के लिए वार्षिक रखरखाव अनुबंध (AMC) लें (₹1/वर्ग फुट बेस रेट पर प्रति वर्ष 12 मुफ्त सेवाएँ)।` 
            : `Subscribe to Annual Maintenance Contract for ${locCat.name} (12 free services per year at ₹1/sq ft base rate).`
        };
      });

    res.json({
      success: true,
      activeSubscriptions,
      availablePlans,
      message: (req.lang === 'hi') ? "AMC सब्सक्रिप्शन सफलतापूर्ण प्राप्त हुए" : "AMC subscriptions and plans retrieved successfully"
    });
  } catch (err) {
    console.error("Fetch AMC subscriptions failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 12e. AMC: Renew Subscription
app.post('/api/amc/renew', async (req, res) => {
  const { amcId } = req.body;
  if (!amcId) {
    return res.status(400).json({ error: "amcId is required" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sub = await DbLayer.getAmcSubscriptionById(amcId);
    if (!sub || sub.userPhone !== user.phone) {
      return res.status(404).json({ error: "AMC subscription not found" });
    }

    const now = new Date();
    const baseDate = (sub.status === 'active' && new Date(sub.endDate) > now) ? new Date(sub.endDate) : now;
    const newEndDate = new Date(baseDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);

    const updated = await DbLayer.updateAmcSubscription(amcId, {
      status: 'active',
      endDate: newEndDate.toISOString()
    });

    res.json({
      success: true,
      message: `AMC subscription ${amcId} renewed successfully! Extended for 1 year.`,
      subscription: updated
    });
  } catch (err) {
    console.error("Renew AMC subscription failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 12f. AMC: Get Plan Details
app.get('/api/amc/plans/:category', (req, res) => {
  const { category } = req.params;
  const exists = CATEGORIES_DATA.some(cat => cat.toLowerCase() === category.toLowerCase());
  if (!exists) {
    return res.status(404).json({ error: `AMC plan for category ${category} not found` });
  }
  const matchedCategory = CATEGORIES_DATA.find(cat => cat.toLowerCase() === category.toLowerCase());
  const catId = getCategoryIdByName(matchedCategory);
  res.json({
    success: true,
    plan: {
      category: matchedCategory,
      categoryId: catId,
      category_id: catId,
      catId: catId,
      id: catId,
      baseRatePerSqFt: 1.0,
      price: 1.0,
      description: `Annual Maintenance Contract for ${matchedCategory}. Free 12 services per year. Base price: ₹1 per sq feet.`
    }
  });
});

// 12g. AMC: Plan Property Details Quote
app.post('/api/amc/plan-property-details', (req, res) => {
  const { category, areaSqFt, floors } = req.body;
  if (!category || !areaSqFt || !floors || areaSqFt <= 0 || floors <= 0) {
    return res.status(400).json({ error: "category, areaSqFt and floors are required and must be positive numbers" });
  }
  if (!CATEGORIES_DATA.some(cat => cat.toLowerCase() === category.toLowerCase())) {
    return res.status(400).json({ error: "Invalid category" });
  }
  const matchedCategory = CATEGORIES_DATA.find(cat => cat.toLowerCase() === category.toLowerCase());
  const ratePerSqFt = 1.0;
  const totalPrice = Number(areaSqFt) * 1 * Number(floors);
  const catId = getCategoryIdByName(matchedCategory);
  res.json({
    success: true,
    category: matchedCategory,
    categoryId: catId,
    category_id: catId,
    catId: catId,
    id: catId,
    areaSqFt: Number(areaSqFt),
    floors: Number(floors),
    ratePerSqFt,
    totalPrice,
    description: `Estimated AMC for ${matchedCategory} over ${areaSqFt} sq ft across ${floors} floor(s).`
  });
});

// Helper to resolve service category from DB or static catalog
const getServiceCategoryDbOrStatic = async (productId) => {
  if (!productId) return null;
  if (dbMode === "mysql" && mysqlReady) {
    try {
      const [srvRows] = await mysqlPool.query(
        "SELECT category_id FROM node_services WHERE LOWER(title) = ? OR LOWER(title_hi) = ? OR id = ?",
        [productId.toLowerCase(), productId.toLowerCase(), isNaN(productId) ? -1 : parseInt(productId)]
      );
      if (srvRows.length > 0 && srvRows[0].category_id) {
        const [catRows] = await mysqlPool.query(
          "SELECT title FROM node_categories WHERE id = ?",
          [srvRows[0].category_id]
        );
        if (catRows.length > 0) {
          return getCanonicalCategoryName(catRows[0].title) || null;
        }
      }
    } catch (err) {
      console.warn("[getServiceCategoryDbOrStatic] Failed to query DB:", err.message);
    }
  }
  // Try to find category in database.json
  try {
    const data = DbLayer.getLayer().readData ? DbLayer.getLayer().readData() : null;
    if (data && data.services && data.services.length > 0) {
      const matched = data.services.find(s => s.title.toLowerCase() === productId.toLowerCase() || s.id.toString() === productId.toString());
      if (matched && matched.category) {
        const cats = data.categories || [];
        const catObj = cats.find(c => c.id.toString() === matched.category.toString());
        if (catObj) {
          return getCanonicalCategoryName(catObj.name) || null;
        }
      }
    }
  } catch (err) {
    console.warn("[getServiceCategoryDbOrStatic] JSON fallback read failed:", err.message);
  }
  for (const [catName, services] of Object.entries(SERVICES_DATA)) {
    const match = services.some(s => s.title.toLowerCase() === productId.toLowerCase());
    if (match) return getCanonicalCategoryName(catName);
  }
  const normTitle = productId.toLowerCase();
  for (const cat of CATEGORIES_DATA) {
    if (normTitle.includes(cat.toLowerCase()) || cat.toLowerCase().includes(normTitle)) {
      return getCanonicalCategoryName(cat);
    }
  }
  return null;
};

// 12h. AMC: Book Service under Subscription
const handlePostAmcBooking = async (req, res) => {
  const amcId = req.body.amcId || req.body.amc || req.query.amcId || req.query.amc;
  const productId = req.body.productId || req.body.product || req.body.product_id || req.body.serviceName || req.query.productId;
  let date = req.body.date || req.query.date;
  let timeSlot = req.body.timeSlot || req.body.slot || req.query.timeSlot;
  const addressObj = req.body.address;

  if (!amcId || !productId || !date || !timeSlot) {
    return res.status(400).json({ error: "amcId, productId, date, and timeSlot are required" });
  }

  date = normalizeDate(date);
  timeSlot = normalizeTimeSlot(timeSlot);

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sub = await DbLayer.getAmcSubscriptionById(amcId);
    if (!sub || sub.userPhone !== user.phone) {
      return res.status(404).json({ error: "AMC subscription not found" });
    }

    if (sub.status !== 'active') {
      return res.status(400).json({ error: `AMC subscription status is '${sub.status}', not 'active'` });
    }

    if (new Date(sub.endDate) < new Date()) {
      return res.status(400).json({ error: "AMC subscription has expired" });
    }

    const completedCount = await DbLayer.countAmcBookingsCompleted(amcId);
    if (completedCount >= 12) {
      return res.status(400).json({ error: "You have already completed all 12 free services for this AMC subscription" });
    }

    const currentMonthCount = await DbLayer.countAmcBookingsInCurrentMonth(amcId);
    if (currentMonthCount >= 1) {
      return res.status(400).json({ error: "You have already booked your 1 free AMC service for this month. You can book your next free AMC service next month." });
    }

    const resolvedProduct = await resolveServiceDetails(productId);
    if (!resolvedProduct) {
      return res.status(404).json({ error: `Service/Product '${productId}' not found in catalog` });
    }

    const serviceCategory = await getServiceCategoryDbOrStatic(resolvedProduct.title);
    const canonicalServiceCategory = getCanonicalCategoryName(serviceCategory);
    const canonicalSubCategory = getCanonicalCategoryName(sub.category);
    if (canonicalServiceCategory !== canonicalSubCategory) {
      return res.status(400).json({
        error: `Category mismatch: This service (${resolvedProduct.title}) belongs to category '${canonicalServiceCategory}', but your AMC subscription is for '${canonicalSubCategory}'`
      });
    }

    let resolvedAddress = null;
    if (addressObj) {
      try {
        const newAddress = {
          userPhone: user.phone,
          type: addressObj.type || "Home",
          houseNo: addressObj.houseNo || "",
          society: addressObj.society || "",
          floor: addressObj.floor || "",
          landmark: addressObj.landmark || "",
          city: addressObj.city || "",
          locality: addressObj.locality || "",
          pincode: addressObj.pincode || "",
          latitude: Number(addressObj.latitude) || 0,
          longitude: Number(addressObj.longitude) || 0,
          name: addressObj.name || "",
          alternateNumber: addressObj.alternateNumber || addressObj.alternate_number || "",
          countryCode: addressObj.countryCode || addressObj.country_code || "+91"
        };
        resolvedAddress = await DbLayer.createAddress(newAddress);
      } catch (addrErr) {
        console.error("Save address from body failed:", addrErr);
      }
    }
    if (!resolvedAddress) {
      const addresses = await DbLayer.getAddressesByUserPhone(user.phone).catch(() => []);
      if (addresses && addresses.length > 0) {
        resolvedAddress = addresses[addresses.length - 1];
      }
    }

    const lastOrderId = await DbLayer.getLastOrderId();
    let highestId = lastOrderId;
    for (const draft of draftOrders.values()) {
      if (draft.id > highestId) {
        highestId = draft.id;
      }
    }
    const orderId = highestId + 1;

    const newOrder = {
      id: orderId,
      userPhone: user.phone,
      userId: user.phone,
      serviceName: resolvedProduct.serviceName,
      price: 0.00,
      date: date,
      status: "Pending",
      bookingStatus: "searching",
      partnerName: null,
      partnerDistance: null,
      productId: resolvedProduct.productId,
      description: resolvedProduct.description,
      timeSlot: timeSlot,
      address: resolvedAddress,
      payment: {
        paymentMethod: "AMC",
        amountPaid: 0.00
      },
      razorpayOrderId: null,
      razorpayPaymentId: null,
      createdAt: Date.now(),
      amcId: sub.amcId,
      advancePayment: 0.00,
      remainingAmount: 0.00
    };

    const placedOrder = await DbLayer.createOrder(newOrder);
    draftOrders.delete(user.phone);

    res.json({
      success: true,
      orderId: placedOrder.id,
      order_id: placedOrder.id,
      message: `Successfully booked service '${resolvedProduct.title}' under AMC subscription ${sub.amcId}!`,
      order: placedOrder
    });
  } catch (err) {
    console.error("AMC booking failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

app.post('/api/amc/book', handlePostAmcBooking);
app.post('/api/amc/bookings', handlePostAmcBooking);

// Cards: Get List
app.get('/api/cards', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const cards = await DbLayer.getSavedCards(user.phone);
    res.json({ success: true, cards });
  } catch (err) {
    console.error("Fetch saved cards failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Cards: Save Card
app.post('/api/cards', async (req, res) => {
  const { cardHolderName, cardNumber, expiryDate, cardType } = req.body;
  if (!cardHolderName || !cardNumber || !expiryDate || !cardType) {
    return res.status(400).json({ error: "cardHolderName, cardNumber, expiryDate, and cardType are required" });
  }
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    let maskedNumber = cardNumber;
    if (cardNumber.length > 4) {
      maskedNumber = "**** **** **** " + cardNumber.slice(-4);
    }
    const newCard = await DbLayer.createSavedCard({
      userPhone: user.phone,
      cardHolderName,
      cardNumber: maskedNumber,
      expiryDate,
      cardType
    });
    res.json({ success: true, card: newCard, message: "Card saved successfully" });
  } catch (err) {
    console.error("Save card failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Generic Payment API
app.post('/api/payments', async (req, res) => {
  const { orderId, amount, paymentMethod } = req.body;
  if (!orderId || !amount || !paymentMethod) {
    return res.status(400).json({ error: "orderId, amount, and paymentMethod are required" });
  }
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isAmcPay = String(orderId).toUpperCase().startsWith("AMC");
    let amcSub = null;
    let order = null;

    if (isAmcPay) {
      amcSub = await DbLayer.getAmcSubscriptionById(orderId);
      if (!amcSub) {
        return res.status(404).json({ error: "AMC subscription not found" });
      }
    } else {
      order = await DbLayer.getOrderById(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
    }

    let razorpayOrderId = null;
    const isOnline = paymentMethod.toLowerCase() === "online" || paymentMethod.toLowerCase() === "razorpay";
    if (isOnline) {
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
            amount: Math.round(Number(amount) * 100),
            currency: 'INR',
            receipt: `pay_${orderId}_${Date.now()}`
          })
        });
        const rzpData = await rzpRes.json();
        if (rzpData && rzpData.id) {
          razorpayOrderId = rzpData.id;
        }
      } catch (err) {
        console.error('[Payments] Razorpay order generation failed:', err.message);
      }
      if (!razorpayOrderId) {
        razorpayOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      }

      // Update local storage of razorpayOrderId
      if (isAmcPay) {
        await DbLayer.updateAmcSubscription(orderId, { razorpayOrderId });
      } else if (order) {
        await DbLayer.updateOrder(order.id, { razorpayOrderId });
      }
    }

    res.json({
      success: true,
      orderId: isAmcPay ? orderId : order.id,
      amount: Number(amount),
      paymentMethod,
      razorpayOrderId,
      status: isOnline ? "Initiated" : "Success",
      message: isOnline ? "Razorpay order generated successfully" : "Payment processed successfully"
    });
  } catch (err) {
    console.error("Create payment failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Wallet: Get rules for Refer and Earn wallet discounts
app.get('/api/wallet/rules', (req, res) => {
  res.json({
    success: true,
    rules: [
      { condition: "price <= 800", maxWalletDeduction: 100, description: "Orders up to Rs.800: fixed cap of Rs.100 from wallet" },
      { condition: "price > 800", maxWalletDeductionPercent: 20, description: "Orders above Rs.800: up to 20% of service price from wallet" }
    ],
    message: "Wallet discount rules retrieved successfully"
  });
});

// Wallet: Calculate allowed wallet discount for a given price
app.post('/api/wallet/calculate-discount', async (req, res) => {
  const { price } = req.body;
  if (price === undefined || isNaN(price) || price < 0) {
    return res.status(400).json({ error: "Invalid price" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const walletBalance = Number(user.walletBalance || 0);
    const servicePrice = Number(price);

    // Tiered wallet discount rule:
    // - Orders <= Rs.800: fixed cap of Rs.100
    // - Orders > Rs.800: 20% of service price (no fixed cap)
    let maxAllowedFromWallet;
    if (servicePrice <= 800) {
      maxAllowedFromWallet = 100;
    } else {
      maxAllowedFromWallet = servicePrice * 0.20;
    }
    const allowedDiscount = Math.min(walletBalance, maxAllowedFromWallet);
    const remainingPrice = Math.max(0, servicePrice - allowedDiscount);

    res.json({
      success: true,
      price: servicePrice,
      walletBalance,
      allowedDiscount,
      remainingPrice,
      rule: servicePrice <= 800 ? "fixed_cap_100" : "percent_20"
    });
  } catch (err) {
    console.error("Calculate wallet discount failed:", err);
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

    // Reward only the referrer (the one who referred) with ₹500
    const newReferrerBalance = (referrer.walletBalance || 0) + 500.0;

    const referralRecord = {
      userPhone: currentUser.phone,
      referrerPhone: referrer.phone,
      appliedAt: new Date().toISOString()
    };

    await Promise.all([
      DbLayer.updateUser(referrer.phone, { walletBalance: newReferrerBalance }),
      DbLayer.createReferralApplied(referralRecord),
      DbLayer.createWalletTransaction({
        userPhone: referrer.phone,
        amount: 500.0,
        type: 'credit',
        description: `Referral bonus from ${currentUser.name || 'Guest'} (${currentUser.phone})`,
        senderName: currentUser.name || 'Guest User'
      })
    ]);

    res.json({
      success: true,
      message: `Referral code successfully applied! The referrer received ₹500.`,
      newBalance: currentUser.walletBalance || 0
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

  const logBookingResult = (statusCode, success, errMessage = null, userPhone = null) => {
    debugLogs.push({
      timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      productId,
      rawProductId: req.body.productId || req.body.serviceName || req.body.product || (req.body.booking && req.body.booking.productId),
      date,
      timeSlot,
      headers: {
        authorization: req.headers['authorization'] ? "Present" : "Missing",
      },
      statusCode,
      success,
      userPhone,
      error: errMessage
    });
    if (debugLogs.length > 50) debugLogs.shift();
  };

  // Support multiple items list
  const rawItems = req.body.items || req.query.items || (req.body.booking && req.body.booking.items);
  let itemsList = [];
  if (Array.isArray(rawItems)) {
    itemsList = rawItems;
  } else if (rawItems && typeof rawItems === 'string') {
    try {
      itemsList = JSON.parse(rawItems);
    } catch (e) {
      console.warn("Failed to parse items query/body string:", e.message);
    }
  }

  // Fallback to legacy single product booking if no items list was sent
  if (itemsList.length === 0 && productId) {
    itemsList.push({ productId: productId, quantity: 1 });
  }

  if (itemsList.length === 0 || !date || !timeSlot) {
    logBookingResult(400, false, "items list (or productId), date, and timeSlot are required");
    return res.status(400).json({ error: "items list (or productId), date, and timeSlot are required" });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      logBookingResult(401, false, `Unauthorized: ${req.authError || "Token verification failed"}`);
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Resolve details for all selected services and compute total price
    const resolvedItems = [];
    let totalPrice = 0;
    for (const item of itemsList) {
      const itemProdId = item.productId || item.product_id || item.id;
      const qty = parseInt(item.quantity || item.qty || 1) || 1;
      if (!itemProdId) continue;
      
      const resolved = await resolveServiceDetails(itemProdId);
      if (resolved) {
        resolvedItems.push({
          productId: resolved.productId,
          serviceName: resolved.serviceName,
          price: Number(resolved.price),
          quantity: qty,
          description: resolved.description || "",
          image: resolved.image || "",
          category: resolved.category || ""
        });
        totalPrice += Number(resolved.price) * qty;
      }
    }

    if (resolvedItems.length === 0) {
      logBookingResult(400, false, "No valid services could be resolved from request items", user.phone);
      return res.status(400).json({ error: "No valid services could be resolved from request items." });
    }

    // Validate slot availability (no overlap with existing bookings on the same date for any of the products)
    const allOrders = await DbLayer.getAllOrders();
    const targetDate = normalizeDate(date.split('T')[0]);
    const matchingOrders = allOrders.filter(order => {
      if (!order.date) return false;
      if (order.status && order.status.toLowerCase() === "cancelled") return false;
      if (order.bookingStatus && order.bookingStatus.toLowerCase() === "draft") return false;
      const orderDate = normalizeDate(order.date.split('T')[0]);
      if (orderDate !== targetDate) return false;

      // Extract all product IDs related to this saved order
      const orderProductIds = [];
      if (order.items && Array.isArray(order.items)) {
        orderProductIds.push(...order.items.map(it => String(it.productId).toLowerCase()));
      }
      if (order.productId) {
        orderProductIds.push(String(order.productId).toLowerCase());
      }
      if (order.serviceName) {
        orderProductIds.push(String(order.serviceName).toLowerCase());
      }

      // Check if any of our requested services overlap with this order's products
      return resolvedItems.some(it => {
        const idLower = String(it.productId).toLowerCase();
        const nameLower = String(it.serviceName).toLowerCase();
        return orderProductIds.includes(idLower) || orderProductIds.includes(nameLower);
      });
    });

    const reqRange = parseTimeRange(timeSlot);
    if (reqRange) {
      const bookedRanges = matchingOrders
        .map(order => parseTimeRange(order.timeSlot))
        .filter(range => range !== null);

      const overlappingBookingsCount = bookedRanges.filter(bookedRange => timesOverlap(reqRange, bookedRange)).length;
      if (overlappingBookingsCount >= 5) {
        logBookingResult(400, false, "This time slot is already booked. Please choose another slot.", user.phone);
        return res.status(400).json({ error: "This time slot is already booked. Please choose another slot." });
      }
    }
    
    // ─── MAX 50 ORDERS PER SLOT PER PINCODE PER SERVICE ───────────────────────
    const MAX_ORDERS_PER_SLOT_PINCODE = 50;

    // Get user's pincode from their saved address
    const resolvedAddrForLimit = await resolveAddressForPhone(user.phone);
    const userPincode = resolvedAddrForLimit
      ? String(resolvedAddrForLimit.pincode || "").trim()
      : "";

    if (userPincode) {
      // Count active orders for same service + date + slot + pincode
      const sameSlotOrders = allOrders.filter(order => {
        if (!order.date) return false;
        // Skip cancelled and draft orders
        if (order.status && order.status.toLowerCase() === "cancelled") return false;
        if (order.bookingStatus && order.bookingStatus.toLowerCase() === "draft") return false;

        // Match date
        const orderDate = normalizeDate(order.date.split('T')[0]);
        if (orderDate !== targetDate) return false;

        // Extract all product IDs related to this saved order
        const orderProductIds = [];
        if (order.items && Array.isArray(order.items)) {
          orderProductIds.push(...order.items.map(it => String(it.productId).toLowerCase()));
        }
        if (order.productId) {
          orderProductIds.push(String(order.productId).toLowerCase());
        }
        if (order.serviceName) {
          orderProductIds.push(String(order.serviceName).toLowerCase());
        }

        // Check if any of our requested services overlap with this order's products
        const hasOverlapProduct = resolvedItems.some(it => {
          const idLower = String(it.productId).toLowerCase();
          const nameLower = String(it.serviceName).toLowerCase();
          return orderProductIds.includes(idLower) || orderProductIds.includes(nameLower);
        });
        if (!hasOverlapProduct) return false;

        // Match time slot (exact or overlapping)
        const orderSlotRange = parseTimeRange(order.timeSlot);
        const reqSlotRange = parseTimeRange(timeSlot);
        if (!orderSlotRange || !reqSlotRange) return false;
        if (!timesOverlap(reqSlotRange, orderSlotRange)) return false;

        // Match pincode from order's address
        const orderPincode = order.address
          ? String(order.address.pincode || "").trim()
          : "";
        return orderPincode === userPincode;
      });

      if (sameSlotOrders.length >= MAX_ORDERS_PER_SLOT_PINCODE) {
        const msg = `Slot full: maximum ${MAX_ORDERS_PER_SLOT_PINCODE} bookings reached for this service, slot, and area (pincode: ${userPincode}). Please choose a different slot or date.`;
        logBookingResult(400, false, msg, user.phone);
        return res.status(400).json({ error: msg });
      }

      console.log(`[Capacity] ${sameSlotOrders.length}/${MAX_ORDERS_PER_SLOT_PINCODE} orders for multiple items on ${date} @ ${timeSlot} in pincode ${userPincode}`);
    }
    // ────────────────────────────────────────────────────────────────────────────

    console.log(`User ${user.phone} validated booking slot ${timeSlot} on ${date} for multiple items`);

    const statusParam = req.body.status || req.query.status || (req.body.booking && req.body.booking.status);
    const useAmc = statusParam === "AMC" || req.body.useAmc === true || req.body.useAmc === "true" || (req.body.payment && String(req.body.payment.paymentMethod).toLowerCase() === "amc");

    // ALWAYS create a new draft order record with a new unique ID instead of overwriting/reusing.
    // This prevents active or previously booked orders from being updated or removed.
    const resolvedAddr = await resolveAddressForPhone(user.phone);
    const lastOrderId = await DbLayer.getLastOrderId();
    let highestId = lastOrderId;
    for (const draft of draftOrders.values()) {
      if (draft.id > highestId) {
        highestId = draft.id;
      }
    }
    const orderId = highestId + 1;

    const order = {
      id: orderId,
      userPhone: user.phone,
      userId: user.phone,
      serviceName: resolvedItems.map(x => x.serviceName).join(", "),
      price: useAmc ? 0.00 : totalPrice,
      date: date,
      status: useAmc ? "AMC" : "Draft",
      bookingStatus: "draft",
      partnerName: null,
      partnerDistance: null,
      productId: resolvedItems[0].productId,
      description: resolvedItems[0].description,
      timeSlot: timeSlot,
      address: resolvedAddr,
      payment: {
        paymentMethod: useAmc ? "AMC" : "Wallet",
        amountPaid: useAmc ? 0.00 : totalPrice
      },
      createdAt: Date.now(),
      items: resolvedItems
    };
    draftOrders.set(user.phone, order);
    console.log(`[handlePostBooking] Created new in-memory draft order #${order.id} for user ${user.phone} with ${resolvedItems.length} items`);

    // Always persist to DB so server restarts don't lose the draft (both created and updated drafts)
    try {
      await DbLayer.createOrder(order);
      console.log(`[handlePostBooking] Saved draft order #${order.id} to DB`);
    } catch (dbErr) {
      console.warn(`[handlePostBooking] Could not save draft to DB:`, dbErr.message);
    }

    logBookingResult(200, true, null, user.phone);
    res.json({
      success: true,
      message: "Booking details validated and registered",
      booking: {
        productId: resolvedItems[0].productId,
        date,
        timeSlot,
        items: resolvedItems
      }
    });
  } catch (err) {
    console.error("Booking validation failed:", err);
    logBookingResult(500, false, err.message);
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
      const placedOrders = userOrders.filter(o => !o.bookingStatus || o.bookingStatus.toLowerCase() !== "draft");
      const limitedUserOrders = placedOrders.slice(0, 5).map(o => localizeService(o, req.lang));
      return res.json({ success: true, bookings: limitedUserOrders, message: translate("bookings_retrieved", req.lang) });
    }
    
    // Fallback: public view of all bookings in the system for testing without authorization header
    const allOrders = await DbLayer.getAllOrders();
    const placedAllOrders = allOrders.filter(o => !o.bookingStatus || o.bookingStatus.toLowerCase() !== "draft");
    const limitedAllOrders = placedAllOrders.slice(0, 5).map(o => localizeService(o, req.lang));
    res.json({ success: true, bookings: limitedAllOrders, message: translate("bookings_retrieved", req.lang) });
  } catch (err) {
    console.error("Fetch bookings failed:", err);
    res.status(500).json({ error: translate("internal_error", req.lang) });
  }
});

// Addresses: Save a User Address
const handleAddAddress = async (req, res) => {
  const { type, houseNo, society, floor, landmark, city, locality, pincode, lat, latitude, lon, longitude, lng, name, alternateNumber, alternate_number, countryCode, country_code } = req.body;
  
  try {
    let phone;
    let userCountryCode = "+91";
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    if (authUser) {
      phone = authUser.phone;
      if (authUser.countryCode) {
        userCountryCode = authUser.countryCode;
      }
    } else {
      phone = req.body.userId || req.body.phone || req.body.userPhone || req.query.userId || req.query.phone;
    }

    if (!phone) {
      return res.status(401).json({ error: "Unauthorized: User identification (Token or userId) is required" });
    }
    
    const latValue = latitude !== undefined ? Number(latitude) : (lat !== undefined ? Number(lat) : null);
    const lonValue = longitude !== undefined ? Number(longitude) : (lon !== undefined ? Number(lon) : (lng !== undefined ? Number(lng) : null));
    
    const finalAltNum = alternateNumber || alternate_number || "";
    const finalCountryCode = countryCode || country_code || userCountryCode;

    if (finalAltNum && !validatePhoneNumberLength(finalAltNum, finalCountryCode)) {
      const expected = getExpectedPhoneLength(finalCountryCode);
      const countryName = getCountryNameByPrefix(finalCountryCode);
      return res.status(400).json({
        error: `Alternate phone number for ${countryName} must be ${expected} digits long.`
      });
    }

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
      alternateNumber: finalAltNum,
      countryCode: finalCountryCode
    };
    
    const savedAddress = await DbLayer.createAddress(newAddress);
    console.log(`Saved address for phone ${phone}: ${savedAddress.houseNo}, ${savedAddress.city}`);
    res.json({ success: true, address: savedAddress, status: req.body.status || "Regular", message: translate("address_saved", req.lang) });
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
    const sanitizedList = (list || []).map(a => sanitizeAddressObj(a, req.lang));
    res.json({ success: true, addresses: sanitizedList, message: translate("addresses_retrieved", req.lang) });
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
  
  let user = null;
  try {
    user = await getAuthenticatedUser(req);
  } catch (err) {
    // Ignore, handled below
  }

  if (!productId && user) {
    let existingOrder = draftOrders.get(user.phone);
    if (!existingOrder) {
      try {
        const userOrders = await DbLayer.getOrdersByUserPhone(user.phone);
        const dbDraft = userOrders.find(o =>
          (o.bookingStatus === 'draft' || o.status === 'Draft')
        );
        if (dbDraft) {
          existingOrder = dbDraft;
        }
      } catch (e) {}
    }
    if (existingOrder && existingOrder.productId) {
      productId = existingOrder.productId;
    } else {
      const userCart = await resolveFullUserCart(user.phone).catch(() => null);
      if (userCart && Array.isArray(userCart.items) && userCart.items.length > 0) {
        productId = String(userCart.items[0].serviceId || userCart.items[0].id || userCart.items[0].title || "cart_services");
      } else if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
        productId = String(req.body.items[0].serviceId || req.body.items[0].id || req.body.items[0].title || "cart_services");
      }
    }
  }

  if (!productId) {
    const userCart = await resolveFullUserCart(req.headers['x-user-id'] || 'guest').catch(() => null);
    if (userCart && Array.isArray(userCart.items) && userCart.items.length > 0) {
      productId = String(userCart.items[0].serviceId || userCart.items[0].id || userCart.items[0].title || "cart_services");
    } else {
      productId = "cart_services";
    }
  }
  
  try {
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid authentication token" });
    }
    const phone = user.phone;
    
    // Resolve service properties from dynamic database or fall back to hardcoded SERVICES_DATA
    const clientServiceName = req.body.serviceName || req.query.serviceName || req.body.title || req.query.title;
    const clientPrice = req.body.price !== undefined ? Number(req.body.price) : (req.body.payment ? Number(req.body.payment.amountPaid) : null);
    
    let foundService = await resolveServiceDetails(productId);
    if (!foundService) {
      foundService = {
        productId: productId,
        serviceName: clientServiceName || productId,
        title: clientServiceName || productId,
        price: clientPrice !== null && clientPrice > 0 ? clientPrice : 499,
        description: req.body.description || `${productId} service`,
        image: req.body.image || ""
      };
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
          alternateNumber: req.body.address.alternateNumber || req.body.address.alternate_number || "",
          countryCode: req.body.address.countryCode || req.body.address.country_code || "+91"
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
    let existingOrder = draftOrders.get(phone) || null;
    if (!existingOrder) {
      try {
        const userOrders = await DbLayer.getOrdersByUserPhone(phone);
        const dbDraft = userOrders.find(o =>
          (o.bookingStatus === 'draft' || o.status === 'Draft')
        );
        if (dbDraft) {
          existingOrder = dbDraft;
          draftOrders.set(phone, existingOrder);
          console.log(`[Checkout] Hydrated draft order #${dbDraft.id} from DB for user ${phone}`);
        }
      } catch (dbErr) {
        console.warn("[Checkout] Failed to hydrate draft from DB:", dbErr.message);
      }
    }
    
    // Auto-increment simple numerical ID or reuse existing pending order ID
    let orderId;
    if (existingOrder) {
      orderId = existingOrder.id;
      console.log(`[Checkout] Reusing existing pending Order #${orderId} for phone ${phone}`);
    } else {
      const lastOrderId = await DbLayer.getLastOrderId();
      let highestId = lastOrderId;
      for (const draft of draftOrders.values()) {
        if (draft.id > highestId) {
          highestId = draft.id;
        }
      }
      orderId = highestId + 1;
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

    // Check if items array was explicitly passed in body or query or in existing order or in cart
    let inputItems = req.body.items || req.query.items;
    if (typeof inputItems === 'string') {
      try { inputItems = JSON.parse(inputItems); } catch (e) {}
    }
    if (!Array.isArray(inputItems) || inputItems.length === 0) {
      if (existingOrder && Array.isArray(existingOrder.items) && existingOrder.items.length > 0) {
        inputItems = existingOrder.items;
      } else {
        const userCart = await resolveFullUserCart(phone, req.lang).catch(() => null);
        if (userCart && Array.isArray(userCart.items) && userCart.items.length > 0) {
          inputItems = userCart.items;
        }
      }
    }

    let itemsTotalCalculated = 0;
    if (Array.isArray(inputItems) && inputItems.length > 0) {
      itemsTotalCalculated = inputItems.reduce((sum, item) => {
        const p = Number(item.price || item.price_final || item.itemTotal || 0);
        const q = Number(item.quantity || item.qty || 1);
        return sum + (p * q);
      }, 0);
    }

    // AMC coupon discount logic
    const useAmc = req.body.useAmc === true || req.body.useAmc === "true" || (req.body.payment && (String(req.body.payment.paymentMethod).toLowerCase() === "amc")) || req.body.status === "AMC" || req.query.status === "AMC";
    let activeAmcId = null; // declared here so it's accessible in finalOrder below
    let foundPrice = 499;
    if (existingOrder && existingOrder.price !== undefined && existingOrder.price !== null) {
      foundPrice = Number(existingOrder.price);
    } else if (foundService && foundService.price !== undefined && foundService.price !== null && !isNaN(foundService.price)) {
      foundPrice = Number(foundService.price);
    }

    let baseServicePrice = itemsTotalCalculated > 0 ? itemsTotalCalculated : (foundPrice > 0 ? foundPrice : 499);
    let finalPrice = amountPaid > 0 ? amountPaid : baseServicePrice;

    if (useAmc) {
      const category = getCanonicalCategoryName(foundService.category || getServiceCategory(foundService.title));
      const activeAmc = await DbLayer.getAmcSubscriptionByCategory(phone, category);
      if (!activeAmc) {
        return res.status(400).json({ error: `No active AMC subscription found for category ${category}` });
      }

      const completedCount = await DbLayer.countAmcBookingsCompleted(activeAmc.amcId);
      if (completedCount >= 12) {
        return res.status(400).json({ error: "You have already completed all 12 free services for this AMC subscription" });
      }

      const currentMonthCount = await DbLayer.countAmcBookingsInCurrentMonth(activeAmc.amcId);
      if (currentMonthCount >= 1) {
        return res.status(400).json({ error: "You have already booked your 1 free AMC service for this month. You can book your next free AMC service next month." });
      }

      activeAmcId = activeAmc.amcId;
      paymentMethod = "AMC";
      finalPrice = 0.00;
    }

    // Call Razorpay API to create a real Order ID if payment method is "Online"
    let razorpayOrderId = null;
    if (existingOrder && (paymentMethod.toLowerCase() === "online" || paymentMethod.toLowerCase() === "razorpay")) {
      if (Number(existingOrder.price) === Number(finalPrice)) {
        razorpayOrderId = existingOrder.razorpayOrderId;
      }
    }

    if (!razorpayOrderId && (paymentMethod.toLowerCase() === "online" || paymentMethod.toLowerCase() === "razorpay")) {
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_SwFaJKQjU5ZOsH';
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'JY4Uup8xp2k1AvXXE2ezOje2';
      const advanceOnlineAmount = amountPaid > 0 ? amountPaid : finalPrice;
      try {
        const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.round(advanceOnlineAmount * 100), // amount in paisa (full service price)
            currency: 'INR',
            receipt: `order_${orderId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
          })
        });
        const rzpData = await rzpRes.json();
        if (rzpData && rzpData.id) {
          razorpayOrderId = rzpData.id;
          console.log(`[Razorpay] Successfully created order ${razorpayOrderId} for advance amount ₹${advanceOnlineAmount}`);
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

    let allowedWalletDeduction = 0;
    if (paymentMethod.toLowerCase() === "wallet") {
      const userObj = await DbLayer.getUserByPhone(phone);
      if (userObj) {
        const userWalletBalance = Number(userObj.walletBalance || 0);
        // Fixed ₹100 deduction: only if balance >= ₹100, else ₹0
        allowedWalletDeduction = userWalletBalance >= 100 ? 100 : 0;
        console.log(`[Wallet] Wallet Balance: Rs.${userWalletBalance}, Deduction: Rs.${allowedWalletDeduction}`);
      }
    }

    const resolvedDate = date || (existingOrder ? existingOrder.date : null) || new Date().toISOString().split('T')[0];
    const resolvedTimeSlot = timeSlot || (existingOrder ? existingOrder.timeSlot : null) || (await getDynamicDateAndSlot()).timeSlot;
    const resolvedAddressField = resolvedAddress || (existingOrder ? existingOrder.address : null);
    
    const isOnlinePayment = paymentMethod.toLowerCase() === "online" || paymentMethod.toLowerCase() === "razorpay";
    const resolvedBookingStatus = isOnlinePayment ? "draft" : "searching";
    const resolvedStatus = "Pending"; 

    let finalAdvancePayment = 0.00;
    let finalRemainingAmount = finalPrice;

    if (useAmc) {
      finalAdvancePayment = 0.00;
      finalRemainingAmount = 0.00;
    } else if (paymentMethod.toLowerCase() === "wallet") {
      finalAdvancePayment = allowedWalletDeduction;
      finalRemainingAmount = Math.max(0, finalPrice - allowedWalletDeduction);
    } else if (isOnlinePayment) {
      finalAdvancePayment = Math.max(0, finalPrice - allowedWalletDeduction);
      finalRemainingAmount = 0.00;
    } else {
      finalAdvancePayment = 0.00;
      finalRemainingAmount = finalPrice;
    }

    const finalOrderItems = (Array.isArray(inputItems) && inputItems.length > 0) ? inputItems : [
      {
        productId: foundService.productId,
        serviceName: foundService.title,
        title: foundService.title,
        price: foundService.price,
        quantity: 1,
        description: foundService.description || "",
        image: foundService.image || ""
      }
    ];

    const finalServiceName = finalOrderItems.map(i => i.title || i.serviceName || i.name || i.productId).join(", ");

    const finalOrder = {
      id: orderId,
      userPhone: phone,
      userId: phone,
      serviceName: finalServiceName || (existingOrder ? existingOrder.serviceName : foundService.title),
      price: finalPrice,
      date: resolvedDate,
      status: useAmc ? "AMC" : resolvedStatus,
      bookingStatus: resolvedBookingStatus,
      partnerName: null,
      partnerDistance: null,
      productId: finalOrderItems[0].productId || (existingOrder ? existingOrder.productId : foundService.productId),
      description: finalOrderItems[0].description || (existingOrder ? existingOrder.description : foundService.description),
      timeSlot: resolvedTimeSlot,
      address: resolvedAddressField,
      payment: { 
        paymentMethod: paymentMethod, 
        amountPaid: paymentMethod.toLowerCase() === "wallet" ? allowedWalletDeduction : (paymentMethod.toLowerCase() === "amc" ? 0 : amountPaid)
      },
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: (existingOrder ? existingOrder.razorpayPaymentId : null) || null,
      createdAt: Date.now(),
      amcId: activeAmcId,
      advancePayment: finalAdvancePayment,
      remainingAmount: finalRemainingAmount,
      items: finalOrderItems
    };
    
    if (isOnlinePayment) {
      // Do NOT write to the database yet. Keep it in the in-memory draft map.
      draftOrders.set(phone, finalOrder);
      console.log(`[Checkout] Saved online draft order #${orderId} for phone ${phone} in-memory with ${finalOrderItems.length} items (₹${finalPrice})`);
    } else {
      // Write the finalized order to the database (COD / Wallet / AMC)
      await DbLayer.createOrder(finalOrder);
      // Delete from in-memory draft map
      draftOrders.delete(phone);
      // Clear user cart after placing order
      await DbLayer.clearCart(phone).catch(() => {});
      await saveUserRawCartItems(phone, []).catch(() => {});
      console.log(`[Checkout] Placed offline/wallet/amc order #${orderId} for phone ${phone} to database with ${finalOrderItems.length} items (₹${finalPrice})`);
    }
    
    // Only simulate wallet balance deduction if paymentMethod is Wallet
    if (paymentMethod.toLowerCase() === "wallet") {
      const userObj = await DbLayer.getUserByPhone(phone);
      if (userObj) {
        const newBalance = Math.max(0, (userObj.walletBalance || 0) - allowedWalletDeduction);
        await DbLayer.updateUser(phone, { walletBalance: newBalance });
        await DbLayer.createWalletTransaction({
          userPhone: phone,
          amount: Number(allowedWalletDeduction),
          type: 'debit',
          description: `Payment for Order #${orderId}`
        });
        console.log(`Deducted ₹${allowedWalletDeduction} from user ${phone} wallet. New balance: ₹${newBalance}`);
      }
    }
    
    console.log(`[Checkout] Refactored Order #${orderId} for phone ${phone}`);
    const localizedOrder = localizeService({ ...finalOrder, userId: phone }, req.lang);
    const totalItemsCount = (finalOrder.items || []).length;
    const totalQtyCount = (finalOrder.items || []).reduce((sum, item) => sum + (Number(item.quantity || item.qty || 1)), 0);
    const cutPriceVal = finalPrice + (totalQtyCount * 100);
    const discountVal = cutPriceVal - finalPrice;

    res.json({
      success: true,
      orderId: orderId,
      userId: phone,
      order: localizedOrder,
      items: localizedOrder.items || [],
      cutPrice: cutPriceVal,
      mrp: cutPriceVal,
      discount: discountVal,
      discountAmount: discountVal,
      subtotal: cutPriceVal,
      totalAmount: finalPrice,
      grandTotal: finalPrice,
      totalItems: totalItemsCount,
      totalQuantity: totalQtyCount,
      razorpayOrderId: razorpayOrderId,
      message: translate("checkout_success", req.lang)
    });
  } catch (err) {
    console.error("Checkout failed stack:", err.stack || err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
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
  if (dbMode === "mysql" && mysqlReady) {
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

async function getAvailableSlotsForDate(dateStr, excludeOrderId = null, productId = null, pincode = null) {
  const MAX_ORDERS_PER_SLOT = 50;
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
      if (o.status && o.status.toLowerCase() === "cancelled") return false;
      if (o.bookingStatus && o.bookingStatus.toLowerCase() === "draft") return false;
      const orderDate = normalizeDate(o.date.split('T')[0]);
      return orderDate === targetDate;
    });
    const bookedRanges = matchingOrders.map(o => parseTimeRange(o.timeSlot)).filter(r => r !== null);
    for (const slot of slots) {
      const slotRange = parseTimeRange(slot.time);
      if (!slotRange) continue;

      // 1. Mark unavailable if ANY booking overlaps (original behavior)
      if (bookedRanges.some(b => timesOverlap(slotRange, b))) {
        slot.available = false;
        continue;
      }

      // 2. Mark unavailable if 50+ orders for same service+pincode+slot
      if (productId && pincode) {
        const capacityCount = matchingOrders.filter(o => {
          const matchProduct = (o.productId && o.productId.toLowerCase() === productId.toLowerCase()) ||
                               (o.serviceName && o.serviceName.toLowerCase() === productId.toLowerCase());
          if (!matchProduct) return false;
          const orderSlotRange = parseTimeRange(o.timeSlot);
          if (!orderSlotRange) return false;
          if (!timesOverlap(slotRange, orderSlotRange)) return false;
          const orderPincode = o.address ? String(o.address.pincode || "").trim() : "";
          return orderPincode === String(pincode).trim();
        }).length;

        if (capacityCount >= MAX_ORDERS_PER_SLOT) {
          slot.available = false;
          slot.fullReason = `Slot full for this area (${capacityCount}/${MAX_ORDERS_PER_SLOT})`;
        }
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
        alternateNumber: "",
        countryCode: user.countryCode || "+91"
      };
    }
  } catch (userErr) {
    console.error("Resolve address from user profile failed:", userErr);
  }

  // Default mock address fallback: Return null to prevent populating draft orders with fake data.
  return null;
};

const normalizeString = (str) => {
  if (!str) return '';
  return String(str).toLowerCase()
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

const getPhoneVariants = (phone) => {
  if (!phone) return [];
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 10) return [phone];
  const last10 = clean.substring(clean.length - 10);
  return [
    last10,
    `91${last10}`,
    `+91${last10}`
  ];
};

// Sanitizers to prevent Dart Type Null Errors on the client
const sanitizeAddressObj = (addr, lang = 'en') => {
  if (!addr) {
    return {
      name: "",
      alternateNumber: "",
      countryCode: "+91",
      type: lang === 'hi' ? "घर" : "Home",
      houseNo: "",
      society: "",
      floor: "",
      landmark: "",
      city: "",
      locality: "",
      pincode: ""
    };
  }
  const localized = localizeAddress(addr, lang);
  return {
    name: String(localized.name || localized.userPhone || ""),
    alternateNumber: String(localized.alternateNumber || localized.alternate_number || localized.altPhoneNumber || ""),
    countryCode: String(localized.countryCode || localized.country_code || "+91"),
    type: String(localized.type || "Home"),
    houseNo: String(localized.houseNo || localized.house_no || ""),
    society: String(localized.society || ""),
    floor: String(localized.floor || ""),
    landmark: String(localized.landmark || ""),
    city: String(localized.city || ""),
    locality: String(localized.locality || ""),
    pincode: String(localized.pincode || "")
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

const sanitizeProductObj = (prod, defaultTitle = "professional Plumber") => {
  if (!prod) {
    return {
      productId: defaultTitle,
      serviceName: defaultTitle,
      title: defaultTitle,
      name: defaultTitle,
      productName: defaultTitle,
      product_name: defaultTitle,
      price: 499,
      description: "Professional Plumber Home Service",
      productDescription: "Professional Plumber Home Service",
      product_description: "Professional Plumber Home Service",
      image: "",
      date: "",
      timeSlot: ""
    };
  }
  let titleVal = String(prod.serviceName || prod.title || prod.productName || prod.product_name || prod.productId || defaultTitle).trim();
  if (titleVal === "0" || titleVal === "null" || titleVal === "undefined" || !titleVal) {
    titleVal = String(prod.productId || prod.title || prod.serviceName || defaultTitle).trim();
    if (titleVal === "0" || titleVal === "null" || titleVal === "undefined" || !titleVal) {
      titleVal = defaultTitle;
    }
  }
  const descVal = String(prod.description || prod.productDescription || prod.product_description || "");
  return {
    productId: titleVal,
    serviceName: titleVal,
    title: titleVal,
    name: titleVal,
    productName: titleVal,
    product_name: titleVal,
    price: Number(prod.price !== undefined && prod.price !== null ? prod.price : 499),
    description: descVal,
    productDescription: descVal,
    product_description: descVal,
    image: String(prod.image || ""),
    date: String(prod.date || ""),
    timeSlot: String(prod.timeSlot || "")
  };
};

// Helper to resolve service details by productId or title
const resolveServiceDetails = async (productId) => {
  if (!productId) {
    return {
      productId: "professional Plumber",
      serviceName: "professional Plumber",
      title: "professional Plumber",
      price: 499,
      description: "Professional Plumber Home Service",
      image: ""
    };
  }

  const normProduct = normalizeString(productId);

  if (dbMode === "mysql" && mysqlReady) {
    try {
      // STEP 1: Try EXACT title match first (case-insensitive)
      // This is the safest match - prevents wrong service substitution
      const [exactRows] = await mysqlPool.query(
        "SELECT * FROM node_services WHERE LOWER(title) = ? OR LOWER(title_hi) = ? OR id = ? LIMIT 1",
        [String(productId).toLowerCase(), String(productId).toLowerCase(), isNaN(productId) ? -1 : parseInt(productId)]
      );
      if (exactRows.length > 0) {
        const r = exactRows[0];
        const dbPrice = parseFloat(r.price);
        const discountVal = r.discount !== null && r.discount !== undefined ? parseFloat(r.discount) : 0.00;
        let finalPrice = dbPrice;
        if (discountVal > 0) {
          finalPrice = Math.max(0, dbPrice - discountVal);
        }
        let dbCategoryName = null;
        try {
          const [catRows] = await mysqlPool.query("SELECT title FROM node_categories WHERE id = ?", [r.category_id]);
          if (catRows.length > 0) dbCategoryName = catRows[0].title;
        } catch (catErr) { /* ignore */ }
        return {
          productId: r.title,
          serviceName: r.title,
          title: r.title,
          price: finalPrice,
          description: r.description,
          image: r.image,
          category: dbCategoryName,
          categoryId: r.category_id ? r.category_id.toString() : ""
        };
      }

      // STEP 2: Only if exact match failed, try normalized fuzzy match
      // Use a narrower normalized query to reduce wrong-service risk
      const [fuzzyRows] = await mysqlPool.query(
        "SELECT * FROM node_services WHERE REPLACE(REPLACE(REPLACE(LOWER(title), '-', ''), '_', ''), ' ', '') = ? OR REPLACE(REPLACE(REPLACE(LOWER(title_hi), '-', ''), '_', ''), ' ', '') = ? LIMIT 1",
        [normProduct, normProduct]
      );
      if (fuzzyRows.length > 0) {
        const r = fuzzyRows[0];
        const dbPrice = parseFloat(r.price);
        const discountVal = r.discount !== null && r.discount !== undefined ? parseFloat(r.discount) : 0.00;
        let finalPrice = dbPrice;
        if (discountVal > 0) {
          finalPrice = Math.max(0, dbPrice - discountVal);
        }
        let dbCategoryName = null;
        try {
          const [catRows] = await mysqlPool.query("SELECT title FROM node_categories WHERE id = ?", [r.category_id]);
          if (catRows.length > 0) dbCategoryName = catRows[0].title;
        } catch (catErr) { /* ignore */ }
        return {
          productId: r.title,
          serviceName: r.title,
          title: r.title,
          price: finalPrice,
          description: r.description,
          image: r.image,
          category: dbCategoryName,
          categoryId: r.category_id ? r.category_id.toString() : ""
        };
      }
    } catch (err) {
      console.warn("[resolveServiceDetails] DB query failed, falling back static:", err.message);
    }
  }

  // Try matching in database.json
  try {
    const data = DbLayer.getLayer().readData ? DbLayer.getLayer().readData() : null;
    if (data && data.services && data.services.length > 0) {
      const exactMatch = data.services.find(s => 
        s.title.toLowerCase() === String(productId).toLowerCase() || 
        s.id.toString() === productId.toString()
      );
      if (exactMatch) {
        return {
          productId: exactMatch.title,
          serviceName: exactMatch.title,
          title: exactMatch.title,
          price: Number(exactMatch.price),
          description: exactMatch.description,
          image: exactMatch.image,
          category: exactMatch.category,
          categoryId: exactMatch.categoryId || exactMatch.category
        };
      }

      const looseMatch = data.services.find(s => 
        normalizeString(s.title) === normProduct
      );
      if (looseMatch) {
        return {
          productId: looseMatch.title,
          serviceName: looseMatch.title,
          title: looseMatch.title,
          price: Number(looseMatch.price),
          description: looseMatch.description,
          image: looseMatch.image,
          category: looseMatch.category,
          categoryId: looseMatch.categoryId || looseMatch.category
        };
      }
    }
  } catch (err) {
    console.warn("[resolveServiceDetails] JSON fallback read failed:", err.message);
  }

  for (const [categoryName, services] of Object.entries(SERVICES_DATA)) {
    const match = services.find(s => normalizeString(s.title) === normProduct);
    if (match) {
      return {
        productId: match.title,
        serviceName: match.title,
        title: match.title,
        price: Number(match.price),
        description: match.description,
        image: match.image
      };
    }
  }

  // If no service matches, check if the productId is one of the category names
  const matchedCategory = CATEGORIES_DATA.find(
    cat => cat.toLowerCase() === productId.toLowerCase() || 
           normalizeString(cat) === normProduct
  );
  if (matchedCategory) {
    return {
      productId: matchedCategory,
      serviceName: matchedCategory,
      title: matchedCategory,
      price: 0.00,
      description: `${matchedCategory} Service under AMC`,
      image: ""
    };
  }

  // Return the requested productId dynamically instead of hardcoded Tap Repair
  const fallbackName = productId && productId.trim() !== '' ? productId.trim() : "professional Plumber";
  return {
    productId: fallbackName,
    serviceName: fallbackName,
    title: fallbackName,
    price: 499,
    description: `${fallbackName} service`,
    image: "",
    category: getServiceCategory(fallbackName),
    categoryId: ""
  };
};

// Helper to determine category for a given service title
function getServiceCategory(serviceTitle) {
  if (!serviceTitle) return "Plumber";
  
  const cleanTitle = serviceTitle.toLowerCase().replace(/[\s\-_]/g, '');

  for (const cat of Object.keys(SERVICES_DATA)) {
    const found = SERVICES_DATA[cat].some(s => s.title.toLowerCase().replace(/[\s\-_]/g, '') === cleanTitle);
    if (found) return cat;
  }
  
  for (const cat of CATEGORIES_DATA) {
    const cleanCat = cat.toLowerCase().replace(/[\s\-_]/g, '');
    if (cleanTitle.includes(cleanCat) || cleanCat.includes(cleanTitle)) {
      return cat;
    }
  }

  if (cleanTitle.includes("ac") || cleanTitle.includes("aircondition")) {
    return "AcRepair";
  }

  return "Plumber";
}

// Checkout: Retrieve Checkout Summary (Get details)
const handleGetCheckout = async (req, res) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const serverBaseUrl = `${isLocal ? protocol : 'https'}://${host}`;

  // Ensure req.body is always an object (GET requests may not have a body)
  if (!req.body || typeof req.body !== 'object') req.body = {};

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

  // Resolve query payment method early
  let queryPaymentMethod = req.query.paymentMethod || req.query.payment_method || req.body.paymentMethod || req.body.payment_method || req.headers['x-payment-method'];
  if (req.body.payment) {
    queryPaymentMethod = queryPaymentMethod || req.body.payment.paymentMethod || req.body.payment.payment_method;
  }
  if (req.query.payment) {
    queryPaymentMethod = queryPaymentMethod || req.query.payment.paymentMethod || req.query.payment.payment_method;
  }
  
  try {
    let user = await getAuthenticatedUser(req).catch(() => null);
    if (!user) {
      user = {
        name: "Guest User",
        phone: "9999999999",
        email: "",
        walletBalance: 0.0
      };
    }
    
    let targetPhone = user.phone;
    let order = null;
    let justCreated = false;
    
    // Check if the idParam looks like a phone number (user id)
    if (isNaN(idParam) || idParam.length >= 8) {
      targetPhone = idParam === "me" ? user.phone : idParam;
      const pendingOrders = [];
      let memDraft = draftOrders.get(targetPhone);
      if (!memDraft) {
        // Hydrate from DB if missing (e.g. server restart)
        try {
          const userOrders = await DbLayer.getOrdersByUserPhone(targetPhone);
          const dbDraft = userOrders.find(o =>
            (o.bookingStatus === 'draft' || o.status === 'Draft')
          );
          if (dbDraft) {
            memDraft = dbDraft;
            draftOrders.set(targetPhone, memDraft);
            console.log(`[GetCheckout] Hydrated in-memory draft from DB: #${dbDraft.id} for user ${targetPhone}`);
          }
        } catch (dbErr) {
          console.warn("[GetCheckout] Failed to hydrate draft from DB:", dbErr.message);
        }
      }
      if (memDraft) {
        pendingOrders.push(memDraft);
      }

      // Helper to check if a service title is generic tap repair fallback
      const isTapRepairFallback = (sName) => {
        if (!sName) return true;
        const lower = String(sName).toLowerCase().trim();
        return lower === 'tap repair' || lower === 'tap / faucet repair & replacement' || /^service \d+$/i.test(lower);
      };
      
      if (pendingOrders && pendingOrders.length > 0) {
        let chosenOrder = null;
        if (queryProductId) {
          chosenOrder = pendingOrders.find(o =>
            (o.productId && o.productId.toString().toLowerCase() === queryProductId.toLowerCase()) ||
            (o.serviceName && o.serviceName.toLowerCase() === queryProductId.toLowerCase())
          );
        }
        // If no exact match, prefer any non-"Tap Repair" draft (real booking)
        if (!chosenOrder) {
          chosenOrder = pendingOrders.find(o => o.serviceName && o.serviceName.toLowerCase() !== 'tap repair');
        }
        // Final fallback: most recent draft
        order = JSON.parse(JSON.stringify(chosenOrder || pendingOrders[0]));

        // CRITICAL: If queryProductId is provided and the draft has wrong/generic serviceName,
        // override with the actual service the user just booked.
        if (order && queryProductId && !isTapRepairFallback(queryProductId)) {
          if (String(order.productId).toLowerCase() !== queryProductId.toLowerCase() || 
              String(order.serviceName).toLowerCase() !== queryProductId.toLowerCase() ||
              isTapRepairFallback(order.serviceName)) {
            // Resolve exact product details dynamically from DB or catalog
            const resolvedQueryProduct = await resolveServiceDetails(queryProductId);
            let realPrice = resolvedQueryProduct ? resolvedQueryProduct.price : order.price;
            let realName = resolvedQueryProduct ? resolvedQueryProduct.title : queryProductId;
            let realDesc = resolvedQueryProduct ? resolvedQueryProduct.description : `${queryProductId} service`;

            order.serviceName = realName;
            order.productId = realName;
            order.price = realPrice;
            order.description = realDesc;
            if (order.payment) order.payment.amountPaid = order.price;
            order.razorpayOrderId = null; // Clear old Razorpay order ID since the product has changed!
            draftOrders.set(targetPhone, order);
            console.log(`[GetCheckout] Overrode draft product with queryProductId: "${realName}" (price: ${realPrice})`);
            try {
              await DbLayer.createOrder(order);
              console.log(`[GetCheckout] Persisted overridden draft order #${order.id} to DB`);
            } catch (dbErr) {
              console.warn(`[GetCheckout] Could not save overridden draft to DB:`, dbErr.message);
            }
          }
        }
      }

      
      // Dynamic fallback if no order exists for this user ID
      if (!order) {
        const resolvedAddr = await resolveAddressForPhone(targetPhone);

        // Priority 1: Use queryProductId if provided (set by updated Flutter app)
        const userOrders = await DbLayer.getOrdersByUserPhone(targetPhone);

        // Priority 1: queryProductId passed by the Flutter app
        // Priority 2: A recent draft order saved in DB (survives server restarts)
        // Priority 3: Most recent non-Tap-Repair order (for returning users)
        // Priority 4: Absolute fallback - Tap Repair

        // Check if there's a recent non-fallback draft in DB to restore
        const recentDraftOrder = userOrders.find(o =>
          (o.bookingStatus === 'draft' || o.status === 'Draft') &&
          !isTapRepairFallback(o.serviceName) &&
          !isTapRepairFallback(o.productId)
        ) || userOrders.find(o => (o.bookingStatus === 'draft' || o.status === 'Draft'));

        if (recentDraftOrder && !queryProductId) {
          // Restore draft from DB into memory
          draftOrders.set(targetPhone, recentDraftOrder);
          order = JSON.parse(JSON.stringify(recentDraftOrder));
          console.log(`[GetCheckout] Restored draft order #${recentDraftOrder.id} (${recentDraftOrder.serviceName}) from DB for user ${targetPhone}`);
        } else {
          // No draft found - need to create a new one
          let inferredProductId = queryProductId;
          if (!inferredProductId) {
            const recentRealOrder = userOrders.find(o =>
              !isTapRepairFallback(o.serviceName) &&
              !isTapRepairFallback(o.productId)
            );
            if (recentRealOrder) {
              inferredProductId = recentRealOrder.productId || recentRealOrder.serviceName;
            }
          }

          let resolvedProduct = inferredProductId ? await resolveServiceDetails(inferredProductId) : null;
          if (!resolvedProduct || isTapRepairFallback(resolvedProduct.serviceName)) {
            if (inferredProductId && !isTapRepairFallback(inferredProductId)) {
              // Service not in DB but we have the title - use it directly
              resolvedProduct = {
                productId: inferredProductId,
                serviceName: inferredProductId,
                title: inferredProductId,
                price: 499,
                description: `${inferredProductId} service`
              };
            } else {
              resolvedProduct = await resolveServiceDetails("professional Plumber") || {
                productId: "professional Plumber",
                serviceName: "professional Plumber",
                title: "professional Plumber",
                price: 499,
                description: "Professional Plumber Home Service"
              };
            }
          }

          const lastOrderId = await DbLayer.getLastOrderId();
          let highestId = lastOrderId;
          for (const draft of draftOrders.values()) {
            if (draft.id > highestId) highestId = draft.id;
          }
          const orderId = highestId + 1;

          order = {
            id: orderId,
            userPhone: targetPhone,
            userId: targetPhone,
            serviceName: resolvedProduct.serviceName,
            price: resolvedProduct.price,
            date: queryDate || (await getDynamicDateAndSlot()).date,
            status: "Draft",
            bookingStatus: "draft",
            partnerName: null,
            partnerDistance: null,
            productId: resolvedProduct.productId,
            description: resolvedProduct.description,
            timeSlot: querySlot || (await getDynamicDateAndSlot()).timeSlot,
            address: resolvedAddr,
            payment: {
              paymentMethod: queryPaymentMethod || "Wallet",
              amountPaid: resolvedProduct.price
            },
            createdAt: Date.now()
          };
          draftOrders.set(targetPhone, order);
          justCreated = true;
          console.log(`[GetCheckout] Created new fallback order #${orderId} for user ${targetPhone} with product: ${resolvedProduct.serviceName}`);
        } // end else (no draft found)
      } // end if (!order)
    } else {
      // Treat as numerical orderId
      const orderId = parseInt(idParam);
      order = await DbLayer.getOrderById(orderId);
      if (!order) {
        for (const draft of draftOrders.values()) {
          if (draft.id === orderId) {
            order = draft;
            break;
          }
        }
      }
      if (order) {
        order = JSON.parse(JSON.stringify(order));
      }
      
      // Dynamic fallback if no order exists for this order ID
      if (!order) {
        const resolvedAddr = await resolveAddressForPhone(user.phone);
        let resolvedProduct = await resolveServiceDetails(queryProductId);
        if (!resolvedProduct) {
          resolvedProduct = await resolveServiceDetails("professional Plumber") || {
            productId: "professional Plumber",
            serviceName: "professional Plumber",
            title: "professional Plumber",
            price: 499,
            description: "Professional Plumber Home Service"
          };
        }
        order = {
          id: orderId,
          userPhone: user.phone,
          userId: user.phone,
          serviceName: resolvedProduct.serviceName,
          price: resolvedProduct.price,
          date: queryDate || (await getDynamicDateAndSlot()).date,
          status: "Draft",
          bookingStatus: "draft",
          partnerName: null,
          partnerDistance: null,
          productId: resolvedProduct.productId,
          description: resolvedProduct.description,
          timeSlot: querySlot || (await getDynamicDateAndSlot()).timeSlot,
          address: resolvedAddr,
          payment: {
            paymentMethod: queryPaymentMethod || "Wallet",
            amountPaid: resolvedProduct.price
          },
          createdAt: Date.now()
        };
        draftOrders.set(user.phone, order);
        justCreated = true;
        console.log(`[GetCheckout] Created in-memory fallback order #${orderId} for order ID lookup`);
      }
    }

    if (!order) {
      const resolvedAddr = await resolveAddressForPhone(targetPhone).catch(() => null);
      let resolvedProduct = queryProductId ? await resolveServiceDetails(queryProductId) : null;
      if (!resolvedProduct) {
        resolvedProduct = await resolveServiceDetails("professional Plumber") || {
          productId: "1",
          serviceName: "professional Plumber",
          title: "professional Plumber",
          price: 499,
          description: "Professional Plumber Home Service"
        };
      }
      const lastOrderId = await DbLayer.getLastOrderId().catch(() => 100);
      let highestId = lastOrderId;
      for (const draft of draftOrders.values()) {
        if (draft.id > highestId) highestId = draft.id;
      }
      const newOrderId = highestId + 1;

      order = {
        id: newOrderId,
        userPhone: targetPhone,
        userId: targetPhone,
        serviceName: resolvedProduct.serviceName || resolvedProduct.title,
        price: resolvedProduct.price,
        date: queryDate || (await getDynamicDateAndSlot()).date,
        status: "Draft",
        bookingStatus: "draft",
        partnerName: null,
        partnerDistance: null,
        productId: resolvedProduct.productId || "1",
        description: resolvedProduct.description || "",
        timeSlot: querySlot || (await getDynamicDateAndSlot()).timeSlot,
        address: resolvedAddr,
        payment: {
          paymentMethod: queryPaymentMethod || "Wallet",
          amountPaid: resolvedProduct.price
        },
        createdAt: Date.now(),
        items: []
      };
      draftOrders.set(targetPhone, order);
      justCreated = true;
      console.log(`[GetCheckout] Created fresh fallback draft order #${newOrderId} for user ${targetPhone}`);
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
          order.razorpayOrderId = null; // Clear old Razorpay order ID since the product has changed!
          
          updates.productId = resolvedProduct.productId;
          updates.serviceName = resolvedProduct.serviceName;
          updates.price = resolvedProduct.price;
          updates.description = resolvedProduct.description;
          updates.razorpayOrderId = null;
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
      
      // Support explicit payment method overrides
      if (queryPaymentMethod) {
        order.payment = order.payment || {};
        if (order.payment.paymentMethod !== queryPaymentMethod) {
          order.payment.paymentMethod = queryPaymentMethod;
          updates.payment = order.payment;
          order.razorpayOrderId = null; // Clear old Razorpay order ID since the payment method has changed!
          updates.razorpayOrderId = null;
          needsUpdate = true;

          // Sync order.status with the payment method override to prevent AMC state persistence
          const newStatus = queryPaymentMethod.toLowerCase() === "amc" ? "AMC" : "Draft";
          if (order.status !== newStatus) {
            order.status = newStatus;
            updates.status = newStatus;
          }
        }
      }

      // Check if the current state is not AMC, but the draft in memory has price = 0.
      // If so, restore the original service price!
      const statusParam = req.query.status || req.body.status || req.headers['x-status'];
      let currentMethod = (order.payment && order.payment.paymentMethod) || "Online";
      let checkAmc = currentMethod.toLowerCase() === "amc" || (order.amcId !== undefined && order.amcId !== null) || statusParam === "AMC" || order.status === "AMC";
      if (!checkAmc && Number(order.price) === 0) {
        const resolvedProduct = await resolveServiceDetails(order.productId || order.serviceName);
        if (resolvedProduct) {
          order.price = resolvedProduct.price;
          if (order.payment) {
            order.payment.amountPaid = resolvedProduct.price;
          }
          updates.price = resolvedProduct.price;
          updates.payment = order.payment;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        draftOrders.set(order.userPhone, order);
        console.log(`[GetCheckout] Persisted overrides to in-memory draft order #${order.id}`);
        try {
          await DbLayer.createOrder(order);
          console.log(`[GetCheckout] Persisted overrides of draft order #${order.id} to DB`);
        } catch (dbErr) {
          console.warn(`[GetCheckout] Could not save overridden draft to DB:`, dbErr.message);
        }
      }
    }

    // Resolve service details and image dynamically for the checkout response
    let resolvedProduct = null;
    if (order) {
      resolvedProduct = await resolveServiceDetails(order.productId || order.serviceName);
      if (resolvedProduct && resolvedProduct.image) {
        const resolvedList = resolveServiceUrls([resolvedProduct], serverBaseUrl);
        order.image = resolvedList[0].image;
      }
    }
    
    // Retrieve available user addresses
    const addresses = await DbLayer.getAddressesByUserPhone(order.userPhone).catch(() => []);

    // Retrieve available services in the same category
    let services = [];
    if (dbMode === "mysql" && mysqlReady) {
      try {
        const [srvRows] = await mysqlPool.query("SELECT category_id FROM node_services WHERE LOWER(title) = ? OR LOWER(title_hi) = ? OR id = ?", [order.serviceName.toLowerCase(), order.serviceName.toLowerCase(), isNaN(order.productId) ? -1 : parseInt(order.productId)]);
        if (srvRows.length > 0) {
          const categoryId = srvRows[0].category_id;
          const [catSrvRows] = await mysqlPool.query("SELECT * FROM node_services WHERE category_id = ? AND status IN (0, 1)", [categoryId]);
          services = catSrvRows.map(r => sanitizeServiceDbObj(r, serverBaseUrl));
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
    const daysOfWeekEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const daysOfWeekHi = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
    const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthsHi = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

    const isHi = req.lang === 'hi';
    const daysOfWeek = isHi ? daysOfWeekHi : daysOfWeekEn;
    const months = isHi ? monthsHi : monthsEn;

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      let dayName = daysOfWeek[d.getDay()];
      if (i === 0) dayName = isHi ? "आज" : "Today";
      else if (i === 1) dayName = isHi ? "कल" : "Tomorrow";
      dates.push({
        formattedDate: d.toISOString().split('T')[0],
        dayName: dayName,
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
            dayName: isHi ? "चयनित तिथि" : "Selected Date",
            displayDate: `${day} ${months[monthIndex] || parts[1]}`
          });
        }
      } catch (e) {
        console.error("Failed to parse order date for dates list:", e);
      }
    }

    // Support explicit payment method overrides passed via query/body parameters
    if (queryPaymentMethod) {
      order.payment = order.payment || {};
      order.payment.paymentMethod = queryPaymentMethod;
    }

    let currentMethod = (order.payment && order.payment.paymentMethod) || "Online";

    // Support query/body status = AMC parameter
    const statusParam = req.query.status || req.body.status || req.headers['x-status'];
    let isAmc = currentMethod.toLowerCase() === "amc" || (order.amcId !== undefined && order.amcId !== null) || statusParam === "AMC" || order.status === "AMC";

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

    // Check if user has active items in cart and sync them into draft order
    const userCart = await resolveFullUserCart(targetPhone, req.lang).catch(() => null);
    if (userCart && Array.isArray(userCart.items) && userCart.items.length > 0) {
      if (!order || !order.items || order.items.length === 0 || order.bookingStatus === 'draft' || order.status === 'Draft') {
        if (!order) {
          order = {
            id: Date.now(),
            userPhone: targetPhone,
            userId: targetPhone,
            status: "Draft",
            bookingStatus: "draft"
          };
        }
        order.items = userCart.items;
        order.price = userCart.grandTotal;
        order.serviceName = userCart.items.map(i => i.title || i.name || i.serviceName).join(", ");
      }
    }

    if (!order) {
      order = {
        id: Date.now(),
        userPhone: targetPhone,
        userId: targetPhone,
        serviceName: "Home Service",
        price: 0,
        status: "Draft",
        bookingStatus: "draft",
        items: []
      };
    }

    const userBalance = Number(targetUser.walletBalance || 0);
    
    // Dynamically calculate srvPrice using the sum of all items in cart/order if not AMC
    let computedItemsTotal = 0;
    if (order && Array.isArray(order.items) && order.items.length > 0) {
      computedItemsTotal = order.items.reduce((sum, item) => {
        const itemPrice = Number(item.price || item.price_final || item.itemTotal || 0);
        const itemQty = Number(item.quantity || item.qty || 1);
        return sum + (itemPrice * itemQty);
      }, 0);
    }

    const originalPrice = computedItemsTotal > 0 ? computedItemsTotal : ((order && order.price !== undefined && order.price !== null) ? Number(order.price) : (resolvedProduct ? Number(resolvedProduct.price) : 299));
    const srvPrice = isAmc ? 0 : originalPrice;
    
    // Fixed ₹100 wallet deduction: only if balance >= ₹100, else ₹0
    let allowedWallet = 0;
    if (!isAmc && currentMethod.toLowerCase() === "wallet") {
      allowedWallet = userBalance >= 100 ? 100 : 0;
    }

    let finalAdvance = 0.00;
    let finalRemaining = 0.00;

    if (isAmc) {
      finalAdvance = 0.00;
      finalRemaining = 0.00;
      currentMethod = "AMC";
      order.payment = order.payment || {};
      order.payment.paymentMethod = "AMC";
    } else {
      const isWallet = currentMethod.toLowerCase() === "wallet";
      if (isWallet) {
        finalAdvance = allowedWallet;
        finalRemaining = Math.max(0, srvPrice - allowedWallet);
      } else {
        // Online / Razorpay / UPI / COD / Card / etc.
        finalAdvance = Math.max(0, srvPrice - allowedWallet);
        finalRemaining = 0.00;
      }
    }

    let finalTotal = 0.00;
    if (isAmc) {
      finalTotal = 0.00;
    } else {
      const isWallet = currentMethod.toLowerCase() === "wallet";
      if (isWallet) {
        finalTotal = finalRemaining;
      } else {
        finalTotal = srvPrice - allowedWallet;
      }
    }

    let finalAmountPaid = 0.00;
    if (order.bookingStatus && order.bookingStatus.toLowerCase() === "draft") {
      finalAmountPaid = finalTotal;
    } else {
      if (isAmc) {
        finalAmountPaid = 0.00;
      } else if (currentMethod.toLowerCase() === "wallet") {
        finalAmountPaid = finalAdvance;
      } else if (currentMethod.toLowerCase() === "online" || currentMethod.toLowerCase() === "razorpay") {
        finalAmountPaid = finalAdvance;
      } else {
        finalAmountPaid = (order.payment && order.payment.amountPaid) || 0.00;
      }
    }

    const rawProductObj = {
      ...sanitizeProductObj(order),
      price: isAmc ? 0 : originalPrice
    };
    const localizedProduct = localizeService(rawProductObj, req.lang);
    const localizedServicesList = (resolvedServices || []).map(s => localizeService(s, req.lang));

    // Resolve and localize items array
    const rawItemsList = (order.items && order.items.length > 0) ? order.items : [rawProductObj];
    const localizedItems = rawItemsList.map(item => {
      const localizedItem = localizeService(item, req.lang);
      return {
        ...localizedItem,
        quantity: Number(item.quantity || item.qty || 1)
      };
    });

    const totalItemsCount = localizedItems.length;
    const totalQtyCount = localizedItems.reduce((acc, item) => acc + Number(item.quantity || 1), 0);

    const finalPayableAmount = isAmc ? 0.00 : Math.max(0, srvPrice - allowedWallet);
    const cutPriceVal = isAmc ? 0.00 : (srvPrice + (totalQtyCount * 100));
    const discountVal = isAmc ? 0.00 : (cutPriceVal - finalPayableAmount);

    res.json({
      success: true,
      orderId: order.id,
      userId: order.userPhone,
      user: sanitizeUserObj(targetUser),
      product: {
        ...localizedProduct,
        price: isAmc ? 0 : cutPriceVal,
        cutPrice: isAmc ? 0 : cutPriceVal,
        mrp: isAmc ? 0 : cutPriceVal,
        sellingPrice: finalPayableAmount,
        discount: discountVal
      },
      items: localizedItems,
      address: sanitizeAddressObj(order.address, req.lang),
      payment: {
        paymentMethod: currentMethod,
        amountPaid: Number(finalAmountPaid > 0 ? finalAmountPaid : finalPayableAmount)
      },
      status: isAmc ? "AMC" : (order.status || "Pending"),
      bookingStatus: order.bookingStatus || "searching",
      partnerName: order.partnerName || null,
      partnerDistance: order.partnerDistance || null,
      razorpayOrderId: order.razorpayOrderId || null,
      advancePayment: finalAdvance,
      remainingAmount: finalRemaining,
      platformCharge: 0.00,
      cutPrice: cutPriceVal,
      mrp: cutPriceVal,
      discount: discountVal,
      discountAmount: discountVal,
      subtotal: isAmc ? 0.00 : cutPriceVal,
      totalAmount: finalPayableAmount,
      grandTotal: finalPayableAmount,
      totalItems: totalItemsCount,
      totalQuantity: totalQtyCount,
      total: finalPayableAmount,
      walletBalance: userBalance,
      addresses: (addresses || []).map(addr => sanitizeAddressObj(addr, req.lang)),
      services: localizedServicesList,
      products: localizedServicesList,
      slots: availableSlots,
      dates: dates,
      message: translate("checkout_success", req.lang)
    });
  } catch (err) {
    console.error("Fetch checkout details failed:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message, stack: err.stack });
  }
};
app.get('/api/checkout', handleGetCheckout);
app.get('/api/checkout-api', handleGetCheckout);
app.get('/api/checkout/:userId', handleGetCheckout);
app.get('/api/checkout-api/:userId', handleGetCheckout);

// ==========================================
// CART MANAGEMENT SYSTEM
// ==========================================
const memoryCart = new Map();

async function getUserIdFromReq(req) {
  try {
    const user = await getAuthenticatedUser(req);
    if (user && (user.id || user.phone || user.user_id)) {
      return String(user.id || user.phone || user.user_id);
    }
  } catch (e) {}

  const headers = req ? (req.headers || {}) : {};
  const fromHeader = headers['x-user-id'] || headers['x-user-phone'] || headers['userid'];
  if (fromHeader) return String(fromHeader);

  const query = req ? (req.query || {}) : {};
  const fromQuery = query.userId || query.user_id || query.phone || query.id;
  if (fromQuery) return String(fromQuery);

  const body = req ? (req.body || {}) : {};
  const fromBody = body.userId || body.user_id || body.phone || body.id;
  if (fromBody) return String(fromBody);

  return "guest_default";
}

async function getUserRawCartItems(userId) {
  let items = [];

  if (mysqlReady) {
    try {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS node_cart (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          service_id VARCHAR(100) NOT NULL,
          category_id VARCHAR(100) DEFAULT '',
          category_name VARCHAR(255) DEFAULT '',
          quantity INT DEFAULT 1,
          options TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY user_service (user_id, service_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      const [rows] = await mysqlPool.query(
        "SELECT * FROM node_cart WHERE user_id = ?",
        [userId]
      );
      if (rows && rows.length > 0) {
        return rows.map(r => ({
          serviceId: String(r.service_id),
          quantity: parseInt(r.quantity || 1, 10),
          categoryId: String(r.category_id || ''),
          categoryName: String(r.category_name || ''),
          options: r.options ? (typeof r.options === 'string' ? JSON.parse(r.options || '{}') : r.options) : {}
        }));
      }
    } catch (e) {
      console.warn("[Cart] MySQL query failed, falling back:", e.message);
    }
  }

  try {
    const dbData = readDataFromJsonDb();
    if (dbData && dbData.cart) {
      const userItems = dbData.cart.filter(item => String(item.userId || item.user_id) === String(userId));
      if (userItems.length > 0) {
        return userItems.map(item => ({
          serviceId: String(item.serviceId || item.service_id),
          quantity: parseInt(item.quantity || item.qty || 1, 10),
          categoryId: String(item.categoryId || item.category_id || ''),
          categoryName: String(item.categoryName || item.category_name || ''),
          options: item.options || {}
        }));
      }
    }
  } catch (e) {}

  if (memoryCart.has(userId)) {
    const userMap = memoryCart.get(userId);
    items = Array.from(userMap.values());
  }

  return items;
}

async function saveUserRawCartItems(userId, items) {
  const userMap = new Map();
  items.forEach(item => {
    userMap.set(String(item.serviceId), item);
  });
  memoryCart.set(userId, userMap);

  if (mysqlReady) {
    try {
      await mysqlPool.query("DELETE FROM node_cart WHERE user_id = ?", [userId]);
      for (const item of items) {
        await mysqlPool.query(
          "INSERT INTO node_cart (user_id, service_id, category_id, category_name, quantity, options) VALUES (?, ?, ?, ?, ?, ?)",
          [
            userId,
            String(item.serviceId),
            String(item.categoryId || ''),
            String(item.categoryName || ''),
            item.quantity,
            JSON.stringify(item.options || {})
          ]
        );
      }
    } catch (e) {
      console.warn("[Cart] MySQL save failed:", e.message);
    }
  }

  try {
    const dbPath = path.join(__dirname, 'database.json');
    if (fs.existsSync(dbPath)) {
      const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (dbData) {
        dbData.cart = (dbData.cart || []).filter(item => String(item.userId || item.user_id) !== String(userId));
        for (const item of items) {
          dbData.cart.push({
            userId: userId,
            serviceId: String(item.serviceId),
            quantity: item.quantity,
            categoryId: String(item.categoryId || ''),
            categoryName: String(item.categoryName || ''),
            options: item.options || {},
            updatedAt: new Date().toISOString()
          });
        }
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
      }
    }
  } catch (e) {
    console.warn("[Cart] JSON save failed:", e.message);
  }
}

function resolveDynamicServiceImageUrl(svc, serverBaseUrl) {
  if (!svc) return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=500&auto=format&fit=crop";
  const resolved = resolveServiceUrls([svc], serverBaseUrl);
  return (resolved && resolved[0] && resolved[0].image) ? resolved[0].image : (svc.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=500&auto=format&fit=crop");
}

async function resolveFullUserCart(userId, lang = 'en') {
  const rawItems = await getUserRawCartItems(userId);
  const host = 'https://backend-1-ux3b.onrender.com';
  const serverBaseUrl = host;

  let allServices = [];
  if (mysqlReady) {
    try {
      const [rows] = await mysqlPool.query(
        "SELECT s.*, c.title as cat_name FROM node_services s LEFT JOIN node_categories c ON s.category_id = c.id WHERE s.status IN (0, 1)"
      );
      if (rows && rows.length > 0) {
        allServices = rows.map(r => sanitizeServiceDbObj(r, serverBaseUrl));
      }
    } catch (e) {}
  }

  if (allServices.length === 0) {
    try {
      const data = readDataFromJsonDb();
      if (data && data.services) {
        allServices = data.services;
      }
    } catch (e) {}
  }

  const enrichedItems = [];
  let subtotal = 0;
  let totalQuantity = 0;
  let totalOriginalPrice = 0;

  for (const raw of rawItems) {
    const sId = String(raw.serviceId);
    let matchedSvc = allServices.find(s => 
      String(s.id) === sId || 
      String(s.service_id) === sId || 
      (s.title && s.title.toLowerCase() === sId.toLowerCase())
    );

    let title = raw.title || (matchedSvc ? (matchedSvc.title || matchedSvc.name) : "Service Item");
    let description = matchedSvc ? (matchedSvc.description || matchedSvc.desc || "") : "";
    let price = matchedSvc ? parseFloat(matchedSvc.price || matchedSvc.price_final || 0) : parseFloat(raw.price || 0);
    let originalPrice = matchedSvc ? parseFloat(matchedSvc.original_price || matchedSvc.cut_price || (price * 1.25)) : (price * 1.25);
    if (originalPrice < price) originalPrice = Math.round(price * 1.2);
    
    let discount = matchedSvc && matchedSvc.discount ? matchedSvc.discount : "20% OFF";
    let image = matchedSvc ? resolveDynamicServiceImageUrl(matchedSvc, serverBaseUrl) : (raw.image || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=500&auto=format&fit=crop");
    let catId = raw.categoryId || (matchedSvc ? String(matchedSvc.category_id || matchedSvc.category || "1") : "1");
    let catName = raw.categoryName || (matchedSvc ? String(matchedSvc.cat_name || matchedSvc.categoryName || matchedSvc.category || "General") : "General");
    let qty = parseInt(raw.quantity || 1, 10);
    let itemTotal = price * qty;
    let duration = matchedSvc && matchedSvc.duration ? matchedSvc.duration : "45 mins";
    let warranty = matchedSvc && matchedSvc.warranty ? matchedSvc.warranty : "30 Days Warranty";

    if (lang && lang !== 'en' && matchedSvc && mysqlReady) {
      try {
        const [trans] = await mysqlPool.query(
          `SELECT title_${lang}, description_${lang} FROM node_services WHERE id = ? LIMIT 1`,
          [matchedSvc.id]
        );
        if (trans && trans[0]) {
          if (trans[0][`title_${lang}`]) title = trans[0][`title_${lang}`];
          if (trans[0][`description_${lang}`]) description = trans[0][`description_${lang}`];
        }
      } catch (e) {}
    }

    subtotal += itemTotal;
    totalQuantity += qty;
    totalOriginalPrice += (originalPrice * qty);

    enrichedItems.push({
      serviceId: sId,
      id: sId,
      title: title,
      name: title,
      description: description,
      price: Math.round(price),
      originalPrice: Math.round(originalPrice),
      cutPrice: Math.round(originalPrice),
      discount: discount,
      image: image,
      imageUrl: image,
      categoryId: catId,
      categoryName: catName,
      quantity: qty,
      qty: qty,
      itemTotal: Math.round(itemTotal),
      duration: duration,
      warranty: warranty,
      options: raw.options || {}
    });
  }

  const discountTotal = Math.max(0, Math.round(totalOriginalPrice - subtotal));

  return {
    items: enrichedItems,
    totalItems: enrichedItems.length,
    totalQuantity: totalQuantity,
    subtotal: Math.round(subtotal),
    discountTotal: discountTotal,
    tax: 0,
    deliveryFee: 0,
    grandTotal: Math.round(subtotal)
  };
}

// 1. POST /api/cart/add
app.post('/api/cart/add', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const body = req.body || {};
    const serviceId = String(body.serviceId || body.service_id || body.id || '');
    const quantity = parseInt(body.quantity || body.qty || 1, 10);
    const categoryId = String(body.categoryId || body.category_id || '');
    const categoryName = String(body.categoryName || body.category_name || '');
    const options = body.options || {};

    if (!serviceId) {
      return res.status(400).json({ success: false, error: "serviceId is required" });
    }

    let items = await getUserRawCartItems(userId);
    const existingIndex = items.findIndex(item => String(item.serviceId) === serviceId);

    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
      if (categoryId) items[existingIndex].categoryId = categoryId;
      if (categoryName) items[existingIndex].categoryName = categoryName;
      if (Object.keys(options).length > 0) items[existingIndex].options = options;
    } else {
      items.push({
        serviceId: serviceId,
        quantity: quantity,
        categoryId: categoryId,
        categoryName: categoryName,
        options: options
      });
    }

    await saveUserRawCartItems(userId, items);
    const fullCart = await resolveFullUserCart(userId, req.lang);

    res.json({
      success: true,
      message: translate("cart_item_added", req.lang) || "Service added to cart successfully",
      cart: fullCart
    });
  } catch (err) {
    console.error("Add to cart failed:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// 2. GET /api/cart
app.get('/api/cart', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const fullCart = await resolveFullUserCart(userId, req.lang);

    res.json({
      success: true,
      message: translate("cart_retrieved", req.lang) || "Cart retrieved successfully",
      cart: fullCart
    });
  } catch (err) {
    console.error("Get cart failed:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// 3. PUT /api/cart/update-quantity
app.put('/api/cart/update-quantity', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const body = req.body || {};
    const serviceId = String(body.serviceId || body.service_id || body.id || '');
    const newQty = parseInt(body.quantity !== undefined ? body.quantity : (body.qty !== undefined ? body.qty : 1), 10);

    if (!serviceId) {
      return res.status(400).json({ success: false, error: "serviceId is required" });
    }

    let items = await getUserRawCartItems(userId);

    if (newQty <= 0) {
      items = items.filter(item => String(item.serviceId) !== serviceId);
    } else {
      const existingIndex = items.findIndex(item => String(item.serviceId) === serviceId);
      if (existingIndex >= 0) {
        items[existingIndex].quantity = newQty;
      } else {
        items.push({ serviceId: serviceId, quantity: newQty });
      }
    }

    await saveUserRawCartItems(userId, items);
    const fullCart = await resolveFullUserCart(userId, req.lang);

    res.json({
      success: true,
      message: translate("cart_updated", req.lang) || "Cart quantity updated successfully",
      cart: fullCart
    });
  } catch (err) {
    console.error("Update cart quantity failed:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// 4. DELETE /api/cart/remove/:serviceId
app.delete('/api/cart/remove/:serviceId', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    const serviceId = String(req.params ? (req.params.serviceId || '') : '');

    if (!serviceId) {
      return res.status(400).json({ success: false, error: "serviceId is required" });
    }

    let items = await getUserRawCartItems(userId);
    items = items.filter(item => String(item.serviceId) !== serviceId);

    await saveUserRawCartItems(userId, items);
    const fullCart = await resolveFullUserCart(userId, req.lang);

    res.json({
      success: true,
      message: translate("cart_item_removed", req.lang) || "Item removed from cart successfully",
      cart: fullCart
    });
  } catch (err) {
    console.error("Remove cart item failed:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// 5. DELETE /api/cart/clear
app.delete('/api/cart/clear', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);

    await saveUserRawCartItems(userId, []);
    const fullCart = await resolveFullUserCart(userId, req.lang);

    res.json({
      success: true,
      message: translate("cart_cleared", req.lang) || "Cart cleared successfully",
      cart: fullCart
    });
  } catch (err) {
    console.error("Clear cart failed:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// 14. Orders: Get All
app.get('/api/orders', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userOrders = await DbLayer.getOrdersByUserPhone(user.phone);
    const placedOrders = userOrders.filter(o => !o.bookingStatus || o.bookingStatus.toLowerCase() !== "draft");

    const statusQuery = req.query.status || req.body.status;
    let filteredOrders = placedOrders;
    if (statusQuery) {
      filteredOrders = placedOrders.filter(o => 
        (o.status && o.status.toLowerCase() === statusQuery.toLowerCase()) ||
        (o.payment && o.payment.paymentMethod && o.payment.paymentMethod.toLowerCase() === statusQuery.toLowerCase())
      );
    }

    // Localize serviceName for each order
    const localizedFilteredOrders = await Promise.all(filteredOrders.map(async o => {
      let localizedServiceName = o.serviceName;
      let localizedDescription = o.description;
      if (req.lang && req.lang !== 'en' && o.serviceName && mysqlPool) {
        try {
          const [svcRows] = await mysqlPool.query(
            `SELECT title, title_${req.lang}, description_${req.lang} FROM node_services WHERE LOWER(title) = ? LIMIT 1`,
            [String(o.serviceName).toLowerCase()]
          );
          if (svcRows && svcRows[0]) {
            if (svcRows[0][`title_${req.lang}`]) {
              localizedServiceName = svcRows[0][`title_${req.lang}`];
            }
            if (svcRows[0][`description_${req.lang}`]) {
              localizedDescription = svcRows[0][`description_${req.lang}`];
            }
          }
        } catch (e) { /* ignore, use English name */ }
      }

      // Also localize items
      const itemsList = o.items || [];
      const localizedItems = await Promise.all(itemsList.map(async item => {
        let localizedItemName = item.serviceName;
        let localizedItemDesc = item.description;
        if (req.lang && req.lang !== 'en' && item.serviceName && mysqlPool) {
          try {
            const [svcRows] = await mysqlPool.query(
              `SELECT title, title_${req.lang}, description_${req.lang} FROM node_services WHERE LOWER(title) = ? LIMIT 1`,
              [String(item.serviceName).toLowerCase()]
            );
            if (svcRows && svcRows[0]) {
              if (svcRows[0][`title_${req.lang}`]) {
                localizedItemName = svcRows[0][`title_${req.lang}`];
              }
              if (svcRows[0][`description_${req.lang}`]) {
                localizedItemDesc = svcRows[0][`description_${req.lang}`];
              }
            }
          } catch (e) {}
        }
        return {
          ...item,
          serviceName: localizedItemName,
          title: localizedItemName,
          description: localizedItemDesc,
          quantity: item.quantity || 1
        };
      }));

      return { 
        ...o, 
        serviceName: localizedServiceName, 
        description: localizedDescription,
        items: localizedItems.length > 0 ? localizedItems : null
      };
    }));

    // Enriched list mapping
    const list = localizedFilteredOrders.map(o => ({
      id: o.id,
      serviceName: o.serviceName,
      price: o.price,
      status: o.status,
      date: o.date,
      timeSlot: o.timeSlot,
      razorpayOrderId: o.razorpayOrderId || null,
      advancePayment: o.advancePayment !== undefined ? Number(o.advancePayment) : (o.status === "AMC" ? 0.00 : 199.00),
      remainingAmount: o.remainingAmount !== undefined ? Number(o.remainingAmount) : 0.00,
      platformCharge: o.platformCharge !== undefined ? Number(o.platformCharge) : 0.00,
      totalAmount: o.status === "AMC" ? 0.00 : Number(o.price || 0),
      total: o.remainingAmount !== undefined ? Number(o.remainingAmount) : 0.00,
      items: o.items
    }));

    const orderlist = {
      total: localizedFilteredOrders.length,
      data: localizedFilteredOrders
    };

    res.json({
      success: true,
      orders: localizedFilteredOrders,
      list,
      orderlist,
      status: statusQuery || "ALL",
      message: translate("bookings_retrieved", req.lang)
    });
  } catch (err) {
    console.error("Fetch orders failed:", err);
    res.status(500).json({ error: translate("internal_error", req.lang) });
  }
});

// 14a. Orders: Get Details by ID
app.get('/api/orders/:id', async (req, res) => {
  const orderId = parseInt(req.params.id);
  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid Order ID" });
  }

  try {
    const order = await DbLayer.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (req.lang && req.lang !== 'en' && order.serviceName && mysqlPool) {
      try {
        const [svcRows] = await mysqlPool.query(
          `SELECT title_${req.lang}, description_${req.lang} FROM node_services WHERE LOWER(title) = ? LIMIT 1`,
          [String(order.serviceName).toLowerCase()]
        );
        if (svcRows && svcRows[0]) {
          if (svcRows[0][`title_${req.lang}`]) {
            order.serviceName = svcRows[0][`title_${req.lang}`];
            order.title_hi = svcRows[0][`title_${req.lang}`]; 
          }
          if (svcRows[0][`description_${req.lang}`]) {
            order.description = svcRows[0][`description_${req.lang}`];
            order.description_hi = svcRows[0][`description_${req.lang}`];
          }
        }
      } catch (e) { /* ignore */ }
    }

    if (order.items && Array.isArray(order.items)) {
      order.items = await Promise.all(order.items.map(async item => {
        const localizedItem = localizeService(item, req.lang);
        if (req.lang && req.lang !== 'en' && item.serviceName && mysqlPool) {
          try {
            const [svcRows] = await mysqlPool.query(
              `SELECT title_${req.lang}, description_${req.lang} FROM node_services WHERE LOWER(title) = ? LIMIT 1`,
              [String(item.serviceName).toLowerCase()]
            );
            if (svcRows && svcRows[0]) {
              if (svcRows[0][`title_${req.lang}`]) {
                localizedItem.serviceName = svcRows[0][`title_${req.lang}`];
                localizedItem.title = svcRows[0][`title_${req.lang}`];
              }
              if (svcRows[0][`description_${req.lang}`]) {
                localizedItem.description = svcRows[0][`description_${req.lang}`];
              }
            }
          } catch (e) {}
        }
        return {
          ...localizedItem,
          quantity: item.quantity || 1
        };
      }));
    }

    const localizedOrder = localizeService(order, req.lang);

    res.json({
      success: true,
      ...localizedOrder,
      status: localizedOrder.status || "Pending",
      advancePayment: localizedOrder.advancePayment !== undefined ? Number(localizedOrder.advancePayment) : (localizedOrder.status === "AMC" ? 0.00 : 199.00),
      remainingAmount: localizedOrder.remainingAmount !== undefined ? Number(localizedOrder.remainingAmount) : 0.00,
      platformCharge: localizedOrder.platformCharge !== undefined ? Number(localizedOrder.platformCharge) : 0.00,
      totalAmount: localizedOrder.status === "AMC" ? 0.00 : Number(localizedOrder.price || 0),
      total: localizedOrder.remainingAmount !== undefined ? Number(localizedOrder.remainingAmount) : 0.00,
      order: localizedOrder
    });
  } catch (err) {
    console.error("Fetch order details failed:", err);
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

    // Clear cart for user after placing order
    await DbLayer.clearCart(user.phone).catch(() => {});
    await saveUserRawCartItems(user.phone, []).catch(() => {});

    console.log(`Placed new order #${orderId} - ${serviceName} for phone ${user.phone}`);
    res.json({ success: true, order: newOrder, message: translate("booking_success", req.lang) });
  } catch (err) {
    console.error("Place order failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 16. Orders: Cancel Order
const handleCancelOrder = async (req, res) => {
  const orderId = req.body.orderId || req.body.order_id || req.body.id || req.query.orderId || req.query.id;
  const cancelResponse = req.body.response || req.body.reason || req.body.cancelReason || req.body.cancellationReason || req.query.response || req.query.reason;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: "orderId is required in request body"
    });
  }

  if (!cancelResponse || String(cancelResponse).trim() === "") {
    return res.status(400).json({
      success: false,
      error: "response (cancellation reason) is required in request body"
    });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
    }

    const numericOrderId = parseInt(orderId);
    const order = await DbLayer.getOrderById(numericOrderId);
    if (!order || order.userPhone !== user.phone) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const updates = {
      status: "Cancelled",
      bookingStatus: "idle",
      cancelReason: String(cancelResponse).trim()
    };

    let updatedOrder;
    try {
      updatedOrder = await DbLayer.updateOrder(numericOrderId, updates);
    } catch (dbErr) {
      delete updates.cancelReason;
      updatedOrder = await DbLayer.updateOrder(numericOrderId, updates);
    }

    return res.json({
      success: true,
      orderId: numericOrderId,
      status: "Cancelled",
      reason: String(cancelResponse).trim(),
      response: String(cancelResponse).trim(),
      order: updatedOrder,
      message: translate("order_cancelled", req.lang)
    });
  } catch (err) {
    console.error("Cancel order failed:", err);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

app.post('/api/orders/cancel', handleCancelOrder);
app.post('/api/cancel-order', handleCancelOrder);
app.post('/api/order/cancel', handleCancelOrder);

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

    res.json({ success: true, order: updatedOrder, message: translate("order_cancelled", req.lang) });
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

    // Real-time dispatching flow: bookings remain in searching state until accepted by a nearby partner or assigned by admin

    res.json({
      success: true,
      status: order.bookingStatus,
      partnerName: order.partnerName,
      partnerDistance: order.partnerDistance,
      message: translate("booking_flow_retrieved", req.lang)
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
      message: translate("booking_flow_updated", req.lang)
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
    message: translate("dates_retrieved", req.lang)
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

    // Get pincode from query params or authenticated user's address
    let pincode = req.query.pincode || req.body.pincode || null;
    if (!pincode) {
      try {
        const authUser = await getAuthenticatedUser(req).catch(() => null);
        if (authUser) {
          const addr = await resolveAddressForPhone(authUser.phone);
          if (addr) pincode = String(addr.pincode || "").trim() || null;
        }
      } catch(_) {}
    }

    if (date) {
      // Use shared helper which checks real DB bookings for the given date
      // Pass productId and pincode for capacity check (50 orders per slot per service per pincode)
      const rawSlots = await getAvailableSlotsForDate(date, null, productId || null, pincode || null);
      slots = rawSlots.filter(s => s.available);
    } else {
      // No date provided — return all slots as available
      slots = bookingSlots.map(s => ({ ...s, available: true }));
    }

    res.json({
      success: true,
      slots: slots,
      message: translate("slots_retrieved", req.lang)
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


// Dropdown: Get Countries
const countriesList = [
  {
    "name": "Afghanistan",
    "code": "AF",
    "dial_code": "+93",
    "dialCode": "+93",
    "flag": "🇦🇫",
    "flagUrl": "https://flagcdn.com/w80/af.png",
    "flag_url": "https://flagcdn.com/w80/af.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Åland Islands",
    "code": "AX",
    "dial_code": "+358",
    "dialCode": "+358",
    "flag": "🇦🇽",
    "flagUrl": "https://flagcdn.com/w80/ax.png",
    "flag_url": "https://flagcdn.com/w80/ax.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Albania",
    "code": "AL",
    "dial_code": "+355",
    "dialCode": "+355",
    "flag": "🇦🇱",
    "flagUrl": "https://flagcdn.com/w80/al.png",
    "flag_url": "https://flagcdn.com/w80/al.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9
    ]
  },
  {
    "name": "Algeria",
    "code": "DZ",
    "dial_code": "+213",
    "dialCode": "+213",
    "flag": "🇩🇿",
    "flagUrl": "https://flagcdn.com/w80/dz.png",
    "flag_url": "https://flagcdn.com/w80/dz.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "American Samoa",
    "code": "AS",
    "dial_code": "+1684",
    "dialCode": "+1684",
    "flag": "🇦🇸",
    "flagUrl": "https://flagcdn.com/w80/as.png",
    "flag_url": "https://flagcdn.com/w80/as.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Andorra",
    "code": "AD",
    "dial_code": "+376",
    "dialCode": "+376",
    "flag": "🇦🇩",
    "flagUrl": "https://flagcdn.com/w80/ad.png",
    "flag_url": "https://flagcdn.com/w80/ad.png",
    "phoneLength": 6,
    "phoneLengths": [
      6,
      8,
      9
    ]
  },
  {
    "name": "Angola",
    "code": "AO",
    "dial_code": "+244",
    "dialCode": "+244",
    "flag": "🇦🇴",
    "flagUrl": "https://flagcdn.com/w80/ao.png",
    "flag_url": "https://flagcdn.com/w80/ao.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Anguilla",
    "code": "AI",
    "dial_code": "+1264",
    "dialCode": "+1264",
    "flag": "🇦🇮",
    "flagUrl": "https://flagcdn.com/w80/ai.png",
    "flag_url": "https://flagcdn.com/w80/ai.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Antarctica",
    "code": "AQ",
    "dial_code": "+672",
    "dialCode": "+672",
    "flag": "🇦🇶",
    "flagUrl": "https://flagcdn.com/w80/aq.png",
    "flag_url": "https://flagcdn.com/w80/aq.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Antigua and Barbuda",
    "code": "AG",
    "dial_code": "+1268",
    "dialCode": "+1268",
    "flag": "🇦🇬",
    "flagUrl": "https://flagcdn.com/w80/ag.png",
    "flag_url": "https://flagcdn.com/w80/ag.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Argentina",
    "code": "AR",
    "dial_code": "+54",
    "dialCode": "+54",
    "flag": "🇦🇷",
    "flagUrl": "https://flagcdn.com/w80/ar.png",
    "flag_url": "https://flagcdn.com/w80/ar.png",
    "phoneLength": 11,
    "phoneLengths": [
      10,
      11
    ]
  },
  {
    "name": "Armenia",
    "code": "AM",
    "dial_code": "+374",
    "dialCode": "+374",
    "flag": "🇦🇲",
    "flagUrl": "https://flagcdn.com/w80/am.png",
    "flag_url": "https://flagcdn.com/w80/am.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Aruba",
    "code": "AW",
    "dial_code": "+297",
    "dialCode": "+297",
    "flag": "🇦🇼",
    "flagUrl": "https://flagcdn.com/w80/aw.png",
    "flag_url": "https://flagcdn.com/w80/aw.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Australia",
    "code": "AU",
    "dial_code": "+61",
    "dialCode": "+61",
    "flag": "🇦🇺",
    "flagUrl": "https://flagcdn.com/w80/au.png",
    "flag_url": "https://flagcdn.com/w80/au.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10,
      12
    ]
  },
  {
    "name": "Austria",
    "code": "AT",
    "dial_code": "+43",
    "dialCode": "+43",
    "flag": "🇦🇹",
    "flagUrl": "https://flagcdn.com/w80/at.png",
    "flag_url": "https://flagcdn.com/w80/at.png",
    "phoneLength": 9,
    "phoneLengths": [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13
    ]
  },
  {
    "name": "Azerbaijan",
    "code": "AZ",
    "dial_code": "+994",
    "dialCode": "+994",
    "flag": "🇦🇿",
    "flagUrl": "https://flagcdn.com/w80/az.png",
    "flag_url": "https://flagcdn.com/w80/az.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Bahamas",
    "code": "BS",
    "dial_code": "+1242",
    "dialCode": "+1242",
    "flag": "🇧🇸",
    "flagUrl": "https://flagcdn.com/w80/bs.png",
    "flag_url": "https://flagcdn.com/w80/bs.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Bahrain",
    "code": "BH",
    "dial_code": "+973",
    "dialCode": "+973",
    "flag": "🇧🇭",
    "flagUrl": "https://flagcdn.com/w80/bh.png",
    "flag_url": "https://flagcdn.com/w80/bh.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Bangladesh",
    "code": "BD",
    "dial_code": "+880",
    "dialCode": "+880",
    "flag": "🇧🇩",
    "flagUrl": "https://flagcdn.com/w80/bd.png",
    "flag_url": "https://flagcdn.com/w80/bd.png",
    "phoneLength": 10,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Barbados",
    "code": "BB",
    "dial_code": "+1246",
    "dialCode": "+1246",
    "flag": "🇧🇧",
    "flagUrl": "https://flagcdn.com/w80/bb.png",
    "flag_url": "https://flagcdn.com/w80/bb.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Belarus",
    "code": "BY",
    "dial_code": "+375",
    "dialCode": "+375",
    "flag": "🇧🇾",
    "flagUrl": "https://flagcdn.com/w80/by.png",
    "flag_url": "https://flagcdn.com/w80/by.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Belgium",
    "code": "BE",
    "dial_code": "+32",
    "dialCode": "+32",
    "flag": "🇧🇪",
    "flagUrl": "https://flagcdn.com/w80/be.png",
    "flag_url": "https://flagcdn.com/w80/be.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Belize",
    "code": "BZ",
    "dial_code": "+501",
    "dialCode": "+501",
    "flag": "🇧🇿",
    "flagUrl": "https://flagcdn.com/w80/bz.png",
    "flag_url": "https://flagcdn.com/w80/bz.png",
    "phoneLength": 7,
    "phoneLengths": [
      7,
      11
    ]
  },
  {
    "name": "Benin",
    "code": "BJ",
    "dial_code": "+229",
    "dialCode": "+229",
    "flag": "🇧🇯",
    "flagUrl": "https://flagcdn.com/w80/bj.png",
    "flag_url": "https://flagcdn.com/w80/bj.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      10
    ]
  },
  {
    "name": "Bermuda",
    "code": "BM",
    "dial_code": "+1441",
    "dialCode": "+1441",
    "flag": "🇧🇲",
    "flagUrl": "https://flagcdn.com/w80/bm.png",
    "flag_url": "https://flagcdn.com/w80/bm.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Bhutan",
    "code": "BT",
    "dial_code": "+975",
    "dialCode": "+975",
    "flag": "🇧🇹",
    "flagUrl": "https://flagcdn.com/w80/bt.png",
    "flag_url": "https://flagcdn.com/w80/bt.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Bolivia, Plurinational State of bolivia",
    "code": "BO",
    "dial_code": "+591",
    "dialCode": "+591",
    "flag": "🇧🇴",
    "flagUrl": "https://flagcdn.com/w80/bo.png",
    "flag_url": "https://flagcdn.com/w80/bo.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Bosnia and Herzegovina",
    "code": "BA",
    "dial_code": "+387",
    "dialCode": "+387",
    "flag": "🇧🇦",
    "flagUrl": "https://flagcdn.com/w80/ba.png",
    "flag_url": "https://flagcdn.com/w80/ba.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Botswana",
    "code": "BW",
    "dial_code": "+267",
    "dialCode": "+267",
    "flag": "🇧🇼",
    "flagUrl": "https://flagcdn.com/w80/bw.png",
    "flag_url": "https://flagcdn.com/w80/bw.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      10
    ]
  },
  {
    "name": "Bouvet Island",
    "code": "BV",
    "dial_code": "+47",
    "dialCode": "+47",
    "flag": "🇧🇻",
    "flagUrl": "https://flagcdn.com/w80/bv.png",
    "flag_url": "https://flagcdn.com/w80/bv.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Brazil",
    "code": "BR",
    "dial_code": "+55",
    "dialCode": "+55",
    "flag": "🇧🇷",
    "flagUrl": "https://flagcdn.com/w80/br.png",
    "flag_url": "https://flagcdn.com/w80/br.png",
    "phoneLength": 11,
    "phoneLengths": [
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "British Indian Ocean Territory",
    "code": "IO",
    "dial_code": "+246",
    "dialCode": "+246",
    "flag": "🇮🇴",
    "flagUrl": "https://flagcdn.com/w80/io.png",
    "flag_url": "https://flagcdn.com/w80/io.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Brunei Darussalam",
    "code": "BN",
    "dial_code": "+673",
    "dialCode": "+673",
    "flag": "🇧🇳",
    "flagUrl": "https://flagcdn.com/w80/bn.png",
    "flag_url": "https://flagcdn.com/w80/bn.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Bulgaria",
    "code": "BG",
    "dial_code": "+359",
    "dialCode": "+359",
    "flag": "🇧🇬",
    "flagUrl": "https://flagcdn.com/w80/bg.png",
    "flag_url": "https://flagcdn.com/w80/bg.png",
    "phoneLength": 8,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      12
    ]
  },
  {
    "name": "Burkina Faso",
    "code": "BF",
    "dial_code": "+226",
    "dialCode": "+226",
    "flag": "🇧🇫",
    "flagUrl": "https://flagcdn.com/w80/bf.png",
    "flag_url": "https://flagcdn.com/w80/bf.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Burundi",
    "code": "BI",
    "dial_code": "+257",
    "dialCode": "+257",
    "flag": "🇧🇮",
    "flagUrl": "https://flagcdn.com/w80/bi.png",
    "flag_url": "https://flagcdn.com/w80/bi.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Cambodia",
    "code": "KH",
    "dial_code": "+855",
    "dialCode": "+855",
    "flag": "🇰🇭",
    "flagUrl": "https://flagcdn.com/w80/kh.png",
    "flag_url": "https://flagcdn.com/w80/kh.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Cameroon",
    "code": "CM",
    "dial_code": "+237",
    "dialCode": "+237",
    "flag": "🇨🇲",
    "flagUrl": "https://flagcdn.com/w80/cm.png",
    "flag_url": "https://flagcdn.com/w80/cm.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Canada",
    "code": "CA",
    "dial_code": "+1",
    "dialCode": "+1",
    "flag": "🇨🇦",
    "flagUrl": "https://flagcdn.com/w80/ca.png",
    "flag_url": "https://flagcdn.com/w80/ca.png",
    "phoneLength": 10,
    "phoneLengths": [
      7,
      10
    ]
  },
  {
    "name": "Cape Verde",
    "code": "CV",
    "dial_code": "+238",
    "dialCode": "+238",
    "flag": "🇨🇻",
    "flagUrl": "https://flagcdn.com/w80/cv.png",
    "flag_url": "https://flagcdn.com/w80/cv.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Cayman Islands",
    "code": "KY",
    "dial_code": "+345",
    "dialCode": "+345",
    "flag": "🇰🇾",
    "flagUrl": "https://flagcdn.com/w80/ky.png",
    "flag_url": "https://flagcdn.com/w80/ky.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Central African Republic",
    "code": "CF",
    "dial_code": "+236",
    "dialCode": "+236",
    "flag": "🇨🇫",
    "flagUrl": "https://flagcdn.com/w80/cf.png",
    "flag_url": "https://flagcdn.com/w80/cf.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Chad",
    "code": "TD",
    "dial_code": "+235",
    "dialCode": "+235",
    "flag": "🇹🇩",
    "flagUrl": "https://flagcdn.com/w80/td.png",
    "flag_url": "https://flagcdn.com/w80/td.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Chile",
    "code": "CL",
    "dial_code": "+56",
    "dialCode": "+56",
    "flag": "🇨🇱",
    "flagUrl": "https://flagcdn.com/w80/cl.png",
    "flag_url": "https://flagcdn.com/w80/cl.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      10,
      11
    ]
  },
  {
    "name": "China",
    "code": "CN",
    "dial_code": "+86",
    "dialCode": "+86",
    "flag": "🇨🇳",
    "flagUrl": "https://flagcdn.com/w80/cn.png",
    "flag_url": "https://flagcdn.com/w80/cn.png",
    "phoneLength": 11,
    "phoneLengths": [
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Christmas Island",
    "code": "CX",
    "dial_code": "+61",
    "dialCode": "+61",
    "flag": "🇨🇽",
    "flagUrl": "https://flagcdn.com/w80/cx.png",
    "flag_url": "https://flagcdn.com/w80/cx.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      12
    ]
  },
  {
    "name": "Cocos (Keeling) Islands",
    "code": "CC",
    "dial_code": "+61",
    "dialCode": "+61",
    "flag": "🇨🇨",
    "flagUrl": "https://flagcdn.com/w80/cc.png",
    "flag_url": "https://flagcdn.com/w80/cc.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      12
    ]
  },
  {
    "name": "Colombia",
    "code": "CO",
    "dial_code": "+57",
    "dialCode": "+57",
    "flag": "🇨🇴",
    "flagUrl": "https://flagcdn.com/w80/co.png",
    "flag_url": "https://flagcdn.com/w80/co.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      10,
      11
    ]
  },
  {
    "name": "Comoros",
    "code": "KM",
    "dial_code": "+269",
    "dialCode": "+269",
    "flag": "🇰🇲",
    "flagUrl": "https://flagcdn.com/w80/km.png",
    "flag_url": "https://flagcdn.com/w80/km.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Congo",
    "code": "CG",
    "dial_code": "+242",
    "dialCode": "+242",
    "flag": "🇨🇬",
    "flagUrl": "https://flagcdn.com/w80/cg.png",
    "flag_url": "https://flagcdn.com/w80/cg.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Congo, The Democratic Republic of the Congo",
    "code": "CD",
    "dial_code": "+243",
    "dialCode": "+243",
    "flag": "🇨🇩",
    "flagUrl": "https://flagcdn.com/w80/cd.png",
    "flag_url": "https://flagcdn.com/w80/cd.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Cook Islands",
    "code": "CK",
    "dial_code": "+682",
    "dialCode": "+682",
    "flag": "🇨🇰",
    "flagUrl": "https://flagcdn.com/w80/ck.png",
    "flag_url": "https://flagcdn.com/w80/ck.png",
    "phoneLength": 5,
    "phoneLengths": [
      5
    ]
  },
  {
    "name": "Costa Rica",
    "code": "CR",
    "dial_code": "+506",
    "dialCode": "+506",
    "flag": "🇨🇷",
    "flagUrl": "https://flagcdn.com/w80/cr.png",
    "flag_url": "https://flagcdn.com/w80/cr.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      10
    ]
  },
  {
    "name": "Cote d'Ivoire",
    "code": "CI",
    "dial_code": "+225",
    "dialCode": "+225",
    "flag": "🇨🇮",
    "flagUrl": "https://flagcdn.com/w80/ci.png",
    "flag_url": "https://flagcdn.com/w80/ci.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Croatia",
    "code": "HR",
    "dial_code": "+385",
    "dialCode": "+385",
    "flag": "🇭🇷",
    "flagUrl": "https://flagcdn.com/w80/hr.png",
    "flag_url": "https://flagcdn.com/w80/hr.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9
    ]
  },
  {
    "name": "Cuba",
    "code": "CU",
    "dial_code": "+53",
    "dialCode": "+53",
    "flag": "🇨🇺",
    "flagUrl": "https://flagcdn.com/w80/cu.png",
    "flag_url": "https://flagcdn.com/w80/cu.png",
    "phoneLength": 8,
    "phoneLengths": [
      6,
      7,
      8,
      10
    ]
  },
  {
    "name": "Cyprus",
    "code": "CY",
    "dial_code": "+357",
    "dialCode": "+357",
    "flag": "🇨🇾",
    "flagUrl": "https://flagcdn.com/w80/cy.png",
    "flag_url": "https://flagcdn.com/w80/cy.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Czech Republic",
    "code": "CZ",
    "dial_code": "+420",
    "dialCode": "+420",
    "flag": "🇨🇿",
    "flagUrl": "https://flagcdn.com/w80/cz.png",
    "flag_url": "https://flagcdn.com/w80/cz.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Denmark",
    "code": "DK",
    "dial_code": "+45",
    "dialCode": "+45",
    "flag": "🇩🇰",
    "flagUrl": "https://flagcdn.com/w80/dk.png",
    "flag_url": "https://flagcdn.com/w80/dk.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Djibouti",
    "code": "DJ",
    "dial_code": "+253",
    "dialCode": "+253",
    "flag": "🇩🇯",
    "flagUrl": "https://flagcdn.com/w80/dj.png",
    "flag_url": "https://flagcdn.com/w80/dj.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Dominica",
    "code": "DM",
    "dial_code": "+1767",
    "dialCode": "+1767",
    "flag": "🇩🇲",
    "flagUrl": "https://flagcdn.com/w80/dm.png",
    "flag_url": "https://flagcdn.com/w80/dm.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Dominican Republic",
    "code": "DO",
    "dial_code": "+1849",
    "dialCode": "+1849",
    "flag": "🇩🇴",
    "flagUrl": "https://flagcdn.com/w80/do.png",
    "flag_url": "https://flagcdn.com/w80/do.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Ecuador",
    "code": "EC",
    "dial_code": "+593",
    "dialCode": "+593",
    "flag": "🇪🇨",
    "flagUrl": "https://flagcdn.com/w80/ec.png",
    "flag_url": "https://flagcdn.com/w80/ec.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Egypt",
    "code": "EG",
    "dial_code": "+20",
    "dialCode": "+20",
    "flag": "🇪🇬",
    "flagUrl": "https://flagcdn.com/w80/eg.png",
    "flag_url": "https://flagcdn.com/w80/eg.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "El Salvador",
    "code": "SV",
    "dial_code": "+503",
    "dialCode": "+503",
    "flag": "🇸🇻",
    "flagUrl": "https://flagcdn.com/w80/sv.png",
    "flag_url": "https://flagcdn.com/w80/sv.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      11
    ]
  },
  {
    "name": "Equatorial Guinea",
    "code": "GQ",
    "dial_code": "+240",
    "dialCode": "+240",
    "flag": "🇬🇶",
    "flagUrl": "https://flagcdn.com/w80/gq.png",
    "flag_url": "https://flagcdn.com/w80/gq.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Eritrea",
    "code": "ER",
    "dial_code": "+291",
    "dialCode": "+291",
    "flag": "🇪🇷",
    "flagUrl": "https://flagcdn.com/w80/er.png",
    "flag_url": "https://flagcdn.com/w80/er.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Estonia",
    "code": "EE",
    "dial_code": "+372",
    "dialCode": "+372",
    "flag": "🇪🇪",
    "flagUrl": "https://flagcdn.com/w80/ee.png",
    "flag_url": "https://flagcdn.com/w80/ee.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      10
    ]
  },
  {
    "name": "Eswatini",
    "code": "SZ",
    "dial_code": "+268",
    "dialCode": "+268",
    "flag": "🇸🇿",
    "flagUrl": "https://flagcdn.com/w80/sz.png",
    "flag_url": "https://flagcdn.com/w80/sz.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Ethiopia",
    "code": "ET",
    "dial_code": "+251",
    "dialCode": "+251",
    "flag": "🇪🇹",
    "flagUrl": "https://flagcdn.com/w80/et.png",
    "flag_url": "https://flagcdn.com/w80/et.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Falkland Islands (Malvinas)",
    "code": "FK",
    "dial_code": "+500",
    "dialCode": "+500",
    "flag": "🇫🇰",
    "flagUrl": "https://flagcdn.com/w80/fk.png",
    "flag_url": "https://flagcdn.com/w80/fk.png",
    "phoneLength": 5,
    "phoneLengths": [
      5
    ]
  },
  {
    "name": "Faroe Islands",
    "code": "FO",
    "dial_code": "+298",
    "dialCode": "+298",
    "flag": "🇫🇴",
    "flagUrl": "https://flagcdn.com/w80/fo.png",
    "flag_url": "https://flagcdn.com/w80/fo.png",
    "phoneLength": 6,
    "phoneLengths": [
      6
    ]
  },
  {
    "name": "Fiji",
    "code": "FJ",
    "dial_code": "+679",
    "dialCode": "+679",
    "flag": "🇫🇯",
    "flagUrl": "https://flagcdn.com/w80/fj.png",
    "flag_url": "https://flagcdn.com/w80/fj.png",
    "phoneLength": 7,
    "phoneLengths": [
      7,
      11
    ]
  },
  {
    "name": "Finland",
    "code": "FI",
    "dial_code": "+358",
    "dialCode": "+358",
    "flag": "🇫🇮",
    "flagUrl": "https://flagcdn.com/w80/fi.png",
    "flag_url": "https://flagcdn.com/w80/fi.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "France",
    "code": "FR",
    "dial_code": "+33",
    "dialCode": "+33",
    "flag": "🇫🇷",
    "flagUrl": "https://flagcdn.com/w80/fr.png",
    "flag_url": "https://flagcdn.com/w80/fr.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "French Guiana",
    "code": "GF",
    "dial_code": "+594",
    "dialCode": "+594",
    "flag": "🇬🇫",
    "flagUrl": "https://flagcdn.com/w80/gf.png",
    "flag_url": "https://flagcdn.com/w80/gf.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "French Polynesia",
    "code": "PF",
    "dial_code": "+689",
    "dialCode": "+689",
    "flag": "🇵🇫",
    "flagUrl": "https://flagcdn.com/w80/pf.png",
    "flag_url": "https://flagcdn.com/w80/pf.png",
    "phoneLength": 8,
    "phoneLengths": [
      6,
      8,
      9
    ]
  },
  {
    "name": "French Southern Territories",
    "code": "TF",
    "dial_code": "+262",
    "dialCode": "+262",
    "flag": "🇹🇫",
    "flagUrl": "https://flagcdn.com/w80/tf.png",
    "flag_url": "https://flagcdn.com/w80/tf.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Gabon",
    "code": "GA",
    "dial_code": "+241",
    "dialCode": "+241",
    "flag": "🇬🇦",
    "flagUrl": "https://flagcdn.com/w80/ga.png",
    "flag_url": "https://flagcdn.com/w80/ga.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Gambia",
    "code": "GM",
    "dial_code": "+220",
    "dialCode": "+220",
    "flag": "🇬🇲",
    "flagUrl": "https://flagcdn.com/w80/gm.png",
    "flag_url": "https://flagcdn.com/w80/gm.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Georgia",
    "code": "GE",
    "dial_code": "+995",
    "dialCode": "+995",
    "flag": "🇬🇪",
    "flagUrl": "https://flagcdn.com/w80/ge.png",
    "flag_url": "https://flagcdn.com/w80/ge.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Germany",
    "code": "DE",
    "dial_code": "+49",
    "dialCode": "+49",
    "flag": "🇩🇪",
    "flagUrl": "https://flagcdn.com/w80/de.png",
    "flag_url": "https://flagcdn.com/w80/de.png",
    "phoneLength": 11,
    "phoneLengths": [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15
    ]
  },
  {
    "name": "Ghana",
    "code": "GH",
    "dial_code": "+233",
    "dialCode": "+233",
    "flag": "🇬🇭",
    "flagUrl": "https://flagcdn.com/w80/gh.png",
    "flag_url": "https://flagcdn.com/w80/gh.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Gibraltar",
    "code": "GI",
    "dial_code": "+350",
    "dialCode": "+350",
    "flag": "🇬🇮",
    "flagUrl": "https://flagcdn.com/w80/gi.png",
    "flag_url": "https://flagcdn.com/w80/gi.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Greece",
    "code": "GR",
    "dial_code": "+30",
    "dialCode": "+30",
    "flag": "🇬🇷",
    "flagUrl": "https://flagcdn.com/w80/gr.png",
    "flag_url": "https://flagcdn.com/w80/gr.png",
    "phoneLength": 10,
    "phoneLengths": [
      10,
      11,
      12
    ]
  },
  {
    "name": "Greenland",
    "code": "GL",
    "dial_code": "+299",
    "dialCode": "+299",
    "flag": "🇬🇱",
    "flagUrl": "https://flagcdn.com/w80/gl.png",
    "flag_url": "https://flagcdn.com/w80/gl.png",
    "phoneLength": 6,
    "phoneLengths": [
      6
    ]
  },
  {
    "name": "Grenada",
    "code": "GD",
    "dial_code": "+1473",
    "dialCode": "+1473",
    "flag": "🇬🇩",
    "flagUrl": "https://flagcdn.com/w80/gd.png",
    "flag_url": "https://flagcdn.com/w80/gd.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Guadeloupe",
    "code": "GP",
    "dial_code": "+590",
    "dialCode": "+590",
    "flag": "🇬🇵",
    "flagUrl": "https://flagcdn.com/w80/gp.png",
    "flag_url": "https://flagcdn.com/w80/gp.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Guam",
    "code": "GU",
    "dial_code": "+1671",
    "dialCode": "+1671",
    "flag": "🇬🇺",
    "flagUrl": "https://flagcdn.com/w80/gu.png",
    "flag_url": "https://flagcdn.com/w80/gu.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Guatemala",
    "code": "GT",
    "dial_code": "+502",
    "dialCode": "+502",
    "flag": "🇬🇹",
    "flagUrl": "https://flagcdn.com/w80/gt.png",
    "flag_url": "https://flagcdn.com/w80/gt.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      11
    ]
  },
  {
    "name": "Guernsey",
    "code": "GG",
    "dial_code": "+44",
    "dialCode": "+44",
    "flag": "🇬🇬",
    "flagUrl": "https://flagcdn.com/w80/gg.png",
    "flag_url": "https://flagcdn.com/w80/gg.png",
    "phoneLength": 10,
    "phoneLengths": [
      7,
      9,
      10
    ]
  },
  {
    "name": "Guinea",
    "code": "GN",
    "dial_code": "+224",
    "dialCode": "+224",
    "flag": "🇬🇳",
    "flagUrl": "https://flagcdn.com/w80/gn.png",
    "flag_url": "https://flagcdn.com/w80/gn.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Guinea-Bissau",
    "code": "GW",
    "dial_code": "+245",
    "dialCode": "+245",
    "flag": "🇬🇼",
    "flagUrl": "https://flagcdn.com/w80/gw.png",
    "flag_url": "https://flagcdn.com/w80/gw.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      9
    ]
  },
  {
    "name": "Guyana",
    "code": "GY",
    "dial_code": "+592",
    "dialCode": "+592",
    "flag": "🇬🇾",
    "flagUrl": "https://flagcdn.com/w80/gy.png",
    "flag_url": "https://flagcdn.com/w80/gy.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Haiti",
    "code": "HT",
    "dial_code": "+509",
    "dialCode": "+509",
    "flag": "🇭🇹",
    "flagUrl": "https://flagcdn.com/w80/ht.png",
    "flag_url": "https://flagcdn.com/w80/ht.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Heard Island and Mcdonald Islands",
    "code": "HM",
    "dial_code": "+672",
    "dialCode": "+672",
    "flag": "🇭🇲",
    "flagUrl": "https://flagcdn.com/w80/hm.png",
    "flag_url": "https://flagcdn.com/w80/hm.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Holy See (Vatican City State)",
    "code": "VA",
    "dial_code": "+379",
    "dialCode": "+379",
    "flag": "🇻🇦",
    "flagUrl": "https://flagcdn.com/w80/va.png",
    "flag_url": "https://flagcdn.com/w80/va.png",
    "phoneLength": 10,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Honduras",
    "code": "HN",
    "dial_code": "+504",
    "dialCode": "+504",
    "flag": "🇭🇳",
    "flagUrl": "https://flagcdn.com/w80/hn.png",
    "flag_url": "https://flagcdn.com/w80/hn.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      11
    ]
  },
  {
    "name": "Hong Kong",
    "code": "HK",
    "dial_code": "+852",
    "dialCode": "+852",
    "flag": "🇭🇰",
    "flagUrl": "https://flagcdn.com/w80/hk.png",
    "flag_url": "https://flagcdn.com/w80/hk.png",
    "phoneLength": 8,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      11
    ]
  },
  {
    "name": "Hungary",
    "code": "HU",
    "dial_code": "+36",
    "dialCode": "+36",
    "flag": "🇭🇺",
    "flagUrl": "https://flagcdn.com/w80/hu.png",
    "flag_url": "https://flagcdn.com/w80/hu.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Iceland",
    "code": "IS",
    "dial_code": "+354",
    "dialCode": "+354",
    "flag": "🇮🇸",
    "flagUrl": "https://flagcdn.com/w80/is.png",
    "flag_url": "https://flagcdn.com/w80/is.png",
    "phoneLength": 7,
    "phoneLengths": [
      7,
      9
    ]
  },
  {
    "name": "India",
    "code": "IN",
    "dial_code": "+91",
    "dialCode": "+91",
    "flag": "🇮🇳",
    "flagUrl": "https://flagcdn.com/w80/in.png",
    "flag_url": "https://flagcdn.com/w80/in.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10,
      11,
      12,
      13
    ]
  },
  {
    "name": "Indonesia",
    "code": "ID",
    "dial_code": "+62",
    "dialCode": "+62",
    "flag": "🇮🇩",
    "flagUrl": "https://flagcdn.com/w80/id.png",
    "flag_url": "https://flagcdn.com/w80/id.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17
    ]
  },
  {
    "name": "Iran, Islamic Republic of Persian Gulf",
    "code": "IR",
    "dial_code": "+98",
    "dialCode": "+98",
    "flag": "🇮🇷",
    "flagUrl": "https://flagcdn.com/w80/ir.png",
    "flag_url": "https://flagcdn.com/w80/ir.png",
    "phoneLength": 10,
    "phoneLengths": [
      4,
      5,
      6,
      7,
      10
    ]
  },
  {
    "name": "Iraq",
    "code": "IQ",
    "dial_code": "+964",
    "dialCode": "+964",
    "flag": "🇮🇶",
    "flagUrl": "https://flagcdn.com/w80/iq.png",
    "flag_url": "https://flagcdn.com/w80/iq.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Ireland",
    "code": "IE",
    "dial_code": "+353",
    "dialCode": "+353",
    "flag": "🇮🇪",
    "flagUrl": "https://flagcdn.com/w80/ie.png",
    "flag_url": "https://flagcdn.com/w80/ie.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Isle of Man",
    "code": "IM",
    "dial_code": "+44",
    "dialCode": "+44",
    "flag": "🇮🇲",
    "flagUrl": "https://flagcdn.com/w80/im.png",
    "flag_url": "https://flagcdn.com/w80/im.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Israel",
    "code": "IL",
    "dial_code": "+972",
    "dialCode": "+972",
    "flag": "🇮🇱",
    "flagUrl": "https://flagcdn.com/w80/il.png",
    "flag_url": "https://flagcdn.com/w80/il.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Italy",
    "code": "IT",
    "dial_code": "+39",
    "dialCode": "+39",
    "flag": "🇮🇹",
    "flagUrl": "https://flagcdn.com/w80/it.png",
    "flag_url": "https://flagcdn.com/w80/it.png",
    "phoneLength": 10,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Jamaica",
    "code": "JM",
    "dial_code": "+1876",
    "dialCode": "+1876",
    "flag": "🇯🇲",
    "flagUrl": "https://flagcdn.com/w80/jm.png",
    "flag_url": "https://flagcdn.com/w80/jm.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Japan",
    "code": "JP",
    "dial_code": "+81",
    "dialCode": "+81",
    "flag": "🇯🇵",
    "flagUrl": "https://flagcdn.com/w80/jp.png",
    "flag_url": "https://flagcdn.com/w80/jp.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17
    ]
  },
  {
    "name": "Jersey",
    "code": "JE",
    "dial_code": "+44",
    "dialCode": "+44",
    "flag": "🇯🇪",
    "flagUrl": "https://flagcdn.com/w80/je.png",
    "flag_url": "https://flagcdn.com/w80/je.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Jordan",
    "code": "JO",
    "dial_code": "+962",
    "dialCode": "+962",
    "flag": "🇯🇴",
    "flagUrl": "https://flagcdn.com/w80/jo.png",
    "flag_url": "https://flagcdn.com/w80/jo.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Kazakhstan",
    "code": "KZ",
    "dial_code": "+7",
    "dialCode": "+7",
    "flag": "🇰🇿",
    "flagUrl": "https://flagcdn.com/w80/kz.png",
    "flag_url": "https://flagcdn.com/w80/kz.png",
    "phoneLength": 10,
    "phoneLengths": [
      10,
      14
    ]
  },
  {
    "name": "Kenya",
    "code": "KE",
    "dial_code": "+254",
    "dialCode": "+254",
    "flag": "🇰🇪",
    "flagUrl": "https://flagcdn.com/w80/ke.png",
    "flag_url": "https://flagcdn.com/w80/ke.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Kiribati",
    "code": "KI",
    "dial_code": "+686",
    "dialCode": "+686",
    "flag": "🇰🇮",
    "flagUrl": "https://flagcdn.com/w80/ki.png",
    "flag_url": "https://flagcdn.com/w80/ki.png",
    "phoneLength": 8,
    "phoneLengths": [
      5,
      8
    ]
  },
  {
    "name": "Korea, Democratic People's Republic of Korea",
    "code": "KP",
    "dial_code": "+850",
    "dialCode": "+850",
    "flag": "🇰🇵",
    "flagUrl": "https://flagcdn.com/w80/kp.png",
    "flag_url": "https://flagcdn.com/w80/kp.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      10
    ]
  },
  {
    "name": "Korea, Republic of South Korea",
    "code": "KR",
    "dial_code": "+82",
    "dialCode": "+82",
    "flag": "🇰🇷",
    "flagUrl": "https://flagcdn.com/w80/kr.png",
    "flag_url": "https://flagcdn.com/w80/kr.png",
    "phoneLength": 10,
    "phoneLengths": [
      5,
      6,
      8,
      9,
      10,
      11,
      12,
      13,
      14
    ]
  },
  {
    "name": "Kosovo",
    "code": "XK",
    "dial_code": "+383",
    "dialCode": "+383",
    "flag": "🇽🇰",
    "flagUrl": "https://flagcdn.com/w80/xk.png",
    "flag_url": "https://flagcdn.com/w80/xk.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Kuwait",
    "code": "KW",
    "dial_code": "+965",
    "dialCode": "+965",
    "flag": "🇰🇼",
    "flagUrl": "https://flagcdn.com/w80/kw.png",
    "flag_url": "https://flagcdn.com/w80/kw.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Kyrgyzstan",
    "code": "KG",
    "dial_code": "+996",
    "dialCode": "+996",
    "flag": "🇰🇬",
    "flagUrl": "https://flagcdn.com/w80/kg.png",
    "flag_url": "https://flagcdn.com/w80/kg.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      10
    ]
  },
  {
    "name": "Laos",
    "code": "LA",
    "dial_code": "+856",
    "dialCode": "+856",
    "flag": "🇱🇦",
    "flagUrl": "https://flagcdn.com/w80/la.png",
    "flag_url": "https://flagcdn.com/w80/la.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Latvia",
    "code": "LV",
    "dial_code": "+371",
    "dialCode": "+371",
    "flag": "🇱🇻",
    "flagUrl": "https://flagcdn.com/w80/lv.png",
    "flag_url": "https://flagcdn.com/w80/lv.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Lebanon",
    "code": "LB",
    "dial_code": "+961",
    "dialCode": "+961",
    "flag": "🇱🇧",
    "flagUrl": "https://flagcdn.com/w80/lb.png",
    "flag_url": "https://flagcdn.com/w80/lb.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Lesotho",
    "code": "LS",
    "dial_code": "+266",
    "dialCode": "+266",
    "flag": "🇱🇸",
    "flagUrl": "https://flagcdn.com/w80/ls.png",
    "flag_url": "https://flagcdn.com/w80/ls.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Liberia",
    "code": "LR",
    "dial_code": "+231",
    "dialCode": "+231",
    "flag": "🇱🇷",
    "flagUrl": "https://flagcdn.com/w80/lr.png",
    "flag_url": "https://flagcdn.com/w80/lr.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9
    ]
  },
  {
    "name": "Libyan Arab Jamahiriya",
    "code": "LY",
    "dial_code": "+218",
    "dialCode": "+218",
    "flag": "🇱🇾",
    "flagUrl": "https://flagcdn.com/w80/ly.png",
    "flag_url": "https://flagcdn.com/w80/ly.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Liechtenstein",
    "code": "LI",
    "dial_code": "+423",
    "dialCode": "+423",
    "flag": "🇱🇮",
    "flagUrl": "https://flagcdn.com/w80/li.png",
    "flag_url": "https://flagcdn.com/w80/li.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      9
    ]
  },
  {
    "name": "Lithuania",
    "code": "LT",
    "dial_code": "+370",
    "dialCode": "+370",
    "flag": "🇱🇹",
    "flagUrl": "https://flagcdn.com/w80/lt.png",
    "flag_url": "https://flagcdn.com/w80/lt.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Luxembourg",
    "code": "LU",
    "dial_code": "+352",
    "dialCode": "+352",
    "flag": "🇱🇺",
    "flagUrl": "https://flagcdn.com/w80/lu.png",
    "flag_url": "https://flagcdn.com/w80/lu.png",
    "phoneLength": 9,
    "phoneLengths": [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Macao",
    "code": "MO",
    "dial_code": "+853",
    "dialCode": "+853",
    "flag": "🇲🇴",
    "flagUrl": "https://flagcdn.com/w80/mo.png",
    "flag_url": "https://flagcdn.com/w80/mo.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Macedonia",
    "code": "MK",
    "dial_code": "+389",
    "dialCode": "+389",
    "flag": "🇲🇰",
    "flagUrl": "https://flagcdn.com/w80/mk.png",
    "flag_url": "https://flagcdn.com/w80/mk.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Madagascar",
    "code": "MG",
    "dial_code": "+261",
    "dialCode": "+261",
    "flag": "🇲🇬",
    "flagUrl": "https://flagcdn.com/w80/mg.png",
    "flag_url": "https://flagcdn.com/w80/mg.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Malawi",
    "code": "MW",
    "dial_code": "+265",
    "dialCode": "+265",
    "flag": "🇲🇼",
    "flagUrl": "https://flagcdn.com/w80/mw.png",
    "flag_url": "https://flagcdn.com/w80/mw.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      9
    ]
  },
  {
    "name": "Malaysia",
    "code": "MY",
    "dial_code": "+60",
    "dialCode": "+60",
    "flag": "🇲🇾",
    "flagUrl": "https://flagcdn.com/w80/my.png",
    "flag_url": "https://flagcdn.com/w80/my.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Maldives",
    "code": "MV",
    "dial_code": "+960",
    "dialCode": "+960",
    "flag": "🇲🇻",
    "flagUrl": "https://flagcdn.com/w80/mv.png",
    "flag_url": "https://flagcdn.com/w80/mv.png",
    "phoneLength": 7,
    "phoneLengths": [
      7,
      10
    ]
  },
  {
    "name": "Mali",
    "code": "ML",
    "dial_code": "+223",
    "dialCode": "+223",
    "flag": "🇲🇱",
    "flagUrl": "https://flagcdn.com/w80/ml.png",
    "flag_url": "https://flagcdn.com/w80/ml.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Malta",
    "code": "MT",
    "dial_code": "+356",
    "dialCode": "+356",
    "flag": "🇲🇹",
    "flagUrl": "https://flagcdn.com/w80/mt.png",
    "flag_url": "https://flagcdn.com/w80/mt.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Marshall Islands",
    "code": "MH",
    "dial_code": "+692",
    "dialCode": "+692",
    "flag": "🇲🇭",
    "flagUrl": "https://flagcdn.com/w80/mh.png",
    "flag_url": "https://flagcdn.com/w80/mh.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Martinique",
    "code": "MQ",
    "dial_code": "+596",
    "dialCode": "+596",
    "flag": "🇲🇶",
    "flagUrl": "https://flagcdn.com/w80/mq.png",
    "flag_url": "https://flagcdn.com/w80/mq.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Mauritania",
    "code": "MR",
    "dial_code": "+222",
    "dialCode": "+222",
    "flag": "🇲🇷",
    "flagUrl": "https://flagcdn.com/w80/mr.png",
    "flag_url": "https://flagcdn.com/w80/mr.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Mauritius",
    "code": "MU",
    "dial_code": "+230",
    "dialCode": "+230",
    "flag": "🇲🇺",
    "flagUrl": "https://flagcdn.com/w80/mu.png",
    "flag_url": "https://flagcdn.com/w80/mu.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      10
    ]
  },
  {
    "name": "Mayotte",
    "code": "YT",
    "dial_code": "+262",
    "dialCode": "+262",
    "flag": "🇾🇹",
    "flagUrl": "https://flagcdn.com/w80/yt.png",
    "flag_url": "https://flagcdn.com/w80/yt.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Mexico",
    "code": "MX",
    "dial_code": "+52",
    "dialCode": "+52",
    "flag": "🇲🇽",
    "flagUrl": "https://flagcdn.com/w80/mx.png",
    "flag_url": "https://flagcdn.com/w80/mx.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Micronesia, Federated States of Micronesia",
    "code": "FM",
    "dial_code": "+691",
    "dialCode": "+691",
    "flag": "🇫🇲",
    "flagUrl": "https://flagcdn.com/w80/fm.png",
    "flag_url": "https://flagcdn.com/w80/fm.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Moldova",
    "code": "MD",
    "dial_code": "+373",
    "dialCode": "+373",
    "flag": "🇲🇩",
    "flagUrl": "https://flagcdn.com/w80/md.png",
    "flag_url": "https://flagcdn.com/w80/md.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Monaco",
    "code": "MC",
    "dial_code": "+377",
    "dialCode": "+377",
    "flag": "🇲🇨",
    "flagUrl": "https://flagcdn.com/w80/mc.png",
    "flag_url": "https://flagcdn.com/w80/mc.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Mongolia",
    "code": "MN",
    "dial_code": "+976",
    "dialCode": "+976",
    "flag": "🇲🇳",
    "flagUrl": "https://flagcdn.com/w80/mn.png",
    "flag_url": "https://flagcdn.com/w80/mn.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Montenegro",
    "code": "ME",
    "dial_code": "+382",
    "dialCode": "+382",
    "flag": "🇲🇪",
    "flagUrl": "https://flagcdn.com/w80/me.png",
    "flag_url": "https://flagcdn.com/w80/me.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Montserrat",
    "code": "MS",
    "dial_code": "+1664",
    "dialCode": "+1664",
    "flag": "🇲🇸",
    "flagUrl": "https://flagcdn.com/w80/ms.png",
    "flag_url": "https://flagcdn.com/w80/ms.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Morocco",
    "code": "MA",
    "dial_code": "+212",
    "dialCode": "+212",
    "flag": "🇲🇦",
    "flagUrl": "https://flagcdn.com/w80/ma.png",
    "flag_url": "https://flagcdn.com/w80/ma.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Mozambique",
    "code": "MZ",
    "dial_code": "+258",
    "dialCode": "+258",
    "flag": "🇲🇿",
    "flagUrl": "https://flagcdn.com/w80/mz.png",
    "flag_url": "https://flagcdn.com/w80/mz.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Myanmar",
    "code": "MM",
    "dial_code": "+95",
    "dialCode": "+95",
    "flag": "🇲🇲",
    "flagUrl": "https://flagcdn.com/w80/mm.png",
    "flag_url": "https://flagcdn.com/w80/mm.png",
    "phoneLength": 8,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Namibia",
    "code": "NA",
    "dial_code": "+264",
    "dialCode": "+264",
    "flag": "🇳🇦",
    "flagUrl": "https://flagcdn.com/w80/na.png",
    "flag_url": "https://flagcdn.com/w80/na.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Nauru",
    "code": "NR",
    "dial_code": "+674",
    "dialCode": "+674",
    "flag": "🇳🇷",
    "flagUrl": "https://flagcdn.com/w80/nr.png",
    "flag_url": "https://flagcdn.com/w80/nr.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Nepal",
    "code": "NP",
    "dial_code": "+977",
    "dialCode": "+977",
    "flag": "🇳🇵",
    "flagUrl": "https://flagcdn.com/w80/np.png",
    "flag_url": "https://flagcdn.com/w80/np.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      10,
      11
    ]
  },
  {
    "name": "Netherlands",
    "code": "NL",
    "dial_code": "+31",
    "dialCode": "+31",
    "flag": "🇳🇱",
    "flagUrl": "https://flagcdn.com/w80/nl.png",
    "flag_url": "https://flagcdn.com/w80/nl.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Netherlands Antilles",
    "code": "AN",
    "dial_code": "+599",
    "dialCode": "+599",
    "flag": "",
    "flagUrl": "https://flagcdn.com/w80/an.png",
    "flag_url": "https://flagcdn.com/w80/an.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "New Caledonia",
    "code": "NC",
    "dial_code": "+687",
    "dialCode": "+687",
    "flag": "🇳🇨",
    "flagUrl": "https://flagcdn.com/w80/nc.png",
    "flag_url": "https://flagcdn.com/w80/nc.png",
    "phoneLength": 6,
    "phoneLengths": [
      6
    ]
  },
  {
    "name": "New Zealand",
    "code": "NZ",
    "dial_code": "+64",
    "dialCode": "+64",
    "flag": "🇳🇿",
    "flagUrl": "https://flagcdn.com/w80/nz.png",
    "flag_url": "https://flagcdn.com/w80/nz.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Nicaragua",
    "code": "NI",
    "dial_code": "+505",
    "dialCode": "+505",
    "flag": "🇳🇮",
    "flagUrl": "https://flagcdn.com/w80/ni.png",
    "flag_url": "https://flagcdn.com/w80/ni.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Niger",
    "code": "NE",
    "dial_code": "+227",
    "dialCode": "+227",
    "flag": "🇳🇪",
    "flagUrl": "https://flagcdn.com/w80/ne.png",
    "flag_url": "https://flagcdn.com/w80/ne.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Nigeria",
    "code": "NG",
    "dial_code": "+234",
    "dialCode": "+234",
    "flag": "🇳🇬",
    "flagUrl": "https://flagcdn.com/w80/ng.png",
    "flag_url": "https://flagcdn.com/w80/ng.png",
    "phoneLength": 10,
    "phoneLengths": [
      10,
      11,
      12,
      13,
      14
    ]
  },
  {
    "name": "Niue",
    "code": "NU",
    "dial_code": "+683",
    "dialCode": "+683",
    "flag": "🇳🇺",
    "flagUrl": "https://flagcdn.com/w80/nu.png",
    "flag_url": "https://flagcdn.com/w80/nu.png",
    "phoneLength": 7,
    "phoneLengths": [
      4,
      7
    ]
  },
  {
    "name": "Norfolk Island",
    "code": "NF",
    "dial_code": "+672",
    "dialCode": "+672",
    "flag": "🇳🇫",
    "flagUrl": "https://flagcdn.com/w80/nf.png",
    "flag_url": "https://flagcdn.com/w80/nf.png",
    "phoneLength": 6,
    "phoneLengths": [
      6
    ]
  },
  {
    "name": "Northern Mariana Islands",
    "code": "MP",
    "dial_code": "+1670",
    "dialCode": "+1670",
    "flag": "🇲🇵",
    "flagUrl": "https://flagcdn.com/w80/mp.png",
    "flag_url": "https://flagcdn.com/w80/mp.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Norway",
    "code": "NO",
    "dial_code": "+47",
    "dialCode": "+47",
    "flag": "🇳🇴",
    "flagUrl": "https://flagcdn.com/w80/no.png",
    "flag_url": "https://flagcdn.com/w80/no.png",
    "phoneLength": 8,
    "phoneLengths": [
      5,
      8
    ]
  },
  {
    "name": "Oman",
    "code": "OM",
    "dial_code": "+968",
    "dialCode": "+968",
    "flag": "🇴🇲",
    "flagUrl": "https://flagcdn.com/w80/om.png",
    "flag_url": "https://flagcdn.com/w80/om.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      9
    ]
  },
  {
    "name": "Pakistan",
    "code": "PK",
    "dial_code": "+92",
    "dialCode": "+92",
    "flag": "🇵🇰",
    "flagUrl": "https://flagcdn.com/w80/pk.png",
    "flag_url": "https://flagcdn.com/w80/pk.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Palau",
    "code": "PW",
    "dial_code": "+680",
    "dialCode": "+680",
    "flag": "🇵🇼",
    "flagUrl": "https://flagcdn.com/w80/pw.png",
    "flag_url": "https://flagcdn.com/w80/pw.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Palestinian Territory, Occupied",
    "code": "PS",
    "dial_code": "+970",
    "dialCode": "+970",
    "flag": "🇵🇸",
    "flagUrl": "https://flagcdn.com/w80/ps.png",
    "flag_url": "https://flagcdn.com/w80/ps.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Panama",
    "code": "PA",
    "dial_code": "+507",
    "dialCode": "+507",
    "flag": "🇵🇦",
    "flagUrl": "https://flagcdn.com/w80/pa.png",
    "flag_url": "https://flagcdn.com/w80/pa.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      10,
      11
    ]
  },
  {
    "name": "Papua New Guinea",
    "code": "PG",
    "dial_code": "+675",
    "dialCode": "+675",
    "flag": "🇵🇬",
    "flagUrl": "https://flagcdn.com/w80/pg.png",
    "flag_url": "https://flagcdn.com/w80/pg.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Paraguay",
    "code": "PY",
    "dial_code": "+595",
    "dialCode": "+595",
    "flag": "🇵🇾",
    "flagUrl": "https://flagcdn.com/w80/py.png",
    "flag_url": "https://flagcdn.com/w80/py.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Peru",
    "code": "PE",
    "dial_code": "+51",
    "dialCode": "+51",
    "flag": "🇵🇪",
    "flagUrl": "https://flagcdn.com/w80/pe.png",
    "flag_url": "https://flagcdn.com/w80/pe.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Philippines",
    "code": "PH",
    "dial_code": "+63",
    "dialCode": "+63",
    "flag": "🇵🇭",
    "flagUrl": "https://flagcdn.com/w80/ph.png",
    "flag_url": "https://flagcdn.com/w80/ph.png",
    "phoneLength": 10,
    "phoneLengths": [
      6,
      8,
      9,
      10,
      11,
      12,
      13
    ]
  },
  {
    "name": "Pitcairn",
    "code": "PN",
    "dial_code": "+64",
    "dialCode": "+64",
    "flag": "🇵🇳",
    "flagUrl": "https://flagcdn.com/w80/pn.png",
    "flag_url": "https://flagcdn.com/w80/pn.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Poland",
    "code": "PL",
    "dial_code": "+48",
    "dialCode": "+48",
    "flag": "🇵🇱",
    "flagUrl": "https://flagcdn.com/w80/pl.png",
    "flag_url": "https://flagcdn.com/w80/pl.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Portugal",
    "code": "PT",
    "dial_code": "+351",
    "dialCode": "+351",
    "flag": "🇵🇹",
    "flagUrl": "https://flagcdn.com/w80/pt.png",
    "flag_url": "https://flagcdn.com/w80/pt.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Puerto Rico",
    "code": "PR",
    "dial_code": "+1939",
    "dialCode": "+1939",
    "flag": "🇵🇷",
    "flagUrl": "https://flagcdn.com/w80/pr.png",
    "flag_url": "https://flagcdn.com/w80/pr.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Qatar",
    "code": "QA",
    "dial_code": "+974",
    "dialCode": "+974",
    "flag": "🇶🇦",
    "flagUrl": "https://flagcdn.com/w80/qa.png",
    "flag_url": "https://flagcdn.com/w80/qa.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      9,
      11
    ]
  },
  {
    "name": "Reunion",
    "code": "RE",
    "dial_code": "+262",
    "dialCode": "+262",
    "flag": "🇷🇪",
    "flagUrl": "https://flagcdn.com/w80/re.png",
    "flag_url": "https://flagcdn.com/w80/re.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Romania",
    "code": "RO",
    "dial_code": "+40",
    "dialCode": "+40",
    "flag": "🇷🇴",
    "flagUrl": "https://flagcdn.com/w80/ro.png",
    "flag_url": "https://flagcdn.com/w80/ro.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      9
    ]
  },
  {
    "name": "Russia",
    "code": "RU",
    "dial_code": "+7",
    "dialCode": "+7",
    "flag": "🇷����",
    "flagUrl": "https://flagcdn.com/w80/ru.png",
    "flag_url": "https://flagcdn.com/w80/ru.png",
    "phoneLength": 10,
    "phoneLengths": [
      10,
      14
    ]
  },
  {
    "name": "Rwanda",
    "code": "RW",
    "dial_code": "+250",
    "dialCode": "+250",
    "flag": "🇷🇼",
    "flagUrl": "https://flagcdn.com/w80/rw.png",
    "flag_url": "https://flagcdn.com/w80/rw.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Saint Barthelemy",
    "code": "BL",
    "dial_code": "+590",
    "dialCode": "+590",
    "flag": "🇧🇱",
    "flagUrl": "https://flagcdn.com/w80/bl.png",
    "flag_url": "https://flagcdn.com/w80/bl.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Saint Helena, Ascension and Tristan Da Cunha",
    "code": "SH",
    "dial_code": "+290",
    "dialCode": "+290",
    "flag": "🇸🇭",
    "flagUrl": "https://flagcdn.com/w80/sh.png",
    "flag_url": "https://flagcdn.com/w80/sh.png",
    "phoneLength": 5,
    "phoneLengths": [
      4,
      5
    ]
  },
  {
    "name": "Saint Kitts and Nevis",
    "code": "KN",
    "dial_code": "+1869",
    "dialCode": "+1869",
    "flag": "🇰🇳",
    "flagUrl": "https://flagcdn.com/w80/kn.png",
    "flag_url": "https://flagcdn.com/w80/kn.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Saint Lucia",
    "code": "LC",
    "dial_code": "+1758",
    "dialCode": "+1758",
    "flag": "🇱🇨",
    "flagUrl": "https://flagcdn.com/w80/lc.png",
    "flag_url": "https://flagcdn.com/w80/lc.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Saint Martin",
    "code": "MF",
    "dial_code": "+590",
    "dialCode": "+590",
    "flag": "🇲🇫",
    "flagUrl": "https://flagcdn.com/w80/mf.png",
    "flag_url": "https://flagcdn.com/w80/mf.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Saint Pierre and Miquelon",
    "code": "PM",
    "dial_code": "+508",
    "dialCode": "+508",
    "flag": "🇵🇲",
    "flagUrl": "https://flagcdn.com/w80/pm.png",
    "flag_url": "https://flagcdn.com/w80/pm.png",
    "phoneLength": 6,
    "phoneLengths": [
      6,
      9
    ]
  },
  {
    "name": "Saint Vincent and the Grenadines",
    "code": "VC",
    "dial_code": "+1784",
    "dialCode": "+1784",
    "flag": "🇻🇨",
    "flagUrl": "https://flagcdn.com/w80/vc.png",
    "flag_url": "https://flagcdn.com/w80/vc.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Samoa",
    "code": "WS",
    "dial_code": "+685",
    "dialCode": "+685",
    "flag": "🇼🇸",
    "flagUrl": "https://flagcdn.com/w80/ws.png",
    "flag_url": "https://flagcdn.com/w80/ws.png",
    "phoneLength": 7,
    "phoneLengths": [
      5,
      6,
      7,
      10
    ]
  },
  {
    "name": "San Marino",
    "code": "SM",
    "dial_code": "+378",
    "dialCode": "+378",
    "flag": "🇸🇲",
    "flagUrl": "https://flagcdn.com/w80/sm.png",
    "flag_url": "https://flagcdn.com/w80/sm.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      10
    ]
  },
  {
    "name": "Sao Tome and Principe",
    "code": "ST",
    "dial_code": "+239",
    "dialCode": "+239",
    "flag": "🇸🇹",
    "flagUrl": "https://flagcdn.com/w80/st.png",
    "flag_url": "https://flagcdn.com/w80/st.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Saudi Arabia",
    "code": "SA",
    "dial_code": "+966",
    "dialCode": "+966",
    "flag": "🇸🇦",
    "flagUrl": "https://flagcdn.com/w80/sa.png",
    "flag_url": "https://flagcdn.com/w80/sa.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      10
    ]
  },
  {
    "name": "Senegal",
    "code": "SN",
    "dial_code": "+221",
    "dialCode": "+221",
    "flag": "🇸🇳",
    "flagUrl": "https://flagcdn.com/w80/sn.png",
    "flag_url": "https://flagcdn.com/w80/sn.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Serbia",
    "code": "RS",
    "dial_code": "+381",
    "dialCode": "+381",
    "flag": "🇷🇸",
    "flagUrl": "https://flagcdn.com/w80/rs.png",
    "flag_url": "https://flagcdn.com/w80/rs.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Seychelles",
    "code": "SC",
    "dial_code": "+248",
    "dialCode": "+248",
    "flag": "🇸🇨",
    "flagUrl": "https://flagcdn.com/w80/sc.png",
    "flag_url": "https://flagcdn.com/w80/sc.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Sierra Leone",
    "code": "SL",
    "dial_code": "+232",
    "dialCode": "+232",
    "flag": "🇸🇱",
    "flagUrl": "https://flagcdn.com/w80/sl.png",
    "flag_url": "https://flagcdn.com/w80/sl.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Singapore",
    "code": "SG",
    "dial_code": "+65",
    "dialCode": "+65",
    "flag": "🇸🇬",
    "flagUrl": "https://flagcdn.com/w80/sg.png",
    "flag_url": "https://flagcdn.com/w80/sg.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      10,
      11
    ]
  },
  {
    "name": "Slovakia",
    "code": "SK",
    "dial_code": "+421",
    "dialCode": "+421",
    "flag": "🇸🇰",
    "flagUrl": "https://flagcdn.com/w80/sk.png",
    "flag_url": "https://flagcdn.com/w80/sk.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      9
    ]
  },
  {
    "name": "Slovenia",
    "code": "SI",
    "dial_code": "+386",
    "dialCode": "+386",
    "flag": "🇸🇮",
    "flagUrl": "https://flagcdn.com/w80/si.png",
    "flag_url": "https://flagcdn.com/w80/si.png",
    "phoneLength": 8,
    "phoneLengths": [
      5,
      6,
      7,
      8
    ]
  },
  {
    "name": "Solomon Islands",
    "code": "SB",
    "dial_code": "+677",
    "dialCode": "+677",
    "flag": "🇸🇧",
    "flagUrl": "https://flagcdn.com/w80/sb.png",
    "flag_url": "https://flagcdn.com/w80/sb.png",
    "phoneLength": 7,
    "phoneLengths": [
      5,
      7
    ]
  },
  {
    "name": "Somalia",
    "code": "SO",
    "dial_code": "+252",
    "dialCode": "+252",
    "flag": "🇸🇴",
    "flagUrl": "https://flagcdn.com/w80/so.png",
    "flag_url": "https://flagcdn.com/w80/so.png",
    "phoneLength": 8,
    "phoneLengths": [
      6,
      7,
      8,
      9
    ]
  },
  {
    "name": "South Africa",
    "code": "ZA",
    "dial_code": "+27",
    "dialCode": "+27",
    "flag": "🇿🇦",
    "flagUrl": "https://flagcdn.com/w80/za.png",
    "flag_url": "https://flagcdn.com/w80/za.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "South Georgia and the South Sandwich Islands",
    "code": "GS",
    "dial_code": "+500",
    "dialCode": "+500",
    "flag": "🇬🇸",
    "flagUrl": "https://flagcdn.com/w80/gs.png",
    "flag_url": "https://flagcdn.com/w80/gs.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "South Sudan",
    "code": "SS",
    "dial_code": "+211",
    "dialCode": "+211",
    "flag": "🇸🇸",
    "flagUrl": "https://flagcdn.com/w80/ss.png",
    "flag_url": "https://flagcdn.com/w80/ss.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Spain",
    "code": "ES",
    "dial_code": "+34",
    "dialCode": "+34",
    "flag": "🇪🇸",
    "flagUrl": "https://flagcdn.com/w80/es.png",
    "flag_url": "https://flagcdn.com/w80/es.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Sri Lanka",
    "code": "LK",
    "dial_code": "+94",
    "dialCode": "+94",
    "flag": "🇱🇰",
    "flagUrl": "https://flagcdn.com/w80/lk.png",
    "flag_url": "https://flagcdn.com/w80/lk.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Sudan",
    "code": "SD",
    "dial_code": "+249",
    "dialCode": "+249",
    "flag": "🇸🇩",
    "flagUrl": "https://flagcdn.com/w80/sd.png",
    "flag_url": "https://flagcdn.com/w80/sd.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Suriname",
    "code": "SR",
    "dial_code": "+597",
    "dialCode": "+597",
    "flag": "🇸🇷",
    "flagUrl": "https://flagcdn.com/w80/sr.png",
    "flag_url": "https://flagcdn.com/w80/sr.png",
    "phoneLength": 7,
    "phoneLengths": [
      6,
      7
    ]
  },
  {
    "name": "Svalbard and Jan Mayen",
    "code": "SJ",
    "dial_code": "+47",
    "dialCode": "+47",
    "flag": "🇸🇯",
    "flagUrl": "https://flagcdn.com/w80/sj.png",
    "flag_url": "https://flagcdn.com/w80/sj.png",
    "phoneLength": 8,
    "phoneLengths": [
      5,
      8
    ]
  },
  {
    "name": "Sweden",
    "code": "SE",
    "dial_code": "+46",
    "dialCode": "+46",
    "flag": "🇸🇪",
    "flagUrl": "https://flagcdn.com/w80/se.png",
    "flag_url": "https://flagcdn.com/w80/se.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      12
    ]
  },
  {
    "name": "Switzerland",
    "code": "CH",
    "dial_code": "+41",
    "dialCode": "+41",
    "flag": "🇨🇭",
    "flagUrl": "https://flagcdn.com/w80/ch.png",
    "flag_url": "https://flagcdn.com/w80/ch.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      12
    ]
  },
  {
    "name": "Syrian Arab Republic",
    "code": "SY",
    "dial_code": "+963",
    "dialCode": "+963",
    "flag": "🇸🇾",
    "flagUrl": "https://flagcdn.com/w80/sy.png",
    "flag_url": "https://flagcdn.com/w80/sy.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Taiwan",
    "code": "TW",
    "dial_code": "+886",
    "dialCode": "+886",
    "flag": "🇹🇼",
    "flagUrl": "https://flagcdn.com/w80/tw.png",
    "flag_url": "https://flagcdn.com/w80/tw.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Tajikistan",
    "code": "TJ",
    "dial_code": "+992",
    "dialCode": "+992",
    "flag": "🇹🇯",
    "flagUrl": "https://flagcdn.com/w80/tj.png",
    "flag_url": "https://flagcdn.com/w80/tj.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Tanzania, United Republic of Tanzania",
    "code": "TZ",
    "dial_code": "+255",
    "dialCode": "+255",
    "flag": "🇹🇿",
    "flagUrl": "https://flagcdn.com/w80/tz.png",
    "flag_url": "https://flagcdn.com/w80/tz.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Thailand",
    "code": "TH",
    "dial_code": "+66",
    "dialCode": "+66",
    "flag": "🇹🇭",
    "flagUrl": "https://flagcdn.com/w80/th.png",
    "flag_url": "https://flagcdn.com/w80/th.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9,
      10,
      13
    ]
  },
  {
    "name": "Timor-Leste",
    "code": "TL",
    "dial_code": "+670",
    "dialCode": "+670",
    "flag": "🇹🇱",
    "flagUrl": "https://flagcdn.com/w80/tl.png",
    "flag_url": "https://flagcdn.com/w80/tl.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Togo",
    "code": "TG",
    "dial_code": "+228",
    "dialCode": "+228",
    "flag": "🇹🇬",
    "flagUrl": "https://flagcdn.com/w80/tg.png",
    "flag_url": "https://flagcdn.com/w80/tg.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Tokelau",
    "code": "TK",
    "dial_code": "+690",
    "dialCode": "+690",
    "flag": "🇹🇰",
    "flagUrl": "https://flagcdn.com/w80/tk.png",
    "flag_url": "https://flagcdn.com/w80/tk.png",
    "phoneLength": 4,
    "phoneLengths": [
      4,
      5,
      6,
      7
    ]
  },
  {
    "name": "Tonga",
    "code": "TO",
    "dial_code": "+676",
    "dialCode": "+676",
    "flag": "🇹🇴",
    "flagUrl": "https://flagcdn.com/w80/to.png",
    "flag_url": "https://flagcdn.com/w80/to.png",
    "phoneLength": 7,
    "phoneLengths": [
      5,
      7
    ]
  },
  {
    "name": "Trinidad and Tobago",
    "code": "TT",
    "dial_code": "+1868",
    "dialCode": "+1868",
    "flag": "🇹🇹",
    "flagUrl": "https://flagcdn.com/w80/tt.png",
    "flag_url": "https://flagcdn.com/w80/tt.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Tunisia",
    "code": "TN",
    "dial_code": "+216",
    "dialCode": "+216",
    "flag": "🇹🇳",
    "flagUrl": "https://flagcdn.com/w80/tn.png",
    "flag_url": "https://flagcdn.com/w80/tn.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Turkey",
    "code": "TR",
    "dial_code": "+90",
    "dialCode": "+90",
    "flag": "🇹🇷",
    "flagUrl": "https://flagcdn.com/w80/tr.png",
    "flag_url": "https://flagcdn.com/w80/tr.png",
    "phoneLength": 10,
    "phoneLengths": [
      7,
      10,
      12,
      13
    ]
  },
  {
    "name": "Turkmenistan",
    "code": "TM",
    "dial_code": "+993",
    "dialCode": "+993",
    "flag": "🇹🇲",
    "flagUrl": "https://flagcdn.com/w80/tm.png",
    "flag_url": "https://flagcdn.com/w80/tm.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Turks and Caicos Islands",
    "code": "TC",
    "dial_code": "+1649",
    "dialCode": "+1649",
    "flag": "🇹🇨",
    "flagUrl": "https://flagcdn.com/w80/tc.png",
    "flag_url": "https://flagcdn.com/w80/tc.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Tuvalu",
    "code": "TV",
    "dial_code": "+688",
    "dialCode": "+688",
    "flag": "🇹🇻",
    "flagUrl": "https://flagcdn.com/w80/tv.png",
    "flag_url": "https://flagcdn.com/w80/tv.png",
    "phoneLength": 6,
    "phoneLengths": [
      5,
      6,
      7
    ]
  },
  {
    "name": "Uganda",
    "code": "UG",
    "dial_code": "+256",
    "dialCode": "+256",
    "flag": "🇺🇬",
    "flagUrl": "https://flagcdn.com/w80/ug.png",
    "flag_url": "https://flagcdn.com/w80/ug.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Ukraine",
    "code": "UA",
    "dial_code": "+380",
    "dialCode": "+380",
    "flag": "🇺🇦",
    "flagUrl": "https://flagcdn.com/w80/ua.png",
    "flag_url": "https://flagcdn.com/w80/ua.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      10
    ]
  },
  {
    "name": "United Arab Emirates",
    "code": "AE",
    "dial_code": "+971",
    "dialCode": "+971",
    "flag": "🇦🇪",
    "flagUrl": "https://flagcdn.com/w80/ae.png",
    "flag_url": "https://flagcdn.com/w80/ae.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "United Kingdom",
    "code": "GB",
    "dial_code": "+44",
    "dialCode": "+44",
    "flag": "🇬🇧",
    "flagUrl": "https://flagcdn.com/w80/gb.png",
    "flag_url": "https://flagcdn.com/w80/gb.png",
    "phoneLength": 10,
    "phoneLengths": [
      7,
      9,
      10
    ]
  },
  {
    "name": "United States",
    "code": "US",
    "dial_code": "+1",
    "dialCode": "+1",
    "flag": "🇺🇸",
    "flagUrl": "https://flagcdn.com/w80/us.png",
    "flag_url": "https://flagcdn.com/w80/us.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Uruguay",
    "code": "UY",
    "dial_code": "+598",
    "dialCode": "+598",
    "flag": "🇺🇾",
    "flagUrl": "https://flagcdn.com/w80/uy.png",
    "flag_url": "https://flagcdn.com/w80/uy.png",
    "phoneLength": 8,
    "phoneLengths": [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13
    ]
  },
  {
    "name": "Uzbekistan",
    "code": "UZ",
    "dial_code": "+998",
    "dialCode": "+998",
    "flag": "🇺🇿",
    "flagUrl": "https://flagcdn.com/w80/uz.png",
    "flag_url": "https://flagcdn.com/w80/uz.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Vanuatu",
    "code": "VU",
    "dial_code": "+678",
    "dialCode": "+678",
    "flag": "🇻🇺",
    "flagUrl": "https://flagcdn.com/w80/vu.png",
    "flag_url": "https://flagcdn.com/w80/vu.png",
    "phoneLength": 7,
    "phoneLengths": [
      5,
      7
    ]
  },
  {
    "name": "Venezuela, Bolivarian Republic of Venezuela",
    "code": "VE",
    "dial_code": "+58",
    "dialCode": "+58",
    "flag": "🇻🇪",
    "flagUrl": "https://flagcdn.com/w80/ve.png",
    "flag_url": "https://flagcdn.com/w80/ve.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Vietnam",
    "code": "VN",
    "dial_code": "+84",
    "dialCode": "+84",
    "flag": "🇻🇳",
    "flagUrl": "https://flagcdn.com/w80/vn.png",
    "flag_url": "https://flagcdn.com/w80/vn.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Virgin Islands, British",
    "code": "VG",
    "dial_code": "+1284",
    "dialCode": "+1284",
    "flag": "🇻🇬",
    "flagUrl": "https://flagcdn.com/w80/vg.png",
    "flag_url": "https://flagcdn.com/w80/vg.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Virgin Islands, U.S.",
    "code": "VI",
    "dial_code": "+1340",
    "dialCode": "+1340",
    "flag": "🇻🇮",
    "flagUrl": "https://flagcdn.com/w80/vi.png",
    "flag_url": "https://flagcdn.com/w80/vi.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Wallis and Futuna",
    "code": "WF",
    "dial_code": "+681",
    "dialCode": "+681",
    "flag": "🇼🇫",
    "flagUrl": "https://flagcdn.com/w80/wf.png",
    "flag_url": "https://flagcdn.com/w80/wf.png",
    "phoneLength": 6,
    "phoneLengths": [
      6,
      9
    ]
  },
  {
    "name": "Yemen",
    "code": "YE",
    "dial_code": "+967",
    "dialCode": "+967",
    "flag": "🇾🇪",
    "flagUrl": "https://flagcdn.com/w80/ye.png",
    "flag_url": "https://flagcdn.com/w80/ye.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9
    ]
  },
  {
    "name": "Zambia",
    "code": "ZM",
    "dial_code": "+260",
    "dialCode": "+260",
    "flag": "🇿🇲",
    "flagUrl": "https://flagcdn.com/w80/zm.png",
    "flag_url": "https://flagcdn.com/w80/zm.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Zimbabwe",
    "code": "ZW",
    "dial_code": "+263",
    "dialCode": "+263",
    "flag": "🇿🇼",
    "flagUrl": "https://flagcdn.com/w80/zw.png",
    "flag_url": "https://flagcdn.com/w80/zw.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10
    ]
  }
];

app.get('/api/countries', (req, res) => {
  const { search } = req.query;
  if (search) {
    const query = search.toLowerCase();
    const filtered = countriesList.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.code.toLowerCase().includes(query) ||
      c.dialCode.includes(query) ||
      c.dial_code.includes(query)
    );
    return res.json({
      success: true,
      countries: filtered,
      message: `Countries matching "${search}" retrieved successfully`
    });
  }
  res.json({
    success: true,
    countries: countriesList,
    message: "Countries retrieved successfully"
  });
});

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
  if (dbMode === "mysql" && mysqlReady) {
    try {
      const [rows] = await mysqlPool.query("SELECT name FROM states WHERE status = 1 AND deleted_at IS NULL");
      const [nodeRows] = await mysqlPool.query("SELECT name FROM node_states WHERE status = 1");
      const allStatesSet = new Set([
        ...rows.map(r => r.name),
        ...nodeRows.map(r => r.name)
      ]);
      const states = Array.from(allStatesSet).sort();
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
  
  if (dbMode === "mysql" && mysqlReady) {
    try {
      let query = "SELECT c.name FROM cities c WHERE c.status = 1 AND c.deleted_at IS NULL";
      const params = [];
      
      let nodeQuery = "SELECT c.cityName as name FROM node_cities c WHERE c.status = 1";
      const nodeParams = [];

      if (state) {
        const [stateRows] = await mysqlPool.query("SELECT id FROM states WHERE name = ? AND deleted_at IS NULL LIMIT 1", [state]);
        if (stateRows.length > 0) {
          query += " AND c.state_id = ?";
          params.push(stateRows[0].id);
        } else {
          // If state is not found in standard table, Laravel query should return empty
          query += " AND c.state_id = -1";
        }
        
        nodeQuery += " AND LOWER(c.stateName) = ?";
        nodeParams.push(state.toLowerCase());
      }
      
      const [rows] = await mysqlPool.query(query, params);
      const [nodeRows] = await mysqlPool.query(nodeQuery, nodeParams);
      
      const allCitiesSet = new Set([
        ...rows.map(r => r.name),
        ...nodeRows.map(r => r.name)
      ]);
      const cities = Array.from(allCitiesSet).sort();

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
  
  if (dbMode === "mysql" && mysqlReady) {
    try {
      let query = "SELECT l.name FROM localities l WHERE l.status = 1 AND l.deleted_at IS NULL";
      const params = [];
      
      let nodeQuery = "SELECT l.localityName as name FROM node_localities l WHERE l.status = 1";
      const nodeParams = [];

      if (city) {
        const [cityRows] = await mysqlPool.query("SELECT id FROM cities WHERE name = ? AND deleted_at IS NULL LIMIT 1", [city]);
        if (cityRows.length > 0) {
          query += " AND l.city_id = ?";
          params.push(cityRows[0].id);
        } else {
          query += " AND l.city_id = -1";
        }
        
        nodeQuery += " AND LOWER(l.cityName) = ?";
        nodeParams.push(city.toLowerCase());
      } else if (state) {
        const [stateRows] = await mysqlPool.query("SELECT id FROM states WHERE name = ? AND deleted_at IS NULL LIMIT 1", [state]);
        if (stateRows.length > 0) {
          query += " AND l.state_id = ?";
          params.push(stateRows[0].id);
        } else {
          query += " AND l.state_id = -1";
        }
        
        nodeQuery += " AND LOWER(l.stateName) = ?";
        nodeParams.push(state.toLowerCase());
      }
      
      const [rows] = await mysqlPool.query(query, params);
      const [nodeRows] = await mysqlPool.query(nodeQuery, nodeParams);
      
      const allLocalitiesSet = new Set([
        ...rows.map(r => r.name),
        ...nodeRows.map(r => r.name)
      ]);
      const names = Array.from(allLocalitiesSet).sort();

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

// =========================================
// CART API ENDPOINTS
// =========================================

// Helper to format cart items
const enrichCartItems = async (cartItems, lang, serverBaseUrl) => {
  const enriched = [];
  for (const item of cartItems) {
    const serviceDetails = await resolveServiceDetails(item.productId);
    const resolvedUrlService = resolveServiceUrls([serviceDetails], serverBaseUrl)[0];
    const localized = localizeService(resolvedUrlService, lang);
    enriched.push({
      productId: item.productId,
      quantity: item.quantity,
      title: localized.title,
      name: localized.name,
      price: localized.price,
      description: localized.description,
      image: localized.image,
      category: localized.category,
      categoryId: localized.categoryId
    });
  }
  return enriched;
};

// GET /api/cart - Get all cart items
app.get('/api/cart', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const cartItems = await DbLayer.getCart(user.phone);
    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const enriched = await enrichCartItems(cartItems, req.lang, serverBaseUrl);
    res.json({ success: true, items: enriched });
  } catch (err) {
    console.error("Get cart failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/cart/add - Add item to cart
app.post('/api/cart/add', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { productId, quantity } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }
    const qty = parseInt(quantity) || 1;
    
    // Verify product exists
    await resolveServiceDetails(productId);
    
    const cartItems = await DbLayer.addToCart(user.phone, productId, qty);
    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const enriched = await enrichCartItems(cartItems, req.lang, serverBaseUrl);
    res.json({ success: true, message: translate("cart_item_added", req.lang) || "Item added to cart", items: enriched });
  } catch (err) {
    console.error("Add to cart failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/cart/update - Update item quantity in cart
app.post('/api/cart/update', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { productId, quantity } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }
    if (quantity === undefined) {
      return res.status(400).json({ error: "quantity is required" });
    }
    const qty = parseInt(quantity);
    
    const cartItems = await DbLayer.updateCartItem(user.phone, productId, qty);
    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const enriched = await enrichCartItems(cartItems, req.lang, serverBaseUrl);
    res.json({ success: true, message: translate("cart_updated", req.lang) || "Cart updated successfully", items: enriched });
  } catch (err) {
    console.error("Update cart failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/cart - Clear cart
app.delete('/api/cart', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await DbLayer.clearCart(user.phone);
    res.json({ success: true, message: translate("cart_cleared", req.lang) || "Cart cleared successfully", items: [] });
  } catch (err) {
    console.error("Clear cart failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/cart/:productId - Remove item from cart
app.delete('/api/cart/:productId', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const productId = req.params.productId;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }
    const cartItems = await DbLayer.removeFromCart(user.phone, productId);
    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const enriched = await enrichCartItems(cartItems, req.lang, serverBaseUrl);
    res.json({ success: true, message: translate("cart_item_removed", req.lang) || "Item removed from cart", items: enriched });
  } catch (err) {
    console.error("Remove from cart failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- APP VERSION ENDPOINTS ---
// GET /api/app-version - Retrieve app version settings
app.get('/api/app-version', async (req, res) => {
  try {
    const versionInfo = await DbLayer.getAppVersion();
    res.json({
      success: true,
      android: versionInfo.android || { latestVersion: "1.0.2", minSupportedVersion: "1.0.2", forceUpdate: true },
      ios: versionInfo.ios || { latestVersion: "1.0.3", minSupportedVersion: "1.0.3", forceUpdate: true }
    });
  } catch (err) {
    console.error("Failed to retrieve app version config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/app-version - Update app version settings
app.post('/api/app-version', async (req, res) => {
  const { android, ios } = req.body;

  try {
    if (android) {
      const updates = {};
      if (android.latestVersion !== undefined) updates.latestVersion = String(android.latestVersion);
      if (android.minSupportedVersion !== undefined) updates.minSupportedVersion = String(android.minSupportedVersion);
      if (android.forceUpdate !== undefined) updates.forceUpdate = !!android.forceUpdate;
      
      if (Object.keys(updates).length > 0) {
        await DbLayer.updateAppVersion('android', updates);
      }
    }

    if (ios) {
      const updates = {};
      if (ios.latestVersion !== undefined) updates.latestVersion = String(ios.latestVersion);
      if (ios.minSupportedVersion !== undefined) updates.minSupportedVersion = String(ios.minSupportedVersion);
      if (ios.forceUpdate !== undefined) updates.forceUpdate = !!ios.forceUpdate;
      
      if (Object.keys(updates).length > 0) {
        await DbLayer.updateAppVersion('ios', updates);
      }
    }

    const updatedConfig = await DbLayer.getAppVersion();
    res.json({
      success: true,
      android: updatedConfig.android || { latestVersion: "1.0.2", minSupportedVersion: "1.0.2", forceUpdate: true },
      ios: updatedConfig.ios || { latestVersion: "1.0.3", minSupportedVersion: "1.0.3", forceUpdate: true },
      message: "App version configuration updated successfully"
    });
  } catch (err) {
    console.error("Failed to update app version config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/send-custom-sms - Send a custom SMS via SMS Gateway Hub
app.post('/api/send-custom-sms', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { phone, message, templateId } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "phone is required" });
    }
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const result = await sendSMS(phone, message, templateId);
    if (result.success) {
      res.json({ success: true, message: "Custom SMS sent successfully", response: result.response });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error("Send custom SMS failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server successfully listening at http://localhost:${PORT}`);
});
