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

    async markBookingPaid(bookingId) {
        const t = await sequelize.transaction();
        try {
            const booking = await Booking.findByPk(bookingId, {
                lock: t.LOCK.UPDATE,
                transaction: t,
                include: [{
                    model: Ticket,
                    as: 'tickets'
                }]
            });

            if (!booking) {
                await t.rollback();
                return { success: false, reason: 'not_found' };
            }

            if (booking.status !== 'pending') {
                await t.rollback();
                return { success: false, reason: 'already_processed', status: booking.status, booking };
            }

            // DB Invariant Protection: Kiểm tra xem có vé nào của các ghế này trong cùng showtime đã được thanh toán (paid) bởi booking khác không
            const seatIds = (booking.tickets || []).map(t => t.seat_id);
            if (seatIds.length > 0) {
                const existingPaidTicket = await Ticket.findOne({
                    where: {
                        seat_id: seatIds,
                        status: 'valid'
                    },
                    include: [{
                        model: Booking,
                        as: 'booking',
                        where: {
                            showtime_id: booking.showtime_id,
                            status: 'paid'
                        }
                    }],
                    transaction: t
                });

                if (existingPaidTicket) {
                    await t.rollback();
                    return { success: false, reason: 'seat_already_paid', booking };
                }
            }

            booking.status = 'paid';
            await booking.save({ transaction: t });

            await Ticket.update(
                { status: 'valid' },
                { where: { booking_id: booking.id }, transaction: t }
            );

            await t.commit();
            return { success: true, booking };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async cancelBookingAndTickets(bookingId) {
        const t = await sequelize.transaction();
        try {
            const booking = await Booking.findByPk(bookingId, {
                lock: t.LOCK.UPDATE,
                transaction: t,
                include: [{
                    model: Ticket,
                    as: 'tickets'
                }]
            });

            if (!booking) {
                await t.rollback();
                return { success: false, reason: 'not_found' };
            }

            if (booking.status !== 'pending') {
                await t.rollback();
                return { success: false, reason: 'already_processed', status: booking.status, booking };
            }

            booking.status = 'cancelled';
            await booking.save({ transaction: t });

            await Ticket.update(
                { status: 'refunded' },
                { where: { booking_id: bookingId }, transaction: t }
            );

            await t.commit();
            return { success: true, booking };
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
