const { sequelize, Showtime, Room, Seat, Ticket, Booking, User, Movie } = require('../../models');
const redis = require('../../config/redis');
const { or } = require('sequelize');
const AppError = require('../../core/utils/AppError');
const { raw } = require('express');

const getShowtimeSeats = async (showtimeId, userId) => {
    const showtime = await Showtime.findByPk(showtimeId, {
        include: [{
            model: Room, as: 'room'
        }]
    })

    if (!showtime) {
        throw new AppError('Showtime not found', 404);
    }

    const seats = await Seat.findAll({
        where: {
            room_id: showtime.room_id
        },
        order: [['row_letter', 'ASC'], ['seat_number', 'ASC']]
    })

    const soldTickets = await Ticket.findAll({
        attributes: ['seat_id'],
        include: [{
            model: require('../../models').Booking,
            as: 'booking',
            attributes: [],
            where: {
                showtime_id: showtimeId,
                status: 'paid'
            }
        }],
        raw: true
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
        } else {
            throw new AppError('This seat is no longer available', 400);
        }
    }

    const showtime = await Showtime.findByPk(showtimeId);
    if (!showtime) throw new AppError('Showtime not found', 404);

    const seat = await Seat.findByPk(seatId);
    if (!seat || seat.room_id !== showtime.room_id) {
        throw new AppError('Seat not found or invalid room', 404);
    }

    const isSold = await Ticket.findOne({
        where: { seat_id: seatId },
        include: [{
            model: Booking,
            as: 'booking',
            where: {
                showtime_id: showtimeId,
                status: 'paid'
            }
        }]
    });

    if (isSold) throw new AppError('This seat is no longer available', 400);

    const setNxResult = await redis.set(redisKey, userId, 'EX', 300, 'NX');
    if (!setNxResult) {
        throw new AppError('This seat is no longer available', 400);
    }

    if (global.io) {
        global.io.to(showtimeId).emit('seat_status_changed', {
            id: seatId,
            status: 'held',
            held_by_user: userId
        });
    }

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

        if (global.io) {
            global.io.to(showtimeId).emit('seat_status_changed', {
                id: seatId,
                status: 'available'
            });
        }
    }

    return {
        message: 'Seat released successfully'
    };
}

const getAllBookingsAdmin = async (query) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    let condition = {};
    if (query.status) condition.status = query.status;

    const { count, rows } = await Booking.findAndCountAll({
        where: condition,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'full_name', 'phone_number']
            },
            {
                model: Showtime,
                as: 'showtime',
                attributes: ['start_time'],
                include: [
                    {
                        model: Movie,
                        as: 'movie',
                        attributes: ['title']
                    },
                    {
                        model: Room,
                        as: 'room',
                        attributes: ['name']
                    }
                ]
            },
            {
                model: Ticket,
                as: 'tickets',
                attributes: ['id', 'price', 'status']
            }
        ]
    });

    return {
        total_items: count,
        total_pages: Math.ceil(count / limit),
        current_page: page,
        bookings: rows
    };
};

module.exports = {
    getShowtimeSeats,
    holdSeat,
    unholdSeat,
    getAllBookingsAdmin
}