const Redis = require('ioredis');

const env = process.env.NODE_ENV || 'development';

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
};

// Không dùng TLS vì Redis chạy nội bộ trong Docker network
const redis = new Redis(redisConfig);

redis.on('connect', () => {
    console.log(`Connected to Redis (${env})`);
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

/**
 * Tạo một Redis connection mới dành riêng cho việc Subscribe (Pub/Sub)
 * @returns {import('ioredis').Redis}
 */
const createRedisSubscriber = () => {
    const subscriber = new Redis(redisConfig);
    subscriber.on('error', (err) => {
        console.error('Redis Subscriber connection error:', err);
    });
    return subscriber;
};

module.exports = redis;
module.exports.createRedisSubscriber = createRedisSubscriber;