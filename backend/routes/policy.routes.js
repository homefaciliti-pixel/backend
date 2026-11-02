const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policy.controller');

router.get('/policies/privacy', policyController.getPrivacyPolicy);
router.get('/about', policyController.getAbout);
router.get('/policies/about', policyController.getPoliciesAbout);
router.get('/policies/terms', policyController.getTerms);
router.get('/policies/refund', policyController.getRefund);

module.exports = router;
