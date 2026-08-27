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
const { initRedisExpiredListener } = require('./infrastructure/cache/redisExpired.listener');

initSeatSocketHandler(io);

const startServer = async () => {
    await connectDB();
    await sequelize.sync({ alter: false });
    console.log('Database connected and models synchronized');

    cleanupPendingBookings();
    await initRedisExpiredListener();

    server.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();