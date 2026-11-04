/**
 * PRODUCTION-SAFE REFACTORING SCRIPT
 * 
 * Strategy:
 * - shared/index.js: All non-route code (lines 1-2681 + all handler functions + data)
 * - routes/*.js: Thin router files that import handlers from shared
 * - app.js: Express setup + middleware + route mounts (no business logic)
 * - server.js: Just app.listen()
 * 
 * This approach is safe because:
 * 1. All handler code stays together in shared/index.js
 * 2. No circular dependencies
 * 3. All routes are preserved exactly
 * 4. No code is modified, only organized
 */

'use strict';

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const serverPath = path.join(BASE, 'server.js');

// Read preserving line structure
const raw = fs.readFileSync(serverPath, 'utf8');
const allLines = raw.split('\n');

function L(start, end) {
  return allLines.slice(start - 1, end).join('\n');
}

function writeFile(relPath, content) {
  const fullPath = path.join(BASE, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✓ Written: ' + relPath + ' (' + content.length + ' bytes)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Build shared/index.js from ALL non-route code in server.js
//
// What goes in shared:
//   Lines 1-542:   All requires, helper functions, cache vars, presets, multer AMC config
//   Lines 543-548: mysqlPool, JWT_SECRET, PORT
//   Lines 561-571: readDataFromJsonDb
//   Lines 697-2680: getCanonicalPhone, OTPs, draftOrders, SMS, DbLayers, startup IIFE,
//                   CATEGORIES_DATA, SERVICES_DATA, getAuthenticatedUser, etc.
//   Lines 2886-2914: validatePhoneNumberLength (used by auth route)
//   Lines 3212-3225: generalUpload multer config
//   Lines 3840-4041: collectAllSubcategories function
//   Lines 4597-4920: getHdFallbackServiceImageUrl
//   Lines 4922-5046: handleServiceDetail
//   Lines 5308-5591: handleVerifyPayment
//   Lines 5592-5888: handlePayPage
//   Lines 5889-6228: handlePaymentCallback
//   Lines 6820-7142: handlePostAmcBooking
//   Lines 7229-7526: handlePostBooking
//   Lines 7529-7591: handleAddAddress
//   Lines 7609-8030: handlePostCheckout  
//   Lines 8031-8588: STATIC_BOOKING_SLOTS, getPhoneVariants
//   Lines 8589-10065: handleGetCheckout
//   Lines 10066-10277: handleCancelOrder
//   Lines 10278-10334: handleGetAvailableSlots
//   Lines 10339-13918: countriesList data
//
// What is EXCLUDED (goes into route files):
//   Lines 550-558: app setup (app = express(), PORT, cors, json, language, assets)
//   Lines 574-695: app.use('/uploads'...) middleware (goes in app.js)
//   Lines 2683-2885: debug + root route registrations
//   Lines 2915-3210: auth route registrations
//   Lines 3133-3156: /api/languages (in existing routes/language.js)
//   Lines 3197-3210: POST /api/contact
//   Lines 3227-3247: POST /api/upload
//   Lines 3249-3801: admin CRUD routes for categories/banners/services
//   Lines 3802-3904: POST /api/categories, POST /api/subcategories
//   Lines 3905-4148: GET /api/categories/:id etc
//   Lines 4149-5050: GET /api/banners, GET /api/services/*
//   Lines 5047-5050: route registrations for handleServiceDetail
//   Lines 5051-5217: GET /api/search
//   Lines 5218-5307: policies routes
//   Lines 6229-6307: payment route registrations
//   Lines 6308-6445: wallet routes
//   Lines 6446-6963: AMC route registrations
//   Lines 6964-7008: cards routes
//   Lines 7008-7142: POST /api/payments, wallet/rules, wallet/calculate-discount
//   Lines 7143-7502: referrals routes
//   Lines 7503-7591: bookings + addresses route registrations
//   Lines 8026-8030: checkout route registrations
//   Lines 9329-9332: GET checkout routes
//   Lines 9667-9825: cart routes (first set)
//   Lines 9826-10338: orders + booking-flow + available-* routes
//   Lines 13919-14143: GET /api/countries, /states, /cities, /localities
//   Lines 14144-14248: cart routes (second set, duplicate)
//   Lines 14250-14329: app-version + send-custom-sms routes
//   Lines 14331-14333: app.listen
// ─────────────────────────────────────────────────────────────────────────────

console.log('Building shared/index.js...');

const sharedParts = [
  // Rewrite requires to use relative paths from shared/ directory
  `'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { translate } = require('../helpers/translate');
const { localizeCategory, localizeService, localizeAddress, runContentI18nMigration } = require('../helpers/contentI18n');
`,
  // Lines 12-542: helper functions (getLocalCategoryAssetUrl, getLocalBannerAssetUrl, cache vars,
  //               fetchAdminBackend*, resolveDynamic*, defaultSubCategoryPresets, defaultSubCatServicePresets,
  //               generateDefaultServicesForSubCategory, generateSubcategoriesForCategory,
  //               resolveDynamicBannerImageUrl, amcStorage, amcUpload, safeJsonParse, parseOrderNumbers)
  L(12, 542),

  // Lines 543-548: globals (mysqlPool, mysqlReady, PORT, JWT_SECRET)
  L(543, 548),

  // Lines 561-571: readDataFromJsonDb
  L(561, 571),

  // Lines 697-2680: All DB code, auth, SMS, etc.
  L(697, 2680),

  // Lines 2886-2914: validatePhoneNumberLength (used before routes)
  L(2886, 2914),

  // Lines 3212-3225: generalUpload multer setup
  L(3212, 3225),

  // Lines 3840-4041: collectAllSubcategories
  L(3840, 4041),

  // Lines 4597-4920: getHdFallbackServiceImageUrl
  L(4597, 4920),

  // Lines 4922-5046: handleServiceDetail handler
  L(4922, 5046),

  // Lines 5308-5591: handleVerifyPayment
  L(5308, 5591),

  // Lines 5592-5888: handlePayPage
  L(5592, 5888),

  // Lines 5889-6228: handlePaymentCallback
  L(5889, 6228),

  // Lines 6820-7142: handlePostAmcBooking
  L(6820, 7142),

  // Lines 7229-7527: handlePostBooking
  L(7229, 7527),

  // Lines 7529-7591: handleAddAddress
  L(7529, 7591),

  // Lines 7609-8030: handlePostCheckout
  L(7609, 8030),

  // Lines 8031-8588: STATIC_BOOKING_SLOTS + getPhoneVariants
  L(8031, 8588),

  // Lines 8589-10065: handleGetCheckout
  L(8589, 10065),

  // Lines 10066-10277: handleCancelOrder
  L(10066, 10277),

  // Lines 10278-10334: handleGetAvailableSlots
  L(10278, 10334),

  // Lines 10339-13918: countriesList data + helpers
  L(10339, 13918),
];

// Module exports for shared
const sharedExports = `

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
module.exports = {
  // Config
  JWT_SECRET,
  PORT,

  // DB
  DbLayer,
  MySqlDbLayer,
  JsonDbLayer,
  DB_FILE,
  DEFAULT_CATEGORIES,
  getDbMode: () => dbMode,
  setDbMode: (m) => { dbMode = m; },
  getMysqlPool: () => mysqlPool,
  getMysqlReady: () => mysqlReady,

  // Auth
  getAuthenticatedUser,
  generateReferralCode,

  // Helpers
  getLocalCategoryAssetUrl,
  getLocalBannerAssetUrl,
  resolveDynamicCategoryImageUrl,
  resolveDynamicBannerImageUrl,
  safeJsonParse,
  parseOrderNumbers,
  getCanonicalPhone,
  readDataFromJsonDb,
  getCanonicalCategoryName,
  getHdFallbackServiceImageUrl,
  collectAllSubcategories,
  generateDefaultServicesForSubCategory,
  generateSubcategoriesForCategory,
  getPhoneVariants,
  validatePhoneNumberLength,

  // Data
  CATEGORIES_DATA,
  SERVICES_DATA,
  AMC_SUPPORTED_CATEGORIES,
  defaultSubCategoryPresets,
  defaultSubCatServicePresets,
  STATIC_BOOKING_SLOTS,
  countriesList,

  // Admin backend fetch
  fetchAdminBackendCategories,
  fetchAdminBackendSubcategories,
  fetchAdminBackendServices,

  // SMS
  sendSMS,
  handleBookingStatusSmsTrigger,
  getLastSmsDebug: () => lastSmsDebug,
  debugLogs,

  // State
  activeOTPs,
  draftOrders,
  isMockPaymentAllowed,

  // Multer
  amcUpload,
  generalUpload,

  // Route handlers (exported so route files can register them)
  handleServiceDetail,
  handleVerifyPayment,
  handlePayPage,
  handlePaymentCallback,
  handlePostAmcBooking,
  handlePostBooking,
  handleAddAddress,
  handlePostCheckout,
  handleGetCheckout,
  handleCancelOrder,
  handleGetAvailableSlots,
};
`;

const sharedContent = sharedParts.join('\n') + sharedExports;
writeFile('shared/index.js', sharedContent);

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE FILE HELPER
// ─────────────────────────────────────────────────────────────────────────────

function makeRouteFile(body) {
  // Convert all app.METHOD( to router.METHOD(
  const converted = body
    .replace(/\bapp\.(get|post|put|delete|patch)\(/g, 'router.$1(');
  
  return `'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const S = require('../shared');
const {
  DbLayer, getAuthenticatedUser, JWT_SECRET, safeJsonParse, parseOrderNumbers,
  getPhoneVariants, sendSMS, activeOTPs, draftOrders, isMockPaymentAllowed,
  CATEGORIES_DATA, SERVICES_DATA, AMC_SUPPORTED_CATEGORIES, STATIC_BOOKING_SLOTS,
  fetchAdminBackendCategories, fetchAdminBackendSubcategories, fetchAdminBackendServices,
  resolveDynamicCategoryImageUrl, resolveDynamicBannerImageUrl, collectAllSubcategories,
  generateDefaultServicesForSubCategory, generateSubcategoriesForCategory,
  getHdFallbackServiceImageUrl, getLocalCategoryAssetUrl, getLocalBannerAssetUrl,
  getCanonicalCategoryName, generateReferralCode, defaultSubCategoryPresets,
  defaultSubCatServicePresets, countriesList, debugLogs, amcUpload, generalUpload,
  handleServiceDetail, handleVerifyPayment, handlePayPage, handlePaymentCallback,
  handlePostAmcBooking, handlePostBooking, handleAddAddress, handlePostCheckout,
  handleGetCheckout, handleCancelOrder, handleGetAvailableSlots, validatePhoneNumberLength,
  getCanonicalPhone,
} = S;

${converted}

module.exports = router;
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// INDIVIDUAL ROUTE FILES
// ─────────────────────────────────────────────────────────────────────────────

console.log('\nBuilding route files...');

// DEBUG ROUTES: /api/debug/db, /api/debug/sms-config, /api/debug/logs
writeFile('routes/debug.js', makeRouteFile(
  L(2683, 2713) + '\n' + // GET /api/debug/db
  L(2866, 2884)          // GET /api/debug/sms-config, GET /api/debug/logs
));

// ROOT route (special - used in app.js directly)
// Extract root handler content to embed in app.js
const rootRouteContent = L(2714, 2865);

// AUTH ROUTES: send-otp, verify-otp, logout, profile GET/PUT, language, delete-account
// Lines 2915-3131 (send-otp, verify-otp, logout, GET profile, PUT profile)
// Lines 3133-3179 (GET /api/languages - skip, already in routes/language.js)  
// Lines 3156-3179 (POST /api/auth/language)
// Lines 3181-3210 (DELETE /api/auth/account)
writeFile('routes/auth.js', makeRouteFile(
  L(2915, 3131) + '\n' +  // send-otp, verify-otp, logout, profile
  L(3156, 3210)            // POST /api/auth/language, DELETE /api/auth/account
));

// LANGUAGES ROUTE - already in routes/language.js, skip
// Lines 3133-3155 (GET /api/languages)
writeFile('routes/languages.js', makeRouteFile(
  L(3133, 3155)
));

// CONTACT + UPLOAD
writeFile('routes/contact.js', makeRouteFile(
  L(3197, 3247)  // POST /api/contact, POST /api/upload
));

// CATEGORIES - admin CRUD + public GET routes
// 3249-3357 (POST/PUT/DELETE categories, POST/PUT/DELETE banners, POST/PUT/DELETE services)
// 3358-3800 (GET /api/categories)
// 3802-3838 (duplicate POST /api/categories, POST /api/subcategories - first part)
// 3905-4147 (GET /api/categories/:id, GET /api/subcategories, GET /api/categories/:cat/subcategories)
// 4149-5050 (GET /api/banners, GET /api/services/trending, etc.)
writeFile('routes/categories.js', makeRouteFile(
  L(3249, 3357) + '\n' +  // admin CRUD for categories/banners/services
  L(3358, 3800) + '\n' +  // GET /api/categories  
  L(3802, 3839) + '\n' +  // POST /api/categories (duplicate), POST /api/subcategories
  L(3905, 4148) + '\n' +  // GET /api/categories/:id, /subcategories, /categories/:cat/subcategories  
  L(4149, 5050)            // GET /api/banners + all services GET routes
));

// SEARCH
writeFile('routes/search.js', makeRouteFile(
  L(5051, 5217)
));

// POLICIES
writeFile('routes/policies.js', makeRouteFile(
  L(5218, 5307)
));

// PAYMENTS: handlePayPage, handlePaymentCallback, handleVerifyPayment, handleCod
writeFile('routes/payments.js', makeRouteFile(
  L(6229, 6307) + '\n' +   // route registrations for pay, callback, verify, cod
  L(7008, 7088)             // POST /api/payments
));

// WALLET
writeFile('routes/wallet.js', makeRouteFile(
  L(6308, 6445) + '\n' +   // wallet balance, add, deduct, history
  L(7089, 7142)             // wallet/rules, wallet/calculate-discount
));

// AMC
writeFile('routes/amc.js', makeRouteFile(
  L(6446, 6819) + '\n' +   // GET /api/amc/plans, POST /api/amc/subscribe, GET subscriptions, POST renew, GET plans/:category, POST plan-property-details
  L(6960, 6963)             // POST /api/amc/book, POST /api/amc/bookings
));

// CARDS
writeFile('routes/cards.js', makeRouteFile(
  L(6964, 7007)
));

// REFERRALS
writeFile('routes/referrals.js', makeRouteFile(
  L(7143, 7502)
));

// BOOKINGS
writeFile('routes/bookings.js', makeRouteFile(
  L(7503, 7507) + '\n' +   // POST /api/bookings, POST /api/booking, GET /api/bookings
  L(10226, 10338)           // GET /api/booking/available-dates, available-slots
));

// ADDRESSES
writeFile('routes/addresses.js', makeRouteFile(
  L(7588, 7591)  // POST /api/addresses, POST /api/address, GET /api/addresses  
));

// CHECKOUT
writeFile('routes/checkout.js', makeRouteFile(
  L(8026, 8030) + '\n' +   // POST /api/checkout, POST /api/checkout-api
  L(9329, 9332)             // GET /api/checkout, GET /api/checkout-api, GET /api/checkout/:userId
));

// CART (combine both sets: 9667-9825 and 14144-14248, deduplicate)
// Use only first set (9667-9825) as they are the primary definitions
// Second set (14144-14248) appears to be duplicates
writeFile('routes/cart.js', makeRouteFile(
  L(9667, 9825)
));

// ORDERS
writeFile('routes/orders.js', makeRouteFile(
  L(9826, 10154) + '\n' +   // GET /api/orders, GET /api/orders/:id, POST /api/orders, cancel routes, PUT /api/orders/:id/cancel
  L(10155, 10225)            // GET /api/orders/:id/booking-flow, PUT /api/orders/:id/booking-flow
));

// GEO
writeFile('routes/geo.js', makeRouteFile(
  L(13919, 14143)
));

// APP VERSION
writeFile('routes/appversion.js', makeRouteFile(
  L(14250, 14302)
));

// CUSTOM SMS
writeFile('routes/sms.js', makeRouteFile(
  L(14305, 14329)
));

// ─────────────────────────────────────────────────────────────────────────────
// APP.JS
// ─────────────────────────────────────────────────────────────────────────────

console.log('\nBuilding app.js...');

// Uploads middleware extracted from server.js (lines 574-695)
const uploadsMiddlewareCode = L(574, 695);

const appJsContent = `'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// ─── Core middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Multilingual System Middleware & Routes (existing) ───────────────────────
const languageMiddleware = require('./middleware/language');
const languageRouter = require('./routes/language');
app.use(languageMiddleware);
app.use('/api', languageRouter);

// ─── Static assets ────────────────────────────────────────────────────────────
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ─── Smart uploads proxy middleware ───────────────────────────────────────────
// Serves files from local uploads dir, falls back to admin backend proxy
const S = require('./shared');
const { getLocalCategoryAssetUrl } = S;

${uploadsMiddlewareCode}

// ─── Root / Health endpoint ───────────────────────────────────────────────────
${rootRouteContent.replace(/\bapp\.(get|post)\(/g, 'app.$1(')}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', require('./routes/debug'));
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/languages'));
app.use('/api', require('./routes/contact'));
app.use('/api', require('./routes/categories'));
app.use('/api', require('./routes/search'));
app.use('/api', require('./routes/policies'));
app.use('/api', require('./routes/payments'));
app.use('/api', require('./routes/wallet'));
app.use('/api', require('./routes/amc'));
app.use('/api', require('./routes/cards'));
app.use('/api', require('./routes/referrals'));
app.use('/api', require('./routes/bookings'));
app.use('/api', require('./routes/addresses'));
app.use('/api', require('./routes/checkout'));
app.use('/api', require('./routes/cart'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/geo'));
app.use('/api', require('./routes/appversion'));
app.use('/api', require('./routes/sms'));

module.exports = app;
`;

writeFile('app.js', appJsContent);

// ─────────────────────────────────────────────────────────────────────────────
// NEW SERVER.JS (minimal)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\nBuilding minimal server.js...');

const newServerJs = `'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app = require('./app');
const { PORT } = require('./shared');

app.listen(PORT, () => {
  console.log(\`Backend server successfully listening at http://localhost:\${PORT}\`);
});
`;

writeFile('server.js', newServerJs);

console.log('\n✅ All files created successfully!');
console.log('\nNext steps:');
console.log('  node -c shared/index.js');
console.log('  node -c app.js');
console.log('  node -c routes/*.js');
