const redis = require('../config/redis');
const env = require('../config/env');

const MAX_ATTEMPTS = env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS; // 5
const WINDOW_SECONDS = env.LOGIN_RATE_LIMIT_WINDOW_SECONDS; // 900s = 15min

function loginAttemptsKey(ip) {
  return `login_attempts:${ip}`;
}

/**
 * Roda ANTES do controller de login. Só verifica o contador atual
 * (não incrementa) — se o IP já estourou o limite, corta a
 * requisição aqui mesmo, sem sequer bater no banco/bcrypt.
 *
 * Requer `app.set('trust proxy', ...)` configurado corretamente em
 * app.js quando atrás de um proxy/load balancer, para que req.ip
 * reflita o IP real do cliente (via X-Forwarded-For) e não o do proxy.
 */
async function checkLoginRateLimit(req, res, next) {
  try {
    const ip = req.ip;
    const key = loginAttemptsKey(ip);
    const attempts = parseInt(await redis.get(key), 10) || 0;

    if (attempts >= MAX_ATTEMPTS) {
      const ttl = await redis.ttl(key);
      const retryAfterSeconds = ttl > 0 ? ttl : WINDOW_SECONDS;
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        error: 'too_many_requests',
        message: `Muitas tentativas de login incorretas. Tente novamente em ${Math.ceil(retryAfterSeconds / 60)} minuto(s).`
      });
    }

    req.loginRateLimitKey = key;
    next();
  } catch (err) {
    // Se o Redis cair, é mais seguro falhar fechado (bloquear) do que
    // deixar o rate limiting inteiro de lado silenciosamente.
    console.error('Erro no rate limiter de login:', err);
    return res.status(503).json({ error: 'service_unavailable', message: 'Tente novamente em instantes.' });
  }
}

/** Chamado pelo controller só quando a senha está incorreta. */
async function registerFailedLoginAttempt(key) {
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }
  return attempts;
}

/** Chamado pelo controller em login bem-sucedido, zerando o contador do IP. */
async function clearLoginAttempts(key) {
  await redis.del(key);
}

module.exports = { checkLoginRateLimit, registerFailedLoginAttempt, clearLoginAttempts };
