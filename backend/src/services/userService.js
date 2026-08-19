const { query, withUserContext } = require('../config/db');
const { hashPassword } = require('./authService');

/**
 * Busca por e-mail é usada só no login/registro, antes de existir
 * uma sessão — roda sem contexto de RLS porque `users` não guarda
 * dado pessoal sensível além do hash da senha (que nunca é retornado
 * pela API). Sempre parametrizada ($1) — nunca concatenar o e-mail
 * diretamente na query.
 */
async function findUserByEmail(email) {
  const result = await query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Cria o usuário e o perfil dentro da mesma transação. A inserção em
 * `profiles` roda com `app.user_id` já apontando para o novo usuário,
 * então a policy `profiles_insert_own` (WITH CHECK id = app.user_id)
 * é satisfeita — o próprio usuário só consegue criar o PRÓPRIO perfil.
 */
async function createUserWithProfile({ nome, email, password }) {
  const passwordHash = await hashPassword(password);

  const userResult = await query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email`,
    [email, passwordHash]
  );
  const user = userResult.rows[0];

  await withUserContext(user.id, async (client) => {
    await client.query(
      `INSERT INTO profiles (id, nome) VALUES ($1, $2)`,
      [user.id, nome]
    );
  });

  return user;
}

/** Sempre escopado por RLS — impossível ler o perfil de outro usuário. */
async function getProfile(userId) {
  return withUserContext(userId, async (client) => {
    const result = await client.query('SELECT * FROM profiles WHERE id = $1', [userId]);
    return result.rows[0] || null;
  });
}

/**
 * Atualiza só os campos permitidos pelo schema (já validado/sanitizado
 * no middleware). Monta a query dinamicamente mas SEMPRE via
 * placeholders — nunca interpola valor de campo na string SQL.
 */
async function updateProfile(userId, fields) {
  const allowed = ['nome', 'telefone', 'cpf', 'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'uf'];
  const entries = Object.entries(fields).filter(([key]) => allowed.includes(key));

  if (entries.length === 0) {
    return getProfile(userId);
  }

  const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`);
  const values = entries.map(([, value]) => value);

  return withUserContext(userId, async (client) => {
    const result = await client.query(
      `UPDATE profiles
       SET ${setClauses.join(', ')}, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [userId, ...values]
    );
    return result.rows[0] || null;
  });
}

module.exports = { findUserByEmail, createUserWithProfile, getProfile, updateProfile };
