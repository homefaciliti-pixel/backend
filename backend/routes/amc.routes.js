const express = require('express');
const router = express.Router();
const amcController = require('../controllers/amc.controller');
const { amcUpload } = require('../middleware/upload.middleware');

router.get('/amc/plans', amcController.getPlans);
router.post('/amc/subscribe', amcUpload.fields([
  { name: 'propertyPhoto', maxCount: 1 },
  { name: 'propertyPdf', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]), amcController.subscribe);
router.get('/amc/subscriptions', amcController.getSubscriptions);
router.post('/amc/renew', amcController.renew);
router.get('/amc/plans/:category', amcController.getPlansByCategory);
router.post('/amc/plan-property-details', amcController.planPropertyDetails);
router.post('/amc/book', amcController.handlePostAmcBooking);
router.post('/amc/bookings', amcController.handlePostAmcBooking);

module.exports = router;
