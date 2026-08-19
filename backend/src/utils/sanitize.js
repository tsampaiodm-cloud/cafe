/**
 * Remove caracteres de controle invisíveis e espaços nas pontas.
 * Não substitui a proteção contra SQL injection (isso vem de
 * sempre usar queries parametrizadas), mas evita que campos de
 * texto livre carreguem bytes de controle, o que ajuda a prevenir
 * ataques de "smuggling" em logs, CSV exportado, PDFs gerados, etc.
 */
function sanitizeText(value) {
  if (typeof value !== 'string') return value;
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

function sanitizeDeep(value) {
  if (typeof value === 'string') return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = sanitizeDeep(val);
    }
    return out;
  }
  return value;
}

function sanitizeObjectStrings(obj) {
  return sanitizeDeep(obj);
}

/**
 * Valida o dígito verificador do CPF (algoritmo padrão da Receita
 * Federal). Usado pelo schema de validação do perfil — "válido
 * estritamente" aqui significa checar o dígito, não só o formato.
 */
function isValidCPF(rawCpf) {
  const cpf = String(rawCpf).replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos os dígitos iguais

  const calcDigit = (base) => {
    let sum = 0;
    let weight = base.length + 1;
    for (const digit of base) {
      sum += parseInt(digit, 10) * weight;
      weight--;
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const digit1 = calcDigit(cpf.slice(0, 9));
  const digit2 = calcDigit(cpf.slice(0, 9) + String(digit1));

  return cpf === cpf.slice(0, 9) + String(digit1) + String(digit2);
}

module.exports = { sanitizeText, sanitizeObjectStrings, isValidCPF };
