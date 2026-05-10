const express = require('express');
const { body } = require('express-validator');
const { register, loginAluno, loginProfessor } = require('../controllers/auth.controller');
const sheetsService = require('../services/sheets.service');
const { verifyToken, requirePerfil } = require('../middlewares/auth.middleware');
const db = require('../config/database');
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

async function enviarEmail({ to, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'MAT-IA', email: 'beparanhosborges@gmail.com' },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  })
  if (!res.ok) throw new Error(`Brevo error: ${res.status}`)
}

const registerAlunoValidation = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Nome deve conter apenas letras'),
  body('email').trim().notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido'),
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
router.get('/turmas/minhas', verifyToken, requirePerfil('professor'), async (req, res) => {
  const result = await db.query(`
    SELECT t.id, t.nome, t.codigo_acesso, COUNT(ta.aluno_id) as total_alunos
    FROM turmas t
    LEFT JOIN turma_alunos ta ON ta.turma_id = t.id
    WHERE t.professor_id = $1
    GROUP BY t.id
  `, [req.usuario.id]);
  return res.json({ turmas: result.rows });
});

router.get('/turmas/disponiveis', verifyToken, requirePerfil('professor'), async (req, res) => {
  const result = await db.query(`SELECT id, nome, codigo_acesso FROM turmas WHERE professor_id IS NULL`);
  return res.json({ turmas: result.rows });
});

