const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

router.post('/cart/add', cartController.addToCart);
router.get('/cart', cartController.getCart);
router.put('/cart/update-quantity', cartController.updateQuantity);
router.delete('/cart/remove/:serviceId', cartController.removeItem);
router.delete('/cart/clear', cartController.clearCart);

router.post('/cart/update', cartController.updateCartAlt);
router.delete('/cart', cartController.clearCartAlt);
router.delete('/cart/:productId', cartController.removeItemAlt);

module.exports = router;
