const express = require('express');
const router = express.Router();

const roomController = require('./room.controller');
const { verifyToken, verifyAdmin, verifyStaff } = require('../../core/middlewares/auth.middleware');
const validate = require('../../core/middlewares/validate.middleware');
const { createRoomSchema, updateRoomSchema, updateSeatStatusSchema } = require('./room.validation');

router.post('/:cinemaId/rooms', verifyToken, verifyAdmin, validate(createRoomSchema), roomController.createRoom);
router.get('/:cinemaId/rooms', verifyToken, verifyStaff, roomController.getRoomsByCinema);
router.put('/:cinemaId/rooms/:roomId', verifyToken, verifyAdmin, validate(updateRoomSchema), roomController.updateRoom);
router.delete('/:cinemaId/rooms/:roomId', verifyToken, verifyAdmin, roomController.deleteRoom);
router.put('/:cinemaId/rooms/:roomId/seats/:seatId', verifyToken, verifyStaff, validate(updateSeatStatusSchema), roomController.updateSeatStatus);

module.exports = router;