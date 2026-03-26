const { or } = require('sequelize');
const { Cinema, Room, Seat } = require('../../models');
const AppError = require('../../core/utils/AppError');
const redis = require('../../config/redis');

const createCinema = async (cinemaData) => {
    const { name, address } = cinemaData;
    const newCinema = await Cinema.create({ name, address });

    await redis.del('cache:cinemas');
    return newCinema;
}

const getAllCinemas = async () => {
    const cachedCinemas = await redis.get('cache:cinemas');
    if (cachedCinemas) {
        return JSON.parse(cachedCinemas);
    }

    const cinemas = await Cinema.findAll({
        order: [['createdAt', 'DESC']]
    })

    await redis.set('cache:cinemas', JSON.stringify(cinemas), 'EX', 86400);
    return cinemas;
}

const getCinemaById = async (id, data) => {
    const cinema = await Cinema.findByPk(id)
    if (!cinema) {
        throw new AppError('Cinema not found', 404);
    }
    return cinema;
}

const updateCinema = async (id, cinemaData) => {
    const cinema = await Cinema.findByPk(id);
    if (!cinema) {
        throw new AppError('Cinema not found', 404);
    }
    await cinema.update(cinemaData);

    await redis.del('cache:cinemas');
    return cinema;
}

const deleteCinema = async (id) => {
    const cinema = await Cinema.findByPk(id);
    if (!cinema) {
        throw new AppError('Cinema not found', 404);
    }
    await cinema.destroy();

    await redis.del('cache:cinemas');
    return {
        message: 'Cinema deleted successfully'
    };
}

module.exports = {
    createCinema,
    getAllCinemas,
    getCinemaById,
    updateCinema,
    deleteCinema
}