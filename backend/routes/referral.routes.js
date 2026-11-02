const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');

router.get('/referrals/lookup/:code', referralController.lookup);
router.post('/referrals/apply', referralController.apply);

module.exports = router;
