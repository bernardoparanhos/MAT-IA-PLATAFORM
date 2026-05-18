const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { verifyToken, requirePerfil } = require('../middlewares/auth.middleware');
const { getPerfil, alterarSenha, desassociarTurma } = require('../controllers/professor.controller');

const limiterAlterarSenha = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/perfil', verifyToken, requirePerfil('professor'), getPerfil);
router.put('/senha', limiterAlterarSenha, verifyToken, requirePerfil('professor'), alterarSenha);
router.post('/desassociar', verifyToken, requirePerfil('professor'), desassociarTurma);

module.exports = router;