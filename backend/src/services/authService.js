const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const COST_FACTOR = env.BCRYPT_COST_FACTOR; // 12, validado em env.js (mínimo 12)

/** Nunca guarda a senha em texto plano — só o hash bcrypt (custo 12). */
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, COST_FACTOR);
}

async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

// Hash "de mentira", gerado uma vez na subida do processo com o
// mesmo fator de custo real — usado quando o e-mail não existe, para
// que o bcrypt.compare sempre rode com custo igual e o tempo de
// resposta do login não revele se aquele e-mail está cadastrado.
const DUMMY_HASH = bcrypt.hashSync('senha-de-referencia-para-timing', COST_FACTOR);

function generateToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

module.exports = { hashPassword, comparePassword, generateToken, DUMMY_HASH };
