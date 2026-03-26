const ticketService = require('./ticket.service');
const catchAsync = require('../../core/utils/catchAsync');

const checkIn = catchAsync(async (req, res) => {
    const { id } = req.params;
    const ticket = await ticketService.checkInticket(id);
    res.status(200).json({
        status: 'success',
        message: 'Ticket checked in successfully',
        data: ticket
    });
});

module.exports = {
    checkIn
}