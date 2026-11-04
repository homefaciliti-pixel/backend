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
