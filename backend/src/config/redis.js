const redis = require('redis');

let client;

async function connectRedis() {
  try {
    client = redis.createClient({ 
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: false
      }
    });
    client.on('error', (err) => {
      // Only log if it's not a connection refused error we already handled
      if (err.code !== 'ECONNREFUSED') console.error('Redis error:', err);
    });
    await client.connect();
    console.log('Redis connected');
  } catch (err) {
    console.error('Redis connection failed:', err.message);
    console.warn('Backend running without Redis. Caching disabled.');
  }
}

async function get(key) {
  const val = await client.get(key);
  return val ? JSON.parse(val) : null;
}

async function set(key, value, ttlSeconds = 3600) {
  await client.setEx(key, ttlSeconds, JSON.stringify(value));
}

async function del(key) {
  await client.del(key);
}

async function invalidatePattern(pattern) {
  const keys = await client.keys(pattern);
  if (keys.length) await client.del(keys);
}

module.exports = { connectRedis, get, set, del, invalidatePattern };
