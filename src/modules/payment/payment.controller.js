const paymentService = require('./payment.service');

const createPaymentUrl = async (req, res) => {
    try {
        const userId = req.user.id;
        const { showtimeId, seatIds } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

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
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
}

const vnpayIpn = async (req, res) => {
    try {
        const vnp_Params = req.query;
        const result = await paymentService.verifyIpn(vnp_Params);
        res.status(200).json(result);
    } catch (error) {
        console.error('VNPay IPN Error:', error);
        res.status(500).json({
            RspCode: '99',
            Message: 'Unknown error'
        });
    }
}

module.exports = {
    createPaymentUrl,
    vnpayIpn
}