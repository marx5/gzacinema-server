const express = require('express');
const router = express.Router();

const cinemaController = require('./cinema.controller');
const { verifyToken, verifyAdmin } = require('../../core/middlewares/auth.middleware');

router.post('/', verifyToken, verifyAdmin, cinemaController.addCinema);
router.get('/', cinemaController.getAllCinemas);
router.get('/:id', cinemaController.getCinemaById);
router.put('/:id', verifyToken, verifyAdmin, cinemaController.updateCinema);
router.delete('/:id', verifyToken, verifyAdmin, cinemaController.deleteCinema);
module.exports = router;