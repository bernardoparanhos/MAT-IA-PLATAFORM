const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// 1. Helmet
app.use(helmet());

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
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 3. Rate limit geral
const limiterGeral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 6. Rotas
const authRoutes = require('./routes/auth.routes');
const professorRoutes = require('./routes/professor.routes'); // ← novo

app.use('/auth', authRoutes);
app.use('/professor', professorRoutes); // ← novo

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

module.exports = app;