const { Op } = require('sequelize');
const { Showtime, Room, Movie, Cinema, Booking } = require('../../models');
const AppError = require('../../core/utils/AppError');
const { parsePagination, formatPaginatedResult } = require('../../core/utils/pagination');

const createShowtime = async (showtimeData) => {
    const { movie_id, room_id, start_time, base_price } = showtimeData;

    const movie = await Movie.findByPk(movie_id);
    if (!movie) {
        throw new AppError('Movie not found', 404);
    }

    const room = await Room.findByPk(room_id);
    if (!room) {
        throw new AppError('Room not found', 404);
    }

    const totalMinutes = movie.duration_minutes + 15;
    const startDate = new Date(start_time);

    const endDate = new Date(startDate.getTime() + totalMinutes * 60000);

    const overlappingShowtime = await Showtime.findOne({
        where: {
            room_id: room_id,
            start_time: {
                [Op.lt]: endDate
            },
            end_time: {
                [Op.gt]: startDate
            }
        }
    })

    if (overlappingShowtime) {
        throw new AppError('Showtime overlaps with an existing showtime in the same room', 400);
    }

    const newShowtime = await Showtime.create({
        movie_id,
        room_id,
        start_time: startDate,
        end_time: endDate,
        base_price
    })
    return newShowtime;
}

const getShowtimesByMovie = async (movieId) => {
    const showtimes = await Showtime.findAll({
        where: {
            movie_id: movieId,
            start_time: { [Op.gt]: new Date() }
        },
        include: [
            {
                model: Room,
                as: 'room',
                attributes: ['id', 'name'],
                required: true,
                include: [{ model: Cinema, as: 'cinema', attributes: ['id', 'name', 'address'], required: true }]
            }
        ],
        order: [['start_time', 'ASC']]
    });

    const groupedShowtimes = {};

    showtimes.forEach(st => {
        const cinemaName = st.room.cinema.name;
        if (!groupedShowtimes[cinemaName]) {
            groupedShowtimes[cinemaName] = {
                cinema_info: st.room.cinema,
                showtimes: []
            };
        }
        groupedShowtimes[cinemaName].showtimes.push({
            showtime_id: st.id,
            room_name: st.room.name,
            start_time: st.start_time,
            base_price: st.base_price
        });
    });

    return Object.values(groupedShowtimes);
}

const getAllShowtimesAdmin = async (query = {}) => {
    const { page, limit, offset } = parsePagination(query);

    let condition = {};
    if (query.movie_id) {
        condition.movie_id = query.movie_id;
    }

    const { count, rows } = await Showtime.findAndCountAll({
        where: condition,
        order: [['start_time', 'DESC']],
        limit,
        offset,
        include: [
            {
                model: Movie,
                as: 'movie',
                attributes: ['id', 'title']
            },
            {
                model: Room,
                as: 'room',
                attributes: ['id', 'name'],
                include: [{ model: Cinema, as: 'cinema', attributes: ['id', 'name'] }]
            }
        ]
    })

    return formatPaginatedResult({
        count,
        rows,
        page,
        limit,
        dataKey: 'showtimes'
    });
}

const deleteShowtime = async (showtimeId) => {
    const showtime = await Showtime.findByPk(showtimeId);
    if (!showtime) {
        throw new AppError('Showtime not found', 404);
    }

    const soldBookingsCount = await Booking.count({
        where: { showtime_id: showtimeId, status: 'paid' },
    })

    if (soldBookingsCount > 0) {
        throw new AppError('Cannot delete showtime with sold tickets', 400);
    }

    await Showtime.destroy({ where: { id: showtimeId } });
    return {
        message: 'Showtime deleted successfully'
    };
}


module.exports = {
    createShowtime,
    getShowtimesByMovie,
    getAllShowtimesAdmin,
    deleteShowtime
}