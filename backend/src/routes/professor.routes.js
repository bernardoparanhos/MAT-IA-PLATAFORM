const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const { getPerfil, alterarSenha } = require('../controllers/professor.controller');

router.get('/perfil', verifyToken, getPerfil);
router.put('/senha', verifyToken, alterarSenha);

module.exports = router;