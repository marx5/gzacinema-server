const { Movie } = require('../../models');
const { Op } = require('sequelize');
const AppError = require('../../core/utils/AppError');
const redis = require('../../config/redis');

const getVietnamDateString = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh'
    }).format(new Date());
};

const clearMovieCache = async () => {
    try {
        const cacheKeys = await redis.smembers('movie_cache_index');
        if (cacheKeys.length > 0) {
            await redis.del(...cacheKeys);
        }
        await redis.del('movie_cache_index');
    } catch (error) {
        console.error('Error clearing movie cache:', error);
    }
}

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

    await clearMovieCache();
    return newMovie;
}

const getAllMovies = async (query) => {
    const status = query.status || 'all';
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const cacheKey = `cache:movies:${status}:${page}:${limit}`;

    const cachedMovies = await redis.get(cacheKey);
    if (cachedMovies) {
        return JSON.parse(cachedMovies);
    }

    let condition = {};
    const today = getVietnamDateString();

    if (status === 'showing') {
        condition.release_date = { [Op.lte]: today };
    } else if (status === 'coming_soon') {
        condition.release_date = { [Op.gt]: today };
    }

    const { count, rows } = await Movie.findAndCountAll({
        where: condition,
        order: [['release_date', 'DESC']],
        limit,
        offset
    })

    const result = {
        total_items: count,
        total_pages: Math.ceil(count / limit),
        current_page: page,
        movie: rows
    }

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);

    await redis.sadd('movie_cache_index', cacheKey);
    await redis.expire('movie_cache_index', 3600);

    return result;
}

const getMovieById = async (movieId) => {
    const movie = await Movie.findByPk(movieId);
    if (!movie) throw new AppError('Movie not found', 404);
    return movie;
}

const updateMovie = async (movieId, movieData) => {
    const movie = await Movie.findByPk(movieId);
    if (!movie) {
        throw new AppError('Movie not found', 404);
    }
    await movie.update(movieData);
    await clearMovieCache();
    return movie;
}

const deleteMovie = async (movieId) => {
    const movie = await Movie.findByPk(movieId);
    if (!movie) {
        throw new AppError('Movie not found', 404);
    }
    await movie.destroy();
    await clearMovieCache();
}

module.exports = {
    createMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
    deleteMovie
}