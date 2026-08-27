const express = require('express');
const router = express.Router();

const userController = require('./user.controller');
const { verifyToken } = require('../../core/middlewares/auth.middleware');

router.get('/profile', verifyToken, userController.getMyProfile);
router.get('/me', verifyToken, userController.getMyProfile);
router.get('/history', verifyToken, userController.getMyHistory);
router.put('/profile', verifyToken, userController.updateMyProfile);
router.put('/me', verifyToken, userController.updateMyProfile);

module.exports = router;