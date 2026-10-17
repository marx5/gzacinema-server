const seatRepository = require('./infrastructure/seat.repository');
const bookingRepository = require('./infrastructure/booking.repository');
const { areSeatsSameType, areSeatsConnected, isNewSeatsAdjacentToExisting } = require('./domain/seatValidation');
const redisAdapter = require('../../infrastructure/cache/redis.adapter');
const eventBus = require('../../core/events/eventBus');
const DomainEvents = require('../../core/events/domainEvents');
const AppError = require('../../core/utils/AppError');
const { parsePagination } = require('../../core/utils/pagination');

const HOLD_DURATION_SECONDS = 300; // 5 phút

const getShowtimeSeats = async (showtimeId, userId) => {
    const showtime = await seatRepository.findShowtimeWithRoom(showtimeId);

    if (!showtime) {
        throw new AppError('Showtime not found', 404);
    }

    const [seats, soldSeatIds] = await Promise.all([
        seatRepository.findSeatsByRoomId(showtime.room_id),
        seatRepository.findSoldSeatIds(showtimeId)
    ]);

    const redisKeys = seats.map(seat => `hold_seat:${showtimeId}:${seat.id}`);
    const heldSeatsData = await redisAdapter.mget(redisKeys);

    const seatMap = seats.map((seat, index) => {
        let seatStatus = 'available';

        if (soldSeatIds.includes(seat.id)) {
            seatStatus = 'booked';
        } else if (seat.status && seat.status !== 'available') {
            seatStatus = seat.status;
        } else if (heldSeatsData[index] !== null) {
            if (heldSeatsData[index] === userId) {
                seatStatus = 'held_by_me';
            } else {
                seatStatus = 'held';
            }
        }

        return {
            id: seat.id,
            row_letter: seat.row_letter,
            seat_number: seat.seat_number,
            type: seat.type,
            status: seatStatus
        };
    });

    return {
        showtime_info: {
            movie_id: showtime.movie_id,
            movie_title: showtime.movie?.title || '',
            poster_url: showtime.movie?.thumbnail || '',
            thumbnail: showtime.movie?.thumbnail || '',
            duration_minutes: showtime.movie?.duration_minutes || null,
            start_time: showtime.start_time,
            room_name: showtime.room?.name || '',
            cinema_name: showtime.room?.cinema?.name || '',
            cinema_address: showtime.room?.cinema?.address || '',
            base_price: showtime.base_price
        },
        seats: seatMap
    };
};

