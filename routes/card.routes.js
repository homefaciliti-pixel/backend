const express = require('express');
const router = express.Router();
const cardController = require('../controllers/card.controller');

router.get('/cards', cardController.getCards);
router.post('/cards', cardController.createCard);

module.exports = router;
