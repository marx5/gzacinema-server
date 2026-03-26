const express = require('express');
const router = express.Router();

const bookingController = require('./booking.controller');
const { verifyToken, verifyAdmin } = require('../../core/middlewares/auth.middleware');

router.use(verifyToken);

router.get('/showtime/:showtimeId/seats', bookingController.getSeats);
router.post('/hold', bookingController.holdSeat);
router.post('/unhold', bookingController.unholdSeat);
router.get('/', verifyAdmin, bookingController.getAllForAdmin);

module.exports = router;