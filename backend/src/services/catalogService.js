const { query, withUserContext } = require('../config/db');

/**
 * Lista fazendas em ordem aleatória a cada chamada (ORDER BY random()
 * no Postgres) — reproduz no servidor o "embaralha a cada visita" que
 * o protótipo fazia no cliente, com a vantagem de já vir filtrado do
 * banco. Filtros combináveis: região, nota mínima (calculada a partir
 * da média de avaliações de todos os produtos da fazenda) e busca
 * livre (nome/produtor/região da fazenda, ou nome/notas/variedade de
 * qualquer produto dela).
 */
async function listFarms({ regiao, busca, notaMinima }) {
  const result = await query(
    `WITH farm_ratings AS (
       SELECT f.id AS farm_id, COALESCE(AVG(r.nota), 0) AS avg_rating, COUNT(r.id) AS review_count
       FROM farms f
       LEFT JOIN products p ON p.farm_id = f.id
       LEFT JOIN product_reviews r ON r.product_id = p.id
       GROUP BY f.id
     )
     SELECT
       f.id, f.nome, f.regiao, f.produtor, f.resumo, f.hero_foto,
       fr.avg_rating, fr.review_count
     FROM farms f
     JOIN farm_ratings fr ON fr.farm_id = f.id
     WHERE ($1::text IS NULL OR f.regiao = $1)
       AND fr.avg_rating >= $2
       AND (
         $3::text IS NULL OR (
           f.nome ILIKE '%' || $3 || '%' OR
           f.produtor ILIKE '%' || $3 || '%' OR
           f.regiao ILIKE '%' || $3 || '%' OR
           EXISTS (
             SELECT 1 FROM products p2
             WHERE p2.farm_id = f.id
               AND (
                 p2.nome ILIKE '%' || $3 || '%' OR
                 p2.notas ILIKE '%' || $3 || '%' OR
                 p2.variedade ILIKE '%' || $3 || '%'
               )
           )
         )
       )
     ORDER BY random()`,
    [regiao || null, notaMinima || 0, busca || null]
  );
  return result.rows;
}

async function listRegions() {
  const result = await query('SELECT DISTINCT regiao FROM farms ORDER BY regiao');
  return result.rows.map((r) => r.regiao);
}

async function getFarmById(farmId) {
  const farmResult = await query('SELECT * FROM farms WHERE id = $1', [farmId]);
  const farm = farmResult.rows[0];
  if (!farm) return null;

  const productsResult = await query(
    `SELECT
       p.*,
       COALESCE(AVG(r.nota), 0) AS avg_rating,
       COUNT(r.id) AS review_count
     FROM products p
     LEFT JOIN product_reviews r ON r.product_id = p.id
     WHERE p.farm_id = $1
     GROUP BY p.id
     ORDER BY p.nome`,
    [farmId]
  );

  return { ...farm, produtos: productsResult.rows };
}

async function listProducts() {
  const result = await query(
    `SELECT
       p.*,
       f.nome AS farm_nome, f.regiao AS farm_regiao,
       COALESCE(AVG(r.nota), 0) AS avg_rating,
       COUNT(r.id) AS review_count
     FROM products p
     LEFT JOIN farms f ON f.id = p.farm_id
     LEFT JOIN product_reviews r ON r.product_id = p.id
     GROUP BY p.id, f.nome, f.regiao
     ORDER BY p.nome`
  );
  return result.rows;
}

async function getProductById(productId) {
  const productResult = await query(
    `SELECT p.*, f.id AS farm_id, f.nome AS farm_nome, f.regiao AS farm_regiao, f.resumo AS farm_resumo
     FROM products p
     LEFT JOIN farms f ON f.id = p.farm_id
     WHERE p.id = $1`,
    [productId]
  );
  const product = productResult.rows[0];
  if (!product) return null;

  const reviewsResult = await query(
    `SELECT id, nota, comentario, created_at, autor_nome
     FROM product_reviews
     WHERE product_id = $1
     ORDER BY created_at DESC`,
    [productId]
  );

  return { ...product, avaliacoes: reviewsResult.rows };
}

async function findProductByBarcode(barcode) {
  const result = await query('SELECT * FROM products WHERE barcode = $1', [barcode]);
  return result.rows[0] || null;
}

/**
 * Cria a avaliação escopada por RLS (só pode gravar com o próprio
 * user_id). Busca o nome atual do perfil (leitura da própria linha —
 * permitida pela policy profiles_select_own) e grava uma cópia dele
 * em autor_nome, pra exibição pública não depender de um JOIN futuro
 * numa tabela protegida por RLS. A constraint UNIQUE(product_id,
 * user_id) garante uma avaliação por cliente por produto — em caso de
 * conflito, devolvemos um erro claro em vez de deixar o Postgres
 * estourar.
 */
async function createReview(userId, productId, { nota, comentario }) {
  return withUserContext(userId, async (client) => {
    const profileResult = await client.query('SELECT nome FROM profiles WHERE id = $1', [userId]);
    const autorNome = profileResult.rows[0]?.nome || 'Cliente Tia Xícara';

    try {
      const result = await client.query(
        `INSERT INTO product_reviews (product_id, user_id, autor_nome, nota, comentario)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, nota, comentario, created_at, autor_nome`,
        [productId, userId, autorNome, nota, comentario]
      );
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        // unique_violation — cliente já avaliou esse produto antes
        const conflictError = new Error('Você já avaliou este café.');
        conflictError.status = 409;
        throw conflictError;
      }
      throw err;
    }
  });
}

module.exports = {
  listFarms,
  listRegions,
  getFarmById,
  listProducts,
  getProductById,
  findProductByBarcode,
  createReview
};
