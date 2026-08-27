const redisClient = require('../../config/redis');

/**
 * Redis Cache Adapter
 * Cung cấp interface chuẩn hóa cho tầng Application/Use Cases tương tác với Cache.
 */
class RedisCacheAdapter {
    /**
     * Lấy giá trị của một key
     * @param {string} key 
     * @returns {Promise<string|null>}
     */
    async get(key) {
        return await redisClient.get(key);
    }

    /**
     * Lấy giá trị của nhiều keys cùng lúc
     * @param {string[]} keys 
     * @returns {Promise<(string|null)[]>}
     */
    async mget(keys) {
        if (!keys || keys.length === 0) return [];
        return await redisClient.mget(keys);
    }

    /**
     * Đặt giá trị cho key với thời gian hết hạn (seconds)
     * @param {string} key 
     * @param {string|number} value 
     * @param {number} ttlSeconds 
     * @returns {Promise<boolean>}
     */
    async set(key, value, ttlSeconds) {
        if (ttlSeconds) {
            const result = await redisClient.set(key, value, 'EX', ttlSeconds);
            return result === 'OK';
        }
        const result = await redisClient.set(key, value);
        return result === 'OK';
    }

    /**
     * Đặt giá trị cho key nếu chưa tồn tại (SET NX) với thời gian hết hạn (seconds)
     * @param {string} key 
     * @param {string|number} value 
     * @param {number} ttlSeconds 
     * @returns {Promise<boolean>} true nếu set thành công, false nếu key đã tồn tại
     */
    async setNx(key, value, ttlSeconds) {
        const result = await redisClient.set(key, value, 'EX', ttlSeconds, 'NX');
        return result === 'OK';
    }

    /**
     * Gia hạn TTL cho key (seconds)
     * @param {string} key 
     * @param {number} ttlSeconds 
     * @returns {Promise<number>}
     */
    async expire(key, ttlSeconds) {
        return await redisClient.expire(key, ttlSeconds);
    }

    /**
     * Thêm một hoặc nhiều thành viên vào một set
     * @param {string} key 
     * @param {string|string[]} members 
     * @returns {Promise<number>}
     */
    async sadd(key, members) {
        if (!members) return 0;
        if (Array.isArray(members)) {
            if (members.length === 0) return 0;
            return await redisClient.sadd(key, ...members);
        }
        return await redisClient.sadd(key, members);
    }

    /**
     * Lấy tất cả thành viên của một set
     * @param {string} key 
     * @returns {Promise<string[]>}
     */
    async smembers(key) {
        return await redisClient.smembers(key);
    }

    /**
     * Xóa một hoặc nhiều keys
     * @param {string|string[]} keys 
     * @returns {Promise<number>}
     */
    async del(keys) {
        if (!keys) return 0;
        if (Array.isArray(keys)) {
            if (keys.length === 0) return 0;
            return await redisClient.del(...keys);
        }
        return await redisClient.del(keys);
    }
}

module.exports = new RedisCacheAdapter();

