const express = require('express');
const router = express.Router();

const movieController = require('./movie.controller');
const showtimeController = require('../showtime/showtime.controller');
const { verifyToken, verifyAdmin } = require('../../core/middlewares/auth.middleware');
const { upload } = require('../../config/cloudinary');

router.post('/', verifyToken, verifyAdmin, upload.single('thumbnail'), movieController.addMovie);
router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovieDetails);
router.get('/:movieId/showtimes', showtimeController.getMovieShowtimes);
router.put('/:id', verifyToken, verifyAdmin, movieController.updateMovie);
router.delete('/:id', verifyToken, verifyAdmin, movieController.deleteMovie);


module.exports = router;