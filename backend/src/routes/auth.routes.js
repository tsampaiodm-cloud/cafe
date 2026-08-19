const express = require('express');
const authController = require('../controllers/authController');
const { validateBody } = require('../middleware/validate');
const { requireAuth } = require('../middleware/requireAuth');
const { checkLoginRateLimit } = require('../middleware/loginRateLimiter');
const { registerSchema, loginSchema } = require('../utils/validators');

const router = express.Router();

router.post('/register', validateBody(registerSchema), authController.register);

// Ordem importa: primeiro verifica o rate limit (barato, só lê o
// Redis), depois valida o input, só então chega no controller que
// de fato bate no banco e no bcrypt.
router.post('/login', checkLoginRateLimit, validateBody(loginSchema), authController.login);

router.get('/me', requireAuth, authController.me);

module.exports = router;
