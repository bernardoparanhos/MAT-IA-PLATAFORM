const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const { getPerfil, alterarSenha, desassociarTurma } = require('../controllers/professor.controller');

router.get('/perfil', verifyToken, getPerfil);
router.put('/senha', verifyToken, alterarSenha);
router.post('/desassociar', verifyToken, desassociarTurma); // ← novo

module.exports = router;