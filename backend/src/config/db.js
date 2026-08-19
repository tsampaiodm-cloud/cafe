const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // SSL obrigatório em produção (ex.: RDS, Supabase, etc.)
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  max: 10,
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => {
  // Erros em clientes ociosos do pool não devem derrubar o processo
  console.error('Erro inesperado no pool do PostgreSQL', err);
});

/**
 * Executa uma query "solta", sem contexto de usuário — use apenas
 * para operações que legitimamente não são escopadas por RLS
 * (ex.: lookup de e-mail no login/registro, antes de haver sessão).
 * Sempre usa placeholders parametrizados ($1, $2, ...) para evitar
 * injeção de SQL — nunca faça concatenação de strings com input do usuário.
 */
async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Executa uma função dentro de uma transação com o contexto do
 * usuário autenticado propagado via `SET LOCAL app.user_id`.
 * As políticas de RLS em `profiles`, `orders` e `order_items`
 * comparam suas condições com `current_setting('app.user_id', true)`,
 * então toda leitura/escrita feita dentro de `callback(client)` já
 * fica automaticamente restrita aos dados do próprio usuário —
 * mesmo que um bug na camada de aplicação esqueça de filtrar por
 * user_id em algum WHERE, o banco impede o acesso cruzado.
 */
async function withUserContext(userId, callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // set_config com is_local=true tem o mesmo efeito de SET LOCAL,
    // mas aceita bind parameter — evita concatenar o UUID na query.
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withUserContext };
