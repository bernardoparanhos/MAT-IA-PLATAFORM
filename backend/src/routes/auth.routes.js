const express = require('express');
const { body } = require('express-validator');
const { register, loginAluno, loginProfessor } = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const db = require('../config/database');

const router = express.Router();

// ─── REGISTER ALUNO ──────────────────────────────────────────────────────────
const registerAlunoValidation = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Nome deve conter apenas letras'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .custom(val => {
      if (!val.endsWith('@alunos.utfpr.edu.br')) {
        throw new Error('Email deve ser do domínio @alunos.utfpr.edu.br')
      }
      return true
    }),

  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 8, max: 128 }).withMessage('Senha deve ter entre 8 e 128 caracteres')
    .matches(/[A-Z]/).withMessage('Senha deve conter ao menos uma letra maiúscula')
    .matches(/[0-9]/).withMessage('Senha deve conter ao menos um número'),

  body('ra')
    .trim()
    .notEmpty().withMessage('RA é obrigatório')
    .isLength({ min: 5, max: 20 }).withMessage('RA inválido'),

  body('turmaId')
    .notEmpty().withMessage('Turma é obrigatória')
    .isInt().withMessage('Turma inválida'),
];

// ─── REGISTER PROFESSOR ───────────────────────────────────────────────────────
const registerProfessorValidation = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Nome deve conter apenas letras'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .custom(val => {
      if (!val.endsWith('@utfpr.edu.br')) {
        throw new Error('Email deve ser do domínio @utfpr.edu.br')
      }
      return true
    }),

  body('siape')
    .trim()
    .notEmpty().withMessage('SIAPE é obrigatório')
    .matches(/^\d{6,7}$/).withMessage('SIAPE deve ter 6 ou 7 dígitos numéricos'),

  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 8, max: 128 }).withMessage('Senha deve ter entre 8 e 128 caracteres')
    .matches(/[A-Z]/).withMessage('Senha deve conter ao menos uma letra maiúscula')
    .matches(/[0-9]/).withMessage('Senha deve conter ao menos um número'),
];

// ─── LOGIN ALUNO ──────────────────────────────────────────────────────────────
const loginAlunoValidation = [
  body('ra')
    .trim()
    .notEmpty().withMessage('RA é obrigatório'),

  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ max: 128 }),
];

// ─── LOGIN PROFESSOR ──────────────────────────────────────────────────────────
const loginProfessorValidation = [
  body('siape')
    .trim()
    .notEmpty().withMessage('SIAPE é obrigatório')
    .matches(/^\d{6,7}$/).withMessage('SIAPE inválido'),

  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ max: 128 }),
];

// ─── TURMAS ───────────────────────────────────────────────────────────────────
router.get('/turmas/minhas', verifyToken, (req, res) => {
  const turmas = db.prepare(`
    SELECT t.id, t.nome, t.codigo_acesso,
      COUNT(ta.aluno_id) as total_alunos
    FROM turmas t
    LEFT JOIN turma_alunos ta ON ta.turma_id = t.id
    WHERE t.professor_id = ?
    GROUP BY t.id
  `).all(req.usuario.id);
  return res.json({ turmas });
});

router.get('/turmas/disponiveis', verifyToken, (req, res) => {
  const turmas = db.prepare(`
    SELECT id, nome, codigo_acesso FROM turmas
    WHERE professor_id IS NULL
  `).all();
  return res.json({ turmas });
});

router.post('/turmas/associar', verifyToken, (req, res) => {
  const { turmaId } = req.body;
  if (!turmaId) return res.status(400).json({ message: 'turmaId é obrigatório' });

  const turma = db.prepare('SELECT id FROM turmas WHERE id = ?').get(turmaId);
  if (!turma) return res.status(404).json({ message: 'Turma não encontrada' });

  db.prepare('UPDATE turmas SET professor_id = ? WHERE id = ?').run(req.usuario.id, turmaId);
  return res.json({ message: 'Turma associada com sucesso!' });
});

router.post('/register/aluno', registerAlunoValidation, (req, res) => register(req, res, 'aluno'));
router.post('/register/professor', registerProfessorValidation, (req, res) => register(req, res, 'professor'));
router.post('/login/aluno', loginAlunoValidation, loginAluno);
router.post('/login/professor', loginProfessorValidation, loginProfessor);

module.exports = router;