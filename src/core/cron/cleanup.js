const cron = require('node-cron');
const { sequelize, Booking, Ticket } = require('../../models');

const getAffectedRows = (queryResult) => {
    if (typeof queryResult === 'number') {
        return queryResult;
    }

    if (Array.isArray(queryResult)) {
        const metadata = queryResult[1] ?? queryResult[0];

        if (typeof metadata === 'number') {
            return metadata;
        }

        if (metadata && typeof metadata.affectedRows === 'number') {
            return metadata.affectedRows;
        }

        if (metadata && typeof metadata.rowCount === 'number') {
            return metadata.rowCount;
        }

        if (queryResult[0] && typeof queryResult[0].affectedRows === 'number') {
            return queryResult[0].affectedRows;
        }
    }

    if (queryResult && typeof queryResult.affectedRows === 'number') {
        return queryResult.affectedRows;
    }

    if (queryResult && typeof queryResult.rowCount === 'number') {
        return queryResult.rowCount;
    }

    return 0;
};

const cleanupPendingBookings = () => {
    cron.schedule('* * * * *', async () => {
        const t = await sequelize.transaction();
        try {
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

            const bookingQueryResult = await sequelize.query(
                `UPDATE Bookings 
                 SET status = 'cancelled', updatedAt = NOW()
                 WHERE status = 'pending' AND createdAt < :fifteenMinutesAgo`,
                {
                    replacements: { fifteenMinutesAgo },
                    transaction: t,
                    type: sequelize.QueryTypes.UPDATE
                }
            );

            const ticketQueryResult = await sequelize.query(
                `UPDATE Tickets 
                 SET status = 'refunded', updatedAt = NOW()
                 WHERE booking_id IN (
                    SELECT id FROM Bookings 
                    WHERE status = 'cancelled' AND createdAt < :fifteenMinutesAgo
                 )
                 AND status = 'valid'`,
                {
                    replacements: { fifteenMinutesAgo },
                    transaction: t,
                    type: sequelize.QueryTypes.UPDATE
                }
            );

            const updatedBookings = getAffectedRows(bookingQueryResult);
            const updatedTickets = getAffectedRows(ticketQueryResult);

            await t.commit();
            console.log(`[CRON] Tối ưu hoàn tất: ${updatedBookings} đơn hàng và ${updatedTickets} vé được cập nhật.`);
        } catch (error) {
            await t.rollback();
            console.error('[CRON] Lỗi chạy tác vụ dọn dẹp:', error);
        }
    });
};

module.exports = cleanupPendingBookings;