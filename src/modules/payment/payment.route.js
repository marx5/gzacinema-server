const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { verifyToken } = require('../../core/middlewares/auth.middleware');
const validate = require('../../core/middlewares/validate.middleware');
const { createPaymentSchema } = require('./payment.validation');

router.get('/vnpay_ipn', paymentController.vnpayIpn);

router.use(verifyToken);
router.post('/create-payment-url', validate(createPaymentSchema), paymentController.createPaymentUrl);

module.exports = router;