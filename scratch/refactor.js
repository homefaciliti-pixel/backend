/**
 * Refactoring Script
 * 
 * Strategy:
 * 1. Read entire server.js
 * 2. Extract lines 1-2681 (all shared globals, helpers, DB layer) into shared/index.js
 * 3. Extract each route group into routes/ files  
 * 4. Write a minimal app.js that mounts all routes
 * 5. Write a minimal server.js that just calls app.listen
 * 
 * The key insight: all route handlers reference shared globals (DbLayer, JWT_SECRET, etc.)
 * So we put all those into shared/index.js and each route file requires it.
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const serverPath = path.join(BASE, 'server.js');

// Read the file preserving original line endings
const rawContent = fs.readFileSync(serverPath, 'utf8');
const lines = rawContent.split('\n');

function getLines(start, end) {
  // start/end are 1-based line numbers (inclusive)
  return lines.slice(start - 1, end).join('\n');
}

function getLine(n) {
  return (lines[n - 1] || '').replace(/\r$/, '');
}

function writeFile(relPath, content) {
  const fullPath = path.join(BASE, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Written: ${relPath}`);
}

// ─────────────────────────────────────────────
// 1. shared/index.js  (lines 1-2681, everything before routes)
//    Remove the app setup / middleware lines that go into app.js
// ─────────────────────────────────────────────

// Lines 1-2681 contain all the shared code.
// BUT we need to strip out lines that reference `app` since app is in app.js.
// Those lines are: 546-559 (app setup), 574-695 (uploads middleware)
// We'll keep them in app.js instead.

const sharedHeader = `'use strict';
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
`;

// Build shared content from sections of server.js
// Section A: lines 12-544 (helpers, caches, presets, multer, utils) - skip lines 1-10 (handled above)
const sharedSectionA = getLines(12, 544);

// Section B: lines 543-548 — globals (mysqlPool, mysqlReady, PORT, JWT_SECRET)
// already included in section A at line 543, but we need these as module-level vars

// Section C: lines 561-571 (readDataFromJsonDb)
const sharedSectionC = getLines(561, 571);

// Section D: lines 697-2516 (everything after uploads middleware up to CATEGORIES_DATA)
const sharedSectionD = getLines(697, 2516);

// Section E: lines 2518-2681 (CATEGORIES_DATA through getAuthenticatedUser, generateReferralCode)
const sharedSectionE = getLines(2518, 2681);

// Section F: generalUpload (lines 3213-3225)
const sharedSectionF = getLines(3212, 3225);

const sharedContent = sharedHeader + '\n' +
  sharedSectionA + '\n' +
  sharedSectionC + '\n' +
  sharedSectionD + '\n' +
  sharedSectionE + '\n\n' +
  sharedSectionF + '\n\n' +
  `module.exports = {
  // Globals
  mysqlPool: () => mysqlPool,
  mysqlReady: () => mysqlReady,
  PORT,
  JWT_SECRET,
  // Helpers
  getLocalCategoryAssetUrl,
  getLocalBannerAssetUrl,
  resolveDynamicCategoryImageUrl,
  resolveDynamicBannerImageUrl,
  safeJsonParse,
  parseOrderNumbers,
  getCanonicalPhone,
  readDataFromJsonDb,
  generateReferralCode,
  getPhoneVariants: (...args) => typeof getPhoneVariants === 'function' ? getPhoneVariants(...args) : args[0],
  getCanonicalCategoryName,
  getHdFallbackServiceImageUrl: (...args) => typeof getHdFallbackServiceImageUrl === 'function' ? getHdFallbackServiceImageUrl(...args) : '',
  // Services/presets
  CATEGORIES_DATA,
  SERVICES_DATA,
  AMC_SUPPORTED_CATEGORIES,
  defaultSubCategoryPresets,
  defaultSubCatServicePresets,
  generateDefaultServicesForSubCategory,
  generateSubcategoriesForCategory,
  collectAllSubcategories: (...args) => typeof collectAllSubcategories === 'function' ? collectAllSubcategories(...args) : [],
  // DB
  DbLayer,
  MySqlDbLayer,
  JsonDbLayer,
  DB_FILE,
  DEFAULT_CATEGORIES,
  dbMode: () => dbMode,
  // Auth
  getAuthenticatedUser,
  // SMS
  sendSMS,
  handleBookingStatusSmsTrigger,
  lastSmsDebug: () => lastSmsDebug,
  debugLogs,
  // Multer
  amcUpload,
  generalUpload,
  // Draft orders
  draftOrders,
  activeOTPs,
  isMockPaymentAllowed,
  // Validation
  validatePhoneNumberLength: (...args) => typeof validatePhoneNumberLength === 'function' ? validatePhoneNumberLength(...args) : true,
  countriesList: typeof countriesList !== 'undefined' ? countriesList : [],
  STATIC_BOOKING_SLOTS: typeof STATIC_BOOKING_SLOTS !== 'undefined' ? STATIC_BOOKING_SLOTS : [],
};
`;

// ─────────────────────────────────────────────────────────
// Actually, the approach above is fragile because STATIC_BOOKING_SLOTS is defined at line 8031
// and getPhoneVariants at 8290, etc.  They are used in initMySqlDb at line 1174.
// 
// Better strategy: DON'T split the code at all. Instead:
// - Keep ALL the logic in one shared module (just reorganized from top of server.js)
// - Each route file simply: const S = require('../shared'); and uses S.DbLayer, S.getAuthenticatedUser, etc.
// - But the routes themselves are moved out.
//
// The cleanest safe approach for a 14k line file:
// Put lines 1-14330 minus the final app.listen + the app.use/app.get/app.post/app.put/app.delete
// into shared/index.js, then have route files call into shared functions.
//
// SIMPLEST CORRECT APPROACH:
// The routes already use all the helpers inline. The safest thing is:
//  1. Extract JUST the route registrations into route files
//  2. Keep all business logic handlers in shared
//  3. Route files just call the handlers
// ─────────────────────────────────────────────────────────

console.log('Analyzing server.js structure...');
console.log('Total lines:', lines.length);
console.log('\nKey boundaries identified:');
console.log('  Lines 1-2681: Shared globals, helpers, DB layer, auth');
console.log('  Lines 2682-3210: Debug, root, auth routes');
console.log('  Lines 3211-14330: Route handlers and registrations');
console.log('\nStrategy: Create shared/index.js with all non-route code');
console.log('Then create minimal route files that import handlers from shared');
