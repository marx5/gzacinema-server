const { Op } = require('sequelize');
const { Booking, Ticket, User, sequelize, Showtime, Movie, Room } = require('../../models');
const redis = require('../../config/redis');

const getDashboardStats = async (query = {}) => {
    const { startDate, endDate, cinemaId } = query;

    const cacheKey = `dashboard:stats:${startDate || 'all'}:${endDate || 'all'}:${cinemaId || 'all'}`;

    try {
        const cachedStats = await redis.get(cacheKey);
        if (cachedStats) {
            console.log('Returning cached dashboard stats');
            return JSON.parse(cachedStats);
        }
    } catch (cacheErr) {
        console.warn('Redis cache error:', cacheErr);
    }

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

    const cinemaShowtimeInclude = cinemaId
        ? [{
            model: Showtime,
            as: 'showtime',
            attributes: [],
            required: true,
            include: [{
                model: Room,
                as: 'room',
                attributes: [],
                where: { cinema_id: cinemaId },
                required: true
            }]
        }]
        : [];

    const [revenueRow, totalTicketsSold, totalUsers, revenueByMovie] = await Promise.all([
        Booking.findOne({
            where: bookingCondition,
            attributes: [
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('Booking.total_amount')), 0), 'total_revenue']
            ],
            include: cinemaShowtimeInclude,
            raw: true
        }),
        Ticket.count({
            where: { status: ['valid', 'used'] },
            include: [{
                model: Booking,
                as: 'booking',
                attributes: [],
                where: bookingCondition,
                required: true,
                include: cinemaShowtimeInclude
            }]
        }),
        User.count({ where: userCondition }),
        Booking.findAll({
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
                required: true,
                include: [
                    {
                        model: Movie,
                        as: 'movie',
                        attributes: [],
                        required: true
                    },
                    ...(cinemaId ? [{
                        model: Room,
                        as: 'room',
                        attributes: [],
                        where: { cinema_id: cinemaId },
                        required: true
                    }] : [])
                ]
            }],
            group: ['showtime.movie.id', 'showtime.movie.title'],
            order: [[sequelize.literal('total_revenue'), 'DESC']],
            raw: true
        })
    ]);

    const totalRevenue = Number(revenueRow?.total_revenue) || 0;

    const stats = {
        overview: {
            total_revenue: totalRevenue,
            total_users: totalUsers,
            total_tickets_sold: totalTicketsSold
        },
        revenue_by_movie: revenueByMovie
    };

    try {
        await redis.setex(cacheKey, 300, JSON.stringify(stats));
        console.log('Dashboard stats cached for 5 minutes');
    } catch (cacheErr) {
        console.warn('Error saving to Redis cache:', cacheErr);
    }

    return stats;
};

module.exports = { getDashboardStats };