const seatRepository = require('../booking/infrastructure/seat.repository');
const bookingRepository = require('../booking/infrastructure/booking.repository');
const { releaseCancelledBookingSeats } = require('../booking/booking.service');
const { calculateSeatPrice } = require('../booking/domain/seatPricing');
const { areSeatsSameType, areSeatsConnected } = require('../booking/domain/seatValidation');
const redisAdapter = require('../../infrastructure/cache/redis.adapter');
const vnpayGateway = require('../../infrastructure/gateways/vnpay.gateway');
const eventBus = require('../../core/events/eventBus');
const DomainEvents = require('../../core/events/domainEvents');
const AppError = require('../../core/utils/AppError');

const PAYMENT_HOLD_EXTEND_SECONDS = 17 * 60; // 17 phút (15 phút VNPay + 2 phút đệm cho IPN)

const createVNPayUrl = async (userId, showtimeId, seatIdsInput, ipAddr) => {
    const seatIds = [...new Set(Array.isArray(seatIdsInput) ? seatIdsInput : [seatIdsInput])];
    if (seatIds.length === 0) {
        throw new AppError('No seats selected', 400);
    }

    const showtime = await seatRepository.findShowtimeWithRoom(showtimeId);
    if (!showtime) throw new AppError('Showtime not found', 404);

    const [seats, soldSeatIds] = await Promise.all([
        seatRepository.findSeatsByIds(seatIds),
        seatRepository.findSoldSeatIds(showtimeId)
    ]);

    if (!seats || seats.length !== seatIds.length) {
        throw new AppError('Một số ghế không tồn tại!', 404);
    }

    if (!seats.every((s) => s.room_id === showtime.room_id)) {
        throw new AppError('Một số ghế không thuộc phòng chiếu của suất chiếu này!', 400);
    }

    if (!seats.every((s) => !s.status || s.status === 'available')) {
        throw new AppError('Một số ghế đang bảo trì hoặc không khả dụng!', 400);
    }

    if (seats.some((s) => soldSeatIds.includes(s.id))) {
        throw new AppError('Một số ghế đã được bán!', 400);
    }

    if (!areSeatsSameType(seats)) {
        throw new AppError('Chỉ được chọn các ghế cùng loại trong một lần đặt!', 400);
    }

    if (!areSeatsConnected(seats)) {
        throw new AppError('Các ghế được chọn phải liền kề nhau (trên dưới, trái phải) và không được cách ghế!', 400);
    }

    const redisKeys = seatIds.map((seatId) => `hold_seat:${showtimeId}:${seatId}`);

    // Kiểm tra và gia hạn giữ ghế nguyên tử (All-or-Nothing) cho đúng userId bằng Lua script
    const isAllExtended = await redisAdapter.extendMultipleSeats(redisKeys, userId, PAYMENT_HOLD_EXTEND_SECONDS);
    if (!isAllExtended) {
        throw new AppError(
            'Một số ghế đã hết hạn giữ chỗ hoặc không thuộc quyền sở hữu của bạn. Vui lòng chọn lại ghế.',
            400
        );
    }

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

    const showtimeId = booking.showtime_id;
    const seatIds = (booking.tickets || []).map((t) => t.seat_id);
    const redisKeys = seatIds.map((seatId) => `hold_seat:${showtimeId}:${seatId}`);

    if (rspCode === '00' && transactionStatus === '00') {
        // Cập nhật DB nguyên tử với pessimistic lock và kiểm tra double-booking
        const result = await bookingRepository.markBookingPaid(bookingId);

        if (!result.success) {
            if (result.reason === 'already_processed') {
                return {
                    RspCode: '02',
                    Message: 'Order already confirmed'
                };
            }
            if (result.reason === 'seat_already_paid') {
                return {
                    RspCode: '02',
                    Message: 'Seat already booked and paid by another user'
                };
            }
            return {
                RspCode: '01',
                Message: 'Order not found'
            };
        }

        // Xóa hold key an toàn chỉ khi key đó thực sự thuộc về user của booking này
        await redisAdapter.releaseMultipleSeats(redisKeys, booking.user_id);

        // Phát Domain Event cho WebSockets Adapter xử lý
        eventBus.emit(DomainEvents.SEATS_BOOKED, {
            showtimeId,
            seatIds
        });

        return { RspCode: '00', Message: 'Confirm Success' };
    } else {
        // Hủy booking trong DB một cách nguyên tử
        const result = await bookingRepository.cancelBookingAndTickets(bookingId);

        if (result.success) {
            await releaseCancelledBookingSeats({
                showtimeId,
                seatIds,
                userId: booking.user_id
            });
        }

        return { RspCode: '00', Message: 'Payment failed, order and tickets cancelled' };
    }
};

module.exports = {
    createVNPayUrl,
    verifyIpn
};