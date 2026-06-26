const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express();
app.set('trust proxy', 1);

// 1. Helmet
app.use(helmet());

// 2. Cookie parser
app.use(cookieParser());

// 2. CORS
app.use(cors({
  origin: function(origin, callback) {
    const allowed = process.env.ALLOWED_ORIGIN.split(',')
    if (!origin || allowed.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Bloqueado pelo CORS'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret', 'x-totp-code'],
  credentials: true
}));

// 3. Rate limit geral
const limiterGeral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Era 100, agora 500
  message: { erro: 'Muitas requisições. Tente novamente em alguns minutos.' }
});
app.use(limiterGeral);

// 4. Rate limit no login
const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { erro: 'Muitas tentativas de login. Aguarde 15 minutos.' }
});
app.use('/auth/login', limiterLogin);

// 5. Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Rotas
const authRoutes = require('./routes/auth.routes');
const professorRoutes = require('./routes/professor.routes'); // ← novo
const exerciciosRoutes = require('./routes/exercicio.routes');

app.use('/auth', authRoutes);
app.use('/professor', professorRoutes); // ← novo
app.use('/exercicios', exerciciosRoutes);

// 7. Rota de teste
app.get('/', (req, res) => {
  res.json({ 
    mensagem: '🚀 MAT-IA API está funcionando!',
    versao: '1.0.0',
    status: 'online'
  });
});

// 8. Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// 9. Middleware Global de Erros (O "Pega-tudo")
app.use((err, req, res, next) => {
  console.error('🔥 Erro detectado no pipeline:', err.stack);

  // Se for erro de CORS, damos um aviso amigável
  if (err.message === 'Bloqueado pelo CORS') {
    return res.status(403).json({ erro: 'Origem não permitida pelo CORS' });
  }

  res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
});

module.exports = app;