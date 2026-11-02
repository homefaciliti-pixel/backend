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
