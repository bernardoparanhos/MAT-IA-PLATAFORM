// ✅ Antes de tudo
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const app = require('./app');

const PORT = process.env.PORT || 3000;

// 🔥 PROTEÇÃO CONTRA CRASHES (Adicione isso!)
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ REJEIÇÃO NÃO TRATADA:', reason);
  // Aqui o servidor não cai, ele apenas avisa o que houve
});

process.on('uncaughtException', (err) => {
  console.error('❌ EXCEÇÃO NÃO CAPTURADA:', err);
  // Em produção você daria um process.exit(1), mas em dev
  // queremos manter o servidor vivo para você ver o erro.
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
});