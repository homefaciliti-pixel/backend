const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');

router.get('/services/trending', serviceController.getTrendingServices);
router.get('/categories/:category/services', serviceController.getCategoryServices);
router.get('/services', serviceController.getAllServices);
router.get('/services/detail/:title', serviceController.handleServiceDetail);
router.get('/services/detail', serviceController.handleServiceDetail);
router.get('/search', serviceController.searchServices);

module.exports = router;
