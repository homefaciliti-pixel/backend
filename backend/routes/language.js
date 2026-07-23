const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');

router.get('/language/:lang', languageController.getTranslations);
router.post('/language/upsert', languageController.upsertTranslation);

module.exports = router;
