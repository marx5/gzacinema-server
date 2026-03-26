const cinemaService = require('./cinema.service');
const catchAsync = require('../../core/utils/catchAsync');

const addCinema = catchAsync(async (req, res) => {
    const newCinema = await cinemaService.createCinema(req.body);
    res.status(201).json({
        status: 'success',
        message: 'Cinema created successfully',
        data: newCinema
    });
})

const getAllCinemas = catchAsync(async (req, res) => {
    const cinemas = await cinemaService.getAllCinemas();
    res.status(200).json({
        status: 'success',
        message: 'Cinemas retrieved successfully',
        data: cinemas
    });
})

const getCinemaById = catchAsync(async (req, res) => {
    const cinema = await cinemaService.getCinemaById(req.params.id);
    res.status(200).json({
        status: 'success',
        message: 'Cinema retrieved successfully',
        data: cinema
    })
})

const updateCinema = catchAsync(async (req, res) => {
    const updatedCinema = await cinemaService.updateCinema(req.params.id, req.body);
    res.status(200).json({
        status: 'success',
        message: 'Cinema updated successfully',
        data: updatedCinema
    })
})

const deleteCinema = catchAsync(async (req, res) => {
    await cinemaService.deleteCinema(req.params.id);
    res.status(200).json({
        status: 'success',
        message: 'Cinema deleted successfully'
    })
})

module.exports = {
    addCinema,
    getAllCinemas,
    getCinemaById,
    updateCinema,
    deleteCinema
}