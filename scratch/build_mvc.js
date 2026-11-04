const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'server_backup_original.js');
const code = fs.readFileSync(srcFile, 'utf8');
const lines = code.split('\n');

function L(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

function writeTargetFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`Created: ${relPath} (${content.length} bytes)`);
}

console.log('Total lines in server_backup_original.js:', lines.length);

// ==========================================
// 1. CONFIG / CONSTANTS
// ==========================================
console.log('Writing config/constants.js...');
const constantsContent = `
const path = require('path');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super_secret_jwt_key_123';
const ADMIN_FETCH_TTL = 10000; // 10s cache for fast admin sync
const DB_FILE = path.join(__dirname, '..', 'database.json');

${L(201, 278)}

${L(280, 368)}

${L(852, 871)}

${L(2519, 2528)}

${L(2543, 2606)}

${L(8031, 8043)}

${L(10342, 13918)}

module.exports = {
  PORT,
  JWT_SECRET,
  ADMIN_FETCH_TTL,
  DB_FILE,
  defaultSubCategoryPresets,
  defaultSubCatServicePresets,
  DEFAULT_CATEGORIES,
  CATEGORIES_DATA,
  AMC_SUPPORTED_CATEGORIES,
  SERVICES_DATA,
  STATIC_BOOKING_SLOTS,
  countriesList
};
`;
writeTargetFile('config/constants.js', constantsContent);

// ==========================================
// 2. UTILS / IMAGE HELPERS
// ==========================================
console.log('Writing utils/imageHelpers.js...');
const imageHelpersContent = `
const path = require('path');

${L(12, 44)}

${L(46, 59)}

${L(182, 199)}

${L(481, 496)}

${L(4597, 4694)}

${L(9508, 9512)}

module.exports = {
  getLocalCategoryAssetUrl,
  getLocalBannerAssetUrl,
  resolveDynamicCategoryImageUrl,
  resolveDynamicBannerImageUrl,
  getHdFallbackServiceImageUrl,
  resolveDynamicServiceImageUrl
};
`;
writeTargetFile('utils/imageHelpers.js', imageHelpersContent);

// ==========================================
// 3. UTILS / HELPERS
// ==========================================
console.log('Writing utils/helpers.js...');
const helpersContent = `
const fs = require('fs');
const path = require('path');
const { countriesList, CATEGORIES_DATA } = require('../config/constants');
const { translate } = require('../helpers/translate');

${L(520, 530)}

${L(532, 541)}

${L(561, 571)}

${L(697, 701)}

${L(732, 747)}

${L(2531, 2541)}

${L(2676, 2680)}

${L(2886, 2914)}

${L(8208, 8288)}

${L(8290, 8301)}

${L(8303, 8395)}

${L(10249, 10277)}

module.exports = {
  safeJsonParse,
  parseOrderNumbers,
  readDataFromJsonDb,
  getCanonicalPhone,
  isMockPaymentAllowed,
  getCanonicalCategoryName,
  generateReferralCode,
  validatePhoneNumberLength,
  normalizeString,
  normalizeDate,
  normalizeTimeSlot,
  getPhoneVariants,
  sanitizeAddressObj,
  sanitizeUserObj,
  sanitizeProductObj,
  parseTimeRange,
  timesOverlap
};
`;
writeTargetFile('utils/helpers.js', helpersContent);

// ==========================================
// 4. SERVICES / ADMIN BACKEND
// ==========================================
console.log('Writing services/adminBackend.service.js...');
const adminBackendContent = `
const https = require('https');
const { ADMIN_FETCH_TTL } = require('../config/constants');

${L(61, 66)}

${L(69, 105)}

${L(107, 142)}

${L(144, 180)}

module.exports = {
  fetchAdminBackendCategories,
  fetchAdminBackendSubcategories,
  fetchAdminBackendServices
};
`;
writeTargetFile('services/adminBackend.service.js', adminBackendContent);

// ==========================================
// 5. SERVICES / CATEGORY SERVICE
// ==========================================
console.log('Writing services/category.service.js...');
const categoryServiceContent = `
const { defaultSubCategoryPresets, defaultSubCatServicePresets } = require('../config/constants');
const { getHdFallbackServiceImageUrl } = require('../utils/imageHelpers');

${L(370, 414)}

${L(416, 478)}

${L(3840, 3904)}

${L(8564, 8588)}

module.exports = {
  generateDefaultServicesForSubCategory,
  generateSubcategoriesForCategory,
  collectAllSubcategories,
  getServiceCategory
};
`;
writeTargetFile('services/category.service.js', categoryServiceContent);

// ==========================================
// 6. SERVICES / SMS SERVICE
// ==========================================
console.log('Writing services/sms.service.js...');
const smsServiceContent = `
let lastSmsDebug = { timestamp: null, url: null, response: null, error: null };
const debugLogs = [];

${L(754, 800)}

${L(803, 845)}

module.exports = {
  sendSMS,
  handleBookingStatusSmsTrigger,
  getLastSmsDebug: () => lastSmsDebug,
  debugLogs
};
`;
writeTargetFile('services/sms.service.js', smsServiceContent);

// ==========================================
// 7. CONFIG / DB
// ==========================================
console.log('Writing config/db.js...');
const dbConfigContent = `
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { DEFAULT_CATEGORIES, STATIC_BOOKING_SLOTS, DB_FILE } = require('./constants');

let mysqlPool = null;
let mysqlReady = false;
let dbMode = "mysql";

${L(876, 1266)}

${L(1826, 1916)}

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
`;
writeTargetFile('config/db.js', dbConfigContent);

