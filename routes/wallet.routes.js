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
