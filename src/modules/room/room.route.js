const express = require('express');
const router = express.Router();

const roomController = require('./room.controller');
const { verifyToken, verifyAdmin, verifyStaff } = require('../../core/middlewares/auth.middleware');
const validate = require('../../core/middlewares/validate.middleware');
const { createRoomSchema, updateRoomSchema } = require('./room.validation');

router.post('/:cinemaId', verifyToken, verifyAdmin, validate(createRoomSchema), roomController.createRoom);
router.get('/cinema/:cinemaId', verifyToken, roomController.getRoomsByCinema);
router.put('/:roomId', verifyToken, verifyAdmin, validate(updateRoomSchema), roomController.updateRoom);
router.delete('/:roomId', verifyToken, verifyAdmin, validate(updateRoomSchema), roomController.deleteRoom);
router.put('/:roomId/seats/:seatId', verifyToken, verifyStaff, roomController.updateSeatStatus);

module.exports = router;