// ==========================================
// 8. SERVICES / DB LAYER
// ==========================================
console.log('Writing services/dbLayer.js...');
const dbLayerContent = `
const fs = require('fs');
const path = require('path');
const { DB_FILE, DEFAULT_CATEGORIES } = require('../config/constants');
const { getMysqlPool, getMysqlReady, setMysqlReady, getDbMode, setDbMode, initJsonDb } = require('../config/db');
const { parseOrderNumbers, getPhoneVariants, getCanonicalPhone } = require('../utils/helpers');
const { fetchAdminBackendCategories } = require('./adminBackend.service');
const { handleBookingStatusSmsTrigger } = require('./sms.service');

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

const memoryCart = new Map();

${L(1268, 1824).replace(/mysqlPool\b/g, 'getMysqlPool()')}

${L(1918, 2389)}

// ----------------------------------------
// HYBRID DATABASE ROUTER
// ----------------------------------------
async function executeDbMethod(methodName, ...args) {
  if (getDbMode() === "mysql" && getMysqlReady() && MySqlDbLayer && typeof MySqlDbLayer[methodName] === 'function') {
    try {
      return await MySqlDbLayer[methodName](...args);
    } catch (err) {
      console.warn(\`[DbLayer.\${methodName}] MySQL query failed (\${err.message}). Falling back to JSON database.\`);
      setMysqlReady(false);
      setDbMode("json");
    }
  }
  return await JsonDbLayer[methodName](...args);
}

${L(2410, 2486)}

module.exports = {
  DbLayer,
  MySqlDbLayer,
  JsonDbLayer,
  executeDbMethod,
  activeOTPs,
  draftOrders,
  memoryCart
};
`;
writeTargetFile('services/dbLayer.js', dbLayerContent);

// ==========================================
// 9. MIDDLEWARE / AUTH
// ==========================================
console.log('Writing middleware/auth.middleware.js...');
const authMiddlewareContent = `
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const { DbLayer } = require('../services/dbLayer');
const { generateReferralCode, getPhoneVariants } = require('../utils/helpers');

${L(2609, 2673)}

module.exports = {
  getAuthenticatedUser
};
`;
writeTargetFile('middleware/auth.middleware.js', authMiddlewareContent);

// ==========================================
// 10. MIDDLEWARE / UPLOAD
// ==========================================
console.log('Writing middleware/upload.middleware.js...');
const uploadMiddlewareContent = `
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { getLocalCategoryAssetUrl } = require('../utils/imageHelpers');

${L(499, 518)}

${L(3213, 3225)}

const uploadsProxyMiddleware = async (req, res, next) => {
  const relPath = req.path.replace(/^\\/+/, '');
  if (!relPath) return next();

  const baseDir = path.join(__dirname, '..');

  // 1. Check if uploaded file exists in backend/uploads/
  const uploadsPath = path.resolve(baseDir, 'uploads', relPath);
  if (fs.existsSync(uploadsPath) && fs.statSync(uploadsPath).size > 0) {
    return res.sendFile(uploadsPath);
  }

  // 2. Check if uploaded file exists in backend/assets/uploads/
  const assetsUploadsPath = path.resolve(baseDir, 'assets', 'uploads', relPath);
  if (fs.existsSync(assetsUploadsPath) && fs.statSync(assetsUploadsPath).size > 0) {
    return res.sendFile(assetsUploadsPath);
  }

  // 3. Direct match in assets/categories/, assets/banners/, or assets/services/
  const catPath = path.resolve(baseDir, 'assets', 'categories', relPath);
  if (fs.existsSync(catPath)) return res.sendFile(catPath);

  const bannerPath = path.resolve(baseDir, 'assets', 'banners', relPath);
  if (fs.existsSync(bannerPath)) return res.sendFile(bannerPath);

  const srvPath = path.resolve(baseDir, 'assets', 'services', relPath);
  if (fs.existsSync(srvPath)) return res.sendFile(srvPath);

  // 4. Instant 3D Category Asset Fallback check
  const norm = relPath.toLowerCase();

  function sendCategoryFile(res, targetFilename) {
    const catDir = path.resolve(baseDir, 'assets', 'categories');
    const targetLower = targetFilename.toLowerCase();
    try {
      const files = fs.readdirSync(catDir);
      const match = files.find(f => f.toLowerCase() === targetLower);
      if (match) {
        return res.sendFile(path.resolve(catDir, match));
      }
    } catch (e) {}
    return res.sendFile(path.resolve(catDir, 'plumber_3d.png'));
  }

  ${L(616, 641)}

  // 5. Proxy check: Try fetching live uploaded file from Admin Backend if present
  try {
    const adminUrl = \`https://adminbackend-1-h03r.onrender.com/uploads/\${encodeURIComponent(relPath)}\`;

    const proxied = await new Promise((resolve) => {
      const pReq = https.get(adminUrl, { timeout: 3500 }, (pRes) => {
        if (pRes.statusCode === 200) {
          res.setHeader('Content-Type', pRes.headers['content-type'] || 'image/jpeg');
          try {
            const dir = path.dirname(uploadsPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const fileStream = fs.createWriteStream(uploadsPath);
            pRes.pipe(fileStream);
          } catch (e) {}
          pRes.pipe(res);
          return resolve(true);
        }
        resolve(false);
      });
      pReq.on('error', () => resolve(false));
      pReq.on('timeout', () => { pReq.destroy(); resolve(false); });
    });

    if (proxied) return;
  } catch (e) {
    console.warn(\`[Proxy uploads error for \${relPath}]:\`, e.message);
  }

  ${L(671, 694)}
};

module.exports = {
  amcUpload,
  generalUpload,
  uploadsProxyMiddleware
};
`;
writeTargetFile('middleware/upload.middleware.js', uploadMiddlewareContent);

console.log('Phase 1 (Config, Utils, Services, Middleware) completed successfully!');
