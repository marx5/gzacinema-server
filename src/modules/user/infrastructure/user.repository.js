const { Op } = require('sequelize');
const { User, Booking, Ticket, Seat, Showtime, Movie, Room, Cinema, sequelize } = require('../../../models');

/**
 * User Repository (Infrastructure Layer)
 * Cô lập toàn bộ truy vấn ORM liên quan đến User và Lịch sử đơn hàng của User.
 */
class UserRepository {
    async findById(id) {
        return await User.findByPk(id);
    }

    async findByIdWithoutPassword(id) {
        return await User.findByPk(id, {
            attributes: {
                exclude: ['password']
            }
        });
    }

    async findByEmail(email) {
        return await User.findOne({ where: { email } });
    }

    async create(data) {
        return await User.create(data);
    }

    async getUserStats(userId) {
        const bookings = await Booking.findAll({
            where: {
                user_id: userId,
                status: 'paid'
            },
            include: [
                {
                    model: Ticket,
                    as: 'tickets',
                    attributes: ['id']
                }
            ]
        });

        const totalBookings = bookings.length;
        let totalTickets = 0;
        let totalSpent = 0;

        bookings.forEach((b) => {
            totalSpent += Number(b.total_amount || 0);
            totalTickets += Array.isArray(b.tickets) ? b.tickets.length : 0;
        });

        return {
            total_bookings: totalBookings,
            total_tickets: totalTickets,
            total_spent: totalSpent
        };
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
                            attributes: ['title', 'duration_minutes', 'thumbnail']
                        },
                        {
                            model: Room,
                            as: 'room',
                            attributes: ['name'],
                            include: [
                                {
                                    model: Cinema,
                                    as: 'cinema',
                                    attributes: ['name', 'address']
                                }
                            ]
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

    async findAllUsers({ role, search, limit, offset }) {
        const whereClause = {};

        if (role && ['user', 'staff', 'admin'].includes(role)) {
            whereClause.role = role;
        }

        if (search && search.trim()) {
            const keyword = `%${search.trim()}%`;
            whereClause[Op.or] = [
                { full_name: { [Op.like]: keyword } },
                { email: { [Op.like]: keyword } },
                { phone_number: { [Op.like]: keyword } }
            ];
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            attributes: {
                exclude: ['password'],
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM bookings AS b
                            WHERE b.user_id = User.id AND b.status = 'paid'
                        )`),
                        'booking_count'
                    ],
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(b.total_amount), 0)
                            FROM bookings AS b
                            WHERE b.user_id = User.id AND b.status = 'paid'
                        )`),
                        'total_spent'
                    ]
                ]
            },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        return { count, rows };
    }

    async getRoleSummary() {
        const [totalUsers, adminCount, staffCount, customerCount] = await Promise.all([
            User.count(),
            User.count({ where: { role: 'admin' } }),
            User.count({ where: { role: 'staff' } }),
            User.count({ where: { role: 'user' } })
        ]);

        return {
            total_users: totalUsers,
            admin_count: adminCount,
            staff_count: staffCount,
            customer_count: customerCount
        };
    }
}

module.exports = new UserRepository();

