const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { verifyToken } = require('../../core/middlewares/auth.middleware');

router.get('/vnpay_ipn', paymentController.vnpayIpn);

router.use(verifyToken);
router.post('/create-payment-url', paymentController.createPaymentUrl);

module.exports = router;