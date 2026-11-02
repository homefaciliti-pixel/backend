const express = require('express');
const router = express.Router();
const geoController = require('../controllers/geo.controller');

router.get('/countries', geoController.getCountries);
router.get('/states', geoController.getStates);
router.get('/cities', geoController.getCities);
router.get('/localities', geoController.getLocalities);

module.exports = router;
