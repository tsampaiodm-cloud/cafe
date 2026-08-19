const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true
});

redis.on('error', (err) => {
  console.error('Erro na conexão com o Redis', err);
});

module.exports = redis;
