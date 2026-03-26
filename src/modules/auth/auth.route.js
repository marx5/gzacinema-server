const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const validate = require('../../core/middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('./auth.validation');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

module.exports = router;