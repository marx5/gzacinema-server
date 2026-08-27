const { sequelize, Booking, Ticket, User, Showtime, Movie, Room } = require('../../../models');

/**
 * Booking Repository (Sequelize Implementation)
 */
class BookingRepository {
    async createBookingWithTickets({ userId, showtimeId, totalAmount, ticketsData }) {
        const t = await sequelize.transaction();
        try {
            const newBooking = await Booking.create({
                user_id: userId,
                showtime_id: showtimeId,
                total_amount: totalAmount,
                status: 'pending'
            }, { transaction: t });

            const finalTicketData = ticketsData.map(ticket => ({
                ...ticket,
                booking_id: newBooking.id
            }));

            await Ticket.bulkCreate(finalTicketData, { transaction: t });
            await t.commit();

            return newBooking;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async findBookingByIdWithTickets(bookingId) {
        return await Booking.findByPk(bookingId, {
            include: [{
                model: Ticket,
                as: 'tickets'
            }]
        });
    }

    async markBookingPaid(booking) {
        booking.status = 'paid';
        await booking.save();
        return booking;
    }

    async cancelBookingAndTickets(bookingId, booking) {
        const t = await sequelize.transaction();
        try {
            booking.status = 'cancelled';
            await booking.save({ transaction: t });

            await Ticket.update(
                { status: 'refunded' },
                { where: { booking_id: bookingId }, transaction: t }
            );

            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async findAdminBookings({ condition, limit, offset, page }) {
        const [count, rows] = await Promise.all([
            Booking.count({ where: condition }),
            Booking.findAll({
                where: condition,
                order: [['createdAt', 'DESC']],
                limit,
                offset,
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
                            { model: Movie, as: 'movie', attributes: ['title'] },
                            { model: Room, as: 'room', attributes: ['name'] }
                        ]
                    },
                    {
                        model: Ticket,
                        as: 'tickets',
                        attributes: ['id', 'price', 'status']
                    }
                ]
            })
        ]);

        return {
            total_items: count,
            total_pages: Math.ceil(count / limit),
            current_page: page,
            bookings: rows
        };
    }
}

module.exports = new BookingRepository();
