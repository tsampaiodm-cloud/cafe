const { query, withUserContext } = require('../config/db');

/**
 * Cria o post sempre como pertencente ao autor. Se for avaliação, o
 * título vem do nome real do produto (buscado no servidor, nunca
 * aceito do cliente) — assim não dá pra criar um post de avaliação
 * com um título qualquer desconectado do café de verdade.
 */
async function createPost(userId, input) {
  return withUserContext(userId, async (client) => {
    const profileResult = await client.query('SELECT nome FROM profiles WHERE id = $1', [userId]);
    const autorNome = profileResult.rows[0]?.nome || 'Cliente Tia Xícara';

    let titulo;
    let produtoId = null;
    let nota = null;

    if (input.tipo === 'avaliacao') {
      const productResult = await client.query('SELECT nome FROM products WHERE id = $1', [input.produtoId]);
      const product = productResult.rows[0];
      if (!product) {
        const err = new Error('Café não encontrado.');
        err.status = 404;
        throw err;
      }
      titulo = product.nome;
      produtoId = input.produtoId;
      nota = input.nota;
    } else {
      titulo = input.titulo;
    }

    const publishedAt = input.publicarNoFeed ? new Date() : null;

    const result = await client.query(
      `INSERT INTO posts (user_id, autor_nome, tipo, produto_id, titulo, nota, texto, tem_foto, published_to_feed, published_to_feed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, autorNome, input.tipo, produtoId, titulo, nota, input.texto, !!input.temFoto, !!input.publicarNoFeed, publishedAt]
    );
    return result.rows[0];
  });
}

/** Feed público — só posts publicados, com contagem de curtidas/comentários. */
async function listFeed({ tipo } = {}) {
  const result = await query(
    `SELECT
       p.id, p.autor_nome, p.tipo, p.produto_id, p.titulo, p.nota, p.texto, p.tem_foto, p.created_at,
       COUNT(DISTINCT l.id) AS like_count,
       COUNT(DISTINCT c.id) AS comment_count
     FROM posts p
     LEFT JOIN post_likes l ON l.post_id = p.id
     LEFT JOIN post_comments c ON c.post_id = p.id
     WHERE p.published_to_feed = true
       AND ($1::text IS NULL OR p.tipo = $1)
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [tipo || null]
  );
  return result.rows;
}

/**
 * Diário pessoal — TODOS os posts do próprio cliente, publicados ou
 * não. Precisa de withUserContext (não dá pra usar query() direto
 * aqui): sem app.user_id definido, a policy de RLS só deixaria ver
 * os posts já publicados, escondendo os rascunhos privados do dono.
 */
async function listDiario(userId) {
  return withUserContext(userId, async (client) => {
    const result = await client.query(
      `SELECT
         p.*,
         COUNT(DISTINCT l.id) AS like_count,
         COUNT(DISTINCT c.id) AS comment_count
       FROM posts p
       LEFT JOIN post_likes l ON l.post_id = p.id
       LEFT JOIN post_comments c ON c.post_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows;
  });
}

function buildCommentTree(rows) {
  const byId = new Map(rows.map((r) => [r.id, { ...r, replies: [] }]));
  const roots = [];
  for (const row of rows) {
    const node = byId.get(row.id);
    if (row.parent_comment_id && byId.has(row.parent_comment_id)) {
      byId.get(row.parent_comment_id).replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/**
 * Detalhe público de um post. Roda sem contexto de usuário de
 * propósito: a policy de RLS (`published_to_feed = true OR dono`) já
 * deixa passar posts publicados mesmo sem app.user_id definido — e
 * como não setamos contexto aqui, um rascunho privado de outra pessoa
 * simplesmente não aparece (a query não erra, só devolve vazio), o
 * que é exatamente o comportamento certo pra um endpoint público.
 */
async function getPostDetail(id) {
  const postResult = await query(
    `SELECT
       p.*,
       COUNT(DISTINCT l.id) AS like_count,
       COUNT(DISTINCT c.id) AS comment_count
     FROM posts p
     LEFT JOIN post_likes l ON l.post_id = p.id
     LEFT JOIN post_comments c ON c.post_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );
  const post = postResult.rows[0];
  if (!post) return null;

  const commentsResult = await query(
    `SELECT id, parent_comment_id, autor_nome, texto, created_at
     FROM post_comments
     WHERE post_id = $1
     ORDER BY created_at ASC`,
    [id]
  );

  return { ...post, comments: buildCommentTree(commentsResult.rows) };
}

async function publishToFeed(userId, postId) {
  return withUserContext(userId, async (client) => {
    const result = await client.query(
      `UPDATE posts
       SET published_to_feed = true, published_to_feed_at = now()
       WHERE id = $1 AND user_id = $2 AND published_to_feed = false
       RETURNING *`,
      [postId, userId]
    );
    return result.rows[0] || null;
  });
}

/**
 * Curtir/descurtir (toggle). Só é permitido em post já publicado —
 * mesma regra que a policy de INSERT em post_likes já impõe no banco;
 * checar aqui antes só evita uma volta desnecessária ao banco.
 *
 * Nota: `listFeed`/`getPostDetail` não retornam se o usuário atual já
 * curtiu cada post (exigiria decodificar o JWT em rotas públicas só
 * pra isso). O app assume "não curtido" ao carregar e atualiza local
 * e otimisticamente após uma ação de curtir na própria sessão — dá
 * pra evoluir depois passando o user id (quando presente) pra essas
 * duas queries e fazendo um LEFT JOIN em post_likes filtrado por ele.
 */
async function toggleLike(userId, postId) {
  const postResult = await query('SELECT published_to_feed FROM posts WHERE id = $1', [postId]);
  const post = postResult.rows[0];
  if (!post || !post.published_to_feed) {
    const err = new Error('Post não encontrado.');
    err.status = 404;
    throw err;
  }

  return withUserContext(userId, async (client) => {
    const existing = await client.query(
      'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    if (existing.rows[0]) {
      await client.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      return { liked: false };
    }
    await client.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
    return { liked: true };
  });
}

async function createComment(userId, postId, { texto, parentCommentId }) {
  const postResult = await query('SELECT published_to_feed FROM posts WHERE id = $1', [postId]);
  const post = postResult.rows[0];
  if (!post || !post.published_to_feed) {
    const err = new Error('Post não encontrado.');
    err.status = 404;
    throw err;
  }

  return withUserContext(userId, async (client) => {
    const profileResult = await client.query('SELECT nome FROM profiles WHERE id = $1', [userId]);
    const autorNome = profileResult.rows[0]?.nome || 'Cliente Tia Xícara';

    const result = await client.query(
      `INSERT INTO post_comments (post_id, user_id, autor_nome, parent_comment_id, texto)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, autor_nome, parent_comment_id, texto, created_at`,
      [postId, userId, autorNome, parentCommentId || null, texto]
    );
    return result.rows[0];
  });
}

module.exports = {
  createPost,
  listFeed,
  listDiario,
  getPostDetail,
  publishToFeed,
  toggleLike,
  createComment
};
