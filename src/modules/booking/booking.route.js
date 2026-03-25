const express = require('express');
const router = express.Router();

const bookingController = require('./booking.controller');
const { verifyToken } = require('../../core/middlewares/auth.middleware');

router.use(verifyToken);

router.get('/showtime/:showtimeId/seats', bookingController.getSeats);
router.post('/hold', bookingController.holdSeat);
router.post('/unhold', bookingController.unholdSeat);

module.exports = router;