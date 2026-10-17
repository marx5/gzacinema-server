const cron = require('node-cron');
const { Booking, Ticket } = require('../../models');
const bookingRepository = require('../../modules/booking/infrastructure/booking.repository');
const { releaseCancelledBookingSeats } = require('../../modules/booking/booking.service');
const { Op } = require('sequelize');

const CLEANUP_EXPIRATION_MINUTES = 15;
let isCleaning = false;

/**
 * Cron job chạy định kỳ mỗi phút:
 * 1. Tìm các đơn hàng pending quá 15 phút.
 * 2. Cập nhật có điều kiện (WHERE status = 'pending') sang 'cancelled' và vé sang 'refunded' bằng transaction & row lock.
 * 3. Xóa các key giữ chỗ trong Redis an toàn theo đúng owner token (user_id).
 * 4. Phát Domain Event 'SEAT_STATUS_CHANGED' (available) realtime cho client chỉ với các ghế thực sự được giải phóng.
 */
const cleanupPendingBookings = () => {
    // Chạy mỗi phút 1 lần vào đúng giây thứ 00 (0 * * * * *)
    cron.schedule('0 * * * * *', async () => {
        if (isCleaning) return;
        isCleaning = true;

        const expirationThreshold = new Date(Date.now() - CLEANUP_EXPIRATION_MINUTES * 60 * 1000);

        try {
            // 1. Tìm danh sách các booking pending quá hạn (giới hạn mỗi mẻ 200 đơn)
            const expiredCandidates = await Booking.findAll({
                where: {
                    status: 'pending',
                    createdAt: {
                        [Op.lt]: expirationThreshold
                    }
                },
                limit: 200,
                include: [{
                    model: Ticket,
                    as: 'tickets',
                    attributes: ['id', 'seat_id', 'status']
                }]
            });

            if (!expiredCandidates || expiredCandidates.length === 0) {
                return;
            }

            let cleanedCount = 0;

            for (const candidate of expiredCandidates) {
                // Hủy booking nguyên tử với Pessimistic Lock & conditional check (status === 'pending')
                const result = await bookingRepository.cancelBookingAndTickets(candidate.id);

                // Nếu booking thực sự chuyển trạng thái thành công (chưa bị IPN mark paid trước đó)
                if (result.success) {
                    cleanedCount++;
                    const showtimeId = candidate.showtime_id;
                    const seatIds = (candidate.tickets || []).map(t => t.seat_id);

                    await releaseCancelledBookingSeats({
                        showtimeId,
                        seatIds,
                        userId: candidate.user_id
                    });
                }
            }

            if (cleanedCount > 0) {
                console.log(`[CRON] Đã dọn dẹp thành công ${cleanedCount} đơn hàng pending quá hạn và giải phóng ghế an toàn.`);
            }
        } catch (error) {
            console.error('[CRON] Lỗi chạy tác vụ dọn dẹp đơn hàng quá hạn:', error);
        } finally {
            isCleaning = false;
        }
    });
};

module.exports = cleanupPendingBookings;