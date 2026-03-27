const express = require('express');
const { body } = require('express-validator');
const { register, loginAluno, loginProfessor } = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const db = require('../config/database');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const limiterEsqueciSenha = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.get('/setup', async (req, res) => {
  if (req.query.senha !== 'matia2026') return res.status(403).json({ ok: false })
  await db.query("INSERT INTO turmas (nome, codigo_acesso) VALUES ($1, $2) ON CONFLICT (codigo_acesso) DO NOTHING", ['Fundamentos', 'FUND2026'])
  return res.json({ ok: true, message: 'Turma Fundamentos criada!' })
})

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const registerAlunoValidation = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Nome deve conter apenas letras'),
  body('email').trim().notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .custom(val => {
      if (!val.endsWith('@alunos.utfpr.edu.br')) throw new Error('Email deve ser do domínio @alunos.utfpr.edu.br')
      return true
    }),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 8, max: 128 }).withMessage('Senha deve ter entre 8 e 128 caracteres')
    .matches(/[A-Z]/).withMessage('Senha deve conter ao menos uma letra maiúscula')
    .matches(/[0-9]/).withMessage('Senha deve conter ao menos um número'),
  body('ra').trim().notEmpty().withMessage('RA é obrigatório')
    .isLength({ min: 5, max: 20 }).withMessage('RA inválido'),
  body('turmaId').notEmpty().withMessage('Turma é obrigatória')
    .isInt().withMessage('Turma inválida'),
];

const registerProfessorValidation = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Nome deve conter apenas letras'),
  body('email').trim().notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .custom(val => {
      if (!val.endsWith('@utfpr.edu.br')) throw new Error('Email deve ser do domínio @utfpr.edu.br')
      return true
    }),
  body('siape').trim().notEmpty().withMessage('SIAPE é obrigatório')
    .matches(/^\d{6,7}$/).withMessage('SIAPE deve ter 6 ou 7 dígitos numéricos'),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 8, max: 128 }).withMessage('Senha deve ter entre 8 e 128 caracteres')
    .matches(/[A-Z]/).withMessage('Senha deve conter ao menos uma letra maiúscula')
    .matches(/[0-9]/).withMessage('Senha deve conter ao menos um número'),
];

const loginAlunoValidation = [
  body('ra').trim().notEmpty().withMessage('RA é obrigatório'),
  body('senha').notEmpty().withMessage('Senha é obrigatória').isLength({ max: 128 }),
];

const loginProfessorValidation = [
  body('siape').trim().notEmpty().withMessage('SIAPE é obrigatório')
    .matches(/^\d{6,7}$/).withMessage('SIAPE inválido'),
  body('senha').notEmpty().withMessage('Senha é obrigatória').isLength({ max: 128 }),
];

// ─── TURMAS ───────────────────────────────────────────────────────────────────
router.get('/turmas/minhas', verifyToken, async (req, res) => {
  const result = await db.query(`
    SELECT t.id, t.nome, t.codigo_acesso, COUNT(ta.aluno_id) as total_alunos
    FROM turmas t
    LEFT JOIN turma_alunos ta ON ta.turma_id = t.id
    WHERE t.professor_id = $1
    GROUP BY t.id
  `, [req.usuario.id]);
  return res.json({ turmas: result.rows });
});

router.get('/turmas/disponiveis', verifyToken, async (req, res) => {
  const result = await db.query(`SELECT id, nome, codigo_acesso FROM turmas WHERE professor_id IS NULL`);
  return res.json({ turmas: result.rows });
});

router.post('/turmas/associar', verifyToken, async (req, res) => {
  const { turmaId } = req.body;
  if (!turmaId) return res.status(400).json({ message: 'turmaId é obrigatório' });
  const turma = await db.query('SELECT id FROM turmas WHERE id = $1', [turmaId]);
  if (turma.rows.length === 0) return res.status(404).json({ message: 'Turma não encontrada' });
  await db.query('UPDATE turmas SET professor_id = $1 WHERE id = $2', [req.usuario.id, turmaId]);
  return res.json({ message: 'Turma associada com sucesso!' });
});

router.get('/turmas/publicas', async (req, res) => {
  const result = await db.query(`SELECT id, nome FROM turmas WHERE professor_id IS NOT NULL`);
  return res.json({ turmas: result.rows });
});

