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
