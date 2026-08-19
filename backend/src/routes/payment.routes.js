const express = require('express');
const paymentController = require('../controllers/paymentController');
const { validateBody } = require('../middleware/validate');
const { requireAuth } = require('../middleware/requireAuth');
const { checkoutSchema } = require('../utils/validators');

const router = express.Router();

router.post(
  '/checkout-session',
  requireAuth,
  validateBody(checkoutSchema),
  paymentController.createCheckout
);

// O endpoint de webhook (POST /api/payment/webhook) é registrado
// separadamente em app.js, ANTES do express.json() global, porque a
// verificação de assinatura do Stripe precisa do corpo cru (raw)
// da requisição — se passar por express.json() primeiro, o corpo já
// vem parseado/re-serializado e a assinatura não bate mais.

module.exports = router;
