const express = require('express');
const { body } = require('express-validator');
const { register, loginAluno, loginProfessor } = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
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

router.get('/setup', async (req, res) => {
  if (req.query.senha !== 'matia2026') return res.status(403).json({ ok: false })
  await db.query("INSERT INTO turmas (nome, codigo_acesso) VALUES ($1, $2) ON CONFLICT (codigo_acesso) DO NOTHING", ['Fundamentos', 'FUND2026'])
  return res.json({ ok: true, message: 'Turma Fundamentos criada!' })
})

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

router.delete('/notificacoes/:id', verifyToken, async (req, res) => {
  await db.query('DELETE FROM notificacoes WHERE id = $1 AND professor_id = $2', [req.params.id, req.usuario.id])
  return res.json({ ok: true })
})

router.delete('/notificacoes', verifyToken, async (req, res) => {
  await db.query('DELETE FROM notificacoes WHERE professor_id = $1', [req.usuario.id])
  return res.json({ ok: true })
})

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

// ─── MÉTRICAS — DIAGNÓSTICO POR TURMA ────────────────────────────────────────
router.get('/turmas/:id/diagnosticos', verifyToken, async (req, res) => {
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
        d.resultado_json, d.feito_em
      FROM usuarios u
      INNER JOIN turma_alunos ta ON ta.aluno_id = u.id
      LEFT JOIN diagnosticos d ON d.aluno_id = u.id
      WHERE ta.turma_id = $1
      ORDER BY u.nome ASC
    `, [req.params.id])

    return res.json({
      turma: turma.rows[0],
      alunos: result.rows.map(r => ({
        id: r.id,
        nome: r.nome,
        ra: r.ra,
        status: r.diagnostico_status,
        feito_em: r.feito_em,
        resultado: r.resultado_json ? JSON.parse(r.resultado_json) : null
      }))
    })
  } catch (e) {
    console.error('Erro ao buscar diagnósticos da turma', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

router.delete('/diagnosticos/:alunoId', verifyToken, async (req, res) => {
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
router.post('/ia/analisar-turma', verifyToken, async (req, res) => {
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
- Média geral: ${mediaGeral}/17
- Desempenho por bloco: ${mediasBlocos.map(b => `${b.bloco}: ${b.media}%`).join(' | ')}

INSTRUÇÕES:
- Escreva em português, tom profissional mas acessível
- Máximo 4 frases
- Destaque o ponto mais forte e o mais fraco da turma
- Termine com UMA recomendação pedagógica concreta para o professor
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

    return res.json({ analise })
  } catch (e) {
    console.error('[ia/analisar-turma] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── IA — ANÁLISE INDIVIDUAL ─────────────────────────────────────────────────
router.post('/ia/analisar-aluno', verifyToken, async (req, res) => {
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
    const { nivel, pontuacao, blocos, usou_dicas, pulou } = JSON.parse(resultado_json)

    const blocoTexto = Object.entries(blocos).map(([b, d]) => `${b}: ${d.acertos}/${d.total}`).join(' | ')

    const contexto = `
Você é um assistente pedagógico especializado em matemática para cursos de Engenharia.
Analise o desempenho individual do aluno e forneça um feedback objetivo e útil para o professor.

DADOS DO ALUNO: ${nome}
- Nível: ${nivel}
- Pontuação: ${pontuacao}/17
- Desempenho por bloco: ${blocoTexto}
- Dicas utilizadas: ${(usou_dicas || []).length}
- Questões puladas: ${(pulou || []).length}

INSTRUÇÕES:
- Escreva em português, tom profissional mas acessível
- Máximo 3 frases
- Destaque o ponto forte e o ponto fraco do aluno
- Termine com UMA sugestão de reforço específica
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

    return res.json({ analise })
  } catch (e) {
    console.error('[ia/analisar-aluno] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

module.exports = router;