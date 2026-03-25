const ticketService = require('./ticket.service');

const checkIn = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await ticketService.checkInticket(id);
        res.status(200).json({
            status: 'success',
            message: 'Ticket checked in successfully',
            data: ticket
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
}

module.exports = {
    checkIn
}