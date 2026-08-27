const eventBus = require('../../core/events/eventBus');
const DomainEvents = require('../../core/events/domainEvents');

/**
 * Socket.IO Handler cho tính năng đặt vé (Showtime/Seats)
 * Đóng vai trò là Interface Adapter giữa EventBus nội bộ và WebSocket Client.
 * @param {import('socket.io').Server} io 
 */
const initSeatSocketHandler = (io) => {
    io.on('connection', (socket) => {
        let currentRoom = null;

        socket.on('join_showtime', (showtimeId) => {
            if (currentRoom === showtimeId) return;
            if (currentRoom) {
                socket.leave(currentRoom);
            }

            socket.join(showtimeId);
            currentRoom = showtimeId;
        });

        socket.on('leave_showtime', (showtimeId) => {
            if (currentRoom === showtimeId) {
                socket.leave(showtimeId);
                currentRoom = null;
            }
        });
    });

    // Lắng nghe sự kiện Domain Event thay đổi trạng thái ghế đơn lẻ
    eventBus.on(DomainEvents.SEAT_STATUS_CHANGED, ({ showtimeId, seatId, status, heldByUserId }) => {
        io.to(showtimeId).emit('seat_status_changed', {
            id: seatId,
            status,
            ...(heldByUserId ? { held_by_user: heldByUserId } : {})
        });
    });

    // Lắng nghe sự kiện Domain Event nhiều ghế đã được thanh toán/đặt thành công
    eventBus.on(DomainEvents.SEATS_BOOKED, ({ showtimeId, seatIds }) => {
        seatIds.forEach((seatId) => {
            io.to(showtimeId).emit('seat_status_changed', {
                id: seatId,
                status: 'booked'
            });
        });
    });
};

module.exports = initSeatSocketHandler;
