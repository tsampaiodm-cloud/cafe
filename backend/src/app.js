const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const paymentController = require('./controllers/paymentController');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const paymentRoutes = require('./routes/payment.routes');
const catalogRoutes = require('./routes/catalog.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const postRoutes = require('./routes/post.routes');

const app = express();

// Necessário para que req.ip reflita o IP real do cliente (via
// X-Forwarded-For) quando o app roda atrás de um proxy/load balancer —
// crítico para o rate limiting de login funcionar por IP de verdade,
// e não pelo IP do proxy repetido em toda requisição.
if (env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors({ origin: env.APP_URL, credentials: true }));

// Webhook do Stripe precisa do corpo cru — por isso é montado ANTES
// do express.json() global, só para essa rota específica.
app.post(
  '/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/posts', postRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Rota não encontrada.' });
});

app.use(errorHandler);

module.exports = app;
