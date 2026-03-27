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

const rawTrustProxy = process.env.TRUST_PROXY;
const trustProxy = rawTrustProxy === undefined
    ? 1
    : rawTrustProxy === 'true'
        ? true
        : rawTrustProxy === 'false'
            ? false
            : Number(rawTrustProxy);

app.set('trust proxy', Number.isNaN(trustProxy) ? 1 : trustProxy);

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
    max: 5000,
    message: { status: 'error', message: 'Too many requests from this IP, please try again later.' }
})

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { status: 'error', message: 'Too many login attempts, please try again after 15 minutes.' }
});

const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    skipSuccessfulRequests: true,
    message: { status: 'error', message: 'Too many booking requests, please try again later.' }
});

const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    skipSuccessfulRequests: true,
    message: { status: 'error', message: 'Too many payment requests, please try again later.' }
});

app.get('/api', limiter, (req, res) => {
    res.status(200).json({ status: 'success', message: 'Welcome to Gzacinema API' });
});

app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Gzacinema server is running' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'OK' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', limiter, userRoutes);
app.use('/api/cinemas', limiter, cinemaRoutes);
app.use('/api/movies', limiter, movieRoutes);
app.use('/api/cinemas', limiter, roomRoutes);
app.use('/api/showtimes', limiter, showtimeRoutes);
app.use('/api/bookings', bookingLimiter, bookingRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/tickets', limiter, ticketRoutes);
app.use('/api/statistics', limiter, statisticRoutes);

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