router.get('/turmas/:id', verifyToken, async (req, res) => {
  const result = await db.query(`
    SELECT t.id, t.nome, t.codigo_acesso, t.criado_em, COUNT(ta.aluno_id) as total_alunos
    FROM turmas t
    LEFT JOIN turma_alunos ta ON ta.turma_id = t.id
    WHERE t.id = $1 AND t.professor_id = $2
    GROUP BY t.id
  `, [req.params.id, req.usuario.id]);
  if (result.rows.length === 0) return res.status(404).json({ message: 'Turma não encontrada.' });
  return res.json({ turma: result.rows[0] });
});

router.get('/turmas/:id/alunos', verifyToken, async (req, res) => {
  const turma = await db.query('SELECT id FROM turmas WHERE id = $1 AND professor_id = $2', [req.params.id, req.usuario.id]);
  if (turma.rows.length === 0) return res.status(404).json({ message: 'Turma não encontrada.' });
  const alunos = await db.query(`
    SELECT u.id, u.nome, u.email, u.ra, u.criado_em as entrou_em
    FROM usuarios u
    INNER JOIN turma_alunos ta ON ta.aluno_id = u.id
    WHERE ta.turma_id = $1
    ORDER BY u.nome ASC
  `, [req.params.id]);
  return res.json({ alunos: alunos.rows });
});

// ─── MINHA TURMA — ALUNO ──────────────────────────────────────────────────────
router.get('/aluno/minha-turma', verifyToken, async (req, res) => {
  const turmaResult = await db.query(`
    SELECT t.id, t.nome, t.codigo_acesso, t.criado_em
    FROM turmas t
    INNER JOIN turma_alunos ta ON ta.turma_id = t.id
    WHERE ta.aluno_id = $1
  `, [req.usuario.id]);

  if (turmaResult.rows.length === 0) return res.json({ turma: null, professor: null, colegas: [] });
  const turma = turmaResult.rows[0];

  const professorResult = await db.query(`
    SELECT nome, email FROM usuarios WHERE id = (SELECT professor_id FROM turmas WHERE id = $1)
  `, [turma.id]);

  const colegasResult = await db.query(`
    SELECT u.id, u.nome, u.email, u.ra, u.criado_em as entrou_em
    FROM usuarios u
    INNER JOIN turma_alunos ta ON ta.aluno_id = u.id
    WHERE ta.turma_id = $1 AND u.id != $2
    ORDER BY u.nome ASC
  `, [turma.id, req.usuario.id]);

  return res.json({ turma, professor: professorResult.rows[0] || null, colegas: colegasResult.rows });
});

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────
router.get('/notificacoes', verifyToken, async (req, res) => {
  const result = await db.query(`
    SELECT * FROM notificacoes WHERE professor_id = $1 ORDER BY criado_em DESC LIMIT 50
  `, [req.usuario.id]);
  return res.json({ notificacoes: result.rows });
});

router.post('/notificacoes/lida/:id', verifyToken, async (req, res) => {
  await db.query(`UPDATE notificacoes SET lida = 1 WHERE id = $1 AND professor_id = $2`, [req.params.id, req.usuario.id]);
  return res.json({ ok: true });
});

router.post('/notificacoes/lida-todas', verifyToken, async (req, res) => {
  await db.query(`UPDATE notificacoes SET lida = 1 WHERE professor_id = $1`, [req.usuario.id]);
  return res.json({ ok: true });
});

// ─── REGISTER / LOGIN ─────────────────────────────────────────────────────────
router.post('/register/aluno', registerAlunoValidation, (req, res) => register(req, res, 'aluno'));
router.post('/register/professor', registerProfessorValidation, (req, res) => register(req, res, 'professor'));
router.post('/login/aluno', loginAlunoValidation, loginAluno);
router.post('/login/professor', loginProfessorValidation, loginProfessor);

