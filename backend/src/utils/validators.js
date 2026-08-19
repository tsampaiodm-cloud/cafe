const { z } = require('zod');
const { isValidCPF } = require('./sanitize');

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

// bcrypt trunca (e o pacote `bcrypt` lança erro) senhas acima de 72
// bytes — por isso o limite máximo aqui, além do mínimo de segurança.
const passwordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres')
  .max(72, 'A senha pode ter no máximo 72 caracteres')
  .regex(/[a-z]/, 'A senha precisa de ao menos uma letra minúscula')
  .regex(/[A-Z]/, 'A senha precisa de ao menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha precisa de ao menos um número');

const emailSchema = z.string().trim().toLowerCase().email('E-mail inválido').max(255);

const nomeSchema = z.string().trim().min(2, 'Nome muito curto').max(120);

const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 11, 'CPF deve ter 11 dígitos')
  .refine(isValidCPF, 'CPF inválido');

const registerSchema = z.object({
  nome: nomeSchema,
  email: emailSchema,
  password: passwordSchema
});

const loginSchema = z.object({
  email: emailSchema,
  // Na hora de logar, não aplicamos as regras de complexidade —
  // só um limite de tamanho, pra não permitir payloads absurdos.
  password: z.string().min(1).max(72)
});

const profileUpdateSchema = z
  .object({
    nome: nomeSchema.optional(),
    telefone: z
      .string()
      .transform((v) => v.replace(/\D/g, ''))
      .refine((v) => v.length >= 10 && v.length <= 13, 'Telefone inválido')
      .optional(),
    cpf: cpfSchema.optional(),
    cep: z
      .string()
      .transform((v) => v.replace(/\D/g, ''))
      .refine((v) => v.length === 8, 'CEP inválido')
      .optional(),
    rua: z.string().trim().max(200).optional(),
    numero: z.string().trim().max(20).optional(),
    complemento: z.string().trim().max(120).optional(),
    bairro: z.string().trim().max(120).optional(),
    cidade: z.string().trim().max(120).optional(),
    uf: z.enum(UF_LIST).optional()
  })
  .strict(); // rejeita qualquer campo fora da lista acima

const checkoutItemSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  detalhe: z.string().trim().max(200).optional(),
  precoCents: z.number().int().positive().max(100000000),
  quantidade: z.number().int().positive().max(99)
});

const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'O carrinho está vazio').max(50)
});

// ---------- Catálogo ----------

// Query string chega sempre como string — por isso o coerce/transform
// aqui, diferente dos schemas de body acima.
const farmsQuerySchema = z.object({
  regiao: z.string().trim().max(120).optional(),
  busca: z.string().trim().max(120).optional(),
  notaMinima: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : 0))
    .pipe(z.number().min(0).max(5))
});

const reviewSchema = z.object({
  nota: z.number().int().min(1, 'A nota deve ser de 1 a 5').max(5, 'A nota deve ser de 1 a 5'),
  comentario: z.string().trim().min(3, 'Escreva um pouco mais sobre o café').max(1000)
});

// ---------- Assinaturas ----------
// União discriminada pelo campo `tipo`: cada ramo exige exatamente os
// campos daquele tipo de assinatura, então um payload misturando
// planId com productId (ou faltando algo) já é rejeitado aqui, antes
// de chegar no banco (que também tem a CHECK constraint equivalente,
// como segunda camada de defesa).
const subscriptionSchema = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('explorador'),
    planId: z.string().trim().min(1).max(60)
  }),
  z.object({
    tipo: z.literal('meu_cafe'),
    productId: z.string().uuid('productId inválido'),
    gramas: z.number().int().positive().max(5000)
  })
]);

// ---------- Feed / Diário ----------
const postSchema = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('avaliacao'),
    produtoId: z.string().uuid('produtoId inválido'),
    nota: z.number().int().min(1, 'A nota deve ser de 1 a 5').max(5, 'A nota deve ser de 1 a 5'),
    texto: z.string().trim().min(3, 'Escreva um pouco mais sobre o café').max(2000),
    temFoto: z.boolean().optional().default(false),
    publicarNoFeed: z.boolean().optional().default(false)
  }),
  z.object({
    tipo: z.literal('receita'),
    titulo: z.string().trim().min(3, 'Dê um título pra sua receita').max(200),
    texto: z.string().trim().min(3, 'Escreva o modo de preparo').max(2000),
    temFoto: z.boolean().optional().default(false),
    publicarNoFeed: z.boolean().optional().default(false)
  })
]);

const commentSchema = z.object({
  texto: z.string().trim().min(1, 'Escreva um comentário').max(1000),
  parentCommentId: z.string().uuid().optional()
});

const feedQuerySchema = z.object({
  tipo: z.enum(['avaliacao', 'receita']).optional()
});

module.exports = {
  UF_LIST,
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  checkoutSchema,
  farmsQuerySchema,
  reviewSchema,
  subscriptionSchema,
  postSchema,
  commentSchema,
  feedQuerySchema
};
