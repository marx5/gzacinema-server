const express = require('express');
const router = express.Router();

const userController = require('./user.controller');
const { verifyToken } = require('../../core/middlewares/auth.middleware');

router.get('/me', verifyToken, userController.getMyProfile);
router.get('/history', verifyToken, userController.getMyHistory);

module.exports = router;