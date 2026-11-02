const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');

router.post(['/addresses', '/address'], addressController.handleAddAddress);
router.get('/addresses', addressController.getAddresses);

module.exports = router;
