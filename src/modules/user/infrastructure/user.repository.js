const { User, Booking, Ticket, Seat, Showtime, Movie, Room } = require('../../../models');

/**
 * User Repository (Infrastructure Layer)
 * Cô lập toàn bộ truy vấn ORM liên quan đến User và Lịch sử đơn hàng của User.
 */
class UserRepository {
    async findById(id) {
        return await User.findByPk(id);
    }

    async findByEmail(email) {
        return await User.findOne({ where: { email } });
    }

    async create(data) {
        return await User.create(data);
    }

    async findUserHistory(userId, { limit, offset }) {
        return await Booking.findAndCountAll({
            where: {
                user_id: userId,
                status: 'paid'
            },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            distinct: true,
            include: [
                {
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
                    include: [
                        {
                            model: Seat,
                            as: 'seat',
                            attributes: ['row_letter', 'seat_number', 'type']
                        }
                    ]
                }
            ]
        });
    }
}

module.exports = new UserRepository();
