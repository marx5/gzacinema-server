const Redis = require('ioredis');

const env = process.env.NODE_ENV || 'development';

// Không dùng TLS vì Redis chạy nội bộ trong Docker network
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
});

redis.on('connect', () => {
    console.log(`Connected to Redis (${env})`);
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

module.exports = redis;