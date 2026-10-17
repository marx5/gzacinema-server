const express = require('express');
const router = express.Router();

const userController = require('./user.controller');
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const validate = require('../../core/middlewares/validate.middleware');
const { updateProfileSchema } = require('./user.validation');

router.get('/profile', verifyToken, userController.getMyProfile);
router.get('/me', verifyToken, userController.getMyProfile);
router.get('/history', verifyToken, userController.getMyHistory);
router.put('/profile', verifyToken, validate(updateProfileSchema), userController.updateMyProfile);
router.put('/me', verifyToken, validate(updateProfileSchema), userController.updateMyProfile);

module.exports = router;