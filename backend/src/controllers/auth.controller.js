const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const LOGIN_ERROR_MSG = 'Email ou senha inválidos';

// ─── REGISTER ────────────────────────────────────────────────────────────────
async function register(req, res) {
  // 1. Validar campos
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nome, email, senha, perfil, ra, codigoTurma } = req.body;

  try {
    // 2. Verificar se email já existe — mensagem genérica (evita user enumeration)
    const emailExistente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
    if (emailExistente) {
      return res.status(409).json({ message: 'Não foi possível criar a conta. Verifique os dados.' });
    }

    // 3. Se aluno, validar código de turma e RA
    let turmaId = null;
    if (perfil === 'aluno') {
      const turma = db.prepare('SELECT id FROM turmas WHERE codigo_acesso = ?').get(codigoTurma);
      if (!turma) {
        return res.status(400).json({ message: 'Código de turma inválido ou inexistente.' });
      }
      turmaId = turma.id;

      // RA único — mensagem genérica também
      const raExistente = db.prepare('SELECT id FROM usuarios WHERE ra = ?').get(ra);
      if (raExistente) {
        return res.status(409).json({ message: 'Não foi possível criar a conta. Verifique os dados.' });
      }
    }

    // 4. Hash da senha
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    // 5. Inserir usuário
    const stmt = db.prepare(`
      INSERT INTO usuarios (nome, email, senha, ra, perfil)
      VALUES (?, ?, ?, ?, ?)
    `);
    const resultado = stmt.run(nome, email, senhaHash, ra || null, perfil);
    const userId = resultado.lastInsertRowid;

    // 6. Se aluno, vincular à turma
    if (perfil === 'aluno' && turmaId) {
      db.prepare(`
        INSERT INTO turma_alunos (turma_id, aluno_id)
        VALUES (?, ?)
      `).run(turmaId, userId);
    }

    // 7. Gerar JWT — não incluir dados sensíveis no payload
    const token = gerarToken({ id: userId, perfil });

    return res.status(201).json({
      message: 'Conta criada com sucesso!',
      token,
      usuario: { id: userId, nome, email, perfil },
    });

  } catch (error) {
    console.error('[register] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
async function login(req, res) {
  // 1. Validar campos
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, senha } = req.body;

  try {
    // 2. Buscar usuário
    const usuario = db.prepare(`
      SELECT id, nome, email, senha, perfil
      FROM usuarios WHERE email = ?
    `).get(email);

    // 3. SEMPRE rodar bcrypt, mesmo se usuário não existir
    //    Evita timing attack — atacante descobre se email existe
    //    medindo o tempo de resposta da requisição
    const hashFake = '$2b$12$invalido.hash.para.evitar.timing.xxxxxxxxxxxxxxxx';
    const hashParaComparar = usuario ? usuario.senha : hashFake;
    const senhaCorreta = await bcrypt.compare(senha, hashParaComparar);

    if (!usuario || !senhaCorreta) {
      return res.status(401).json({ message: LOGIN_ERROR_MSG });
    }

    // 4. Gerar JWT
    const token = gerarToken({ id: usuario.id, perfil: usuario.perfil });

    return res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    });

  } catch (error) {
    console.error('[login] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function gerarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'mat-ia',
    audience: 'mat-ia-app',
  });
}

module.exports = { register, login };