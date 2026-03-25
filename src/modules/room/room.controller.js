const roomService = require('./room.service');

const addRoom = async (req, res) => {
    try {
        const { cinemaId } = req.params;
        const newRoom = await roomService.createRoom(cinemaId, req.body);
        res.status(201).json({
            status: 'success',
            message: 'Room created successfully',
            data: newRoom
        })
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        })
    }
}

const getRoomsByCinema = async (req, res) => {
    try {
        const rooms = await roomService.getRoomsByCinema(req.params.cinemaId);
        res.status(200).json({
            status: 'success',
            message: 'Rooms retrieved successfully',
            data: rooms
        })
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        })
    }
}


const updateRoom = async (req, res) => {
    try {
        const room = await roomService.updateRoom(req.params.roomId, req.body);
        res.status(200).json({
            status: 'success',
            message: 'Room updated successfully',
            data: room
        })
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        })
    }
}

const deleteRoom = async (req, res) => {
    try {
        await roomService.deleteRoom(req.params.roomId);
        res.status(200).json({
            status: 'success',
            message: 'Room deleted successfully'
        })
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        })
    }
}

module.exports = {
    addRoom,
    getRoomsByCinema,
    updateRoom,
    deleteRoom
}