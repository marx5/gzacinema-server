const redis = require('../../config/redis');
const { createRedisSubscriber } = require('../../config/redis');
const eventBus = require('../../core/events/eventBus');
const DomainEvents = require('../../core/events/domainEvents');

let subscriber = null;

/**
 * Khởi tạo listener lắng nghe sự kiện key Redis hết hạn (Keyspace Notifications)
 * Tự động nhả ghế khi hold_seat:{showtimeId}:{seatId} hết hạn TTL.
 */
const initRedisExpiredListener = async () => {
    try {
        // Cố gắng bật tính năng Keyspace Notifications cho sự kiện Expired nếu Redis cho phép
        try {
            await redis.config('SET', 'notify-keyspace-events', 'Ex');
            console.log('[Redis] Keyspace notifications (Ex) enabled successfully.');
        } catch (configErr) {
            console.warn('[Redis] CONFIG SET notify-keyspace-events skipped (might be restricted in managed environment):', configErr.message);
        }

        subscriber = createRedisSubscriber();

        // Pattern subscribe lắng nghe tất cả các DB (__keyevent@*__:expired)
        const EXPIRED_CHANNEL_PATTERN = '__keyevent@*__:expired';

        subscriber.psubscribe(EXPIRED_CHANNEL_PATTERN, (err, count) => {
            if (err) {
                console.error('[Redis] Failed to psubscribe to expired channel:', err);
                return;
            }
            console.log(`[Redis] Subscribed to expired channel pattern (${EXPIRED_CHANNEL_PATTERN}). Channels count: ${count}`);
        });

        subscriber.on('pmessage', (pattern, channel, expiredKey) => {
            if (!expiredKey || !expiredKey.startsWith('hold_seat:')) {
                return;
            }

            const parts = expiredKey.split(':');
            if (parts.length === 3) {
                const [, showtimeId, seatId] = parts;
                if (showtimeId && seatId) {
                    console.log(`[Redis Expired] Seat hold expired for showtime ${showtimeId}, seat ${seatId}. Emitting available event.`);
                    
                    // Phát Domain Event để Socket.IO adapter thông báo realtime cho các client
                    eventBus.emit(DomainEvents.SEAT_STATUS_CHANGED, {
                        showtimeId,
                        seatId,
                        status: 'available'
                    });
                }
            }
        });
    } catch (error) {
        console.error('[Redis] Error initializing redis expired listener:', error);
    }
};

/**
 * Hủy bỏ subscription và đóng kết nối subscriber
 */
const stopRedisExpiredListener = async () => {
    if (subscriber) {
        try {
            await subscriber.punsubscribe('__keyevent@*__:expired');
            subscriber.disconnect();
            subscriber = null;
            console.log('[Redis] Redis expired listener stopped.');
        } catch (err) {
            console.error('[Redis] Error stopping redis expired listener:', err);
        }
    }
};

module.exports = {
    initRedisExpiredListener,
    stopRedisExpiredListener
};
