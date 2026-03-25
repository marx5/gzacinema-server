const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const authRoutes = require('./modules/auth/auth.route');
const userRoutes = require('./modules/user/user.route');
const cinemaRoutes = require('./modules/cinema/cinema.route');
const movieRoutes = require('./modules/movie/movie.route');
const roomRoutes = require('./modules/room/room.route');
const showtimeRoutes = require('./modules/showtime/showtime.route');
const bookingRoutes = require('./modules/booking/booking.route');
const paymentRoutes = require('./modules/payment/payment.route');
const ticketRoutes = require('./modules/ticket/ticket.route');
const statisticRoutes = require('./modules/statistic/statistic.route');

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Welcome to Gzacinema API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/statistics', statisticRoutes);

module.exports = app;
