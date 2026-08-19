const { query, withUserContext } = require('../config/db');

async function getPlansAndConfig() {
  const plansResult = await query(
    'SELECT id, nome, gramas, preco_cents, frete, descricao, destaque FROM subscription_plans ORDER BY ordem'
  );

  const settingsResult = await query(
    "SELECT key, value FROM app_settings WHERE key IN ('meu_cafe_frete_gratis_acima_de_cents', 'meu_cafe_quantidades_gramas')"
  );
  const settings = Object.fromEntries(settingsResult.rows.map((r) => [r.key, r.value]));

  return {
    exploradorPlans: plansResult.rows,
    meuCafe: {
      freteGratisAcimaDeCents: settings.meu_cafe_frete_gratis_acima_de_cents ?? 12000,
      quantidadesGramas: settings.meu_cafe_quantidades_gramas ?? [250, 500, 750, 1000, 1500, 2000]
    }
  };
}

/** Extrai o número de gramas de uma string tipo "250g" — usado para
 * achar o preço "por 250g" de um produto e escalar pra quantidade
 * escolhida no Clube Meu Café. */
function parseGramsFromPeso(peso) {
  const match = String(peso).match(/([\d.,]+)\s*(kg|g)/i);
  if (!match) return 250; // fallback conservador
  const value = parseFloat(match[1].replace(',', '.'));
  return match[2].toLowerCase() === 'kg' ? value * 1000 : value;
}

async function createSubscription(userId, input) {
  return withUserContext(userId, async (client) => {
    if (input.tipo === 'explorador') {
      const planResult = await client.query(
        'SELECT * FROM subscription_plans WHERE id = $1',
        [input.planId]
      );
      const plan = planResult.rows[0];
      if (!plan) {
        const err = new Error('Plano não encontrado.');
        err.status = 404;
        throw err;
      }

      const result = await client.query(
        `INSERT INTO subscriptions (user_id, tipo, plan_id, preco_cents, frete)
         VALUES ($1, 'explorador', $2, $3, $4)
         RETURNING *`,
        [userId, plan.id, plan.preco_cents, plan.frete]
      );
      return { subscription: result.rows[0], plan };
    }

    // tipo === 'meu_cafe'
    const productResult = await client.query('SELECT * FROM products WHERE id = $1', [input.productId]);
    const product = productResult.rows[0];
    if (!product) {
      const err = new Error('Produto não encontrado.');
      err.status = 404;
      throw err;
    }

    const settingsResult = await client.query(
      "SELECT value FROM app_settings WHERE key = 'meu_cafe_frete_gratis_acima_de_cents'"
    );
    const freteGratisAcimaDeCents = settingsResult.rows[0]?.value ?? 12000;

    // Preço sempre calculado no servidor a partir do preço-base do
    // produto — nunca confiamos num valor de preço vindo do cliente.
    const pricePer250g = product.preco_cents / (parseGramsFromPeso(product.peso) / 250);
    const precoCents = Math.round(pricePer250g * (input.gramas / 250));
    const frete = precoCents >= freteGratisAcimaDeCents ? 'gratis' : 'pago';

    const result = await client.query(
      `INSERT INTO subscriptions (user_id, tipo, product_id, gramas, preco_cents, frete)
       VALUES ($1, 'meu_cafe', $2, $3, $4, $5)
       RETURNING *`,
      [userId, product.id, input.gramas, precoCents, frete]
    );
    return { subscription: result.rows[0], product };
  });
}

async function listMySubscriptions(userId) {
  return withUserContext(userId, async (client) => {
    const result = await client.query(
      `SELECT s.*, p.nome AS plan_nome, pr.nome AS product_nome
       FROM subscriptions s
       LEFT JOIN subscription_plans p ON p.id = s.plan_id
       LEFT JOIN products pr ON pr.id = s.product_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );
    return result.rows;
  });
}

async function cancelSubscription(userId, subscriptionId) {
  return withUserContext(userId, async (client) => {
    const result = await client.query(
      `UPDATE subscriptions
       SET status = 'canceled', canceled_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [subscriptionId, userId]
    );
    return result.rows[0] || null;
  });
}

module.exports = { getPlansAndConfig, createSubscription, listMySubscriptions, cancelSubscription };
