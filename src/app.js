const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

require('dotenv').config();

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
app.use(compression());

app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'));

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { status: 'error', message: 'Too many requests from this IP, please try again later.' }
})

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { status: 'error', message: 'Too many login attempts, please try again after 15 minutes.' }
});

app.get('/api', limiter, (req, res) => {
    res.status(200).json({ status: 'success', message: 'Welcome to Gzacinema API' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/statistics', statisticRoutes);

app.all(/.*/, (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server`
    })
});

app.use((err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'SequelizeUniqueConstraintError') {
        error.statusCode = 400;
        error.message = 'Duplicate value found for a unique field';
    }

    if (err.name === 'SequelizeValidationError') {
        error.statusCode = 400;
        error.message = err.errors.map(e => e.message).join(', ');
    }

    if (err.name === 'JsonWebTokenError') {
        error.statusCode = 401;
        error.message = 'Invalid token. Please log in again.';
    }

    const statusCode = error.statusCode || 500;
    const status = error.status || 'error';

    res.status(statusCode).json({
        status,
        message: error.message,
        ...process.env.NODE_ENV === 'development' && { stack: error.stack }
    })
});

module.exports = app;
