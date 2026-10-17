const jwt = require('jsonwebtoken');
const eventBus = require('../../core/events/eventBus');
const DomainEvents = require('../../core/events/domainEvents');
const bookingService = require('../../modules/booking/booking.service');

/**
 * Socket.IO Handler cho tính năng đặt vé (Showtime/Seats)
 * Đóng vai trò là Interface Adapter giữa EventBus nội bộ và WebSocket Client.
 * Hỗ trợ tự động giải phóng ghế giữ tạm khi người dùng rời phòng hoặc đóng tab.
 * @param {import('socket.io').Server} io 
 */
const initSeatSocketHandler = (io) => {
    // Map lưu timer hủy giữ ghế khi disconnect tạm thời (tránh mất ghế khi F5 tải lại trang)
    const disconnectTimers = new Map();

    const extractUserIdFromSocket = (socket, payloadUserId) => {
        if (payloadUserId) return String(payloadUserId);
        try {
            const rawToken =
                socket.handshake?.auth?.token ||
                socket.handshake?.headers?.authorization?.replace(/^Bearer\s+/i, '');
            if (rawToken && process.env.JWT_SECRET) {
                const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
                if (decoded?.id) return String(decoded.id);
            }
        } catch {
            // Ignore invalid/expired token on socket handshake
        }
        return null;
    };

    io.on('connection', (socket) => {
        let currentRoom = null;
        let currentUserId = extractUserIdFromSocket(socket, null);

        socket.on('join_showtime', (payload) => {
            const showtimeId = typeof payload === 'object' ? payload?.showtimeId : payload;
            const userId = extractUserIdFromSocket(
                socket,
                typeof payload === 'object' ? payload?.userId : null
            );

            if (!showtimeId) return;
            if (userId) currentUserId = userId;

            // Hủy bộ đếm disconnect nếu người dùng vừa F5 kết nối lại vào đúng suất chiếu
            if (currentUserId) {
                const timerKey = `${showtimeId}:${currentUserId}`;
                if (disconnectTimers.has(timerKey)) {
                    clearTimeout(disconnectTimers.get(timerKey));
                    disconnectTimers.delete(timerKey);
                }
            }

            if (currentRoom === showtimeId) return;
            if (currentRoom) {
                socket.leave(currentRoom);
            }

            socket.join(showtimeId);
            currentRoom = showtimeId;
        });

        socket.on('leave_showtime', async (payload) => {
            const showtimeId =
                (typeof payload === 'object' ? payload?.showtimeId : payload) || currentRoom;
            const skipRelease = typeof payload === 'object' && Boolean(payload?.isCheckingOut);

            if (showtimeId) {
                socket.leave(showtimeId);
                if (currentRoom === showtimeId) {
                    currentRoom = null;
                }

                if (currentUserId && !skipRelease) {
                    try {
                        await bookingService.unholdAllSeatsByUser(showtimeId, currentUserId, {
                            skipIfPendingBooking: true
                        });
                    } catch (err) {
                        console.error('Error releasing seats on leave_showtime:', err);
                    }
                }
            }
        });

        socket.on('disconnect', () => {
            if (!currentRoom || !currentUserId) return;

            const showtimeIdToRelease = currentRoom;
            const userIdToRelease = currentUserId;
            const timerKey = `${showtimeIdToRelease}:${userIdToRelease}`;

            // Chờ 3 giây để phân biệt giữa F5 reload trang và đóng tab thực sự
            const timer = setTimeout(async () => {
                disconnectTimers.delete(timerKey);
                try {
                    await bookingService.unholdAllSeatsByUser(showtimeIdToRelease, userIdToRelease, {
                        skipIfPendingBooking: true
                    });
                } catch (err) {
                    console.error('Error releasing seats on socket disconnect:', err);
                }
            }, 3000);

            disconnectTimers.set(timerKey, timer);
        });
    });

    // Lắng nghe sự kiện Domain Event thay đổi trạng thái ghế đơn lẻ
    eventBus.on(DomainEvents.SEAT_STATUS_CHANGED, ({ showtimeId, seatId, status }) => {
        io.to(showtimeId).emit('seat_status_changed', {
            id: seatId,
            status
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

