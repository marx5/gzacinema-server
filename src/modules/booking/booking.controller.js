const bookingService = require('./booking.service');
const catchAsync = require('../../core/utils/catchAsync');
const AppError = require('../../core/utils/AppError');

const getSeats = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const { showtimeId } = req.params;

    const seatMap = await bookingService.getShowtimeSeats(showtimeId, userId);

    res.status(200).json({
        status: 'success',
        data: seatMap
    });
});

const holdSeat = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { showtimeId, seatId, seatIds } = req.body;

    const targetSeatIds = Array.isArray(seatIds) ? seatIds : (seatId ? [seatId] : []);

    if (!showtimeId || targetSeatIds.length === 0) {
        throw new AppError('showtimeId và seatId/seatIds là bắt buộc', 400);
    }

    const result = await bookingService.holdSeat(showtimeId, targetSeatIds, userId);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

const unholdSeat = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { showtimeId, seatId, seatIds } = req.body;

    const targetSeatIds = Array.isArray(seatIds) ? seatIds : (seatId ? [seatId] : []);

    if (!showtimeId || targetSeatIds.length === 0) {
        throw new AppError('showtimeId và seatId/seatIds là bắt buộc', 400);
    }

    const result = await bookingService.unholdSeat(showtimeId, targetSeatIds, userId);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

const getAllForAdmin = catchAsync(async (req, res) => {
    const result = await bookingService.getAllBookingsAdmin(req.query);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

module.exports = {
    getSeats,
    holdSeat,
    unholdSeat,
    getAllForAdmin
};