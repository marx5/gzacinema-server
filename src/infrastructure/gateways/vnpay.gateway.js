const moment = require('moment');
const crypto = require('crypto');
const qs = require('qs');
const AppError = require('../../core/utils/AppError');

const VNPAY_UTC_OFFSET_MINUTES = 7 * 60;

/**
 * VNPay Payment Gateway Adapter
 * Đóng gói toàn bộ logic giao tiếp với VNPay (URL builder, Hash security, IPN verification).
 */
class VNPayGateway {
    constructor() {
        this.tmnCode = process.env.VNP_TMNCODE;
        this.secretKey = process.env.VNP_HASHSECRET;
        this.vnpUrl = process.env.VNP_URL;
        this.returnUrl = process.env.VNP_RETURN_URL;
    }

    _validateConfig() {
        const requiredVars = ['VNP_TMNCODE', 'VNP_HASHSECRET', 'VNP_URL', 'VNP_RETURN_URL'];
        const missingVars = requiredVars.filter((key) => !process.env[key]);

        if (missingVars.length > 0) {
            throw new AppError(`Missing VNPay configuration: ${missingVars.join(', ')}`, 500);
        }
    }

    _getDateRange() {
        const vnNow = moment().utcOffset(VNPAY_UTC_OFFSET_MINUTES);
        return {
            createDate: vnNow.format('YYYYMMDDHHmmss'),
            expireDate: vnNow.clone().add(15, 'minutes').format('YYYYMMDDHHmmss')
        };
    }

    _sortObject(obj) {
        const sorted = {};
        const str = [];
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (let key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
        }
        return sorted;
    }

    _generateSecureHash(vnpParams, secretKey) {
        const signData = qs.stringify(vnpParams, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    }

    /**
     * Tạo URL thanh toán VNPay
     * @param {Object} params
     * @param {string|number} params.bookingId
     * @param {number} params.amount
     * @param {string} params.ipAddr
     * @returns {string} Payment URL
     */
    createPaymentUrl({ bookingId, amount, ipAddr }) {
        this._validateConfig();

        const { createDate, expireDate } = this._getDateRange();
        const tmnCode = process.env.VNP_TMNCODE;
        const secretKey = process.env.VNP_HASHSECRET;
        let vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURN_URL;

        let vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: bookingId,
            vnp_OrderInfo: `Thanh toan ve phim: ${bookingId}`,
            vnp_OrderType: 'other',
            vnp_Amount: Math.round(amount * 100),
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDate
        };

        vnpParams = this._sortObject(vnpParams);
        vnpParams.vnp_SecureHash = this._generateSecureHash(vnpParams, secretKey);

        vnpUrl += '?' + qs.stringify(vnpParams, { encode: false });
        return vnpUrl;
    }

    /**
     * Xác thực chữ ký và trích xuất dữ liệu IPN từ VNPay
     * @param {Object} rawParams 
     * @returns {{ isValid: boolean, bookingId: string, responseCode: string, transactionStatus: string, paidAmount: number }}
     */
    verifyIpnSignature(rawParams) {
        this._validateConfig();

        const vnpParams = { ...rawParams };
        const secureHash = vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHashType'];

        const sortedParams = this._sortObject(vnpParams);
        const secretKey = process.env.VNP_HASHSECRET;
        const signed = this._generateSecureHash(sortedParams, secretKey);

        const isValid = secureHash === signed;

        return {
            isValid,
            bookingId: rawParams['vnp_TxnRef'],
            responseCode: rawParams['vnp_ResponseCode'],
            transactionStatus: rawParams['vnp_TransactionStatus'],
            paidAmount: Number(rawParams['vnp_Amount'])
        };
    }
}

module.exports = new VNPayGateway();
