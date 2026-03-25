const express = require('express');
const { body } = require('express-validator');
const { register, loginAluno, loginProfessor } = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const db = require('../config/database');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const rateLimit = require('express-rate-limit');

// ─── RATE LIMIT — RECUPERAÇÃO DE SENHA ───────────────────────────────────────
const limiterEsqueciSenha = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: { message: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.get('/setup', (req, res) => {
  if (req.query.senha !== 'matia2026') return res.status(403).json({ ok: false })
  db.prepare("INSERT OR IGNORE INTO turmas (nome, codigo_acesso) VALUES (?, ?)").run('Fundamentos', 'FUND2026')
  return res.json({ ok: true, message: 'Turma Fundamentos criada!' })
})

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// ─── REGISTER ALUNO ───────────────────────────────────────────────────────────
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

// ─── REGISTER PROFESSOR ───────────────────────────────────────────────────────
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

// ─── LOGIN ALUNO ──────────────────────────────────────────────────────────────
const loginAlunoValidation = [
  body('ra').trim().notEmpty().withMessage('RA é obrigatório'),
  body('senha').notEmpty().withMessage('Senha é obrigatória').isLength({ max: 128 }),
];

// ─── LOGIN PROFESSOR ──────────────────────────────────────────────────────────
const loginProfessorValidation = [
  body('siape').trim().notEmpty().withMessage('SIAPE é obrigatório')
    .matches(/^\d{6,7}$/).withMessage('SIAPE inválido'),
  body('senha').notEmpty().withMessage('Senha é obrigatória').isLength({ max: 128 }),
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

router.get('/turmas/publicas', (req, res) => {
  const turmas = db.prepare(`
    SELECT id, nome FROM turmas WHERE professor_id IS NOT NULL
  `).all();
  return res.json({ turmas });
});

// ─── TURMAS — DETALHE E ALUNOS ────────────────────────────────────────────────
router.get('/turmas/:id', verifyToken, (req, res) => {
  const turma = db.prepare(`
    SELECT t.id, t.nome, t.codigo_acesso, t.criado_em,
      COUNT(ta.aluno_id) as total_alunos
    FROM turmas t
    LEFT JOIN turma_alunos ta ON ta.turma_id = t.id
    WHERE t.id = ? AND t.professor_id = ?
    GROUP BY t.id
  `).get(req.params.id, req.usuario.id)

  if (!turma) return res.status(404).json({ message: 'Turma não encontrada.' })
  return res.json({ turma })
})

router.get('/turmas/:id/alunos', verifyToken, (req, res) => {
  const turma = db.prepare(
    'SELECT id FROM turmas WHERE id = ? AND professor_id = ?'
  ).get(req.params.id, req.usuario.id)

  if (!turma) return res.status(404).json({ message: 'Turma não encontrada.' })

  const alunos = db.prepare(`
    SELECT u.id, u.nome, u.email, u.ra, u.criado_em as entrou_em
    FROM usuarios u
    INNER JOIN turma_alunos ta ON ta.aluno_id = u.id
    WHERE ta.turma_id = ?
    ORDER BY u.nome ASC
  `).all(req.params.id)

  return res.json({ alunos })
})

// ─── MINHA TURMA — ALUNO ──────────────────────────────────────────────────────
router.get('/aluno/minha-turma', verifyToken, (req, res) => {
  const turma = db.prepare(`
    SELECT t.id, t.nome, t.codigo_acesso, t.criado_em
    FROM turmas t
    INNER JOIN turma_alunos ta ON ta.turma_id = t.id
    WHERE ta.aluno_id = ?
  `).get(req.usuario.id)

  if (!turma) return res.json({ turma: null, professor: null, colegas: [] })

  const professor = db.prepare(`
    SELECT nome, email FROM usuarios WHERE id = (
      SELECT professor_id FROM turmas WHERE id = ?
    )
  `).get(turma.id)

  const colegas = db.prepare(`
    SELECT u.id, u.nome, u.email, u.ra, u.criado_em as entrou_em
    FROM usuarios u
    INNER JOIN turma_alunos ta ON ta.aluno_id = u.id
    WHERE ta.turma_id = ? AND u.id != ?
    ORDER BY u.nome ASC
  `).all(turma.id, req.usuario.id)

  return res.json({ turma, professor, colegas })
})

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────
router.get('/notificacoes', verifyToken, (req, res) => {
  const notificacoes = db.prepare(`
    SELECT * FROM notificacoes
    WHERE professor_id = ?
    ORDER BY criado_em DESC
    LIMIT 50
  `).all(req.usuario.id);
  return res.json({ notificacoes });
});

router.post('/notificacoes/lida/:id', verifyToken, (req, res) => {
  db.prepare(`
    UPDATE notificacoes SET lida = 1
    WHERE id = ? AND professor_id = ?
  `).run(req.params.id, req.usuario.id);
  return res.json({ ok: true });
});

router.post('/notificacoes/lida-todas', verifyToken, (req, res) => {
  db.prepare(`
    UPDATE notificacoes SET lida = 1 WHERE professor_id = ?
  `).run(req.usuario.id);
  return res.json({ ok: true });
});

// ─── REGISTER / LOGIN ─────────────────────────────────────────────────────────
router.post('/register/aluno', registerAlunoValidation, (req, res) => register(req, res, 'aluno'));
router.post('/register/professor', registerProfessorValidation, (req, res) => register(req, res, 'professor'));
router.post('/login/aluno', loginAlunoValidation, loginAluno);
router.post('/login/professor', loginProfessorValidation, loginProfessor);

// ─── ALUNO PERFIL ─────────────────────────────────────────────────────────────
router.get('/aluno/perfil', verifyToken, (req, res) => {
  const turma = db.prepare(`
    SELECT t.id, t.nome, t.codigo_acesso
    FROM turmas t
    INNER JOIN turma_alunos ta ON ta.turma_id = t.id
    WHERE ta.aluno_id = ?
  `).get(req.usuario.id)

  const colegas = turma ? db.prepare(`
    SELECT u.nome
    FROM usuarios u
    INNER JOIN turma_alunos ta ON ta.aluno_id = u.id
    WHERE ta.turma_id = ? AND u.id != ?
    ORDER BY u.nome ASC
  `).all(turma.id, req.usuario.id) : []

  return res.json({ turma: turma || null, colegas })
})

// ─── ALUNO PERFIL COMPLETO ────────────────────────────────────────────────────
const alunoController = require('../controllers/aluno.controller');
router.get('/aluno/perfil-completo', verifyToken, alunoController.getPerfil);
router.post('/aluno/alterar-senha', verifyToken, alunoController.alterarSenha);

// ─── ESQUECI SENHA — ALUNO ────────────────────────────────────────────────────
router.post('/aluno/esqueci-senha', limiterEsqueciSenha, async (req, res) => {
  const { email } = req.body;
  const MENSAGEM_GENERICA = 'Se esse email estiver cadastrado, você receberá as instruções em breve.';
  if (!email) return res.status(400).json({ message: 'Email é obrigatório.' });

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'desconhecido'

  try {
    const usuario = db.prepare(
      "SELECT id FROM usuarios WHERE email = ? AND perfil = 'aluno'"
    ).get(email);

    db.prepare(`INSERT INTO log_recuperacao (ip, email, sucesso) VALUES (?, ?, ?)`).run(ip, email, usuario ? 1 : 0)

    if (usuario) {
      db.prepare("UPDATE tokens_recuperacao SET usado = 1 WHERE usuario_id = ?").run(usuario.id);

      const token = crypto.randomBytes(32).toString('hex');
      const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      db.prepare(`
        INSERT INTO tokens_recuperacao (usuario_id, token, expira_em)
        VALUES (?, ?, ?)
      `).run(usuario.id, token, expiraEm);

      const link = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}&perfil=aluno`;

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'MAT-IA — Redefinição de senha',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 12px;">
            <h1 style="color: #f97316; margin-bottom: 4px;">MAT-IA</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 32px;">Suporte Inteligente ao Aprendizado de Matemática</p>
            <h2 style="font-size: 20px; margin-bottom: 12px;">Redefinição de senha</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px;">
              Recebemos uma solicitação para redefinir a senha da sua conta.
              Clique no botão abaixo para continuar.
              O link expira em <strong style="color: #fff;">1 hora</strong>.
            </p>
            <a href="${link}" style="display: inline-block; background: #f97316; color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Redefinir minha senha
            </a>
            <p style="color: #475569; font-size: 12px; margin-top: 32px;">
              Se você não solicitou isso, ignore este email. Sua senha permanece a mesma.
            </p>
          </div>
        `
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

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'desconhecido'

  try {
    const usuario = db.prepare(
      "SELECT id FROM usuarios WHERE email = ? AND perfil = 'professor'"
    ).get(email);

    db.prepare(`INSERT INTO log_recuperacao (ip, email, sucesso) VALUES (?, ?, ?)`).run(ip, email, usuario ? 1 : 0)

    if (usuario) {
      db.prepare("UPDATE tokens_recuperacao SET usado = 1 WHERE usuario_id = ?").run(usuario.id);

      const token = crypto.randomBytes(32).toString('hex');
      const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      db.prepare(`
        INSERT INTO tokens_recuperacao (usuario_id, token, expira_em)
        VALUES (?, ?, ?)
      `).run(usuario.id, token, expiraEm);

      const link = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}&perfil=professor`;

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'MAT-IA — Redefinição de senha',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 12px;">
            <h1 style="color: #f97316; margin-bottom: 4px;">MAT-IA</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 32px;">Suporte Inteligente ao Aprendizado de Matemática</p>
            <h2 style="font-size: 20px; margin-bottom: 12px;">Redefinição de senha</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px;">
              Recebemos uma solicitação para redefinir a senha da sua conta.
              Clique no botão abaixo para continuar.
              O link expira em <strong style="color: #fff;">1 hora</strong>.
            </p>
            <a href="${link}" style="display: inline-block; background: #f97316; color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Redefinir minha senha
            </a>
            <p style="color: #475569; font-size: 12px; margin-top: 32px;">
              Se você não solicitou isso, ignore este email. Sua senha permanece a mesma.
            </p>
          </div>
        `
      });
    }

    return res.json({ message: MENSAGEM_GENERICA });
  } catch (error) {
    console.error('[professor/esqueci-senha] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
});

// ─── VALIDAR TOKEN ────────────────────────────────────────────────────────────
router.get('/validar-token/:token', (req, res) => {
  const { token } = req.params;
  try {
    const registro = db.prepare(`
      SELECT * FROM tokens_recuperacao WHERE token = ? AND usado = 0
    `).get(token);
    if (!registro) return res.json({ valido: false });
    const expirou = new Date(registro.expira_em) < new Date();
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
    const registro = db.prepare(`
      SELECT * FROM tokens_recuperacao WHERE token = ? AND usado = 0
    `).get(token);

    if (!registro)
      return res.status(400).json({ message: 'Token inválido ou já utilizado.' });

    const expirou = new Date(registro.expira_em) < new Date();
    if (expirou)
      return res.status(400).json({ message: 'Token expirado. Solicite um novo link.' });

    const novaSenhaHash = await bcrypt.hash(novaSenha, 12);
    db.prepare('UPDATE usuarios SET senha = ? WHERE id = ?').run(novaSenhaHash, registro.usuario_id);
    db.prepare('UPDATE tokens_recuperacao SET usado = 1 WHERE id = ?').run(registro.id);

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
    if (respostas[q.id] === q.correta) { bloco.acertos++; pontuacao++ }
  })

  Object.keys(blocos).forEach(b => {
    const { acertos, total } = blocos[b]
    const pct = acertos / total
    blocos[b].nivel = pct === 0 ? 'fraco' : pct < 1 ? 'medio' : 'forte'
  })

  const nivel = pontuacao <= 5 ? 'basico' : pontuacao <= 11 ? 'intermediario' : 'avancado'
  return { nivel, pontuacao, blocos }
}

router.get('/diagnostico/status', verifyToken, (req, res) => {
  const usuario = db.prepare('SELECT diagnostico_status FROM usuarios WHERE id = ?').get(req.usuario.id)
  return res.json({ status: usuario?.diagnostico_status || 'pendente' })
})

router.post('/diagnostico/pular', verifyToken, (req, res) => {
  db.prepare("UPDATE usuarios SET diagnostico_status = 'pulado' WHERE id = ?").run(req.usuario.id)
  return res.json({ ok: true })
})

const { registrarDiagnostico } = require('../services/sheets.service')

router.post('/diagnostico/responder', verifyToken, async (req, res) => {
  const { respostas, usou_dicas, pulou, iniciado_em } = req.body
  // respostas: { "1": "A", "2": "B", ... }

  if (!respostas || typeof respostas !== 'object')
    return res.status(400).json({ message: 'Respostas inválidas.' })

  const { nivel, pontuacao, blocos } = calcularResultado(respostas)

  const resultado_json = JSON.stringify({
    nivel, pontuacao, blocos,
    usou_dicas: usou_dicas || [],
    pulou: pulou || [],
    respostas
  })

  // upsert — se já tem diagnóstico, atualiza
  const existente = db.prepare('SELECT id FROM diagnosticos WHERE aluno_id = ?').get(req.usuario.id)
  if (existente) {
    db.prepare('UPDATE diagnosticos SET resultado_json = ?, feito_em = CURRENT_TIMESTAMP WHERE aluno_id = ?')
      .run(resultado_json, req.usuario.id)
  } else {
    db.prepare('INSERT INTO diagnosticos (aluno_id, resultado_json) VALUES (?, ?)').run(req.usuario.id, resultado_json)
  }

  db.prepare("UPDATE usuarios SET diagnostico_status = 'concluido' WHERE id = ?").run(req.usuario.id)

  // Envia para o Google Sheets
  const usuario = db.prepare('SELECT u.nome, u.ra, t.nome as turma FROM usuarios u LEFT JOIN turma_alunos ta ON ta.aluno_id = u.id LEFT JOIN turmas t ON t.id = ta.turma_id WHERE u.id = ?').get(req.usuario.id)
  await registrarDiagnostico({
    nome: usuario?.nome || '-',
    ra: usuario?.ra || '-',
    turma: usuario?.turma || '-',
    nivel,
    pontuacao,
    blocos,
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

router.get('/diagnostico/resultado', verifyToken, (req, res) => {
  const diagnostico = db.prepare('SELECT resultado_json, feito_em FROM diagnosticos WHERE aluno_id = ?').get(req.usuario.id)
  if (!diagnostico) return res.status(404).json({ message: 'Diagnóstico não encontrado.' })
  return res.json({ resultado: JSON.parse(diagnostico.resultado_json), feito_em: diagnostico.feito_em })
})

router.get('/diagnostico/questoes', verifyToken, (req, res) => {
  const questoesEmbaralhadas = questoes.map(({ correta, ...q }) => {
    const letras = ['A', 'B', 'C', 'D']
    // embaralha as letras
    for (let i = letras.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letras[i], letras[j]] = [letras[j], letras[i]]
    }
    // remonta alternativas na nova ordem
    const alternativasOriginais = q.alternativas
    const novasAlternativas = {}
    letras.forEach((letraNova, idx) => {
      const letraOriginal = ['A', 'B', 'C', 'D'][idx]
      novasAlternativas[letraNova] = alternativasOriginais[letraOriginal]
    })
    // descobre qual nova letra corresponde à correta original
    const idxCorreta = ['A', 'B', 'C', 'D'].indexOf(correta)
    const novaCorreta = letras[idxCorreta]

    return { ...q, alternativas: novasAlternativas, correta: novaCorreta }
  })

  // remove o campo correta antes de enviar
  const semGabarito = questoesEmbaralhadas.map(({ correta, ...q }) => q)
  return res.json({ questoes: semGabarito })
})

module.exports = router;