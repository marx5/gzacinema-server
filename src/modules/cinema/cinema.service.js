const { or } = require('sequelize');
const { Cinema, Room, Seat } = require('../../models');

const createCinema = async (cinemaData) => {
    const { name, address } = cinemaData;
    const newCinema = await Cinema.create({ name, address });
    return newCinema;
}

const getAllCinemas = async () => {
    return await Cinema.findAll({
        order: [['createdAt', 'DESC']]
    })
}

const getCinemaById = async (id, data) => {
    const cinema = await Cinema.findByPk(id)
    if (!cinema) {
        throw new Error('Cinema not found');
    }
    return cinema;
}

const updateCinema = async (id, cinemaData) => {
    const cinema = await Cinema.findByPk(id);
    if (!cinema) {
        throw new Error('Cinema not found');
    }
    await cinema.update(cinemaData);
    return cinema;
}

const deleteCinema = async (id) => {
    const cinema = await Cinema.findByPk(id);
    if (!cinema) {
        throw new Error('Cinema not found');
    }
    await cinema.destroy();
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