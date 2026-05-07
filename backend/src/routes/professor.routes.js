const express = require('express');
const router = express.Router();
const { verifyToken, requirePerfil } = require('../middlewares/auth.middleware');
const { getPerfil, alterarSenha, desassociarTurma } = require('../controllers/professor.controller');

router.get('/perfil', verifyToken, requirePerfil('professor'), getPerfil);
router.put('/senha', verifyToken, requirePerfil('professor'), alterarSenha);
router.post('/desassociar', verifyToken, requirePerfil('professor'), desassociarTurma); // ← novo

module.exports = router;