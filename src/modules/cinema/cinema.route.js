const express = require('express');
const router = express.Router();

const cinemaController = require('./cinema.controller');
const { verifyToken, verifyAdmin } = require('../../core/middlewares/auth.middleware');
const validate = require('../../core/middlewares/validate.middleware');
const { createCinemaSchema, updateCinemaSchema } = require('./cinema.validation');

router.post('/', verifyToken, verifyAdmin, validate(createCinemaSchema), cinemaController.addCinema);
router.get('/', cinemaController.getAllCinemas);
router.get('/:id', cinemaController.getCinemaById);
router.put('/:id', verifyToken, verifyAdmin, validate(updateCinemaSchema), cinemaController.updateCinema);
router.delete('/:id', verifyToken, verifyAdmin, cinemaController.deleteCinema);
module.exports = router;