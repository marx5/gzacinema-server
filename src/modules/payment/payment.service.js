const seatRepository = require('../booking/infrastructure/seat.repository');
const bookingRepository = require('../booking/infrastructure/booking.repository');
const { calculateSeatPrice } = require('../booking/domain/seatPricing');
const redisAdapter = require('../../infrastructure/cache/redis.adapter');
const vnpayGateway = require('../../infrastructure/gateways/vnpay.gateway');
const eventBus = require('../../core/events/eventBus');
const DomainEvents = require('../../core/events/domainEvents');
const AppError = require('../../core/utils/AppError');

const PAYMENT_HOLD_EXTEND_SECONDS = 15 * 60; // 15 phút khi chuyển sang cổng thanh toán

const createVNPayUrl = async (userId, showtimeId, seatIds, ipAddr) => {
    const showtime = await seatRepository.findShowtimeWithRoom(showtimeId);
    if (!showtime) throw new AppError('Showtime not found', 404);

    // Kiểm tra tất cả ghế có đang được giữ bởi chính user không
    for (const seatId of seatIds) {
        const holder = await redisAdapter.get(`hold_seat:${showtimeId}:${seatId}`);
        if (holder !== userId) {
            throw new AppError(
                `Seat ${seatId} is not held by you or the hold has expired. Please hold the seat again before checkout.`,
                400
            );
        }
    }

    const seats = await seatRepository.findSeatsByIds(seatIds);
    let totalAmount = 0;
    const ticketDataToInsert = [];

    seats.forEach((seat) => {
        const seatPrice = calculateSeatPrice(showtime.base_price, seat.type);
        totalAmount += seatPrice;

        ticketDataToInsert.push({
            seat_id: seat.id,
            price: seatPrice,
            status: 'valid'
        });
    });

    try {
        const newBooking = await bookingRepository.createBookingWithTickets({
            userId,
            showtimeId,
            totalAmount,
            ticketsData: ticketDataToInsert
        });

        // Gia hạn giữ ghế trong Redis khi user chuyển sang trang VNPay
        for (const seatId of seatIds) {
            await redisAdapter.expire(`hold_seat:${showtimeId}:${seatId}`, PAYMENT_HOLD_EXTEND_SECONDS);
        }

        const paymentUrl = vnpayGateway.createPaymentUrl({
            bookingId: newBooking.id,
            amount: totalAmount,
            ipAddr
        });

        return {
            paymentUrl,
            bookingId: newBooking.id
        };
    } catch (error) {
        throw new AppError('Payment initialization failed: ' + error.message, 500);
    }
};

const verifyIpn = async (vnp_Params) => {
    const ipnData = vnpayGateway.verifyIpnSignature(vnp_Params);

    if (!ipnData.isValid) {
        return {
            RspCode: '97',
            Message: 'Checksum failed'
        };
    }

    const { bookingId, responseCode: rspCode, transactionStatus, paidAmount } = ipnData;

    const booking = await bookingRepository.findBookingByIdWithTickets(bookingId);
    if (!booking) {
        return {
            RspCode: '01',
            Message: 'Order not found'
        };
    }

    const expectedAmount = Math.round(Number(booking.total_amount) * 100);
    if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
        return {
            RspCode: '04',
            Message: 'Invalid amount'
        };
    }

    if (booking.status !== 'pending') {
        return {
            RspCode: '02',
            Message: 'Order already confirmed'
        };
    }

    const showtimeId = booking.showtime_id;
    const seatIds = booking.tickets.map((t) => t.seat_id);
    const redisKeysToDelete = seatIds.map((seatId) => `hold_seat:${showtimeId}:${seatId}`);

    if (rspCode === '00' && transactionStatus === '00') {
        await bookingRepository.markBookingPaid(booking);
        await redisAdapter.del(redisKeysToDelete);

        // Phát Domain Event cho WebSockets Adapter xử lý
        eventBus.emit(DomainEvents.SEATS_BOOKED, {
            showtimeId,
            seatIds
        });

        return { RspCode: '00', Message: 'Confirm Success' };
    } else {
        try {
            await bookingRepository.cancelBookingAndTickets(bookingId, booking);
        } catch (error) {
            // Log nội bộ nếu cần
        }

        await redisAdapter.del(redisKeysToDelete);
        return { RspCode: '00', Message: 'Payment failed, order and tickets cancelled' };
    }
};

module.exports = {
    createVNPayUrl,
    verifyIpn
};