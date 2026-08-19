const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  // Nunca vaza stack trace, mensagens de driver de banco, etc. para
  // o cliente — isso pode revelar detalhes de schema/infra úteis
  // para um atacante. Em desenvolvimento, ajuda a depurar.
  const isDev = env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    error: 'internal_error',
    message: 'Ocorreu um erro ao processar sua solicitação.',
    ...(isDev ? { debug: err.message } : {})
  });
}

module.exports = { errorHandler };
