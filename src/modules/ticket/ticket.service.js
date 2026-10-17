const { Ticket, Seat, Booking, sequelize } = require('../../models');
const AppError = require('../../core/utils/AppError');

const ticketSeatInclude = [
    {
        model: Seat,
        as: 'seat',
        attributes: ['id', 'row_letter', 'seat_number', 'type']
    }
];

const checkInticket = async (ticketId) => {
    const t = await sequelize.transaction();
    try {
        const ticket = await Ticket.findByPk(ticketId, {
            include: [
                ...ticketSeatInclude,
                {
                    model: Booking,
                    as: 'booking',
                    attributes: ['id', 'status']
                }
            ],
            lock: t.LOCK.UPDATE,
            transaction: t
        });
        if (!ticket) {
            throw new AppError('Ticket not found', 404);
        }

        if (!ticket.booking || ticket.booking.status !== 'paid') {
            throw new AppError('Booking has not been paid', 400);
        }

        if (ticket.status === 'used') {
            throw new AppError('Ticket has already been used', 400);
        }

        if (ticket.status === 'refunded') {
            throw new AppError('Ticket has already been refunded', 400);
        }

        ticket.status = 'used';
        await ticket.save({ transaction: t });
        await t.commit();

        return ticket;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

module.exports = {
    checkInticket,
    checkInTicket: checkInticket
};