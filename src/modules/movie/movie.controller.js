const movieService = require('./movie.service');
const catchAsync = require('../../core/utils/catchAsync');

const addMovie = catchAsync(async (req, res) => {
    const defaultImg = "https://res.cloudinary.com/dzwdxplyi/image/upload/v1774407280/default-poster_q5afja.jpg";
    const movieData = req.body;
    if (req.file) {
        movieData.thumbnail = req.file.path;
    } else {
        movieData.thumbnail = defaultImg;
    }

    const newMovie = await movieService.createMovie(movieData);
    res.status(201).json({
        status: 'success',
        message: 'Movie created successfully',
        data: newMovie
    });
})

const getAllMovies = catchAsync(async (req, res) => {
    const movies = await movieService.getAllMovies(req.query);
    res.status(200).json({
        status: 'success',
        data: movies
    });
})

const getMovieDetails = catchAsync(async (req, res) => {
    const movie = await movieService.getMovieById(req.params.id);
    res.status(200).json({
        status: 'success',
        data: movie
    });
})

const updateMovie = catchAsync(async (req, res) => {
    const movieData = req.body;
    if (req.file) {
        movieData.thumbnail = req.file.path;
    }
    const updatedMovie = await movieService.updateMovie(req.params.id, movieData);
    res.status(200).json({
        status: 'success',
        data: updatedMovie
    });
})

const deleteMovie = catchAsync(async (req, res) => {
    await movieService.deleteMovie(req.params.id);
    res.status(200).json({
        status: 'success',
        message: 'Movie deleted successfully'
    });
})

module.exports = {
    addMovie,
    getAllMovies,
    getMovieDetails,
    updateMovie,
    deleteMovie
}