const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');

router.post(['/bookings', '/booking'], bookingController.handlePostBooking);
router.get('/bookings', bookingController.getBookings);
router.get('/booking/available-dates', bookingController.getAvailableDates);
router.get([
  '/booking/available-slots',
  '/booking/available-solts',
  '/booking/available-slot',
  '/booking/available-solt'
], bookingController.handleGetAvailableSlots);

module.exports = router;
