require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/database');
const { sequelize } = require('./models');
const cleanupPendingBookings = require('./core/cron/cleanup');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

const initSeatSocketHandler = require('./infrastructure/sockets/seatSocket.handler');
const { initRedisExpiredListener, stopRedisExpiredListener } = require('./infrastructure/cache/redisExpired.listener');

initSeatSocketHandler(io);

const startServer = async () => {
    await connectDB();
    await sequelize.sync(process.env.DB_ALTER_SYNC === 'true' ? { alter: true } : undefined);
    console.log('Database connected and models synchronized');

    cleanupPendingBookings();
    await initRedisExpiredListener();

    server.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

const gracefulShutdown = async (signal) => {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    await stopRedisExpiredListener();
    server.close(() => {
        process.exit(0);
    });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();