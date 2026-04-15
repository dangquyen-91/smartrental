const rateLimit = require('express-rate-limit');

let redisClient = null;
let RedisStore = null;

if (process.env.REDIS_URL) {
  try {
    const { default: Redis } = require('ioredis');
    const { RedisStore: Store } = require('rate-limit-redis');
    redisClient = new Redis(process.env.REDIS_URL, { lazyConnect: true });
    RedisStore = Store;

    redisClient.on('error', (err) => {
      console.warn('[RateLimit] Redis error, falling back to memory store:', err.message);
      redisClient = null;
    });
  } catch (err) {
    console.warn('[RateLimit] Failed to load Redis, using memory store:', err.message);
  }
}

const makeStore = (prefix) => {
  if (redisClient && RedisStore) {
    return new RedisStore({ sendCommand: (...args) => redisClient.call(...args), prefix });
  }
  return undefined;
};

const createLimiter = ({ windowMs, max, prefix, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore(prefix),
    message: { success: false, message },
  });

const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  prefix: 'rl:api:',
  message: 'Too many requests, please try again later',
});

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  prefix: 'rl:auth:',
  message: 'Too many auth attempts, please try again later',
});

module.exports = { apiLimiter, authLimiter };
