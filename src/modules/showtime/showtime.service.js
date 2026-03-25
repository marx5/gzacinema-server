const { Op, where } = require('sequelize');
const { Showtime, Room, Movie, Cinema } = require('../../models');

const createShowtime = async (showtimeData) => {
    const { movie_id, room_id, start_time, base_price } = showtimeData;

    const movie = await Movie.findByPk(movie_id);
    if (!movie) {
        throw new Error('Movie not found');
    }

    const room = await Room.findByPk(room_id);
    if (!room) {
        throw new Error('Room not found');
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
        throw new Error('Showtime overlaps with an existing showtime in the same room');
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
                include: [{ model: Cinema, as: 'cinema', attributes: ['id', 'name', 'address'] }]
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


module.exports = {
    createShowtime,
    getShowtimesByMovie
}