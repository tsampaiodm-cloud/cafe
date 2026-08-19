const { sanitizeObjectStrings } = require('../utils/sanitize');

/**
 * Middleware de validação estrita: sanitiza strings do body,
 * valida contra o schema Zod informado e, se passar, substitui
 * req.body pelos dados já normalizados (trim, lowercase de e-mail,
 * CPF/telefone só com dígitos, etc.) — os controllers nunca leem
 * req.body cru.
 */
function validateBody(schema) {
  return (req, res, next) => {
    const clean = sanitizeObjectStrings(req.body || {});
    const result = schema.safeParse(clean);

    if (!result.success) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Os dados enviados são inválidos.',
        details: result.error.flatten().fieldErrors
      });
    }

    req.body = result.data;
    next();
  };
}

/** Mesma ideia de validateBody, mas para query string (?regiao=...&busca=...). */
function validateQuery(schema) {
  return (req, res, next) => {
    const clean = sanitizeObjectStrings(req.query || {});
    const result = schema.safeParse(clean);

    if (!result.success) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Os parâmetros de busca são inválidos.',
        details: result.error.flatten().fieldErrors
      });
    }

    req.query = result.data;
    next();
  };
}

module.exports = { validateBody, validateQuery };
