const { Op } = require('sequelize');
const { Cinema, Room, Showtime } = require('../../models');
const AppError = require('../../core/utils/AppError');
const redis = require('../../config/redis');

const clearCinemaCache = async () => {
    try {
        await redis.del('cache:cinemas');
    } catch (err) {
        console.warn('Redis cache clear error:', err);
    }
};

const createCinema = async (cinemaData) => {
    const { name, address } = cinemaData;
    const newCinema = await Cinema.create({ name, address });

    await clearCinemaCache();
    return newCinema;
};

const getAllCinemas = async () => {
    try {
        const cachedCinemas = await redis.get('cache:cinemas');
        if (cachedCinemas) {
            return JSON.parse(cachedCinemas);
        }
    } catch (err) {
        console.warn('Redis cache read error:', err);
    }

    const cinemas = await Cinema.findAll({
        order: [['createdAt', 'DESC']]
    });

    try {
        await redis.set('cache:cinemas', JSON.stringify(cinemas), 'EX', 86400);
    } catch (err) {
        console.warn('Redis cache write error:', err);
    }
    return cinemas;
};

const getCinemaById = async (id) => {
    const cinema = await Cinema.findByPk(id);
    if (!cinema) {
        throw new AppError('Cinema not found', 404);
    }
    return cinema;
};

const updateCinema = async (id, cinemaData) => {
    const cinema = await Cinema.findByPk(id);
    if (!cinema) {
        throw new AppError('Cinema not found', 404);
    }
    await cinema.update(cinemaData);

    await clearCinemaCache();
    return cinema;
};

const deleteCinema = async (id) => {
    const cinema = await Cinema.findByPk(id);
    if (!cinema) {
        throw new AppError('Cinema not found', 404);
    }

    const upcomingShowtimeCount = await Showtime.count({
        where: {
            start_time: { [Op.gt]: new Date() }
        },
        include: [{
            model: Room,
            as: 'room',
            where: { cinema_id: id },
            required: true
        }]
    });

    if (upcomingShowtimeCount > 0) {
        throw new AppError('Cannot delete cinema with upcoming showtimes', 400);
    }

    await cinema.destroy();

    await clearCinemaCache();
    return {
        message: 'Cinema deleted successfully'
    };
};

module.exports = {
    createCinema,
    getAllCinemas,
    getCinemaById,
    updateCinema,
    deleteCinema
};