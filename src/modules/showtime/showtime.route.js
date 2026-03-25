const express = require('express');
const router = express.Router();

const showtimeController = require('./showtime.controller');
const { verifyToken, verifyAdmin } = require('../../core/middlewares/auth.middleware');

router.use(verifyToken, verifyAdmin);
router.post('/', showtimeController.addShowtime);

module.exports = router;