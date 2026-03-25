const { Movie } = require('../../models');
const { Op } = require('sequelize');

const createMovie = async (movieData) => {
    const { title, genre, description, duration_minutes, release_date, thumbnail, trailer_url } = movieData;
    const newMovie = await Movie.create({
        title,
        genre,
        description,
        duration_minutes,
        release_date,
        thumbnail,
        trailer_url
    })
    return newMovie;
}

const getAllMovies = async (query) => {
    let condition = {};
    const today = new Date().toISOString().split('T')[0];

    if (query.status === 'showing') {
        condition.release_date = { [Op.lte]: today };
    }
    else if (query.status === 'coming_soon') {
        condition.release_date = { [Op.gt]: today };
    }

    const movies = await Movie.findAll({
        where: condition,
        order: [['release_date', 'DESC']]
    });
    return movies;
}

const getMovieById = async (movieId) => {
    const movie = await Movie.findByPk(movieId);
    if (!movie) throw new Error('Movie not found');
    return movie;
}

const updateMovie = async (movieId, movieData) => {
    const movie = await Movie.findByPk(movieId);
    if (!movie) {
        throw new Error('Movie not found');
    }
    await movie.update(movieData);
    return movie;
}

const deleteMovie = async (movieId) => {
    const movie = await Movie.findByPk(movieId);
    if (!movie) {
        throw new Error('Movie not found');
    }
    await movie.destroy();
}

module.exports = {
    createMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
    deleteMovie
}