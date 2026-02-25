const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/auth.controller');

const router = express.Router();

const registerValidation = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Nome deve conter apenas letras'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 255 }),

  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 8, max: 128 }).withMessage('Senha deve ter entre 8 e 128 caracteres')
    .matches(/[A-Z]/).withMessage('Senha deve conter ao menos uma letra maiúscula')
    .matches(/[0-9]/).withMessage('Senha deve conter ao menos um número'),

  body('perfil')
    .notEmpty().withMessage('Perfil é obrigatório')
    .isIn(['aluno', 'professor']).withMessage('Perfil inválido'),

  body('ra')
    .if(body('perfil').equals('aluno'))
    .notEmpty().withMessage('RA é obrigatório para alunos')
    .trim()
    .isLength({ min: 5, max: 20 }).withMessage('RA inválido'),

  body('codigoTurma')
    .if(body('perfil').equals('aluno'))
    .notEmpty().withMessage('Código de turma é obrigatório para alunos')
    .trim()
    .isLength({ min: 6, max: 10 }),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),

  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ max: 128 }), // evita DoS por senha gigante
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

module.exports = router;