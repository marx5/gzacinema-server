const express = require('express');
const router = express.Router();

const showtimeController = require('./showtime.controller');
const { verifyToken, verifyAdmin } = require('../../core/middlewares/auth.middleware');
const validate = require('../../core/middlewares/validate.middleware');
const { createShowtimeSchema } = require('../showtime/showtime.validation');

router.use(verifyToken, verifyAdmin);
router.post('/', validate(createShowtimeSchema), showtimeController.addShowtime);
router.get('/', showtimeController.getAllForAdmin);
router.delete('/:id', showtimeController.deleteShowtime);

module.exports = router;