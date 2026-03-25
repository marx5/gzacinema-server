const { Op } = require('sequelize');
const { Booking, Ticket, User, Showtime, Movie, Room, Cinema } = require('../../models');

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

    const paidBookings = await Booking.findAll({
        where: bookingCondition,
        include: [
            {
                model: Showtime,
                as: 'showtime',
                required: true,
                include: [
                    { model: Movie, as: 'movie', attributes: ['id', 'title'] },
                    {
                        model: Room,
                        as: 'room',
                        required: true,
                        include: [{ model: Cinema, as: 'cinema', where: cinemaCondition, required: true }]
                    }
                ]
            },
            { model: Ticket, as: 'tickets' }
        ]
    });

    let totalRevenue = 0;
    let totalTicketsSold = 0;
    const movieRevenueMap = {};

    paidBookings.forEach(booking => {
        const amount = parseFloat(booking.total_amount);
        totalRevenue += amount;
        totalTicketsSold += booking.tickets ? booking.tickets.length : 0;

        const movieId = booking.showtime.movie.id;
        const movieTitle = booking.showtime.movie.title;

        if (!movieRevenueMap[movieId]) {
            movieRevenueMap[movieId] = {
                movie_id: movieId, title: movieTitle, total_revenue: 0, booking_count: 0
            };
        }
        movieRevenueMap[movieId].total_revenue += amount;
        movieRevenueMap[movieId].booking_count += 1;
    });

    const totalUsers = await User.count({ where: userCondition });
    const revenueByMovie = Object.values(movieRevenueMap).sort((a, b) => b.total_revenue - a.total_revenue);

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