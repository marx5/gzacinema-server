const bookingService = require('./booking.service');

const getSeats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { showtimeId } = req.params;
        const seatMap = await bookingService.getShowtimeSeats(showtimeId, userId);

        res.status(200).json({
            status: 'success',
            data: seatMap
        })
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        })
    }
}

const holdSeat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { showtimeId, seatId } = req.body;

        if (!showtimeId || !seatId) {
            return res.status(400).json({
                status: 'error',
                message: 'showtimeId and seatId are required'
            })
        }

        const result = await bookingService.holdSeat(showtimeId, seatId, userId);
        res.status(200).json({
            status: 'success',
            data: result
        })
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        })
    }
}

const unholdSeat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { showtimeId, seatId } = req.body;

        const result = await bookingService.unholdSeat(showtimeId, seatId, userId);
        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
}


module.exports = {
    getSeats,
    holdSeat,
    unholdSeat
}