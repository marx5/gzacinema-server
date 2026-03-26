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
    const { showtimeId, seatId } = req.body;

    if (!showtimeId || !seatId) {
        throw new AppError('showtimeId và seatId là bắt buộc', 400);
    }

    const result = await bookingService.holdSeat(showtimeId, seatId, userId);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

const unholdSeat = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { showtimeId, seatId } = req.body;

    if (!showtimeId || !seatId) {
        throw new AppError('showtimeId và seatId là bắt buộc', 400);
    }

    const result = await bookingService.unholdSeat(showtimeId, seatId, userId);

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