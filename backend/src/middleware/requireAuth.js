const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Exige um Bearer token JWT válido. Em caso de sucesso, popula
 * req.user = { id, email }. Esse req.user.id é o único valor
 * usado depois para escopar as queries via withUserContext —
 * nunca confie em um userId vindo do body/query da requisição.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'unauthorized', message: 'Token de autenticação ausente.' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized', message: 'Token inválido ou expirado.' });
  }
}

module.exports = { requireAuth };
