const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const env = require('../config/env');

async function seed() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  try {
    console.log('Aplicando seed.sql...');
    await pool.query(sql);
    console.log('✅ Seed aplicado com sucesso.');
  } catch (err) {
    console.error('❌ Falha ao aplicar o seed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
