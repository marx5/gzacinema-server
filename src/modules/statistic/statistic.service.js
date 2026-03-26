const { Op } = require('sequelize');
const { Booking, Ticket, User, sequelize, Showtime, Movie } = require('../../models');

const getDashboardStats = async (query) => {
    const { startDate, endDate, cinemaId } = query;

    const bookingCondition = { status: 'paid' };
    const userCondition = { role: 'user' };

    if (startDate && endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const dateFilter = {
            [Op.between]: [new Date(startDate), end]
        };
        bookingCondition.createdAt = dateFilter;
        userCondition.createdAt = dateFilter;
    }

    const cinemaCondition = {};
    if (cinemaId) {
        cinemaCondition.id = cinemaId;
    }

    const totalRevenue = await Booking.sum('total_amount', { where: bookingCondition }) || 0;
    const totalTicketsSold = await Ticket.count({
        include: [{
            model: Booking,
            as: 'booking',
            where: bookingCondition,
            required: true
        }]
    })

    const totalUsers = await User.count({ where: userCondition });

    const revenueByMovie = await Booking.findAll({
        where: bookingCondition,
        attributes: [
            [sequelize.col('showtime.movie.id'), 'movie_id'],
            [sequelize.col('showtime.movie.title'), 'title'],
            [sequelize.fn('SUM', sequelize.col('Booking.total_amount')), 'total_revenue'],
            [sequelize.fn('COUNT', sequelize.col('Booking.id')), 'booking_count']
        ],
        include: [{
            model: Showtime,
            as: 'showtime',
            attributes: [],
            include: [{
                model: Movie,
                as: 'movie',
                attributes: []
            }]
        }],
        group: ['showtime.movie.id', 'showtime.movie.title'],
        order: [[sequelize.literal('total_revenue'), 'DESC']],
        raw: true
    })
    return {
        overview: {
            total_revenue: totalRevenue,
            total_users: totalUsers,
            total_tickets_sold: totalTicketsSold
        },
        revenue_by_movie: revenueByMovie
    };
}

module.exports = { getDashboardStats }