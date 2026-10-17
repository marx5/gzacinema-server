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
            poster_url: showtime.movie?.poster_url || '',
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

    const showtime = await seatRepository.findShowtimeWithRoom(showtimeId);
    if (showtime) {
        const roomSeats = await seatRepository.findSeatsByRoomId(showtime.room_id);
        const allRedisKeys = roomSeats.map(s => `hold_seat:${showtimeId}:${s.id}`);
        const heldSeatsData = await redisAdapter.mget(allRedisKeys);

        const remainingUserHeldSeats = roomSeats.filter(
            (s, idx) => heldSeatsData[idx] === userId && !seatIds.includes(s.id)
        );

        if (remainingUserHeldSeats.length > 1 && !areSeatsConnected(remainingUserHeldSeats)) {
            throw new AppError('Không thể bỏ chọn ghế ở giữa làm tách rời các ghế đang chọn!', 400);
        }
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

module.exports = {
    getShowtimeSeats,
    holdSeat,
    unholdSeat,
    releaseCancelledBookingSeats,
    getAllBookingsAdmin
};