router.post('/turmas/associar', verifyToken, requirePerfil('professor'), async (req, res) => {
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

router.get('/turmas/:id', verifyToken, requirePerfil('professor'), async (req, res) => {
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

router.get('/turmas/:id/alunos', verifyToken, requirePerfil('professor'), async (req, res) => {
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
router.get('/aluno/minha-turma', verifyToken, requirePerfil('aluno'), async (req, res) => {
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

// ─── NOTIFICAÇÕES DO ALUNO ────────────────────────────────────────────────────
router.get('/notificacoes/aluno', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM notificacoes_aluno 
      WHERE aluno_id = $1 
      ORDER BY criado_em DESC 
      LIMIT 50
    `, [req.usuario.id])

    return res.json({ notificacoes: result.rows })
  } catch (e) {
    console.error('Erro ao buscar notificações do aluno', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.post('/notificacoes/aluno/:id/lida', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    await db.query(
      `UPDATE notificacoes_aluno SET lida = 1 WHERE id = $1 AND aluno_id = $2`,
      [req.params.id, req.usuario.id]
    )

    return res.json({ ok: true })
  } catch (e) {
    console.error('Erro ao marcar notificação como lida', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.delete('/notificacoes/aluno/:id', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    await db.query(
      'DELETE FROM notificacoes_aluno WHERE id = $1 AND aluno_id = $2',
      [req.params.id, req.usuario.id]
    )

    return res.json({ ok: true })
  } catch (e) {
    console.error('Erro ao apagar notificação', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.delete('/notificacoes/aluno', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    await db.query(
      'DELETE FROM notificacoes_aluno WHERE aluno_id = $1',
      [req.usuario.id]
    )

    return res.json({ ok: true })
  } catch (e) {
    console.error('Erro ao apagar todas as notificações', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────
router.get('/notificacoes', verifyToken, requirePerfil('professor'), async (req, res) => {
  const result = await db.query(`
    SELECT * FROM notificacoes WHERE professor_id = $1 ORDER BY criado_em DESC LIMIT 50
  `, [req.usuario.id]);
  return res.json({ notificacoes: result.rows });
});

router.post('/notificacoes/lida/:id', verifyToken, requirePerfil('professor'), async (req, res) => {
  await db.query(`UPDATE notificacoes SET lida = 1 WHERE id = $1 AND professor_id = $2`, [req.params.id, req.usuario.id]);
  return res.json({ ok: true });
});

router.post('/notificacoes/lida-todas', verifyToken, requirePerfil('professor'), async (req, res) => {
  await db.query(`UPDATE notificacoes SET lida = 1 WHERE professor_id = $1`, [req.usuario.id]);
  return res.json({ ok: true });
});

router.delete('/notificacoes/:id', verifyToken, requirePerfil('professor'), async (req, res) => {
  await db.query('DELETE FROM notificacoes WHERE id = $1 AND professor_id = $2', [req.params.id, req.usuario.id])
  return res.json({ ok: true })
})

router.delete('/notificacoes', verifyToken, requirePerfil('professor'), async (req, res) => {
  await db.query('DELETE FROM notificacoes WHERE professor_id = $1', [req.usuario.id])
  return res.json({ ok: true })
})

// Músicas favoritas
router.get('/musicas-favoritas', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT musicas_favoritas FROM usuarios WHERE id = $1',
      [req.usuario.id]
    )
    res.json({ favoritas: result.rows[0]?.musicas_favoritas || [] })
  } catch (e) {
    console.error('Erro ao buscar músicas favoritas', e)
    res.status(500).json({ erro: 'Erro interno' })
  }
})

router.post('/musicas-favoritas', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    const { favoritas } = req.body
    await db.query(
      'UPDATE usuarios SET musicas_favoritas = $1 WHERE id = $2',
      [JSON.stringify(favoritas), req.usuario.id]
    )
    res.json({ ok: true })
  } catch (e) {
    console.error('Erro ao salvar músicas favoritas', e)
    res.status(500).json({ erro: 'Erro interno' })
  }
})


// ─── REGISTER / LOGIN ─────────────────────────────────────────────────────────
router.post('/register/aluno', registerAlunoValidation, (req, res) => register(req, res, 'aluno'));
router.post('/register/professor', registerProfessorValidation, (req, res) => register(req, res, 'professor'));
router.post('/login/aluno', loginAlunoValidation, loginAluno);
router.post('/login/professor', loginProfessorValidation, loginProfessor);

// ─── ALUNO PERFIL ─────────────────────────────────────────────────────────────
router.get('/aluno/perfil', verifyToken, requirePerfil('aluno'), async (req, res) => {
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
router.get('/aluno/perfil-completo', verifyToken, requirePerfil('aluno'), alunoController.getPerfil);
router.post('/aluno/alterar-senha', verifyToken, requirePerfil('aluno'), alunoController.alterarSenha);

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
      await enviarEmail({
        to: email,
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
      await enviarEmail({
  to: email,
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
    const corretaReal = q.correta
if (respostas[q.id] === corretaReal) { bloco.acertos++; pontuacao++ }
  })
  Object.keys(blocos).forEach(b => {
    const { acertos, total } = blocos[b]
    blocos[b].nivel = acertos / total === 0 ? 'fraco' : acertos / total < 1 ? 'medio' : 'forte'
  })
  const nivel = pontuacao <= 6 ? 'basico' : pontuacao <= 13 ? 'intermediario' : 'avancado'
  return { nivel, pontuacao, blocos }
}

router.get('/diagnostico/status', verifyToken, requirePerfil('aluno'), async (req, res) => {
  const result = await db.query('SELECT diagnostico_status FROM usuarios WHERE id = $1', [req.usuario.id]);
  return res.json({ status: result.rows[0]?.diagnostico_status || 'pendente' });
});

router.post('/diagnostico/pular', verifyToken, requirePerfil('aluno'), async (req, res) => {
  await db.query("UPDATE usuarios SET diagnostico_status = 'pulado' WHERE id = $1", [req.usuario.id]);
  return res.json({ ok: true });
});

const { registrarDiagnostico } = require('../services/sheets.service')

router.post('/diagnostico/responder', verifyToken, requirePerfil('aluno'), async (req, res) => {
  const { respostas, usou_dicas, pulou, iniciado_em } = req.body
  if (!respostas || typeof respostas !== 'object')
    return res.status(400).json({ message: 'Respostas inválidas.' })

  const { nivel, pontuacao, blocos } = calcularResultado(respostas)
  const tempo_segundos = iniciado_em ? Math.round((Date.now() - iniciado_em) / 1000) : null
  const resultado_json = JSON.stringify({ nivel, pontuacao, blocos, usou_dicas: usou_dicas || [], pulou: pulou || [], respostas, tempo_segundos })

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
    ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].reduce((acc, id) => {
      const q = questoes.find(q => q.id === id)
      acc[`q${id}`] = q ? (respostas[id] ? (respostas[id] === q.correta ? '✅' : '❌') : '—') : '—'
      return acc
    }, {}),
  })

  return res.json({ nivel, pontuacao, blocos })
})

router.get('/diagnostico/resultado', verifyToken, requirePerfil('aluno'), async (req, res) => {
  const result = await db.query('SELECT resultado_json, feito_em FROM diagnosticos WHERE aluno_id = $1', [req.usuario.id])
  if (result.rows.length === 0) return res.status(404).json({ message: 'Diagnóstico não encontrado.' })
  return res.json({ resultado: JSON.parse(result.rows[0].resultado_json), feito_em: result.rows[0].feito_em })
})

// ─── FEEDBACK DO DIAGNÓSTICO ─────────────────────────────────────────────────
router.post('/diagnostico/feedback', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    const { nota, comentario } = req.body
    
    if (nota === undefined || nota === null)
      return res.status(400).json({ message: 'Nota é obrigatória.' })
    
    if (nota < 0 || nota > 10)
      return res.status(400).json({ message: 'Nota deve estar entre 0 e 10.' })

    // Verifica se aluno já completou diagnóstico
    const status = await db.query(
      'SELECT diagnostico_status FROM usuarios WHERE id = $1',
      [req.usuario.id]
    )
    
    if (status.rows[0]?.diagnostico_status !== 'concluido')
      return res.status(400).json({ message: 'Diagnóstico não foi concluído.' })

    // Busca dados do aluno + diagnóstico pra enviar pro Sheets
    const dadosAluno = await db.query(`
      SELECT u.nome, u.ra, t.nome as turma
      FROM usuarios u
      LEFT JOIN turma_alunos ta ON ta.aluno_id = u.id
      LEFT JOIN turmas t ON t.id = ta.turma_id
      WHERE u.id = $1
    `, [req.usuario.id])

    const diagnostico = await db.query(
      'SELECT resultado_json FROM diagnosticos WHERE aluno_id = $1',
      [req.usuario.id]
    )

    const resultado = diagnostico.rows[0] ? JSON.parse(diagnostico.rows[0].resultado_json) : null

    // Insere ou atualiza feedback no banco
    const existente = await db.query(
      'SELECT id FROM feedbacks_diagnostico WHERE aluno_id = $1',
      [req.usuario.id]
    )

    if (existente.rows.length > 0) {
      await db.query(
        'UPDATE feedbacks_diagnostico SET nota = $1, comentario = $2, criado_em = NOW() WHERE aluno_id = $3',
        [nota, comentario || null, req.usuario.id]
      )
    } else {
      await db.query(
        'INSERT INTO feedbacks_diagnostico (aluno_id, nota, comentario) VALUES ($1, $2, $3)',
        [req.usuario.id, nota, comentario || null]
      )
    }

    // Envia pro Google Sheets
    const { registrarFeedback } = require('../services/sheets.service')
    await registrarFeedback({
      nome: dadosAluno.rows[0]?.nome || '-',
      ra: dadosAluno.rows[0]?.ra || '-',
      turma: dadosAluno.rows[0]?.turma || '-',
      nota,
      comentario,
      data: new Date().toLocaleString('pt-BR'),
      tempo_diagnostico: resultado?.tempo_segundos || null,
      nivel: resultado?.nivel || null,
      pontuacao: resultado?.pontuacao || null
    })

    return res.json({ ok: true })
  } catch (e) {
    console.error('[diagnostico/feedback] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.get('/turmas/:id/feedbacks', verifyToken, requirePerfil('professor'), async (req, res) => {
  try {
    const turma = await db.query(
      'SELECT id FROM turmas WHERE id = $1 AND professor_id = $2',
      [req.params.id, req.usuario.id]
    )
    
    if (turma.rows.length === 0)
      return res.status(404).json({ message: 'Turma não encontrada.' })

    const result = await db.query(`
      SELECT 
        u.nome, u.ra,
        f.nota, f.comentario, f.criado_em
      FROM feedbacks_diagnostico f
      INNER JOIN usuarios u ON u.id = f.aluno_id
      INNER JOIN turma_alunos ta ON ta.aluno_id = u.id
      WHERE ta.turma_id = $1
      ORDER BY f.criado_em DESC
    `, [req.params.id])

    return res.json({ feedbacks: result.rows })
  } catch (e) {
    console.error('[turmas/feedbacks] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.get('/diagnostico/feedback-enviado', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id FROM feedbacks_diagnostico WHERE aluno_id = $1',
      [req.usuario.id]
    )
    return res.json({ enviado: result.rows.length > 0 })
  } catch (e) {
    console.error('[diagnostico/feedback-enviado] Erro:', e)
    return res.status(500).json({ enviado: false })
  }
})

router.get('/diagnostico/questoes', verifyToken, requirePerfil('aluno'), (req, res) => {
  const semGabarito = questoes.map(({ correta, ...q }) => q)
  return res.json({ questoes: semGabarito })
})

// ─── MÉTRICAS — DIAGNÓSTICO POR TURMA ────────────────────────────────────────
router.get('/turmas/:id/diagnosticos', verifyToken, requirePerfil('professor'), async (req, res) => {
  try {
    const turma = await db.query(
      'SELECT id, nome FROM turmas WHERE id = $1 AND professor_id = $2',
      [req.params.id, req.usuario.id]
    )
    if (turma.rows.length === 0)
      return res.status(404).json({ message: 'Turma não encontrada.' })

    const result = await db.query(`
      SELECT
        u.id, u.nome, u.ra, u.diagnostico_status,
        d.resultado_json, d.feito_em, d.analise_ia, d.analise_ia_gerada_em
      FROM usuarios u
      INNER JOIN turma_alunos ta ON ta.aluno_id = u.id
      LEFT JOIN diagnosticos d ON d.aluno_id = u.id
      WHERE ta.turma_id = $1
      ORDER BY u.nome ASC
    `, [req.params.id])

    const analiseturma = await db.query(
      'SELECT analise_ia, analise_ia_gerada_em FROM turmas WHERE id = $1',
      [req.params.id]
    )

    return res.json({
      turma: turma.rows[0],
      analise_ia: analiseturma.rows[0]?.analise_ia || null,
      analise_ia_gerada_em: analiseturma.rows[0]?.analise_ia_gerada_em || null,
      alunos: result.rows.map(r => ({
        id: r.id,
        nome: r.nome,
        ra: r.ra,
        status: r.diagnostico_status,
        feito_em: r.feito_em,
        resultado: r.resultado_json ? JSON.parse(r.resultado_json) : null,
        analise_ia: r.analise_ia || null,
        analise_ia_gerada_em: r.analise_ia_gerada_em || null
      }))
    })
  } catch (e) {
    console.error('Erro ao buscar diagnósticos da turma', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.delete('/diagnosticos/:alunoId', verifyToken, requirePerfil('professor'), async (req, res) => {
  try {
    const turma = await db.query(`
      SELECT t.id FROM turmas t
      INNER JOIN turma_alunos ta ON ta.turma_id = t.id
      WHERE ta.aluno_id = $1 AND t.professor_id = $2
    `, [req.params.alunoId, req.usuario.id])

    if (turma.rows.length === 0)
      return res.status(403).json({ message: 'Sem permissão.' })

    await db.query('DELETE FROM diagnosticos WHERE aluno_id = $1', [req.params.alunoId])
    await db.query("UPDATE usuarios SET diagnostico_status = 'pendente' WHERE id = $1", [req.params.alunoId])

    return res.json({ ok: true })
  } catch (e) {
    console.error('Erro ao apagar diagnóstico', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── IA — ANÁLISE DE TURMA ───────────────────────────────────────────────────
router.post('/ia/analisar-turma', verifyToken, requirePerfil('professor'), async (req, res) => {
  try {
    const { turmaId } = req.body
    if (!turmaId) return res.status(400).json({ message: 'turmaId é obrigatório.' })

    const turma = await db.query(
      'SELECT id, nome FROM turmas WHERE id = $1 AND professor_id = $2',
      [turmaId, req.usuario.id]
    )
    if (turma.rows.length === 0)
      return res.status(404).json({ message: 'Turma não encontrada.' })

    const result = await db.query(`
      SELECT u.nome, u.ra, d.resultado_json
      FROM usuarios u
      INNER JOIN turma_alunos ta ON ta.aluno_id = u.id
      LEFT JOIN diagnosticos d ON d.aluno_id = u.id
      WHERE ta.turma_id = $1 AND d.resultado_json IS NOT NULL
      ORDER BY u.nome ASC
    `, [turmaId])

    if (result.rows.length === 0)
      return res.status(400).json({ message: 'Nenhum diagnóstico realizado ainda.' })

    const alunos = result.rows.map(r => ({
      nome: r.nome,
      ...JSON.parse(r.resultado_json)
    }))

    const totalAlunos = alunos.length
    const niveis = { basico: 0, intermediario: 0, avancado: 0 }
    alunos.forEach(a => { if (niveis[a.nivel] !== undefined) niveis[a.nivel]++ })

    const mediasBlocos = ['inteiros', 'fracoes', 'raizes', 'potencias', 'geometria'].map(bloco => {
      const vals = alunos.map(a => a.blocos?.[bloco] ? (a.blocos[bloco].acertos / a.blocos[bloco].total) * 100 : null).filter(v => v !== null)
      return { bloco, media: vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0 }
    })

    const mediaGeral = Math.round(alunos.reduce((s, a) => s + (a.pontuacao || 0), 0) / totalAlunos * 10) / 10

    const contexto = `
Você é um assistente pedagógico especializado em matemática para cursos de Engenharia.
Analise os dados da turma "${turma.rows[0].nome}" e forneça um resumo pedagógico objetivo e útil para o professor.

DADOS DA TURMA:
- Total de alunos que fizeram o diagnóstico: ${totalAlunos}
- Distribuição por nível: Básico: ${niveis.basico} | Intermediário: ${niveis.intermediario} | Avançado: ${niveis.avancado}
- Média geral: ${mediaGeral}/20
- Desempenho por bloco: ${mediasBlocos.map(b => `${b.bloco}: ${b.media}%`).join(' | ')}

INSTRUÇÕES:
- Escreva em português, tom profissional mas acessível
- Máximo 4 frases
- Destaque o ponto mais forte e o mais fraco da turma
- Termine com UMA recomendação pedagógica concreta para o professor
- Sempre cite os valores percentuais ao justificar pontos fortes e fracos
- Compare explicitamente o melhor e o pior bloco com seus valores
- Evite termos vagos como "bom" ou "regular" sem justificar com números
- NÃO invente dados além dos fornecidos
- NÃO use bullet points, escreva em parágrafo corrido
`

    const iaRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [{ role: 'user', content: contexto }]
      })
    })

    if (!iaRes.ok) {
      const err = await iaRes.text()
      console.error('[ia/analisar-turma] Erro API:', err)
      return res.status(500).json({ message: 'Erro ao consultar IA.' })
    }

    const iaData = await iaRes.json()
    const analise = iaData.choices?.[0]?.message?.content || 'Não foi possível gerar análise.'

    await db.query(
      'UPDATE turmas SET analise_ia = $1, analise_ia_gerada_em = NOW() WHERE id = $2',
      [analise, turmaId]
    )
    return res.json({ analise })
  } catch (e) {
    console.error('[ia/analisar-turma] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── IA — ANÁLISE INDIVIDUAL ─────────────────────────────────────────────────
router.post('/ia/analisar-aluno', verifyToken, requirePerfil('professor'), async (req, res) => {
  try {
    const { alunoId } = req.body
    if (!alunoId) return res.status(400).json({ message: 'alunoId é obrigatório.' })

    const turma = await db.query(`
      SELECT t.id FROM turmas t
      INNER JOIN turma_alunos ta ON ta.turma_id = t.id
      WHERE ta.aluno_id = $1 AND t.professor_id = $2
    `, [alunoId, req.usuario.id])
    if (turma.rows.length === 0)
      return res.status(403).json({ message: 'Sem permissão.' })

    const result = await db.query(`
      SELECT u.nome, d.resultado_json
      FROM usuarios u
      INNER JOIN diagnosticos d ON d.aluno_id = u.id
      WHERE u.id = $1
    `, [alunoId])

    if (result.rows.length === 0)
      return res.status(400).json({ message: 'Diagnóstico não encontrado.' })

    const { nome, resultado_json } = result.rows[0]
    const { nivel, pontuacao, blocos, usou_dicas, pulou, tempo_segundos } = JSON.parse(resultado_json)

    const blocoTexto = Object.entries(blocos).map(([b, d]) => {
      const perc = Math.round((d.acertos / d.total) * 100)
      return `${b}: ${d.acertos}/${d.total} (${perc}%)`
    }).join(' | ')

    const contexto = `
Você é um assistente pedagógico especializado em matemática para cursos de Engenharia.
Analise o desempenho individual do aluno e forneça um feedback objetivo e útil para o professor.

DADOS DO ALUNO: ${nome}
- Nível: ${nivel}
- Pontuação: ${pontuacao}/20
- Desempenho por bloco: ${blocoTexto}
- Dicas utilizadas: ${(usou_dicas || []).length} de 20 questões
- Questões puladas: ${(pulou || []).length} de 20 questões
- Tempo total de resposta: ${tempo_segundos ? `${Math.round(tempo_segundos / 60)} minutos (${tempo_segundos}s)` : 'não disponível'}

INSTRUÇÕES:
- Escreva em português, tom profissional mas acessível
- Máximo 3 frases
- Identifique explicitamente o bloco com melhor desempenho e o com pior desempenho, comparando os valores percentuais entre si
- Termine com UMA sugestão de reforço específica
- Cite os valores numéricos (acertos/total e %) ao analisar cada bloco
- Destaque comportamento: se usou muitas dicas ou pulou questões, interprete o que isso pode indicar sobre segurança, dificuldade ou estratégia do aluno
- Se o tempo de resposta for muito curto (menos de 3 min) ou muito longo (mais de 20 min), mencione como possível sinal de pressa ou dificuldade
- Evite termos vagos sem justificar com os dados fornecidos
- NÃO invente dados além dos fornecidos
- NÃO use bullet points, escreva em parágrafo corrido
`

    const iaRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        messages: [{ role: 'user', content: contexto }]
      })
    })

    if (!iaRes.ok) {
      const err = await iaRes.text()
      console.error('[ia/analisar-aluno] Erro API:', err)
      return res.status(500).json({ message: 'Erro ao consultar IA.' })
    }

    const iaData = await iaRes.json()
    const analise = iaData.choices?.[0]?.message?.content || 'Não foi possível gerar análise.'

    await db.query(
      'UPDATE diagnosticos SET analise_ia = $1, analise_ia_gerada_em = NOW() WHERE aluno_id = $2',
      [analise, alunoId]
    )
    return res.json({ analise })
  } catch (e) {
    console.error('[ia/analisar-aluno] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── MATÉRIAS ─────────────────────────────────────────────────────────────────

router.get('/materias/stats', verifyToken, requirePerfil('aluno', 'professor'), async (req, res) => {
  try {
    const [resFeitas, resTotal] = await Promise.all([
      db.query(`
        SELECT
        COUNT(DISTINCT questao_id) as total,
        COUNT(DISTINCT questao_id) FILTER (WHERE acertou = true) as acertos,
        COUNT(DISTINCT questao_id) FILTER (WHERE acertou = false) as erros
      FROM (
        SELECT DISTINCT ON (questao_id) questao_id, acertou
        FROM questoes_historico
        WHERE aluno_id = $1
        ORDER BY questao_id, respondido_em DESC
      ) ultima
      `, [req.usuario.id]),
      db.query(`SELECT COUNT(*) as total FROM questoes WHERE ativa = true`)
    ])
        const { total: feitas, acertos, erros } = resFeitas.rows[0]
    const { total } = resTotal.rows[0]
    return res.json({
      feitas: parseInt(feitas),
      acertos: parseInt(acertos),
      erros: parseInt(erros),
      total: parseInt(total)
    })
  } catch (e) {
    console.error('[materias/stats] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.get('/materias/blocos', verifyToken, requirePerfil('aluno', 'professor'), async (req, res) => {
  try {
    const blocos = ['inteiros', 'fracoes', 'raizes', 'potencias', 'geometria', 'equacao1', 'equacao2', 'modulo', 'exponencial', 'trigonometria']

    const totais = await db.query(`
      SELECT bloco, COUNT(*) as total
      FROM questoes WHERE ativa = true
      GROUP BY bloco
    `)

    const historico = await db.query(`
      SELECT bloco,
        COUNT(*) as feitas,
        COUNT(*) FILTER (WHERE acertou = true) as acertos
      FROM (
        SELECT DISTINCT ON (qh.questao_id) qh.questao_id, q.bloco, qh.acertou
        FROM questoes_historico qh
        INNER JOIN questoes q ON q.id = qh.questao_id
        WHERE qh.aluno_id = $1
        ORDER BY qh.questao_id, qh.respondido_em DESC
      ) ultima
      GROUP BY bloco
    `, [req.usuario.id])

    const totaisMap = {}
    totais.rows.forEach(r => { totaisMap[r.bloco] = parseInt(r.total) })

    const historicoMap = {}
    historico.rows.forEach(r => {
      historicoMap[r.bloco] = { feitas: parseInt(r.feitas), acertos: parseInt(r.acertos) }
    })

    const resultado = blocos.map(bloco => {
      const h = historicoMap[bloco] || { feitas: 0, acertos: 0 }
      const total = totaisMap[bloco] || 0
      return {
        bloco,
        total,
        feitas: h.feitas,
        acertos: h.acertos,
        erros: h.feitas - h.acertos
      }
    })

    return res.json({ blocos: resultado })
  } catch (e) {
    console.error('[materias/blocos] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.get('/materias/:bloco/questoes', verifyToken, requirePerfil('aluno', 'professor'), async (req, res) => {
  try {
        const blocosValidos = ['inteiros', 'fracoes', 'raizes', 'potencias', 'geometria', 'equacao1', 'equacao2', 'modulo', 'exponencial', 'trigonometria']
    if (!blocosValidos.includes(req.params.bloco))
      return res.status(400).json({ message: 'Bloco inválido.' })

    const questoesResult = await db.query(`
      SELECT id, enunciado, alternativas, latex, dificuldade
      FROM questoes
      WHERE bloco = $1 AND ativa = true
      ORDER BY id ASC
    `, [req.params.bloco])

    const historicoResult = await db.query(`
      SELECT questao_id, acertou, resposta_dada, respondido_em
      FROM questoes_historico
      WHERE aluno_id = $1 AND questao_id = ANY(
        SELECT id FROM questoes WHERE bloco = $2 AND ativa = true
      )
      ORDER BY respondido_em DESC
    `, [req.usuario.id, req.params.bloco])

    const historicoMap = {}
    historicoResult.rows.forEach(r => {
      if (!historicoMap[r.questao_id]) {
        historicoMap[r.questao_id] = { acertou: r.acertou, resposta_dada: r.resposta_dada }
      }
    })

    const questoes = questoesResult.rows.map((q, idx) => ({
      ...q,
      numero: idx + 1,
      status: historicoMap[q.id]
        ? (historicoMap[q.id].acertou ? 'acerto' : 'erro')
        : 'pendente'
    }))

    return res.json({ questoes })
  } catch (e) {
    console.error('[materias/bloco/questoes] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.post('/materias/responder', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    const { questaoId, respostaDada, tempo_segundos, bloco } = req.body;
    const alunoId = req.usuario.id;

    if (!questaoId || !respostaDada) {
      return res.status(400).json({ message: 'Dados incompletos.' });
    }

    // ✨ BUSCA DADOS COMPLETOS DO ALUNO (Resolve o erro de 'undefined' na planilha)
    const usuarioDadosRes = await db.query(
        'SELECT nome, ra FROM usuarios WHERE id = $1',
        [alunoId]
    );
    const alunoDados = usuarioDadosRes.rows[0];

    if (!alunoDados) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // 1. Buscar a questão para validar a resposta
    const questaoRes = await db.query(
        'SELECT id, correta FROM questoes WHERE id = $1 AND ativa = true',
        [questaoId]
    );

    if (questaoRes.rows.length === 0) {
      return res.status(404).json({ message: 'Questão não encontrada.' });
    }

    const correta = questaoRes.rows[0].correta;
    const acertou = correta.toUpperCase() === String(respostaDada).toUpperCase();

    // 2. BUSCAR HISTÓRICO
    const historicoRes = await db.query(
        'SELECT acertou FROM questoes_historico WHERE aluno_id = $1 AND questao_id = $2',
        [alunoId, questaoId]
    );

    let pontosGanhos = 0;
    const jaAcertouAntes = historicoRes.rows.some(h => h.acertou);

    if (acertou && !jaAcertouAntes) {
      const jaTinhaTentativas = historicoRes.rows.length > 0;
      pontosGanhos = jaTinhaTentativas ? 5 : 10;
    }

    // 3. Registrar o log da tentativa atual
    await db.query(`
      INSERT INTO questoes_historico (aluno_id, questao_id, resposta_dada, acertou, tempo_segundos, pontos_ganhos)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [alunoId, questaoId, String(respostaDada).toUpperCase(), acertou, tempo_segundos || 0, pontosGanhos]);

    // 4. ATUALIZAR O PERFIL DO USUÁRIO (Contagem de únicas)
    await db.query(`
      UPDATE usuarios 
      SET 
        pontos_totais = pontos_totais + $1,
        questoes_respondidas = (SELECT COUNT(DISTINCT questao_id) FROM questoes_historico WHERE aluno_id = $2),
        questoes_corretas = (SELECT COUNT(DISTINCT questao_id) FROM questoes_historico WHERE aluno_id = $2 AND acertou = true)
      WHERE id = $2
    `, [pontosGanhos, alunoId]);

    // 5. Buscar nova posição no ranking e dados atualizados para o HUD
    const dadosRanking = await db.query(`
      SELECT pontos_totais, questoes_corretas, questoes_respondidas,
             (SELECT COUNT(*) + 1 FROM usuarios WHERE pontos_totais > u.pontos_totais AND perfil = 'aluno') as posicao
      FROM usuarios u
      WHERE id = $1
    `, [alunoId]);

    const novoProgresso = dadosRanking.rows[0];

    // 6. Buscar o nome da turma para a planilha
    const resTurma = await db.query(`
      SELECT t.nome FROM turma_alunos ta
                           JOIN turmas t ON t.id = ta.turma_id
      WHERE ta.aluno_id = $1 LIMIT 1
    `, [alunoId]);

    const nomeTurma = resTurma.rows[0]?.nome || 'Sem Turma';

    // 7. Enviar para o Google Sheets (Usando os dados reais buscados no início)
    if (sheetsService.registrarQuestaoRespondida) {
      sheetsService.registrarQuestaoRespondida(
          alunoDados.nome, // Nome real do banco
          alunoDados.ra,   // RA real do banco
          nomeTurma,
          questaoId,
          bloco || 'geral',
          acertou,
          pontosGanhos,
          tempo_segundos || 0
      ).catch(err => console.error('Erro Sheets:', err));
    }

    // 8. Retorno FINAL para o Frontend
    return res.json({
      acertou,
      // Se acertou, não precisa da correta.
      // Se errou, enviamos null para a plataforma NÃO mostrar qual era a certa.
      correta: null,
      pontosGanhos,
      novoProgresso
    });

  } catch (e) {
    console.error('[materias/responder] Erro:', e);
    return res.status(500).json({ message: 'Erro interno ao processar resposta.' });
  }
});

// ─── FAVORITAS ────────────────────────────────────────────────────────────────

router.get('/materias/favoritas', verifyToken, requirePerfil('aluno', 'professor'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT q.id, q.bloco, q.enunciado, q.alternativas, q.latex, q.dificuldade,
             qf.criado_em as favoritado_em
      FROM questoes_favoritas qf
      INNER JOIN questoes q ON q.id = qf.questao_id
      WHERE qf.aluno_id = $1
      ORDER BY q.bloco ASC, q.id ASC
    `, [req.usuario.id])

    const porBloco = {}
    result.rows.forEach((q, idx) => {
      if (!porBloco[q.bloco]) porBloco[q.bloco] = []
      porBloco[q.bloco].push({ ...q, numero: idx + 1 })
    })

    return res.json({ favoritas: result.rows, porBloco, total: result.rows.length })
  } catch (e) {
    console.error('[materias/favoritas] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.post('/materias/favoritar', verifyToken, requirePerfil('aluno', 'professor'), async (req, res) => {
  try {
    const { questaoId } = req.body
    if (!questaoId) return res.status(400).json({ message: 'questaoId é obrigatório.' })

    await db.query(`
      INSERT INTO questoes_favoritas (aluno_id, questao_id)
      VALUES ($1, $2)
      ON CONFLICT (aluno_id, questao_id) DO NOTHING
    `, [req.usuario.id, questaoId])

    return res.json({ ok: true, favoritado: true })
  } catch (e) {
    console.error('[materias/favoritar] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.delete('/materias/favoritar/:questaoId', verifyToken, requirePerfil('aluno', 'professor'), async (req, res) => {
  try {
    await db.query(`
      DELETE FROM questoes_favoritas
      WHERE aluno_id = $1 AND questao_id = $2
    `, [req.usuario.id, req.params.questaoId])

    return res.json({ ok: true, favoritado: false })
  } catch (e) {
    console.error('[materias/desfavoritar] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── ÚLTIMO ACESSO ────────────────────────────────────────────────────────────

router.get('/materias/ultimo-acesso', verifyToken, requirePerfil('aluno', 'professor'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT q.bloco, COUNT(DISTINCT qh.questao_id) as feitas
      FROM questoes_historico qh
      INNER JOIN questoes q ON q.id = qh.questao_id
      WHERE qh.aluno_id = $1
      GROUP BY q.bloco
      ORDER BY MAX(qh.respondido_em) DESC
      LIMIT 1
    `, [req.usuario.id])

    if (result.rows.length === 0) return res.json({ bloco: null })

    const bloco = result.rows[0].bloco
    const feitas = parseInt(result.rows[0].feitas)

    const total = await db.query(
      'SELECT COUNT(*) as total FROM questoes WHERE bloco = $1 AND ativa = true',
      [bloco]
    )

    return res.json({ bloco, feitas, total: parseInt(total.rows[0].total) })
  } catch (e) {
    console.error('[materias/ultimo-acesso] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── FEEDBACK DO DASHBOARD ────────────────────────────────────────────────────
router.post('/feedback', verifyToken, requirePerfil('aluno'), async (req, res) => {
  const { tipo, mensagem, permitirContato } = req.body;
  const alunoId = req.usuario.id;

  if (!mensagem || mensagem.trim().length < 10) {
    return res.status(400).json({ message: 'A mensagem deve ter pelo menos 10 caracteres.' });
  }

  try {
    // 1. Salvar no Banco
    await db.query(
        'INSERT INTO feedbacks (aluno_id, tipo, mensagem, permitir_contato) VALUES ($1, $2, $3, $4)',
        [alunoId, tipo, mensagem, permitirContato]
    );

    // 2. Buscar dados do aluno para o email
    const userResult = await db.query('SELECT nome, email, ra FROM usuarios WHERE id = $1', [alunoId]);
    const { nome, email, ra } = userResult.rows[0] || { nome: 'Aluno', email: 'N/A', ra: 'N/A' };

    // 3. Montar HTML do Email
    const htmlEmail = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">💬 Novo Feedback — MAT-IA</h2>
        </div>
        <div style="padding: 24px; color: #334155;">
          <p><strong>Tipo:</strong> <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px;">${tipo.toUpperCase()}</span></p>
          <p><strong>Aluno:</strong> ${nome} (RA: ${ra})</p>
          <p><strong>Contato liberado?</strong> ${permitirContato ? `✅ Sim (${email})` : '❌ Não'}</p>
          <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-left: 4px solid #f97316; font-style: italic;">
            "${mensagem.replace(/\n/g, '<br>')}"
          </div>
          <hr style="margin: 24px 0; border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #64748b;">Enviado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    `;

    // 4. Enviar usando a função enviarEmail que já existe no topo do seu arquivo
    await enviarEmail({
      to: process.env.FEEDBACK_EMAIL || 'beparanhosborges@gmail.com',
      subject: `[Feedback MAT-IA] ${tipo}: ${nome}`,
      html: htmlEmail
    });

    res.status(200).json({ message: 'Feedback enviado com sucesso!' });
  } catch (e) {
    console.error('[auth/feedback] Erro:', e);
    res.status(500).json({ message: 'Erro ao processar feedback.' });
  }
});

// ─── GAMIFICAÇÃO: RANKING E PROGRESSO ────────────────────────────────────────

router.get('/ranking', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    const alunoLogadoId = req.usuario.id;

    const result = await db.query(`
      SELECT 
        id, -- Precisamos do ID para comparar
        nome, 
        ra, 
        pontos_totais, 
        questoes_corretas, 
        questoes_respondidas,
        CASE WHEN questoes_respondidas > 0 
             THEN ROUND((questoes_corretas::numeric / questoes_respondidas::numeric) * 100, 1)
             ELSE 0 END as taxa_acerto
      FROM usuarios 
      WHERE perfil = 'aluno' AND pontos_totais > 0
      ORDER BY 
        pontos_totais DESC, 
        questoes_corretas DESC, 
        questoes_respondidas ASC, -- Desempate: quem errou menos ganha
        nome ASC
      LIMIT 10
    `);

    // Adiciona o "(você)" com uma comparação mais robusta
    const rankingFormatado = result.rows.map(aluno => {
      // Forçamos a comparação como String para garantir que tipos diferentes não quebrem a lógica
      const ehUsuarioLogado = String(aluno.id) === String(alunoLogadoId);

      return {
        ...aluno,
        nome: ehUsuarioLogado ? `${aluno.nome} (você)` : aluno.nome
      };
    });

    res.json(rankingFormatado);
  } catch (e) {
    console.error('[ranking] Erro:', e);
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
});

router.get('/meu-progresso', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    const stats = await db.query(
        'SELECT pontos_totais, questoes_respondidas, questoes_corretas FROM usuarios WHERE id = $1',
        [req.usuario.id]
    );

    const rank = await db.query(`
      SELECT COUNT(*) + 1 as posicao FROM usuarios 
      WHERE perfil = 'aluno' AND pontos_totais > (SELECT pontos_totais FROM usuarios WHERE id = $1)
    `, [req.usuario.id]);

    res.json({
      ...stats.rows[0],
      posicao: parseInt(rank.rows[0].posicao)
    });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.status(200).json({ ok: true });
});

module.exports = router;