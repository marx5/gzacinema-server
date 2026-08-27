const seatRepository = require('./infrastructure/seat.repository');
const bookingRepository = require('./infrastructure/booking.repository');
const redisAdapter = require('../../infrastructure/cache/redis.adapter');
const eventBus = require('../../core/events/eventBus');
const DomainEvents = require('../../core/events/domainEvents');
const AppError = require('../../core/utils/AppError');

const HOLD_DURATION_SECONDS = 300; // 5 phút

const getShowtimeSeats = async (showtimeId, userId) => {
    const showtime = await seatRepository.findShowtimeWithRoom(showtimeId);

    if (!showtime) {
        throw new AppError('Showtime not found', 404);
    }

    const seats = await seatRepository.findSeatsByRoomId(showtime.room_id);
    const soldSeatIds = await seatRepository.findSoldSeatIds(showtimeId);

    const redisKeys = seats.map(seat => `hold_seat:${showtimeId}:${seat.id}`);
    const heldSeatsData = await redisAdapter.mget(redisKeys);

    const seatMap = seats.map((seat, index) => {
        let seatStatus = 'available';

        if (soldSeatIds.includes(seat.id)) {
            seatStatus = 'booked';
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
            start_time: showtime.start_time,
            room_name: showtime.room.name,
            base_price: showtime.base_price
        },
        seats: seatMap
    };
};

const holdSeat = async (showtimeId, seatId, userId) => {
    const redisKey = `hold_seat:${showtimeId}:${seatId}`;

    const existingHold = await redisAdapter.get(redisKey);
    if (existingHold) {
        if (existingHold === userId) {
            await redisAdapter.expire(redisKey, HOLD_DURATION_SECONDS);
            return {
                message: 'Hold extended',
                showtime_id: showtimeId,
                seat_id: seatId,
                expire_time: HOLD_DURATION_SECONDS
            };
        } else {
            throw new AppError('This seat is no longer available', 400);
        }
    }

    const showtime = await seatRepository.findShowtimeWithRoom(showtimeId);
    if (!showtime) throw new AppError('Showtime not found', 404);

    const seat = await seatRepository.findSeatById(seatId);
    if (!seat || seat.room_id !== showtime.room_id) {
        throw new AppError('Seat not found or invalid room', 404);
    }

    const isSold = await seatRepository.isSeatSold(showtimeId, seatId);
    if (isSold) throw new AppError('This seat is no longer available', 400);

    const isSet = await redisAdapter.setNx(redisKey, userId, HOLD_DURATION_SECONDS);
    if (!isSet) {
        throw new AppError('This seat is no longer available', 400);
    }

    // Phát Domain Event qua EventBus thay vì gọi trực tiếp global.io
    eventBus.emit(DomainEvents.SEAT_STATUS_CHANGED, {
        showtimeId,
        seatId,
        status: 'held',
        heldByUserId: userId
    });

    return {
        message: 'Seat held successfully, hold will expire in 5 minutes',
        showtime_id: showtimeId,
        seat_id: seatId,
        expire_time: HOLD_DURATION_SECONDS
    };
};

const unholdSeat = async (showtimeId, seatId, userId) => {
    const redisKey = `hold_seat:${showtimeId}:${seatId}`;
    const existingHold = await redisAdapter.get(redisKey);

    if (existingHold === userId) {
        await redisAdapter.del(redisKey);

        // Phát Domain Event qua EventBus thay vì gọi trực tiếp global.io
        eventBus.emit(DomainEvents.SEAT_STATUS_CHANGED, {
            showtimeId,
            seatId,
            status: 'available'
        });
    }

    return {
        message: 'Seat released successfully'
    };
};

const getAllBookingsAdmin = async (query) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    let condition = {};
    if (query.status) condition.status = query.status;

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
    getAllBookingsAdmin
};