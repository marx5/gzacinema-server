const cron = require('node-cron');
const { Op } = require('sequelize');
const { sequelize, Booking, Ticket } = require('../../models');

const cleanupPendingBookings = () => {
    cron.schedule('* * * * *', async () => {
        const t = await sequelize.transaction();
        try {
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

            const [bookingResult] = await sequelize.query(
                `UPDATE Bookings 
                 SET status = 'cancelled', updatedAt = NOW()
                 WHERE status = 'pending' AND createdAt < :fifteenMinutesAgo`,
                {
                    replacements: { fifteenMinutesAgo },
                    transaction: t,
                    type: sequelize.QueryTypes.UPDATE
                }
            );

            const [ticketResult] = await sequelize.query(
                `UPDATE Tickets 
                 SET status = 'cancelled', updatedAt = NOW()
                 WHERE booking_id IN (
                    SELECT id FROM Bookings 
                    WHERE status = 'cancelled' AND createdAt < :fifteenMinutesAgo
                 )`,
                {
                    replacements: { fifteenMinutesAgo },
                    transaction: t,
                    type: sequelize.QueryTypes.UPDATE
                }
            );

            await t.commit();
            console.log(`[CRON] Tối ưu hoàn tất: ${bookingResult} đơn hàng và ${ticketResult} vé được cập nhật.`);
        } catch (error) {
            await t.rollback();
            console.error('[CRON] Lỗi chạy tác vụ dọn dẹp:', error);
        }
    });
};

module.exports = cleanupPendingBookings;