const cron = require('node-cron');
const { sequelize, Booking, Ticket } = require('../../models');
const redisAdapter = require('../../infrastructure/cache/redis.adapter');
const eventBus = require('../events/eventBus');
const DomainEvents = require('../events/domainEvents');
const { Op } = require('sequelize');

const CLEANUP_EXPIRATION_MINUTES = 15;

/**
 * Cron job chạy định kỳ mỗi phút:
 * 1. Tìm và hủy các đơn hàng pending quá 15 phút.
 * 2. Cập nhật vé sang trạng thái 'refunded'.
 * 3. Xóa các key giữ chỗ tương ứng trong Redis nếu còn tồn tại.
 * 4. Phát Domain Event 'SEAT_STATUS_CHANGED' (available) realtime cho client.
 */
const cleanupPendingBookings = () => {
    // Chạy mỗi phút 1 lần vào đúng giây thứ 00 (0 * * * * *)
    cron.schedule('0 * * * * *', async () => {
        const expirationThreshold = new Date(Date.now() - CLEANUP_EXPIRATION_MINUTES * 60 * 1000);

        try {
            // 1. Tìm các booking pending quá hạn kèm danh sách vé
            const expiredBookings = await Booking.findAll({
                where: {
                    status: 'pending',
                    createdAt: {
                        [Op.lt]: expirationThreshold
                    }
                },
                include: [{
                    model: Ticket,
                    as: 'tickets',
                    attributes: ['id', 'seat_id', 'status']
                }]
            });

            if (!expiredBookings || expiredBookings.length === 0) {
                return;
            }

            const expiredBookingIds = expiredBookings.map(b => b.id);
            const seatsToRelease = [];
            const redisKeysToDelete = [];

            expiredBookings.forEach(booking => {
                const showtimeId = booking.showtime_id;
                if (booking.tickets && booking.tickets.length > 0) {
                    booking.tickets.forEach(ticket => {
                        seatsToRelease.push({
                            showtimeId,
                            seatId: ticket.seat_id
                        });
                        redisKeysToDelete.push(`hold_seat:${showtimeId}:${ticket.seat_id}`);
                    });
                }
            });

            // 2. Cập nhật Database trong Transaction
            const t = await sequelize.transaction();
            try {
                await Booking.update(
                    { status: 'cancelled' },
                    {
                        where: { id: expiredBookingIds },
                        transaction: t
                    }
                );

                await Ticket.update(
                    { status: 'refunded' },
                    {
                        where: { booking_id: expiredBookingIds },
                        transaction: t
                    }
                );

                await t.commit();
            } catch (dbError) {
                await t.rollback();
                throw dbError;
            }

            // 3. Xóa các key giữ chỗ còn lại trong Redis
            if (redisKeysToDelete.length > 0) {
                await redisAdapter.del(redisKeysToDelete);
            }

            // 4. Phát sự kiện realtime nhả ghế cho người dùng
            seatsToRelease.forEach(({ showtimeId, seatId }) => {
                eventBus.emit(DomainEvents.SEAT_STATUS_CHANGED, {
                    showtimeId,
                    seatId,
                    status: 'available'
                });
            });

            console.log(
                `[CRON] Đã dọn dẹp ${expiredBookings.length} đơn hàng quá hạn, hủy ${seatsToRelease.length} vé, xóa ${redisKeysToDelete.length} key Redis và phát sự kiện nhả ghế.`
            );
        } catch (error) {
            console.error('[CRON] Lỗi chạy tác vụ dọn dẹp đơn hàng và key hết hạn:', error);
        }
    });
};

module.exports = cleanupPendingBookings;