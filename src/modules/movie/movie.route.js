const express = require('express');
const router = express.Router();


const movieController = require('./movie.controller');
const showtimeController = require('../showtime/showtime.controller');
const { verifyToken, verifyAdmin } = require('../../core/middlewares/auth.middleware');
const { upload } = require('../../config/cloudinary');
const validate = require('../../core/middlewares/validate.middleware');
const { createMovieSchema, updateMovieSchema } = require('./movie.validation');

router.post('/', verifyToken, verifyAdmin, upload.single('thumbnail'), validate(createMovieSchema), movieController.addMovie);
router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovieDetails);
router.get('/:movieId/showtimes', showtimeController.getMovieShowtimes);
router.put('/:id', verifyToken, verifyAdmin, validate(updateMovieSchema), movieController.updateMovie);
router.delete('/:id', verifyToken, verifyAdmin, validate(updateMovieSchema), movieController.deleteMovie);


module.exports = router;