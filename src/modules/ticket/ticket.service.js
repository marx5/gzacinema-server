const { Ticket } = require('../../models');

const checkInticket = async (ticketId) => {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) {
        throw new Error('Ticket not found');
    }

    if (ticket.status === 'used') {
        throw new Error('Ticket has already been used');
    }

    if (ticket.status === 'refunded') {
        throw new Error('Ticket has already been refunded');
    }

    ticket.status = 'used';
    await ticket.save();

    return ticket;
}

module.exports = {
    checkInticket
}