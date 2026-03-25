const showtimeService = require('./showtime.service');

const addShowtime = async (req, res) => {
    try {
        const newShowtime = await showtimeService.createShowtime(req.body);
        res.status(201).json({
            status: 'success',
            message: 'Showtime created successfully',
            data: newShowtime
        })
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        })
    }
}

const getMovieShowtimes = async (req, res) => {
    try {
        const { movieId } = req.params;
        const showtimes = await showtimeService.getShowtimesByMovie(movieId);

        res.status(200).json({
            status: 'success',
            data: showtimes
        })
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        })
    }
}

module.exports = {
    addShowtime,
    getMovieShowtimes
}