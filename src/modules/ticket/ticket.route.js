const express = require('express');
const router = express.Router();

const ticketController = require('./ticket.controller');
const { verifyToken, verifyStaff } = require('../../core/middlewares/auth.middleware');

router.put('/:id/checkin', verifyToken, verifyStaff, ticketController.checkIn);

module.exports = router;