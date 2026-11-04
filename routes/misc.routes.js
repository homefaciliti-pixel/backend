const express = require('express');
const router = express.Router();
const miscController = require('../controllers/misc.controller');
const { generalUpload } = require('../middleware/upload.middleware');

router.get('/debug/db', miscController.getDebugDb);
router.get('/debug/sms-config', miscController.getSmsConfig);
router.get('/debug/logs', miscController.getDebugLogs);
router.post('/contact', miscController.contact);
router.post('/upload', generalUpload.any(), miscController.upload);
router.get('/app-version', miscController.getAppVersion);
router.post('/app-version', miscController.updateAppVersion);
router.post('/send-custom-sms', miscController.sendCustomSms);

module.exports = router;