// ─── ALUNO PERFIL ─────────────────────────────────────────────────────────────
router.get('/aluno/perfil', verifyToken, async (req, res) => {
  const turmaResult = await db.query(`
    SELECT t.id, t.nome, t.codigo_acesso
    FROM turmas t
    INNER JOIN turma_alunos ta ON ta.turma_id = t.id
    WHERE ta.aluno_id = $1
  `, [req.usuario.id]);
  const turma = turmaResult.rows[0] || null;

  const colegas = turma ? (await db.query(`
    SELECT u.nome FROM usuarios u
    INNER JOIN turma_alunos ta ON ta.aluno_id = u.id
    WHERE ta.turma_id = $1 AND u.id != $2
    ORDER BY u.nome ASC
  `, [turma.id, req.usuario.id])).rows : [];

  return res.json({ turma, colegas });
});

const alunoController = require('../controllers/aluno.controller');
router.get('/aluno/perfil-completo', verifyToken, alunoController.getPerfil);
router.post('/aluno/alterar-senha', verifyToken, alunoController.alterarSenha);

// ─── ESQUECI SENHA — ALUNO ────────────────────────────────────────────────────
router.post('/aluno/esqueci-senha', limiterEsqueciSenha, async (req, res) => {
  const { email } = req.body;
  const MENSAGEM_GENERICA = 'Se esse email estiver cadastrado, você receberá as instruções em breve.';
  if (!email) return res.status(400).json({ message: 'Email é obrigatório.' });
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'desconhecido';

  try {
    const result = await db.query("SELECT id FROM usuarios WHERE email = $1 AND perfil = 'aluno'", [email]);
    const usuario = result.rows[0];

    await db.query(`INSERT INTO log_recuperacao (ip, email, sucesso) VALUES ($1, $2, $3)`, [ip, email, usuario ? 1 : 0]);

    if (usuario) {
      await db.query("UPDATE tokens_recuperacao SET usado = 1 WHERE usuario_id = $1", [usuario.id]);
      const token = crypto.randomBytes(32).toString('hex');
      const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await db.query(`INSERT INTO tokens_recuperacao (usuario_id, token, expira_em) VALUES ($1, $2, $3)`, [usuario.id, token, expiraEm]);
      const link = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}&perfil=aluno`;
      await transporter.sendMail({
        from: process.env.EMAIL_FROM, to: email,
        subject: 'MAT-IA — Redefinição de senha',
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f172a;color:#fff;padding:40px;border-radius:12px;"><h1 style="color:#f97316;">MAT-IA</h1><p style="color:#94a3b8;font-size:14px;margin-bottom:32px;">Suporte Inteligente ao Aprendizado de Matemática</p><h2>Redefinição de senha</h2><p style="color:#94a3b8;font-size:14px;margin-bottom:24px;">Clique no botão abaixo para redefinir sua senha. O link expira em <strong style="color:#fff;">1 hora</strong>.</p><a href="${link}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Redefinir minha senha</a></div>`
      });
    }
    return res.json({ message: MENSAGEM_GENERICA });
  } catch (error) {
    console.error('[aluno/esqueci-senha] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
});

// ─── ESQUECI SENHA — PROFESSOR ────────────────────────────────────────────────
router.post('/professor/esqueci-senha', limiterEsqueciSenha, async (req, res) => {
  const { email } = req.body;
  const MENSAGEM_GENERICA = 'Se esse email estiver cadastrado, você receberá as instruções em breve.';
  if (!email) return res.status(400).json({ message: 'Email é obrigatório.' });
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'desconhecido';

  try {
    const result = await db.query("SELECT id FROM usuarios WHERE email = $1 AND perfil = 'professor'", [email]);
    const usuario = result.rows[0];

    await db.query(`INSERT INTO log_recuperacao (ip, email, sucesso) VALUES ($1, $2, $3)`, [ip, email, usuario ? 1 : 0]);

    if (usuario) {
      await db.query("UPDATE tokens_recuperacao SET usado = 1 WHERE usuario_id = $1", [usuario.id]);
      const token = crypto.randomBytes(32).toString('hex');
      const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await db.query(`INSERT INTO tokens_recuperacao (usuario_id, token, expira_em) VALUES ($1, $2, $3)`, [usuario.id, token, expiraEm]);
      const link = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}&perfil=professor`;
      await transporter.sendMail({
        from: process.env.EMAIL_FROM, to: email,
        subject: 'MAT-IA — Redefinição de senha',
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f172a;color:#fff;padding:40px;border-radius:12px;"><h1 style="color:#f97316;">MAT-IA</h1><p style="color:#94a3b8;font-size:14px;margin-bottom:32px;">Suporte Inteligente ao Aprendizado de Matemática</p><h2>Redefinição de senha</h2><p style="color:#94a3b8;font-size:14px;margin-bottom:24px;">Clique no botão abaixo para redefinir sua senha. O link expira em <strong style="color:#fff;">1 hora</strong>.</p><a href="${link}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Redefinir minha senha</a></div>`
      });
    }
    return res.json({ message: MENSAGEM_GENERICA });
  } catch (error) {
    console.error('[professor/esqueci-senha] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
});

