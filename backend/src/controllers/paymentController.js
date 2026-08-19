const paymentService = require('../services/paymentService');

async function createCheckout(req, res, next) {
  try {
    const { items } = req.body; // validado por checkoutSchema
    const { checkoutUrl, orderId } = await paymentService.createCheckoutSession(
      req.user.id,
      req.user.email,
      items
    );
    return res.status(201).json({ checkoutUrl, orderId });
  } catch (err) {
    next(err);
  }
}

/**
 * Endpoint chamado pelo Stripe, não pelo app. Precisa do corpo cru
 * (raw body) pra validar a assinatura — ver a montagem da rota em
 * routes/payment.routes.js, que usa express.raw() só aqui.
 */
async function stripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = paymentService.constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error('Assinatura de webhook do Stripe inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await paymentService.markOrderAsPaid(session.id);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object;
        await paymentService.markOrderAsFailed(session.id);
        break;
      }
      default:
        // Outros eventos são ignorados de propósito — só tratamos o
        // necessário para confirmar/expirar o pedido.
        break;
    }
    return res.json({ received: true });
  } catch (err) {
    console.error('Erro ao processar webhook do Stripe:', err);
    // Devolve 500 pra o Stripe re-tentar o envio do evento depois.
    return res.status(500).json({ error: 'webhook_processing_failed' });
  }
}

module.exports = { createCheckout, stripeWebhook };
