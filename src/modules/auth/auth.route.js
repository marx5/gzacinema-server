const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const authController = require('./auth.controller');
const validate = require('../../core/middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('./auth.validation');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { status: 'error', message: 'Too many login attempts, please try again after 15 minutes.' }
});

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

module.exports = router;