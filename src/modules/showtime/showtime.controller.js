const showtimeService = require('./showtime.service');
const catchAsync = require('../../core/utils/catchAsync');

const addShowtime = catchAsync(async (req, res) => {
    const newShowtime = await showtimeService.createShowtime(req.body);
    res.status(201).json({
        status: 'success',
        message: 'Showtime created successfully',
        data: newShowtime
    });
});

const getMovieShowtimes = catchAsync(async (req, res) => {
    const { movieId } = req.params;
    const showtimes = await showtimeService.getShowtimesByMovie(movieId);

    res.status(200).json({
        status: 'success',
        data: showtimes
    });
});

const getAllForAdmin = catchAsync(async (req, res) => {
    const result = await showtimeService.getAllShowtimesAdmin(req.query);
    res.status(200).json({ status: 'success', data: result });
});

const deleteShowtime = catchAsync(async (req, res) => {
    const result = await showtimeService.deleteShowtime(req.params.id);
    res.status(200).json({ status: 'success', ...result });
});

module.exports = {
    addShowtime,
    getMovieShowtimes,
    getAllForAdmin,
    deleteShowtime
}