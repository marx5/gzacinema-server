const express = require('express');
const router = express.Router();

const statisticController = require('./statistic.controller');
const { verifyToken, verifyAdmin } = require('../../core/middlewares/auth.middleware');

router.use(verifyToken, verifyAdmin);

router.get('/dashboard', statisticController.getDashboard);

module.exports = router;