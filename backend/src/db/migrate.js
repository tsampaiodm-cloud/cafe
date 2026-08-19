const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const env = require('../config/env');

// Script de migração simples: aplica schema.sql inteiro.
// Para um projeto real, prefira uma ferramenta de migração
// versionada (ex.: node-pg-migrate, Prisma Migrate, Flyway).
async function migrate() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    console.log('Aplicando schema.sql...');
    await pool.query(sql);
    console.log('✅ Schema aplicado com sucesso.');
  } catch (err) {
    console.error('❌ Falha ao aplicar o schema:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
