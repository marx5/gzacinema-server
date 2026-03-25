const { sequelize, Showtime, Room, Seat, Ticket, Booking } = require('../../models');
const redis = require('../../config/redis');
const { or } = require('sequelize');

const getShowtimeSeats = async (showtimeId, userId) => {
    const showtime = await Showtime.findByPk(showtimeId, {
        include: [{
            model: Room, as: 'room'
        }]
    })

    if (!showtime) {
        throw new Error('Showtime not found');
    }

    const seats = await Seat.findAll({
        where: {
            room_id: showtime.room_id
        },
        order: [['row_letter', 'ASC'], ['seat_number', 'ASC']]
    })

    const soldTickets = await Ticket.findAll({
        include: [{
            model: require('../../models').Booking,
            as: 'booking',
            where: {
                showtime_id: showtimeId,
                status: 'paid'
            }
        }]
    })

    const soldSeatIds = soldTickets.map(ticket => ticket.seat_id);

    const redisKeys = seats.map(seat => `hold_seat:${showtimeId}:${seat.id}`);

    const heldSeatsData = await redis.mget(redisKeys);

    const seatMap = seats.map((seat, index) => {
        let seatStatus = 'available';

        if (soldSeatIds.includes(seat.id)) {
            seatStatus = 'booked';
        }
        else if (heldSeatsData[index] !== null) {
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
        }
    })

    return {
        showtime_info: {
            movie_id: showtime.movie_id,
            start_time: showtime.start_time,
            room_name: showtime.room.name,
            base_price: showtime.base_price
        },
        seats: seatMap
    }
}

const holdSeat = async (showtimeId, seatId, userId) => {
    const showtime = await Showtime.findByPk(showtimeId);

    if (!showtime) {
        throw new Error('Showtime not found');
    }

    const seat = await Seat.findByPk(seatId);

    if (!seat || seat.room_id !== showtime.room_id) {
        throw new Error('Seat not found');
    }

    const isSold = await Ticket.findOne({
        where: {
            seat_id: seatId
        },
        include: [{
            model: Booking,
            as: 'booking',
            where: {
                showtime_id: showtimeId,
                status: 'paid'
            }
        }]
    })
    if (isSold) {
        throw new Error('Seat already sold');
    }

    const redisKey = `hold_seat:${showtimeId}:${seatId}`;
    const existingHold = await redis.get(redisKey);

    if (existingHold) {
        if (existingHold === userId) {
            await redis.expire(redisKey, 300);
            return {
                message: 'Hold extended',
                showtime_id: showtimeId,
                seat_id: seatId,
                expire_time: 300
            };
        }
        else {
            throw new Error('Seat is currently held by another user');
        }
    }

    await redis.set(redisKey, userId, 'EX', 300);

    return {
        message: 'Seat held successfully, hold will expire in 5 minutes',
        showtime_id: showtimeId,
        seat_id: seatId,
        expire_time: 300
    }
}

const unholdSeat = async (showtimeId, seatId, userId) => {
    const redisKey = `hold_seat:${showtimeId}:${seatId}`;
    const existingHold = await redis.get(redisKey);

    if (existingHold === userId) {
        await redis.del(redisKey);
    }

    return {
        message: 'Seat released successfully'
    };
}

module.exports = {
    getShowtimeSeats,
    holdSeat,
    unholdSeat
}