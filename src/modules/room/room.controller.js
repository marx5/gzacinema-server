const roomService = require('./room.service');
const catchAsync = require('../../core/utils/catchAsync');

const createRoom = catchAsync(async (req, res) => {
    const { cinemaId } = req.params;
    const newRoom = await roomService.createRoom(cinemaId, req.body);
    res.status(201).json({
        status: 'success',
        message: 'Room created successfully',
        data: newRoom
    })
})

const getRoomsByCinema = catchAsync(async (req, res) => {
    const rooms = await roomService.getRoomsByCinema(req.params.cinemaId);
    res.status(200).json({
        status: 'success',
        message: 'Rooms retrieved successfully',
        data: rooms
    })
})


const updateRoom = catchAsync(async (req, res) => {
    const room = await roomService.updateRoom(req.params.roomId, req.body);
    res.status(200).json({
        status: 'success',
        message: 'Room updated successfully',
        data: room
    })
})

const deleteRoom = catchAsync(async (req, res) => {
    await roomService.deleteRoom(req.params.roomId);
    res.status(200).json({
        status: 'success',
        message: 'Room deleted successfully'
    })
})

const updateSeatStatus = catchAsync(async (req, res) => {
    const { roomId, seatId } = req.params;
    const { status } = req.body;

    const seat = await roomService.updateSeatStatus(roomId, seatId, status);
    res.status(200).json({
        status: 'success',
        message: 'Updated seat status successfully',
        data: seat
    });
});

module.exports = {
    createRoom,
    getRoomsByCinema,
    updateRoom,
    deleteRoom,
    updateSeatStatus
}