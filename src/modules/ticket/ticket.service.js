const { Ticket } = require('../../models');
const AppError = require('../../core/utils/AppError');

const checkInticket = async (ticketId) => {
    const ticket = await Ticket.findByPk(ticketId);
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

    return ticket;
}

module.exports = {
    checkInticket
}