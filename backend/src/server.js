const env = require('./config/env');
const app = require('./app');

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Tia Xícara backend rodando na porta ${env.PORT} (${env.NODE_ENV})`);
});

// Encerramento gracioso — evita derrubar requisições em andamento.
function shutdown(signal) {
  console.log(`\nRecebido ${signal}, encerrando...`);
  server.close(() => process.exit(0));
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
