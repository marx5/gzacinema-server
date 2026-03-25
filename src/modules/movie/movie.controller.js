const movieService = require('./movie.service');

const addMovie = async (req, res) => {
    const defaultImg = "https://res.cloudinary.com/dzwdxplyi/image/upload/v1774407280/default-poster_q5afja.jpg";
    try {
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
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
}

const getAllMovies = async (req, res) => {
    try {
        const movies = await movieService.getAllMovies(req.query);
        res.status(200).json({
            status: 'success',
            data: movies
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

const getMovieDetails = async (req, res) => {
    try {
        const movie = await movieService.getMovieById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: movie
        });
    } catch (error) {
        res.status(404).json({
            status: 'error',
            message: error.message
        });
    }
}

const updateMovie = async (req, res) => {
    try {
        const movieData = req.body;
        if (req.file) {
            movieData.thumbnail = req.file.path;
        }
        const updatedMovie = await movieService.updateMovie(req.params.id, movieData);
        res.status(200).json({
            status: 'success',
            data: updatedMovie
        });
    } catch (error) {
        res.status(404).json({
            status: 'error',
            message: error.message
        });
    }
}

const deleteMovie = async (req, res) => {
    try {
        await movieService.deleteMovie(req.params.id);
        res.status(200).json({
            status: 'success',
            message: 'Movie deleted successfully'
        });
    } catch (error) {
        res.status(404).json({
            status: 'error',
            message: error.message
        });
    }
}

module.exports = {
    addMovie,
    getAllMovies,
    getMovieDetails,
    updateMovie,
    deleteMovie
}