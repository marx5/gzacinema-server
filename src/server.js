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

io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    let currentRoom = null;

    socket.on('join_showtime', (showtimeId) => {
        if (currentRoom == showtimeId) return;
        if (currentRoom) {
            socket.leave(currentRoom);
            console.log(`[Socket] ${socket.id} left room: ${currentRoom}`);
        }

        socket.join(showtimeId);
        currentRoom = showtimeId;
        console.log(`[Socket] ${socket.id} joined room: ${showtimeId}`);
    });

    socket.on('leave_showtime', (showtimeId) => {
        if (currentRoom === showtimeId) {
            socket.leave(showtimeId);
            console.log(`[Socket] ${socket.id} left room: ${showtimeId}`);
            currentRoom = null;
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] User disconnected: ${socket.id}`);
    });
});

global.io = io;

const startServer = async () => {
    await connectDB();
    await sequelize.sync({ alter: false });
    console.log('Database connected and models synchronized');

    cleanupPendingBookings();

    server.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

startServer();