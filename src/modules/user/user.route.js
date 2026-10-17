const express = require('express');
const router = express.Router();

const userController = require('./user.controller');
const { verifyToken, verifyAdmin } = require('../../core/middlewares/auth.middleware');
const validate = require('../../core/middlewares/validate.middleware');
const {
    updateProfileSchema,
    createUserSchema,
    adminUpdateUserSchema
} = require('./user.validation');

router.get('/profile', verifyToken, userController.getMyProfile);
router.get('/me', verifyToken, userController.getMyProfile);
router.get('/history', verifyToken, userController.getMyHistory);
router.put('/profile', verifyToken, validate(updateProfileSchema), userController.updateMyProfile);
router.put('/me', verifyToken, validate(updateProfileSchema), userController.updateMyProfile);

// Admin User Management Routes
router.get('/', verifyToken, verifyAdmin, userController.getAllUsers);
router.post('/', verifyToken, verifyAdmin, validate(createUserSchema), userController.createUser);
router.put('/:id', verifyToken, verifyAdmin, validate(adminUpdateUserSchema), userController.updateUser);
router.delete('/:id', verifyToken, verifyAdmin, userController.deleteUser);

module.exports = router;