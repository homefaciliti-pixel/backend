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
