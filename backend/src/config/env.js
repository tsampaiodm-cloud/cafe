require('dotenv').config();
const { z } = require('zod');

// Falha rápido e alto se alguma variável de ambiente crítica estiver
// ausente ou mal formatada — evita subir o servidor em estado inseguro
// (ex.: sem JWT_SECRET, ou com fator de custo do bcrypt fraco).
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url(),
  TRUST_PROXY: z.coerce.boolean().default(false),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  REDIS_URL: z.string().min(1, 'REDIS_URL é obrigatório'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  BCRYPT_COST_FACTOR: z.coerce.number().int().min(12, 'fator de custo do bcrypt deve ser >= 12').default(12),

  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(900),

  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY é obrigatório'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET é obrigatório')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = parsed.data;