// ─── VALIDAR TOKEN ────────────────────────────────────────────────────────────
router.get('/validar-token/:token', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM tokens_recuperacao WHERE token = $1 AND usado = 0`, [req.params.token]);
    if (result.rows.length === 0) return res.json({ valido: false });
    const expirou = new Date(result.rows[0].expira_em) < new Date();
    if (expirou) return res.json({ valido: false });
    return res.json({ valido: true });
  } catch {
    return res.status(500).json({ valido: false });
  }
});

// ─── REDEFINIR SENHA ──────────────────────────────────────────────────────────
router.post('/redefinir-senha', async (req, res) => {
  const { token, novaSenha, confirmarSenha } = req.body;
  if (!token || !novaSenha || !confirmarSenha)
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  if (novaSenha !== confirmarSenha)
    return res.status(400).json({ message: 'As senhas não coincidem.' });
  const senhaForte = /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(novaSenha);
  if (!senhaForte)
    return res.status(400).json({ message: 'Mín. 8 caracteres, 1 maiúscula e 1 número.' });

  try {
    const result = await db.query(`SELECT * FROM tokens_recuperacao WHERE token = $1 AND usado = 0`, [token]);
    if (result.rows.length === 0)
      return res.status(400).json({ message: 'Token inválido ou já utilizado.' });
    const registro = result.rows[0];
    if (new Date(registro.expira_em) < new Date())
      return res.status(400).json({ message: 'Token expirado. Solicite um novo link.' });
    const novaSenhaHash = await bcrypt.hash(novaSenha, 12);
    await db.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [novaSenhaHash, registro.usuario_id]);
    await db.query('UPDATE tokens_recuperacao SET usado = 1 WHERE id = $1', [registro.id]);
    return res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error('[redefinir-senha] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
});

// ─── DIAGNÓSTICO ──────────────────────────────────────────────────────────────
const questoes = require('../data/questoes.json')

function calcularResultado(respostas) {
  const blocos = { inteiros: { acertos: 0, total: 0 }, fracoes: { acertos: 0, total: 0 }, raizes: { acertos: 0, total: 0 }, potencias: { acertos: 0, total: 0 }, geometria: { acertos: 0, total: 0 } }
  let pontuacao = 0
  questoes.forEach(q => {
    const bloco = blocos[q.bloco]
    bloco.total++
    const corretaReal = global.gabaritoAtual?.[q.id] || q.correta
if (respostas[q.id] === corretaReal) { bloco.acertos++; pontuacao++ }
  })
  Object.keys(blocos).forEach(b => {
    const { acertos, total } = blocos[b]
    blocos[b].nivel = acertos / total === 0 ? 'fraco' : acertos / total < 1 ? 'medio' : 'forte'
  })
  const nivel = pontuacao <= 5 ? 'basico' : pontuacao <= 11 ? 'intermediario' : 'avancado'
  return { nivel, pontuacao, blocos }
}

router.get('/diagnostico/status', verifyToken, async (req, res) => {
  const result = await db.query('SELECT diagnostico_status FROM usuarios WHERE id = $1', [req.usuario.id]);
  return res.json({ status: result.rows[0]?.diagnostico_status || 'pendente' });
});

router.post('/diagnostico/pular', verifyToken, async (req, res) => {
  await db.query("UPDATE usuarios SET diagnostico_status = 'pulado' WHERE id = $1", [req.usuario.id]);
  return res.json({ ok: true });
});

const { registrarDiagnostico } = require('../services/sheets.service')

router.post('/diagnostico/responder', verifyToken, async (req, res) => {
  const { respostas, usou_dicas, pulou, iniciado_em } = req.body
  if (!respostas || typeof respostas !== 'object')
    return res.status(400).json({ message: 'Respostas inválidas.' })

  const { nivel, pontuacao, blocos } = calcularResultado(respostas)
  const resultado_json = JSON.stringify({ nivel, pontuacao, blocos, usou_dicas: usou_dicas || [], pulou: pulou || [], respostas })

  const existente = await db.query('SELECT id FROM diagnosticos WHERE aluno_id = $1', [req.usuario.id])
  if (existente.rows.length > 0) {
    await db.query('UPDATE diagnosticos SET resultado_json = $1, feito_em = CURRENT_TIMESTAMP WHERE aluno_id = $2', [resultado_json, req.usuario.id])
  } else {
    await db.query('INSERT INTO diagnosticos (aluno_id, resultado_json) VALUES ($1, $2)', [req.usuario.id, resultado_json])
  }

  await db.query("UPDATE usuarios SET diagnostico_status = 'concluido' WHERE id = $1", [req.usuario.id])

  const usuarioResult = await db.query(`
    SELECT u.nome, u.ra, t.nome as turma
    FROM usuarios u
    LEFT JOIN turma_alunos ta ON ta.aluno_id = u.id
    LEFT JOIN turmas t ON t.id = ta.turma_id
    WHERE u.id = $1
  `, [req.usuario.id])
  const usuario = usuarioResult.rows[0]

  await registrarDiagnostico({
    nome: usuario?.nome || '-',
    ra: usuario?.ra || '-',
    turma: usuario?.turma || '-',
    nivel, pontuacao, blocos,
    dicas_usadas: (usou_dicas || []).length,
    questoes_puladas: (pulou || []).length,
    feito_em: new Date().toLocaleString('pt-BR'),
    tempo_segundos: iniciado_em ? Math.round((Date.now() - iniciado_em) / 1000) : null,
    ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].reduce((acc, id) => {
      const q = questoes.find(q => q.id === id)
      acc[`q${id}`] = q ? (respostas[id] ? (respostas[id] === q.correta ? '✅' : '❌') : '—') : '—'
      return acc
    }, {}),
  })

  return res.json({ nivel, pontuacao, blocos })
})

router.get('/diagnostico/resultado', verifyToken, async (req, res) => {
  const result = await db.query('SELECT resultado_json, feito_em FROM diagnosticos WHERE aluno_id = $1', [req.usuario.id])
  if (result.rows.length === 0) return res.status(404).json({ message: 'Diagnóstico não encontrado.' })
  return res.json({ resultado: JSON.parse(result.rows[0].resultado_json), feito_em: result.rows[0].feito_em })
})

router.get('/diagnostico/questoes', verifyToken, (req, res) => {
  const semGabarito = questoes.map(({ correta, ...q }) => q)
  return res.json({ questoes: semGabarito })
})

// TEMPORÁRIO — embaralhamento desativado até próxima versão
router.get('/diagnostico/questoes-OLD', verifyToken, (req, res) => {
  const questoesEmbaralhadas = questoes.map(({ correta, ...q }) => {
    const letrasOriginais = ['A', 'B', 'C', 'D']
    const letrasEmbaralhadas = [...letrasOriginais]
    for (let i = letrasEmbaralhadas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letrasEmbaralhadas[i], letrasEmbaralhadas[j]] = [letrasEmbaralhadas[j], letrasEmbaralhadas[i]]
    }
    // Cada posição i: letraEmbaralhada[i] recebe conteúdo de letrasOriginais[i]
    const novasAlternativas = {}
    letrasEmbaralhadas.forEach((letraNova, idx) => {
      novasAlternativas[letraNova] = q.alternativas[letrasOriginais[idx]]
    })
    // A nova letra correta é aquela que ficou na posição original da correta
    const idxCorreta = letrasOriginais.indexOf(correta)
const novaCorreta = letrasEmbaralhadas[idxCorreta]
return { ...q, alternativas: novasAlternativas, correta: novaCorreta }
  })
  // Salva gabarito embaralhado em memória temporária por sessão
global.gabaritoAtual = {}
questoesEmbaralhadas.forEach(q => { global.gabaritoAtual[q.id] = q.correta })

return res.json({ questoes: questoesEmbaralhadas.map(({ correta, ...q }) => q) })
})

module.exports = router;