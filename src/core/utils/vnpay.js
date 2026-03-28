const moment = require('moment');
const crypto = require('crypto');
const qs = require('qs');
const AppError = require('./AppError');

const VNPAY_UTC_OFFSET_MINUTES = 7 * 60;

const getVNPayDateRange = () => {
    const vnNow = moment().utcOffset(VNPAY_UTC_OFFSET_MINUTES);
    return {
        createDate: vnNow.format('YYYYMMDDHHmmss'),
        expireDate: vnNow.clone().add(15, 'minutes').format('YYYYMMDDHHmmss')
    };
};

const validateVNPayConfig = () => {
    const requiredVars = ['VNP_TMNCODE', 'VNP_HASHSECRET', 'VNP_URL', 'VNP_RETURN_URL'];
    const missingVars = requiredVars.filter((key) => !process.env[key]);

    if (missingVars.length > 0) {
        throw new AppError(`Missing VNPay configuration: ${missingVars.join(', ')}`, 500);
    }
};

const sortObject = (obj) => {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
};

const generateSecureHash = (vnp_Params, secretKey) => {
    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    return hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
}

module.exports = {
    getVNPayDateRange,
    validateVNPayConfig,
    sortObject,
    generateSecureHash
};