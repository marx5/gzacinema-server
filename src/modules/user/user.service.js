const { Booking, Ticket, Seat, Showtime, Movie, Room } = require('../../models');

const getUserHistory = async (userId) => {
    const history = await Booking.findAll({
        where: {
            user_id: userId,
            status: 'paid'
        },
        order: [['createdAt', 'DESC']],
        include: [{
            model: Showtime,
            as: 'showtime',
            include: [
                {
                    model: Movie,
                    as: 'movie',
                    attributes: ['title', 'duration_minutes']
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
            include: [{
                model: Seat,
                as: 'seat',
                attributes: ['row_letter', 'seat_number', 'type']
            }]
        }]
    })
    return history;
}

module.exports = {
    getUserHistory
}