const holdSeat = async (showtimeId, seatIdsInput, userId) => {
    const seatIds = [...new Set(Array.isArray(seatIdsInput) ? seatIdsInput : [seatIdsInput])];
    if (seatIds.length === 0) throw new AppError('No seats provided', 400);

    const showtime = await seatRepository.findShowtimeWithRoom(showtimeId);
    if (!showtime) throw new AppError('Showtime not found', 404);

    const [roomSeats, soldSeatIds] = await Promise.all([
        seatRepository.findSeatsByRoomId(showtime.room_id),
        seatRepository.findSoldSeatIds(showtimeId)
    ]);

    // 1. Tìm các đối tượng ghế tương ứng trong phòng
    const targetSeats = roomSeats.filter(s => seatIds.includes(s.id));
    if (targetSeats.length !== seatIds.length) {
        throw new AppError('Một số ghế không tồn tại trong phòng chiếu', 404);
    }

    // 1b. Kiểm tra trạng thái vật lý của ghế (broken / maintenance)
    if (targetSeats.some(s => s.status && s.status !== 'available')) {
        throw new AppError('Một số ghế đang bảo trì hoặc không khả dụng!', 400);
    }

    // 2. Kiểm tra xem có ghế nào đã bán chưa
    const isAnySold = targetSeats.some(s => soldSeatIds.includes(s.id));
    if (isAnySold) {
        throw new AppError('Ghế này đã được bán!', 400);
    }

    // 3. Kiểm tra tính cùng loại của chính nhóm ghế mới
    if (!areSeatsSameType(targetSeats)) {
        throw new AppError('Chỉ được chọn các ghế cùng loại trong một lần đặt!', 400);
    }

    // 4. Kiểm tra tính liên thông nội bộ của chính nhóm ghế mới
    if (!areSeatsConnected(targetSeats)) {
        throw new AppError('Các ghế trong nhóm phải liền kề nhau!', 400);
    }

    // 5. Kiểm tra trạng thái Redis của toàn phòng
    const allRedisKeys = roomSeats.map(s => `hold_seat:${showtimeId}:${s.id}`);
    const heldSeatsData = await redisAdapter.mget(allRedisKeys);

    // Kiểm tra xem có ghế nào đang bị user khác giữ không
    for (const seat of targetSeats) {
        const idx = roomSeats.findIndex(s => s.id === seat.id);
        const holder = heldSeatsData[idx];
        if (holder && holder !== userId) {
            throw new AppError(`Ghế ${seat.row_letter}${seat.seat_number} đang được người khác giữ`, 400);
        }
    }

    // 6. Lấy các ghế đang được giữ bởi chính user này (loại trừ các ghế trong targetSeats)
    const userHeldSeats = roomSeats.filter((s, idx) => heldSeatsData[idx] === userId && !seatIds.includes(s.id));

    if (userHeldSeats.length > 0) {
        if (userHeldSeats[0].type !== targetSeats[0].type) {
            throw new AppError('Chỉ được chọn các ghế cùng loại trong một lần đặt!', 400);
        }
        if (!isNewSeatsAdjacentToExisting(userHeldSeats, targetSeats)) {
            throw new AppError('Chỉ được chọn các ghế liền kề nhau (trên dưới, trái phải)!', 400);
        }
    }

    // 7. Ghi nhận giữ ghế vào Redis một cách nguyên tử đa khóa (Atomic Lua Script)
    const targetRedisKeys = targetSeats.map(seat => `hold_seat:${showtimeId}:${seat.id}`);
    const isAcquired = await redisAdapter.acquireOrExtendMultipleSeats(
        targetRedisKeys,
        userId,
        HOLD_DURATION_SECONDS
    );

    if (!isAcquired) {
        throw new AppError(
            'Một hoặc nhiều ghế vừa được người khác giữ trước một khoảnh khắc!',
            400
        );
    }

    // Phát Domain Event cho các ghế đã giữ thành công
    for (const seat of targetSeats) {
        eventBus.emit(DomainEvents.SEAT_STATUS_CHANGED, {
            showtimeId,
            seatId: seat.id,
            status: 'held',
            heldByUserId: userId
        });
    }

    return {
        message: 'Seats held successfully, hold will expire in 5 minutes',
        showtime_id: showtimeId,
        seat_ids: seatIds,
        expire_time: HOLD_DURATION_SECONDS
    };
};


const unholdSeat = async (showtimeId, seatIdsInput, userId) => {
    const seatIds = [...new Set(Array.isArray(seatIdsInput) ? seatIdsInput : [seatIdsInput])];
    if (seatIds.length === 0) {
        return { message: 'No seats to release' };
    }

    for (const seatId of seatIds) {
        const redisKey = `hold_seat:${showtimeId}:${seatId}`;
        // Nhả ghế an toàn qua atomic Lua compare-and-delete
        const isReleased = await redisAdapter.releaseSeat(redisKey, userId);

        if (isReleased && !(await seatRepository.isSeatSold(showtimeId, seatId))) {
            eventBus.emit(DomainEvents.SEAT_STATUS_CHANGED, {
                showtimeId,
                seatId,
                status: 'available'
            });
        }
    }

    return {
        message: 'Seat released successfully'
    };
};

/**
 * Tự động nhả toàn bộ ghế đang giữ tạm của user trong suất chiếu khi rời trang hoặc ngắt kết nối
 */
const unholdAllSeatsByUser = async (showtimeId, userId, { skipIfPendingBooking = false } = {}) => {
    if (!showtimeId || !userId) return { releasedCount: 0 };

    if (skipIfPendingBooking) {
        const hasPending = await bookingRepository.hasActivePendingBooking(userId, showtimeId);
        if (hasPending) {
            return { releasedCount: 0, skipped: true };
        }
    }

    const showtime = await seatRepository.findShowtimeWithRoom(showtimeId);
    if (!showtime) return { releasedCount: 0 };

    const roomSeats = await seatRepository.findSeatsByRoomId(showtime.room_id);
    if (!roomSeats.length) return { releasedCount: 0 };

    const allRedisKeys = roomSeats.map(s => `hold_seat:${showtimeId}:${s.id}`);
    const heldSeatsData = await redisAdapter.mget(allRedisKeys);

    const userHeldSeats = roomSeats.filter((s, idx) => heldSeatsData[idx] === String(userId));
    if (!userHeldSeats.length) return { releasedCount: 0 };

    let releasedCount = 0;
    for (const seat of userHeldSeats) {
        const redisKey = `hold_seat:${showtimeId}:${seat.id}`;
        const isReleased = await redisAdapter.releaseSeat(redisKey, String(userId));
        if (isReleased && !(await seatRepository.isSeatSold(showtimeId, seat.id))) {
            releasedCount += 1;
            eventBus.emit(DomainEvents.SEAT_STATUS_CHANGED, {
                showtimeId,
                seatId: seat.id,
                status: 'available'
            });
        }
    }

    return { releasedCount };
};

