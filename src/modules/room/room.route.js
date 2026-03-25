const express = require('express');
const router = express.Router();

const roomController = require('./room.controller');
const { verifyToken, verifyAdmin } = require('../../core/middlewares/auth.middleware');

router.post('/:cinemaId', verifyToken, verifyAdmin, roomController.addRoom);
router.get('/cinema/:cinemaId', verifyToken, roomController.getRoomsByCinema);
router.put('/:roomId', verifyToken, verifyAdmin, roomController.updateRoom);
router.delete('/:roomId', verifyToken, verifyAdmin, roomController.deleteRoom);

module.exports = router;