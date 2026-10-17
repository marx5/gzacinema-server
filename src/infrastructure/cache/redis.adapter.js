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

    /**
     * Giữ ghế nguyên tử (SET NX EX)
     * @param {string} key 
     * @param {string} owner 
     * @param {number} ttlSeconds 
     * @returns {Promise<boolean>} true nếu acquire thành công
     */
    async acquireSeat(key, owner, ttlSeconds) {
        const result = await redisClient.set(key, owner, 'EX', ttlSeconds, 'NX');
        return result === 'OK';
    }

    /**
     * Nhả ghế an toàn chỉ khi key thuộc về đúng owner (Compare-and-Delete qua Lua script)
     * @param {string} key 
     * @param {string} owner 
     * @returns {Promise<boolean>} true nếu xóa thành công, false nếu không phải owner hoặc key không tồn tại
     */
    async releaseSeat(key, owner) {
        const luaScript = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;
        const result = await redisClient.eval(luaScript, 1, key, owner);
        return result === 1;
    }

    /**
     * Gia hạn giữ ghế an toàn chỉ khi key thuộc về đúng owner (Compare-and-Expire qua Lua script)
     * @param {string} key 
     * @param {string} owner 
     * @param {number} ttlSeconds 
     * @returns {Promise<boolean>} true nếu gia hạn thành công, false nếu không phải owner
     */
    async extendSeat(key, owner, ttlSeconds) {
        const luaScript = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("expire", KEYS[1], ARGV[2])
            else
                return 0
            end
        `;
        const result = await redisClient.eval(luaScript, 1, key, String(owner), String(ttlSeconds));
        return result === 1;
    }

    /**
     * Nhả nhiều ghế an toàn thuộc về owner (Lua script)
     * @param {string[]} keys 
     * @param {string} owner 
     * @returns {Promise<number>} số lượng key thực sự được xóa
     */
    async releaseMultipleSeats(keys, owner) {
        if (!keys || keys.length === 0) return 0;
        const luaScript = `
            local deleted = 0
            for i = 1, #KEYS do
                if redis.call("get", KEYS[i]) == ARGV[1] then
                    redis.call("del", KEYS[i])
                    deleted = deleted + 1
                end
            end
            return deleted
        `;
        const result = await redisClient.eval(luaScript, keys.length, ...keys, String(owner));
        return Number(result);
    }

    /**
     * Gia hạn đồng thời tất cả các ghế cho owner theo nguyên tắc All-or-Nothing (Lua script)
     * Nếu có bất kỳ ghế nào không còn thuộc owner, trả về false và không gia hạn ghế nào.
     * @param {string[]} keys 
     * @param {string} owner 
     * @param {number} ttlSeconds 
     * @returns {Promise<boolean>} true nếu tất cả ghế được gia hạn thành công
     */
    async extendMultipleSeats(keys, owner, ttlSeconds) {
        if (!keys || keys.length === 0) return false;
        const luaScript = `
            for i = 1, #KEYS do
                if redis.call("get", KEYS[i]) ~= ARGV[1] then
                    return 0
                end
            end
            for i = 1, #KEYS do
                redis.call("expire", KEYS[i], ARGV[2])
            end
            return 1
        `;
        const result = await redisClient.eval(luaScript, keys.length, ...keys, String(owner), String(ttlSeconds));
        return result === 1;
    }
}

module.exports = new RedisCacheAdapter();

