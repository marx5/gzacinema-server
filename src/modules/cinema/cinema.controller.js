const cinemaService = require('./cinema.service');

const addCinema = async (req, res) => {
    try {
        const newCinema = await cinemaService.createCinema(req.body);
        res.status(201).json({
            status: 'success',
            message: 'Cinema created successfully',
            data: newCinema
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

const getAllCinemas = async (req, res) => {
    try {
        const cinemas = await cinemaService.getAllCinemas();
        res.status(200).json({
            status: 'success',
            message: 'Cinemas retrieved successfully',
            data: cinemas
        })
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

const getCinemaById = async (req, res) => {
    try {
        const cinema = await cinemaService.getCinemaById(req.params.id);
        res.status(200).json({
            status: 'success',
            message: 'Cinema retrieved successfully',
            data: cinema
        })
    } catch (error) {
        res.status(404).json({
            status: 'error',
            message: error.message
        });
    }
}

const updateCinema = async (req, res) => {
    try {
        const updatedCinema = await cinemaService.updateCinema(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            message: 'Cinema updated successfully',
            data: updatedCinema
        })
    } catch (error) {
        res.status(404).json({
            status: 'error',
            message: error.message
        });
    }
}

const deleteCinema = async (req, res) => {
    try {
        await cinemaService.deleteCinema(req.params.id);
        res.status(200).json({
            status: 'success',
            message: 'Cinema deleted successfully'
        })
    } catch (error) {
        res.status(404).json({
            status: 'error',
            message: error.message
        });
    }
}


module.exports = {
    addCinema,
    getAllCinemas,
    getCinemaById,
    updateCinema,
    deleteCinema
}