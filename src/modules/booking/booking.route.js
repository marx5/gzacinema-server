const express = require('express');
const router = express.Router();

const bookingController = require('./booking.controller');
const { verifyToken, verifyAdmin } = require('../../core/middlewares/auth.middleware');
const validate = require('../../core/middlewares/validate.middleware');
const { holdSeatSchema, unholdSeatSchema } = require('./booking.validation');

router.use(verifyToken);

router.get('/showtime/:showtimeId/seats', bookingController.getSeats);
router.post('/hold', validate(holdSeatSchema), bookingController.holdSeat);
router.post('/unhold', validate(unholdSeatSchema), bookingController.unholdSeat);
router.get('/', verifyAdmin, bookingController.getAllForAdmin);

module.exports = router;