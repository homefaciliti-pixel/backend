const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'server_backup_original.js');
const code = fs.readFileSync(srcFile, 'utf8');
const lines = code.split('\n');

function L(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

function extractHandler(start, end) {
  let chunk = L(start, end).trim();
  const match = chunk.match(/(async\s*\(\s*req|\(\s*req|async\s+function|function\s*\()/);
  if (match) {
    chunk = chunk.substring(match.index).trim();
  }
  chunk = chunk.replace(/\);(\s*\/\/[^\n]*)?$/, ';');
  if (!chunk.endsWith(';')) chunk += ';';
  return chunk;
}

function writeTargetFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`Created: ${relPath} (${content.length} bytes)`);
}

// ============================================================================
// 1. AUTH CONTROLLER & ROUTES
// ============================================================================
console.log('Writing auth controller and routes...');

const authControllerContent = `
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const { DbLayer, activeOTPs } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { getCanonicalPhone, validatePhoneNumberLength, generateReferralCode } = require('../utils/helpers');
const { sendSMS } = require('../services/sms.service');
const { translate } = require('../helpers/translate');

// POST /api/auth/send-otp
const sendOtp = ${extractHandler(2915, 2980)}

// POST /api/auth/verify-otp
const verifyOtp = ${extractHandler(2981, 3052)}

// POST /api/auth/logout
const logout = ${extractHandler(3053, 3067)}

// GET /api/auth/profile
const getProfile = ${extractHandler(3068, 3081)}

// PUT /api/auth/profile
const updateProfile = ${extractHandler(3082, 3132)}

// GET /api/languages
const getLanguages = ${extractHandler(3133, 3155)}

// POST /api/auth/language
const updateLanguage = ${extractHandler(3156, 3180)}

// DELETE /api/auth/account
const deleteAccount = ${extractHandler(3181, 3195)}

module.exports = {
  sendOtp,
  verifyOtp,
  logout,
  getProfile,
  updateProfile,
  getLanguages,
  updateLanguage,
  deleteAccount
};
`;
writeTargetFile('controllers/auth.controller.js', authControllerContent);

const authRoutesContent = `
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtp);
router.post('/auth/logout', authController.logout);
router.get('/auth/profile', authController.getProfile);
router.put('/auth/profile', authController.updateProfile);
router.get('/languages', authController.getLanguages);
router.post('/auth/language', authController.updateLanguage);
router.delete('/auth/account', authController.deleteAccount);

module.exports = router;
`;
writeTargetFile('routes/auth.routes.js', authRoutesContent);

// ============================================================================
// 2. MISC CONTROLLER & ROUTES (Debug, root, contact, upload, app-version, custom-sms)
// ============================================================================
console.log('Writing misc controller and routes...');

const miscControllerContent = `
const fs = require('fs');
const path = require('path');
const { DB_FILE } = require('../config/constants');
const { DbLayer, MySqlDbLayer, JsonDbLayer } = require('../services/dbLayer');
const { getLastSmsDebug, debugLogs, sendSMS } = require('../services/sms.service');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');

// GET /api/debug/db
const getDebugDb = ${extractHandler(2683, 2713)}

// GET / (root health)
const getRootHealth = ${extractHandler(2714, 2865)}

// GET /api/debug/sms-config
const getSmsConfig = (req, res) => {
  res.json({
    config: {
      smsApiKey: (process.env.SMS_API_KEY || 'b395HRZTRUGZThPOeRSnVg').substring(0, 4) + '***',
      senderId: process.env.SMS_SENDER_ID || 'HMFCLI',
      entityId: process.env.SMS_ENTITY_ID || '1201173444411453897',
      dltTemplateId: process.env.SMS_DLT_TEMPLATE_ID || '1207173589889308632',
      smsRoute: process.env.SMS_ROUTE || '2',
      rawTemplate: process.env.SMS_TEMPLATE_TEXT || 'Your OTP for registering on Superhome is: {#var#}. This code is valid for the next 10 minutes. Thank You, Super Home'
    },
    lastSmsDebug: getLastSmsDebug()
  });
};

// GET /api/debug/logs
const getDebugLogs = (req, res) => {
  res.json({ success: true, logs: debugLogs });
};

// POST /api/contact
const contact = ${extractHandler(3197, 3211)}

// POST /api/upload & /upload
const upload = (req, res) => {
  const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const host = req.get('host');
  const protocol = req.protocol;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('10.0.2.2');
  const serverBaseUrl = \`\${isLocal ? protocol : 'https'}://\${host}\`;
  const fileUrl = \`\${serverBaseUrl}/uploads/\${file.filename}\`;

  console.log(\`[Upload] Image uploaded successfully: \${file.filename} (field: \${file.fieldname})\`);
  res.json({
    success: true,
    file: {
      filename: file.filename,
      url: fileUrl,
      path: \`/uploads/\${file.filename}\`,
      size: file.size,
      mimetype: file.mimetype
    }
  });
};

// GET /api/app-version
const getAppVersion = ${extractHandler(14250, 14264)}

// POST /api/app-version
const updateAppVersion = ${extractHandler(14265, 14303)}

// POST /api/send-custom-sms
const sendCustomSms = ${extractHandler(14305, 14330)}

module.exports = {
  getDebugDb,
  getRootHealth,
  getSmsConfig,
  getDebugLogs,
  contact,
  upload,
  getAppVersion,
  updateAppVersion,
  sendCustomSms
};
`;
writeTargetFile('controllers/misc.controller.js', miscControllerContent);

const miscRoutesContent = `
const express = require('express');
const router = express.Router();
const miscController = require('../controllers/misc.controller');
const { generalUpload } = require('../middleware/upload.middleware');

router.get('/debug/db', miscController.getDebugDb);
router.get('/debug/sms-config', miscController.getSmsConfig);
router.get('/debug/logs', miscController.getDebugLogs);
router.post('/contact', miscController.contact);
router.post(['/upload', '/api/upload'], generalUpload.any(), miscController.upload);
router.get('/app-version', miscController.getAppVersion);
router.post('/app-version', miscController.updateAppVersion);
router.post('/send-custom-sms', miscController.sendCustomSms);

module.exports = router;
`;
writeTargetFile('routes/misc.routes.js', miscRoutesContent);

// ============================================================================
// 3. CATEGORY CONTROLLER & ROUTES (Categories, Subcategories, Banners)
// ============================================================================
console.log('Writing category controller and routes...');

const categoryControllerContent = `
const { DbLayer } = require('../services/dbLayer');
const { getLocalCategoryAssetUrl, getLocalBannerAssetUrl, resolveDynamicCategoryImageUrl, resolveDynamicBannerImageUrl } = require('../utils/imageHelpers');
const { fetchAdminBackendCategories, fetchAdminBackendSubcategories, fetchAdminBackendServices } = require('../services/adminBackend.service');
const { generateSubcategoriesForCategory, collectAllSubcategories } = require('../services/category.service');
const { localizeCategory } = require('../helpers/contentI18n');

// POST /api/categories
const createCategory = ${extractHandler(3249, 3264)}

// PUT /api/categories/:id
const updateCategory = ${extractHandler(3265, 3276)}

// DELETE /api/categories/:id
const deleteCategory = ${extractHandler(3277, 3288)}

// POST /api/banners
const createBanner = ${extractHandler(3289, 3299)}

// PUT /api/banners/:id
const updateBanner = ${extractHandler(3300, 3311)}

// DELETE /api/banners/:id
const deleteBanner = ${extractHandler(3312, 3323)}

// POST /api/services (admin)
const createService = ${extractHandler(3324, 3334)}

// PUT /api/services/:id (admin)
const updateService = ${extractHandler(3335, 3346)}

// DELETE /api/services/:id (admin)
const deleteService = ${extractHandler(3347, 3357)}

// GET /api/categories
const getCategories = ${extractHandler(3358, 3801)}

// POST /api/categories (alternate)
const createCategoryAlt = ${extractHandler(3802, 3819)}

// POST /api/subcategories
const createSubcategory = ${extractHandler(3820, 3839)}

// GET /api/categories/:id
const getCategoryById = ${extractHandler(3905, 3995)}

// GET /api/subcategories
const getSubcategories = ${extractHandler(3996, 4042)}

// GET /api/categories/:category/subcategories
const getCategorySubcategories = ${extractHandler(4043, 4148)}

// GET /api/banners
const getBanners = ${extractHandler(4149, 4224)}

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  createBanner,
  updateBanner,
  deleteBanner,
  createService,
  updateService,
  deleteService,
  getCategories,
  createCategoryAlt,
  createSubcategory,
  getCategoryById,
  getSubcategories,
  getCategorySubcategories,
  getBanners
};
`;
writeTargetFile('controllers/category.controller.js', categoryControllerContent);

const categoryRoutesContent = `
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

router.post('/banners', categoryController.createBanner);
router.put('/banners/:id', categoryController.updateBanner);
router.delete('/banners/:id', categoryController.deleteBanner);

router.post('/services', categoryController.createService);
router.put('/services/:id', categoryController.updateService);
router.delete('/services/:id', categoryController.deleteService);

router.get('/categories', categoryController.getCategories);
router.post('/subcategories', categoryController.createSubcategory);
router.get('/categories/:id', categoryController.getCategoryById);
router.get('/subcategories', categoryController.getSubcategories);
router.get('/categories/:category/subcategories', categoryController.getCategorySubcategories);
router.get('/banners', categoryController.getBanners);

module.exports = router;
`;
writeTargetFile('routes/category.routes.js', categoryRoutesContent);

// ============================================================================
// 4. SERVICE CONTROLLER & ROUTES (Services detail, trending, search)
// ============================================================================
console.log('Writing service controller and routes...');

const serviceControllerContent = `
const { DbLayer } = require('../services/dbLayer');
const { SERVICES_DATA, CATEGORIES_DATA } = require('../config/constants');
const { getLocalCategoryAssetUrl, getHdFallbackServiceImageUrl } = require('../utils/imageHelpers');
const { fetchAdminBackendServices, fetchAdminBackendCategories } = require('../services/adminBackend.service');
const { localizeService } = require('../helpers/contentI18n');
const { translate } = require('../helpers/translate');

// GET /api/services/trending
const getTrendingServices = ${extractHandler(4225, 4321)}

// GET /api/categories/:category/services
const getCategoryServices = ${extractHandler(4322, 4596)}

// GET /api/services
const getAllServices = ${extractHandler(4695, 4860)}

// GET /api/services/trending (alt)
const getTrendingServicesAlt = ${extractHandler(4861, 4921)}

// Service detail handler
${L(4922, 5046)}

// GET /api/search
const searchServices = ${extractHandler(5051, 5217)}

module.exports = {
  getTrendingServices,
  getCategoryServices,
  getAllServices,
  getTrendingServicesAlt,
  handleServiceDetail,
  searchServices
};
`;
writeTargetFile('controllers/service.controller.js', serviceControllerContent);

const serviceRoutesContent = `
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');

router.get('/services/trending', serviceController.getTrendingServices);
router.get('/categories/:category/services', serviceController.getCategoryServices);
router.get('/services', serviceController.getAllServices);
router.get('/services/detail/:title', serviceController.handleServiceDetail);
router.get('/services/detail', serviceController.handleServiceDetail);
router.get('/search', serviceController.searchServices);

module.exports = router;
`;
writeTargetFile('routes/service.routes.js', serviceRoutesContent);

// ============================================================================
// 5. POLICY CONTROLLER & ROUTES (Privacy, terms, about, refund)
// ============================================================================
console.log('Writing policy controller and routes...');

const policyControllerContent = `
const getPrivacyPolicy = ${extractHandler(5218, 5240)}

const getAbout = ${extractHandler(5241, 5256)}

const getPoliciesAbout = ${extractHandler(5257, 5260)}

const getTerms = ${extractHandler(5261, 5283)}

const getRefund = ${extractHandler(5284, 5307)}

module.exports = {
  getPrivacyPolicy,
  getAbout,
  getPoliciesAbout,
  getTerms,
  getRefund
};
`;
writeTargetFile('controllers/policy.controller.js', policyControllerContent);

const policyRoutesContent = `
const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policy.controller');

router.get('/policies/privacy', policyController.getPrivacyPolicy);
router.get('/about', policyController.getAbout);
router.get('/policies/about', policyController.getPoliciesAbout);
router.get('/policies/terms', policyController.getTerms);
router.get('/policies/refund', policyController.getRefund);

module.exports = router;
`;
writeTargetFile('routes/policy.routes.js', policyRoutesContent);

// ============================================================================
// 6. PAYMENT CONTROLLER & ROUTES
// ============================================================================
console.log('Writing payment controller and routes...');

const paymentControllerContent = `
const crypto = require('crypto');
const { DbLayer, draftOrders } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { isMockPaymentAllowed } = require('../utils/helpers');
const { translate } = require('../helpers/translate');

${L(5308, 5591)}

${L(5592, 5888)}

${L(5889, 6228)}

const paymentCod = ${extractHandler(6238, 6307)}

const createPayment = ${extractHandler(7008, 7088)}

module.exports = {
  handleVerifyPayment,
  handlePayPage,
  handlePaymentCallback,
  paymentCod,
  createPayment
};
`;
writeTargetFile('controllers/payment.controller.js', paymentControllerContent);

const paymentRoutesContent = `
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.get('/payments/pay/:orderId', paymentController.handlePayPage);
router.get('/payments/callback', paymentController.handlePaymentCallback);
router.get('/payments/verify', paymentController.handleVerifyPayment);
router.post('/payments/verify', paymentController.handleVerifyPayment);
router.get('/payments/verify/:orderId', paymentController.handleVerifyPayment);
router.post('/payments/verify/:orderId', paymentController.handleVerifyPayment);
router.post('/payments/cod/:orderId', paymentController.paymentCod);
router.post('/payments', paymentController.createPayment);

module.exports = router;
`;
writeTargetFile('routes/payment.routes.js', paymentRoutesContent);

// ============================================================================
// 7. WALLET CONTROLLER & ROUTES
// ============================================================================
console.log('Writing wallet controller and routes...');

const walletControllerContent = `
const { DbLayer } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');

const getBalance = ${extractHandler(6308, 6321)}

const addMoney = ${extractHandler(6322, 6350)}

const deductMoney = ${extractHandler(6351, 6383)}

const getHistory = ${extractHandler(6384, 6445)}

const getRules = ${extractHandler(7089, 7100)}

const calculateDiscount = ${extractHandler(7101, 7142)}

module.exports = {
  getBalance,
  addMoney,
  deductMoney,
  getHistory,
  getRules,
  calculateDiscount
};
`;
writeTargetFile('controllers/wallet.controller.js', walletControllerContent);

const walletRoutesContent = `
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');

router.get('/wallet/balance', walletController.getBalance);
router.post('/wallet/add', walletController.addMoney);
router.post('/wallet/deduct', walletController.deductMoney);
router.get('/wallet/history', walletController.getHistory);
router.get('/wallet/rules', walletController.getRules);
router.post('/wallet/calculate-discount', walletController.calculateDiscount);

module.exports = router;
`;
writeTargetFile('routes/wallet.routes.js', walletRoutesContent);

// ============================================================================
// 8. AMC CONTROLLER & ROUTES
// ============================================================================
console.log('Writing amc controller and routes...');

const amcControllerContent = `
const { DbLayer } = require('../services/dbLayer');
const { AMC_SUPPORTED_CATEGORIES } = require('../config/constants');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { getPhoneVariants, isMockPaymentAllowed } = require('../utils/helpers');

${L(6439, 6444)}

const getPlans = ${extractHandler(6446, 6471)}

const subscribe = ${extractHandler(6472, 6586)}

const getSubscriptions = ${extractHandler(6587, 6677)}

const renew = ${extractHandler(6678, 6716)}

const getPlansByCategory = ${extractHandler(6717, 6740)}

const planPropertyDetails = ${extractHandler(6741, 6819)}

${L(6820, 6959)}

module.exports = {
  getPlans,
  subscribe,
  getSubscriptions,
  renew,
  getPlansByCategory,
  planPropertyDetails,
  handlePostAmcBooking
};
`;
writeTargetFile('controllers/amc.controller.js', amcControllerContent);

const amcRoutesContent = `
const express = require('express');
const router = express.Router();
const amcController = require('../controllers/amc.controller');
const { amcUpload } = require('../middleware/upload.middleware');

router.get('/amc/plans', amcController.getPlans);
router.post('/amc/subscribe', amcUpload.fields([
  { name: 'propertyPhoto', maxCount: 1 },
  { name: 'propertyPdf', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), amcController.subscribe);
router.get('/amc/subscriptions', amcController.getSubscriptions);
router.post('/amc/renew', amcController.renew);
router.get('/amc/plans/:category', amcController.getPlansByCategory);
router.post('/amc/plan-property-details', amcController.planPropertyDetails);
router.post('/amc/book', amcController.handlePostAmcBooking);
router.post('/amc/bookings', amcController.handlePostAmcBooking);

module.exports = router;
`;
writeTargetFile('routes/amc.routes.js', amcRoutesContent);

// ============================================================================
// 9. CARD CONTROLLER & ROUTES
// ============================================================================
console.log('Writing card controller and routes...');

const cardControllerContent = `
const { DbLayer } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');

const getCards = ${extractHandler(6964, 6978)}

const createCard = ${extractHandler(6979, 7007)}

module.exports = {
  getCards,
  createCard
};
`;
writeTargetFile('controllers/card.controller.js', cardControllerContent);

const cardRoutesContent = `
const express = require('express');
const router = express.Router();
const cardController = require('../controllers/card.controller');

router.get('/cards', cardController.getCards);
router.post('/cards', cardController.createCard);

module.exports = router;
`;
writeTargetFile('routes/card.routes.js', cardRoutesContent);

// ============================================================================
// 10. REFERRAL CONTROLLER & ROUTES
// ============================================================================
console.log('Writing referral controller and routes...');

const referralControllerContent = `
const { DbLayer } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');

const lookup = ${extractHandler(7143, 7166)}

const apply = ${extractHandler(7167, 7228)}

module.exports = {
  lookup,
  apply
};
`;
writeTargetFile('controllers/referral.controller.js', referralControllerContent);

const referralRoutesContent = `
const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');

router.get('/referrals/lookup/:code', referralController.lookup);
router.post('/referrals/apply', referralController.apply);

module.exports = router;
`;
writeTargetFile('routes/referral.routes.js', referralRoutesContent);

// ============================================================================
// 11. BOOKING CONTROLLER & ROUTES
// ============================================================================
console.log('Writing booking controller and routes...');

const bookingControllerContent = `
const { DbLayer, draftOrders } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { getPhoneVariants, parseOrderNumbers, parseTimeRange, timesOverlap } = require('../utils/helpers');
const { getMysqlPool, getMysqlReady, getDbMode } = require('../config/db');
const { STATIC_BOOKING_SLOTS } = require('../config/constants');
const { translate } = require('../helpers/translate');

${L(7229, 7502)}

const getBookings = ${extractHandler(7507, 7528)}

const getAvailableDates = ${extractHandler(10226, 10248)}

${L(10278, 10334)}

module.exports = {
  handlePostBooking,
  getBookings,
  getAvailableDates,
  handleGetAvailableSlots
};
`;
writeTargetFile('controllers/booking.controller.js', bookingControllerContent);

const bookingRoutesContent = `
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');

router.post(['/bookings', '/booking'], bookingController.handlePostBooking);
router.get('/bookings', bookingController.getBookings);
router.get('/booking/available-dates', bookingController.getAvailableDates);
router.get([
  '/booking/available-slots',
  '/booking/available-solts',
  '/booking/available-slot',
  '/booking/available-solt'
], bookingController.handleGetAvailableSlots);

module.exports = router;
`;
writeTargetFile('routes/booking.routes.js', bookingRoutesContent);

// ============================================================================
// 12. ADDRESS CONTROLLER & ROUTES
// ============================================================================
console.log('Writing address controller and routes...');

const addressControllerContent = `
const { DbLayer } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { localizeAddress } = require('../helpers/contentI18n');
const { sanitizeAddressObj } = require('../utils/helpers');
const { translate } = require('../helpers/translate');

${L(7529, 7587)}

const getAddresses = ${extractHandler(7592, 7608)}

module.exports = {
  handleAddAddress,
  getAddresses
};
`;
writeTargetFile('controllers/address.controller.js', addressControllerContent);

const addressRoutesContent = `
const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');

router.post(['/addresses', '/address'], addressController.handleAddAddress);
router.get('/addresses', addressController.getAddresses);

module.exports = router;
`;
writeTargetFile('routes/address.routes.js', addressRoutesContent);

// ============================================================================
// 13. CHECKOUT CONTROLLER & ROUTES
// ============================================================================
console.log('Writing checkout controller and routes...');

const checkoutControllerContent = `
const { DbLayer, draftOrders } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { getMysqlPool, getMysqlReady, getDbMode } = require('../config/db');
const { STATIC_BOOKING_SLOTS, SERVICES_DATA } = require('../config/constants');
const {
  getCanonicalPhone,
  getPhoneVariants,
  normalizeString,
  normalizeDate,
  normalizeTimeSlot,
  sanitizeAddressObj,
  sanitizeUserObj,
  sanitizeProductObj,
  parseTimeRange,
  timesOverlap,
  parseOrderNumbers
} = require('../utils/helpers');
const { getHdFallbackServiceImageUrl, getLocalCategoryAssetUrl } = require('../utils/imageHelpers');
const { fetchAdminBackendServices } = require('../services/adminBackend.service');
const { getServiceCategory } = require('../services/category.service');
const { translate } = require('../helpers/translate');

${L(7609, 8025)}

${L(8045, 8207)}

${L(8396, 8563)}

${L(8589, 9328)}

module.exports = {
  handlePostCheckout,
  handleGetCheckout
};
`;
writeTargetFile('controllers/checkout.controller.js', checkoutControllerContent);

const checkoutRoutesContent = `
const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout.controller');

router.post(['/checkout', '/checkout-api'], checkoutController.handlePostCheckout);
router.get([
  '/checkout',
  '/checkout-api',
  '/checkout/:userId',
  '/checkout-api/:userId'
], checkoutController.handleGetCheckout);

module.exports = router;
`;
writeTargetFile('routes/checkout.routes.js', checkoutRoutesContent);

// ============================================================================
// 14. CART CONTROLLER & ROUTES
// ============================================================================
console.log('Writing cart controller and routes...');

const cartControllerContent = `
const { DbLayer, memoryCart } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { translate } = require('../helpers/translate');
const { resolveDynamicServiceImageUrl } = require('../utils/imageHelpers');

${L(9339, 9507)}

${L(9514, 9665)}

// POST /api/cart/add
const addToCart = ${extractHandler(9667, 9723)}

// GET /api/cart
const getCart = ${extractHandler(9724, 9740)}

// PUT /api/cart/update-quantity
const updateQuantity = ${extractHandler(9741, 9779)}

// DELETE /api/cart/remove/:serviceId
const removeItem = ${extractHandler(9780, 9806)}

// DELETE /api/cart/clear
const clearCart = ${extractHandler(9807, 9825)}

// Secondary cart endpoints (lines 14144-14249)
const getCartAlt = ${extractHandler(14144, 14160)}
const addToCartAlt = ${extractHandler(14161, 14186)}
const updateCartAlt = ${extractHandler(14187, 14212)}
const clearCartAlt = ${extractHandler(14213, 14227)}
const removeItemAlt = ${extractHandler(14228, 14249)}

module.exports = {
  addToCart,
  getCart,
  updateQuantity,
  removeItem,
  clearCart,
  getCartAlt,
  addToCartAlt,
  updateCartAlt,
  clearCartAlt,
  removeItemAlt
};
`;
writeTargetFile('controllers/cart.controller.js', cartControllerContent);

const cartRoutesContent = `
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

router.post('/cart/add', cartController.addToCart);
router.get('/cart', cartController.getCart);
router.put('/cart/update-quantity', cartController.updateQuantity);
router.delete('/cart/remove/:serviceId', cartController.removeItem);
router.delete('/cart/clear', cartController.clearCart);

// Additional cart routes
router.post('/cart/update', cartController.updateCartAlt);
router.delete('/cart', cartController.clearCartAlt);
router.delete('/cart/:productId', cartController.removeItemAlt);

module.exports = router;
`;
writeTargetFile('routes/cart.routes.js', cartRoutesContent);

// ============================================================================
// 15. ORDER CONTROLLER & ROUTES
// ============================================================================
console.log('Writing order controller and routes...');

const orderControllerContent = `
const { DbLayer } = require('../services/dbLayer');
const { getAuthenticatedUser } = require('../middleware/auth.middleware');
const { parseOrderNumbers } = require('../utils/helpers');
const { translate } = require('../helpers/translate');

const getOrders = ${extractHandler(9826, 9940)}

const getOrderById = ${extractHandler(9941, 10018)}

const createOrder = ${extractHandler(10019, 10065)}

${L(10066, 10124)}

const cancelOrderById = ${extractHandler(10129, 10154)}

const getBookingFlow = ${extractHandler(10155, 10183)}

const updateBookingFlow = ${extractHandler(10184, 10225)}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  handleCancelOrder,
  cancelOrderById,
  getBookingFlow,
  updateBookingFlow
};
`;
writeTargetFile('controllers/order.controller.js', orderControllerContent);

const orderRoutesContent = `
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrderById);
router.post('/orders', orderController.createOrder);
router.post([
  '/orders/cancel',
  '/cancel-order',
  '/order/cancel'
], orderController.handleCancelOrder);
router.put('/orders/:id/cancel', orderController.cancelOrderById);
router.get('/orders/:id/booking-flow', orderController.getBookingFlow);
router.put('/orders/:id/booking-flow', orderController.updateBookingFlow);

module.exports = router;
`;
writeTargetFile('routes/order.routes.js', orderRoutesContent);

// ============================================================================
// 16. GEO CONTROLLER & ROUTES
// ============================================================================
console.log('Writing geo controller and routes...');

const geoControllerContent = `
const { countriesList } = require('../config/constants');
const { translate } = require('../helpers/translate');

const getCountries = ${extractHandler(13919, 13953)}

const getStates = ${extractHandler(13954, 13982)}

const getCities = ${extractHandler(13983, 14051)}

const getLocalities = ${extractHandler(14052, 14143)}

module.exports = {
  getCountries,
  getStates,
  getCities,
  getLocalities
};
`;
writeTargetFile('controllers/geo.controller.js', geoControllerContent);

const geoRoutesContent = `
const express = require('express');
const router = express.Router();
const geoController = require('../controllers/geo.controller');

router.get('/countries', geoController.getCountries);
router.get('/states', geoController.getStates);
router.get('/cities', geoController.getCities);
router.get('/localities', geoController.getLocalities);

module.exports = router;
`;
writeTargetFile('routes/geo.routes.js', geoRoutesContent);

// ============================================================================
// 17. APP.JS
// ============================================================================
console.log('Writing app.js...');

const appContent = `
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Multilingual System Middleware & Routes (Pre-existing)
const languageMiddleware = require('./middleware/language');
const languageRouter = require('./routes/language');
app.use(languageMiddleware);
app.use('/api', languageRouter);

// Static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Uploads proxy middleware
const { uploadsProxyMiddleware } = require('./middleware/upload.middleware');
app.use('/uploads', uploadsProxyMiddleware);

// Root health check
const miscController = require('./controllers/misc.controller');
app.get('/', miscController.getRootHealth);

// API Routes mounting
app.use('/api', require('./routes/auth.routes'));
app.use('/api', require('./routes/misc.routes'));
app.use('/api', require('./routes/category.routes'));
app.use('/api', require('./routes/service.routes'));
app.use('/api', require('./routes/policy.routes'));
app.use('/api', require('./routes/payment.routes'));
app.use('/api', require('./routes/wallet.routes'));
app.use('/api', require('./routes/amc.routes'));
app.use('/api', require('./routes/card.routes'));
app.use('/api', require('./routes/referral.routes'));
app.use('/api', require('./routes/booking.routes'));
app.use('/api', require('./routes/address.routes'));
app.use('/api', require('./routes/checkout.routes'));
app.use('/api', require('./routes/cart.routes'));
app.use('/api', require('./routes/order.routes'));
app.use('/api', require('./routes/geo.routes'));

module.exports = app;
`;
writeTargetFile('app.js', appContent);

// ============================================================================
// 18. SERVER.JS
// ============================================================================
console.log('Writing server.js...');

const serverContent = `
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const app = require('./app');
const { PORT } = require('./config/constants');
const { initMySqlDbWithRetry, initJsonDb, getMysqlReady, getMysqlPool, setDbMode, setMysqlReady } = require('./config/db');
const { runContentI18nMigration } = require('./helpers/contentI18n');

(async () => {
  const mysqlSuccess = await initMySqlDbWithRetry();
  if (!mysqlSuccess) {
    setDbMode("json");
    setMysqlReady(false);
    initJsonDb();
  }
  const poolForExtras = getMysqlReady() ? getMysqlPool() : null;
  if (getMysqlReady() && poolForExtras) {
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

  app.listen(PORT, () => {
    console.log(\`Backend server successfully listening at http://localhost:\${PORT}\`);
  });
})();
`;
writeTargetFile('server.js', serverContent);

console.log('Phase 2 completed successfully!');
