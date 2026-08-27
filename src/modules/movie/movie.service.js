const movieRepository = require('./infrastructure/movie.repository');
const redisAdapter = require('../../infrastructure/cache/redis.adapter');
const AppError = require('../../core/utils/AppError');
const { Op } = require('sequelize');

const getVietnamDateString = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());

    const day = parts.find((part) => part.type === 'day')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const year = parts.find((part) => part.type === 'year')?.value;

    return `${year}-${month}-${day}`;
};

const clearMovieCache = async () => {
    try {
        const cacheKeys = await redisAdapter.smembers('movie_cache_index');
        if (cacheKeys && cacheKeys.length > 0) {
            await redisAdapter.del(cacheKeys);
        }
        await redisAdapter.del('movie_cache_index');
    } catch (error) {
        console.error('Error clearing movie cache:', error);
    }
};

const createMovie = async (movieData) => {
    const { title, genre, description, duration_minutes, release_date, thumbnail, trailer_url } = movieData;
    const newMovie = await movieRepository.create({
        title,
        genre,
        description,
        duration_minutes,
        release_date,
        thumbnail,
        trailer_url
    });

    await clearMovieCache();
    return newMovie;
};

const getAllMovies = async (query) => {
    const status = query.status || 'all';
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const today = getVietnamDateString();

    const statusCachePart = (status === 'showing' || status === 'coming_soon')
        ? `${status}:${today}`
        : status;

    const cacheKey = `cache:movies:${statusCachePart}:${page}:${limit}`;

    const cachedMovies = await redisAdapter.get(cacheKey);
    if (cachedMovies) {
        return JSON.parse(cachedMovies);
    }

    let condition = {};

    if (status === 'showing') {
        condition.release_date = { [Op.lte]: today };
    } else if (status === 'coming_soon') {
        condition.release_date = { [Op.gt]: today };
    }

    const { count, rows } = await movieRepository.findAndCountAll({
        condition,
        order: [['release_date', 'DESC']],
        limit,
        offset
    });

    const result = {
        total_items: count,
        total_pages: Math.ceil(count / limit),
        current_page: page,
        movie: rows
    };

    await redisAdapter.set(cacheKey, JSON.stringify(result), 3600);
    await redisAdapter.sadd('movie_cache_index', cacheKey);
    await redisAdapter.expire('movie_cache_index', 3600);

    return result;
};

const getTopRankingMovies = async (limit = 10) => {
    const cacheKey = `cache:movies:top_ranking:${limit}`;
    try {
        const cached = await redisAdapter.get(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch (err) {
        console.warn('Redis cache error:', err);
    }

    const result = await movieRepository.findTopRanking(limit);

    try {
        await redisAdapter.set(cacheKey, JSON.stringify(result), 300);
        await redisAdapter.sadd('movie_cache_index', cacheKey);
    } catch (err) {
        console.warn('Redis save error:', err);
    }

    return result;
};

const getMovieById = async (movieId) => {
    const movie = await movieRepository.findById(movieId);
    if (!movie) throw new AppError('Movie not found', 404);
    return movie;
};

const updateMovie = async (movieId, movieData) => {
    const movie = await movieRepository.update(movieId, movieData);
    if (!movie) {
        throw new AppError('Movie not found', 404);
    }
    await clearMovieCache();
    return movie;
};

const deleteMovie = async (movieId) => {
    const movie = await movieRepository.delete(movieId);
    if (!movie) {
        throw new AppError('Movie not found', 404);
    }
    await clearMovieCache();
};

module.exports = {
    createMovie,
    getAllMovies,
    getTopRankingMovies,
    getMovieById,
    updateMovie,
    deleteMovie
};