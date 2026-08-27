const { Showtime, Room, Seat, Ticket, Booking } = require('../../../models');

/**
 * Seat & Showtime Repository (Sequelize Implementation)
 */
class SeatRepository {
    async findShowtimeWithRoom(showtimeId) {
        return await Showtime.findByPk(showtimeId, {
            include: [{ model: Room, as: 'room' }]
        });
    }

    async findSeatsByRoomId(roomId) {
        return await Seat.findAll({
            where: { room_id: roomId },
            order: [['row_letter', 'ASC'], ['seat_number', 'ASC']]
        });
    }

    async findSeatById(seatId) {
        return await Seat.findByPk(seatId);
    }

    async findSeatsByIds(seatIds) {
        return await Seat.findAll({
            where: { id: seatIds }
        });
    }

    async findSoldSeatIds(showtimeId) {
        const soldTickets = await Ticket.findAll({
            attributes: ['seat_id'],
            include: [{
                model: Booking,
                as: 'booking',
                attributes: [],
                where: {
                    showtime_id: showtimeId,
                    status: 'paid'
                }
            }],
            raw: true
        });

        return soldTickets.map(ticket => ticket.seat_id);
    }

    async isSeatSold(showtimeId, seatId) {
        const sold = await Ticket.findOne({
            where: { seat_id: seatId },
            include: [{
                model: Booking,
                as: 'booking',
                where: {
                    showtime_id: showtimeId,
                    status: 'paid'
                }
            }]
        });

        return !!sold;
    }
}

module.exports = new SeatRepository();
