const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const ERRO_GENERICO = 'Dados inválidos. Verifique e tente novamente.';

// ─── Helper JWT ───────────────────────────────────────────────────────────────
function gerarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'mat-ia',
    audience: 'mat-ia-app',
  });
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
async function register(req, res, perfil) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nome, email, senha, ra, codigoTurma, siape } = req.body;

  try {
    // Email único
    const emailExistente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
    if (emailExistente) {
      return res.status(409).json({ message: ERRO_GENERICO });
    }

    if (perfil === 'aluno') {
      // Validar código de turma
      const turma = db.prepare('SELECT id FROM turmas WHERE codigo_acesso = ?').get(codigoTurma);
      if (!turma) {
        return res.status(400).json({ message: 'Código de turma inválido ou inexistente.' });
      }

      // RA único
      const raExistente = db.prepare('SELECT id FROM usuarios WHERE ra = ?').get(ra);
      if (raExistente) {
        return res.status(409).json({ message: ERRO_GENERICO });
      }

      const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
      const resultado = db.prepare(`
        INSERT INTO usuarios (nome, email, senha, ra, perfil)
        VALUES (?, ?, ?, ?, 'aluno')
      `).run(nome, email, senhaHash, ra);

      const userId = resultado.lastInsertRowid;
      db.prepare('INSERT INTO turma_alunos (turma_id, aluno_id) VALUES (?, ?)').run(turma.id, userId);

      const token = gerarToken({ id: userId, perfil: 'aluno' });
      return res.status(201).json({
        message: 'Conta criada com sucesso!',
        token,
        usuario: { id: userId, nome, email, perfil: 'aluno' },
      });
    }

    if (perfil === 'professor') {
      // Validar SIAPE autorizado
      const siapesAutorizados = (process.env.SIAPES_AUTORIZADOS || '').split(',').map(s => s.trim());
      if (!siapesAutorizados.includes(siape)) {
        // Mensagem genérica — não revela que o SIAPE não está na lista
        return res.status(403).json({ message: ERRO_GENERICO });
      }

      // SIAPE único
      const siapeExistente = db.prepare('SELECT id FROM usuarios WHERE ra = ?').get(siape);
      if (siapeExistente) {
        return res.status(409).json({ message: ERRO_GENERICO });
      }

      const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
      // Usamos o campo 'ra' para armazenar o SIAPE — ambos são identificadores únicos
      const resultado = db.prepare(`
        INSERT INTO usuarios (nome, email, senha, ra, perfil)
        VALUES (?, ?, ?, ?, 'professor')
      `).run(nome, email, senhaHash, siape);

      const userId = resultado.lastInsertRowid;
      const token = gerarToken({ id: userId, perfil: 'professor' });
      return res.status(201).json({
        message: 'Conta criada com sucesso!',
        token,
        usuario: { id: userId, nome, email, perfil: 'professor' },
      });
    }

  } catch (error) {
    console.error('[register] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
}

// ─── LOGIN ALUNO ──────────────────────────────────────────────────────────────
async function loginAluno(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { ra, codigoTurma } = req.body;

  try {
    // Busca aluno pelo RA
    const usuario = db.prepare(`
      SELECT u.id, u.nome, u.email, u.perfil
      FROM usuarios u
      INNER JOIN turma_alunos ta ON ta.aluno_id = u.id
      INNER JOIN turmas t ON t.id = ta.turma_id
      WHERE u.ra = ? AND t.codigo_acesso = ? AND u.perfil = 'aluno'
    `).get(ra, codigoTurma);

    if (!usuario) {
      return res.status(401).json({ message: 'RA ou código de turma inválidos.' });
    }

    const token = gerarToken({ id: usuario.id, perfil: 'aluno' });
    return res.status(200).json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: 'aluno' },
    });

  } catch (error) {
    console.error('[loginAluno] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
}

// ─── LOGIN PROFESSOR ──────────────────────────────────────────────────────────
async function loginProfessor(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { siape, senha } = req.body;

  try {
    const usuario = db.prepare(`
      SELECT id, nome, email, senha, perfil
      FROM usuarios WHERE ra = ? AND perfil = 'professor'
    `).get(siape);

    // Timing attack mitigation
    const hashFake = '$2b$12$invalido.hash.para.evitar.timing.xxxxxxxxxxxxxxxx';
    const hashParaComparar = usuario ? usuario.senha : hashFake;
    const senhaCorreta = await bcrypt.compare(senha, hashParaComparar);

    if (!usuario || !senhaCorreta) {
      return res.status(401).json({ message: 'SIAPE ou senha inválidos.' });
    }

    const token = gerarToken({ id: usuario.id, perfil: 'professor' });
    return res.status(200).json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: 'professor' },
    });

  } catch (error) {
    console.error('[loginProfessor] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
}

module.exports = { register, loginAluno, loginProfessor };