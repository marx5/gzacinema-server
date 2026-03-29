const { Ticket, Seat } = require('../../models');
const AppError = require('../../core/utils/AppError');

const ticketSeatInclude = [
    {
        model: Seat,
        as: 'seat',
        attributes: ['id', 'row_letter', 'seat_number', 'type']
    }
];

const checkInticket = async (ticketId) => {
    const ticket = await Ticket.findByPk(ticketId, {
        include: ticketSeatInclude
    });
    if (!ticket) {
        throw new AppError('Ticket not found');
    }

    if (ticket.status === 'used') {
        throw new AppError('Ticket has already been used');
    }

    if (ticket.status === 'refunded') {
        throw new AppError('Ticket has already been refunded');
    }

    ticket.status = 'used';
    await ticket.save();

    const checkedInTicket = await Ticket.findByPk(ticket.id, {
        include: ticketSeatInclude
    });

    return checkedInTicket || ticket;
}

module.exports = {
    checkInticket
}