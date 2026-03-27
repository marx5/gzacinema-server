const paymentService = require('./payment.service');
const catchAsync = require('../../core/utils/catchAsync');

const normalizeClientIp = (req) => {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const rawIp = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : (xForwardedFor || req.socket.remoteAddress || '127.0.0.1');

    const firstIp = String(rawIp).split(',')[0].trim();
    if (firstIp.startsWith('::ffff:')) {
        return firstIp.replace('::ffff:', '');
    }

    if (firstIp === '::1') {
        return '127.0.0.1';
    }

    return firstIp;
};

const createPaymentUrl = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { showtimeId, seatIds } = req.body;
    const ipAddr = normalizeClientIp(req);

    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid data provided'
        });
    }

    const result = await paymentService.createVNPayUrl(userId, showtimeId, seatIds, ipAddr);

    res.status(200).json({
        status: 'success',
        message: 'Payment URL created successfully',
        data: result
    });
})

const vnpayIpn = catchAsync(async (req, res) => {
    const vnp_Params = req.query;
    const result = await paymentService.verifyIpn(vnp_Params);
    res.status(200).json(result);
});

module.exports = {
    createPaymentUrl,
    vnpayIpn
}