const ticketService = require('./ticket.service');
const catchAsync = require('../../core/utils/catchAsync');

const checkIn = catchAsync(async (req, res) => {
    const { id } = req.params;
    const ticket = await ticketService.checkInticket(id);
    const ticketData = ticket?.toJSON ? ticket.toJSON() : ticket;
    const seatName = ticketData?.seat?.row_letter && ticketData?.seat?.seat_number
        ? `${ticketData.seat.row_letter}${ticketData.seat.seat_number}`
        : null;

    res.status(200).json({
        status: 'success',
        message: 'Ticket checked in successfully',
        data: {
            ...ticketData,
            seat_name: seatName
        }
    });
});

module.exports = {
    checkIn
}