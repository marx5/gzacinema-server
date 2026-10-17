const movieService = require('./movie.service');
const catchAsync = require('../../core/utils/catchAsync');
const { uploadToMinio } = require('../../config/minio');

const MIME_TO_EXT = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
};

const generateFilename = (title, mimetype) => {
    const safeTitle = (title || 'movie')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const ext = MIME_TO_EXT[mimetype] || 'webp';
    return `${safeTitle}-${Date.now()}.${ext}`;
};

const addMovie = catchAsync(async (req, res) => {
    const movieData = req.body;
    if (req.file) {
        const filename = generateFilename(req.body.title, req.file.mimetype);
        movieData.thumbnail = await uploadToMinio(req.file.buffer, 'movies', filename, req.file.mimetype);
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

const getTopRankingMovies = catchAsync(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    const rankingMovies = await movieService.getTopRankingMovies(limit);
    res.status(200).json({
        status: 'success',
        data: rankingMovies
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
    const existingMovie = await movieService.getMovieById(req.params.id);
    const movieData = req.body;
    if (req.file) {
        const filename = generateFilename(req.body.title || existingMovie.title, req.file.mimetype);
        movieData.thumbnail = await uploadToMinio(req.file.buffer, 'movies', filename, req.file.mimetype);
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
    getTopRankingMovies,
    getMovieDetails,
    updateMovie,
    deleteMovie
}