/**
 * Giải phóng các ghế trong Redis thuộc về đơn hàng đã bị hủy và phát sự kiện realtime
 * @param {Object} params
 * @param {string} params.showtimeId
 * @param {string[]} params.seatIds
 * @param {string} params.userId
 */
const releaseCancelledBookingSeats = async ({ showtimeId, seatIds = [], userId }) => {
    for (const seatId of seatIds) {
        const redisKey = `hold_seat:${showtimeId}:${seatId}`;
        const isReleased = await redisAdapter.releaseSeat(redisKey, userId);
        const currentHolder = isReleased ? null : await redisAdapter.get(redisKey);

        if ((isReleased || !currentHolder) && !(await seatRepository.isSeatSold(showtimeId, seatId))) {
            eventBus.emit(DomainEvents.SEAT_STATUS_CHANGED, {
                showtimeId,
                seatId,
                status: 'available'
            });
        }
    }
};

const getAllBookingsAdmin = async (query = {}) => {
    const { page, limit, offset } = parsePagination(query);

    let condition = {};
    const validStatuses = ['pending', 'paid', 'cancelled'];
    if (query.status && validStatuses.includes(query.status)) {
        condition.status = query.status;
    }

    return await bookingRepository.findAdminBookings({
        condition,
        limit,
        offset,
        page
    });
};

const updateBookingStatusAdmin = async (bookingId, status) => {
    if (!['paid', 'cancelled'].includes(status)) {
        throw new AppError('Trạng thái cập nhật không hợp lệ (chỉ hỗ trợ paid hoặc cancelled)', 400);
    }

    if (status === 'paid') {
        const result = await bookingRepository.markBookingPaid(bookingId);
        if (!result.success) {
            if (result.reason === 'not_found') {
                throw new AppError('Không tìm thấy đơn đặt vé', 404);
            }
            if (result.reason === 'seat_already_paid') {
                throw new AppError('Ghế trong đơn này đã được bán cho đơn khác. Đơn đã tự động chuyển sang Đã hủy!', 400);
            }
            throw new AppError(`Đơn đặt vé đã ở trạng thái "${result.status}"`, 400);
        }

        const booking = result.booking;
        const seatIds = (booking.tickets || []).map(t => t.seat_id);

        if (seatIds.length > 0) {
            const keysToRelease = seatIds.map(id => `hold_seat:${booking.showtime_id}:${id}`);
            await redisAdapter.releaseMultipleSeats(keysToRelease, booking.user_id);

            eventBus.emit(DomainEvents.SEATS_BOOKED, {
                showtimeId: booking.showtime_id,
                seatIds
            });
        }

        return booking;
    }

    // status === 'cancelled'
    const result = await bookingRepository.cancelBookingAndTickets(bookingId, { allowFromPaid: true });
    if (!result.success) {
        if (result.reason === 'not_found') {
            throw new AppError('Không tìm thấy đơn đặt vé', 404);
        }
        throw new AppError('Đơn đặt vé này đã ở trạng thái Đã hủy', 400);
    }

    const booking = result.booking;
    const seatIds = (booking.tickets || []).map(t => t.seat_id);

    await releaseCancelledBookingSeats({
        showtimeId: booking.showtime_id,
        seatIds,
        userId: booking.user_id
    });

    return booking;
};

module.exports = {
    getShowtimeSeats,
    holdSeat,
    unholdSeat,
    unholdAllSeatsByUser,
    releaseCancelledBookingSeats,
    getAllBookingsAdmin,
    updateBookingStatusAdmin
};