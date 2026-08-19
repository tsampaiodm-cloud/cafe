const userService = require('../services/userService');
const authService = require('../services/authService');
const { registerFailedLoginAttempt, clearLoginAttempts } = require('../middleware/loginRateLimiter');

async function register(req, res, next) {
  try {
    const { nome, email, password } = req.body; // já validado/sanitizado pelo middleware

    const existing = await userService.findUserByEmail(email);
    if (existing) {
      // Mensagem genérica de propósito — não confirma nem nega
      // implicitamente detalhes além do necessário.
      return res.status(409).json({ error: 'email_in_use', message: 'Não foi possível concluir o cadastro com esses dados.' });
    }

    const user = await userService.createUserWithProfile({ nome, email, password });
    const token = authService.generateToken(user);

    return res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const rateLimitKey = req.loginRateLimitKey;

    const user = await userService.findUserByEmail(email);

    // Compara contra um hash válido mesmo quando o usuário não existe,
    // pra manter o tempo de resposta parecido e não vazar (via timing)
    // se aquele e-mail está cadastrado.
    const hashToCompare = user ? user.password_hash : authService.DUMMY_HASH;
    const passwordMatches = await authService.comparePassword(password, hashToCompare);

    if (!user || !passwordMatches) {
      await registerFailedLoginAttempt(rateLimitKey);
      return res.status(401).json({ error: 'invalid_credentials', message: 'E-mail ou senha inválidos.' });
    }

    await clearLoginAttempts(rateLimitKey);

    const token = authService.generateToken(user);
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const profile = await userService.getProfile(req.user.id);
    return res.json({ id: req.user.id, email: req.user.email, profile });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
