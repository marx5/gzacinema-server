const Redis = require('ioredis');

const env = process.env.NODE_ENV || 'development';

const redisOptions = {};
if (env === 'production') {
    redisOptions.tls = {};
}

const redis = new Redis(process.env.REDIS_URL, redisOptions);

redis.on('connect', () => {
    console.log(`Connected to Redis (${env})`);
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

module.exports = redis;