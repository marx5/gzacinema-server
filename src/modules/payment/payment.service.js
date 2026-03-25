const { sequelize, Showtime, Room, Seat, Ticket, Booking } = require('../../models');
const redis = require('../../config/redis');
const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');

function sortObject(obj) {
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
}

const createVNPayUrl = async (userId, showtimeId, seatIds, ipAddr) => {
    const showtime = await Showtime.findByPk(showtimeId);
    if (!showtime) throw new Error('showtime not found');

    for (const seatId of seatIds) {
        const holder = await redis.get(`hold_seat:${showtimeId}:${seatId}`);
        if (holder !== userId) {
            throw new Error(`Seat ${seatId} is not held by you or the hold has expired. Please hold the seat again before checkout.`);
        }
    }

    const seats = await Seat.findAll({ where: { id: seatIds } });
    let totalAmount = 0;
    const ticketDataToInsert = [];

    seats.forEach(seat => {
        let seatPrice = parseFloat(showtime.base_price);
        if (seat.type === 'vip') seatPrice += 20000;
        if (seat.type === 'sweetbox') seatPrice += 50000;
        totalAmount += seatPrice;

        ticketDataToInsert.push({
            seat_id: seat.id,
            price: seatPrice,
            status: 'valid'
        });
    });

    const t = await sequelize.transaction();
    try {
        const newBooking = await Booking.create({
            user_id: userId,
            showtime_id: showtimeId,
            total_amount: totalAmount,
            status: 'pending'
        }, { transaction: t });

        const finalTicketData = ticketDataToInsert.map(ticket => ({
            ...ticket,
            booking_id: newBooking.id
        }));
        await Ticket.bulkCreate(finalTicketData, { transaction: t });
        await t.commit();

        for (const seatId of seatIds) {
            await redis.expire(`hold_seat:${showtimeId}:${seatId}`, 15 * 60);
        }

        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        let expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');
        let tmnCode = process.env.VNP_TMNCODE;
        let secretKey = process.env.VNP_HASHSECRET;
        let vnpUrl = process.env.VNP_URL;
        let returnUrl = process.env.VNP_RETURN_URL;

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = newBooking.id;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan ve phim: ' + newBooking.id;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = totalAmount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        vnp_Params['vnp_ExpireDate'] = expireDate;

        vnp_Params = sortObject(vnp_Params);

        let signData = qs.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;

        vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

        return {
            paymentUrl: vnpUrl,
            bookingId: newBooking.id
        };

    } catch (error) {
        await t.rollback();
        throw new Error('Payment initialization failed: ' + error.message);
    }
}

const verifyIpn = async (vnp_Params) => {
    let secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    let secretKey = process.env.VNP_HASHSECRET;
    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
        let bookingId = vnp_Params['vnp_TxnRef'];
        let rspCode = vnp_Params['vnp_ResponseCode'];

        const booking = await Booking.findByPk(bookingId, {
            include: [{
                model: Ticket,
                as: 'tickets'
            }]
        });
        if (!booking) return {
            RspCode: '01',
            Message: 'Order not found'
        };

        if (booking.status !== 'pending') {
            return {
                RspCode: '02',
                Message: 'Order already confirmed'
            };
        }

        const showtimeId = booking.showtime_id;
        const seatIds = booking.tickets.map(t => t.seat_id);
        const redisKeysToDelete = seatIds.map(seatId => `hold_seat:${showtimeId}:${seatId}`);

        if (rspCode === '00') {
            booking.status = 'paid';
            await booking.save();
            await redis.del(redisKeysToDelete);
            return {
                RspCode: '00',
                Message: 'Confirm Success'
            };
        } else {
            booking.status = 'cancelled';
            await booking.save();
            await redis.del(redisKeysToDelete);
            return {
                RspCode: '00',
                Message: 'Payment failed, order cancelled'
            };
        }
    } else {
        return {
            RspCode: '97',
            Message: 'Checksum failed'
        };
    }
}

module.exports = {
    createVNPayUrl,
    verifyIpn
}