const Stripe = require('stripe');
const env = require('../config/env');
const { query, withUserContext } = require('../config/db');

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

/**
 * Cria o pedido (status "pending") e os itens dentro do contexto do
 * usuário — RLS garante que o pedido só pode ser criado com o próprio
 * user_id, mesmo que exista algum bug de autorização mais acima.
 */
async function createPendingOrder(userId, items) {
  const totalCents = items.reduce((sum, i) => sum + i.precoCents * i.quantidade, 0);

  return withUserContext(userId, async (client) => {
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_cents)
       VALUES ($1, 'pending', $2)
       RETURNING id`,
      [userId, totalCents]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, nome, detalhe, preco_cents, quantidade)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.nome, item.detalhe || null, item.precoCents, item.quantidade]
      );
    }

    return orderId;
  });
}

async function attachStripeSession(userId, orderId, stripeSessionId) {
  return withUserContext(userId, async (client) => {
    await client.query(
      `UPDATE orders SET stripe_session_id = $1, updated_at = now() WHERE id = $2`,
      [stripeSessionId, orderId]
    );
  });
}

/**
 * Monta a sessão de Checkout do Stripe a partir do carrinho já
 * validado (checkoutSchema) e devolve a URL para o cliente redirecionar.
 * Os valores em `precoCents` vêm inteiros (centavos) de propósito,
 * evitando erros de arredondamento de ponto flutuante com dinheiro.
 */
async function createCheckoutSession(userId, userEmail, items) {
  const orderId = await createPendingOrder(userId, items);

  const line_items = items.map((item) => ({
    price_data: {
      currency: 'brl',
      product_data: {
        name: item.nome,
        description: item.detalhe || undefined
      },
      unit_amount: item.precoCents
    },
    quantity: item.quantidade
  }));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: userEmail,
    line_items,
    success_url: `${env.APP_URL}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/pagamento/cancelado`,
    metadata: { orderId, userId }
  });

  await attachStripeSession(userId, orderId, session.id);

  return { checkoutUrl: session.url, orderId };
}

/**
 * Verifica a assinatura do evento do Stripe (nunca confie em um
 * webhook sem validar a assinatura — qualquer um poderia forjar um
 * POST dizendo "pagamento aprovado" sem essa checagem) e atualiza o
 * status do pedido. Roda com uma query direta (sem app.user_id) porque
 * o webhook não tem um usuário autenticado no sentido da API — é uma
 * chamada de servidor-para-servidor autenticada pela assinatura HMAC.
 */
function constructWebhookEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

async function markOrderAsPaid(stripeSessionId) {
  await query(
    `UPDATE orders SET status = 'paid', updated_at = now() WHERE stripe_session_id = $1`,
    [stripeSessionId]
  );
}

async function markOrderAsFailed(stripeSessionId) {
  await query(
    `UPDATE orders SET status = 'failed', updated_at = now() WHERE stripe_session_id = $1`,
    [stripeSessionId]
  );
}

module.exports = {
  createCheckoutSession,
  constructWebhookEvent,
  markOrderAsPaid,
  markOrderAsFailed
};
