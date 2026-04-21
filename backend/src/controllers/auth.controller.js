const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const ERRO_GENERICO = 'Dados inválidos. Verifique e tente novamente.';

function gerarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'mat-ia',
    audience: 'mat-ia-app',
  });
}

async function register(req, res, perfil) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { nome, email, senha, ra, turmaId, siape } = req.body;

  try {
    const emailExistente = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (emailExistente.rows.length > 0) return res.status(409).json({ message: ERRO_GENERICO });

    if (perfil === 'aluno') {
      const rasAutorizados = (process.env.RAS_AUTORIZADOS || '').split(',').map(r => r.trim());
      if (!rasAutorizados.includes(ra)) return res.status(403).json({ message: ERRO_GENERICO });

      const turma = await db.query('SELECT id, nome, professor_id FROM turmas WHERE id = $1', [turmaId]);
      if (turma.rows.length === 0) return res.status(400).json({ message: 'Turma inválida.' });
      const turmaData = turma.rows[0];

      const raExistente = await db.query('SELECT id FROM usuarios WHERE ra = $1', [ra]);
      if (raExistente.rows.length > 0) return res.status(409).json({ message: ERRO_GENERICO });

      const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
      const resultado = await db.query(
        `INSERT INTO usuarios (nome, email, senha, ra, perfil) VALUES ($1, $2, $3, $4, 'aluno') RETURNING id`,
        [nome, email, senhaHash, ra]
      );
      const userId = resultado.rows[0].id;

      await db.query('INSERT INTO turma_alunos (turma_id, aluno_id) VALUES ($1, $2)', [turmaData.id, userId]);

      if (turmaData.professor_id) {
        await db.query(
          `INSERT INTO notificacoes (professor_id, tipo, mensagem) VALUES ($1, 'novo_aluno', $2)`,
          [turmaData.professor_id, `O aluno ${nome} se cadastrou na turma ${turmaData.nome}.`]
        );
      }

      const token = gerarToken({ id: userId, perfil: 'aluno' });
      return res.status(201).json({ message: 'Conta criada com sucesso!', token, usuario: { id: userId, nome, email, perfil: 'aluno' } });
    }

    if (perfil === 'professor') {
      const siapesAutorizados = (process.env.SIAPES_AUTORIZADOS || '').split(',').map(s => s.trim());
      if (!siapesAutorizados.includes(siape)) return res.status(403).json({ message: ERRO_GENERICO });

      const siapeExistente = await db.query('SELECT id FROM usuarios WHERE siape = $1', [siape]);
      if (siapeExistente.rows.length > 0) return res.status(409).json({ message: ERRO_GENERICO });

      const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
      const resultado = await db.query(
        `INSERT INTO usuarios (nome, email, senha, siape, perfil) VALUES ($1, $2, $3, $4, 'professor') RETURNING id`,
        [nome, email, senhaHash, siape]
      );
      const userId = resultado.rows[0].id;

      const token = gerarToken({ id: userId, perfil: 'professor' });
      return res.status(201).json({ message: 'Conta criada com sucesso!', token, usuario: { id: userId, nome, email, perfil: 'professor' } });
    }

  } catch (error) {
    console.error('[register] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
}

async function loginAluno(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { ra, senha } = req.body;

  try {
    const result = await db.query(
      `SELECT id, nome, email, senha, perfil, diagnostico_status FROM usuarios WHERE ra = $1 AND perfil = 'aluno'`,
      [ra]
    );
    const usuario = result.rows[0];

    const hashFake = '$2b$12$invalido.hash.para.evitar.timing.xxxxxxxxxxxxxxxx';
    const hashParaComparar = usuario ? usuario.senha : hashFake;
    const senhaCorreta = await bcrypt.compare(senha, hashParaComparar);

    if (!usuario || !senhaCorreta) return res.status(401).json({ message: 'RA ou senha inválidos.' });

    // Verifica se é o primeiro login (se já tem notificação de boas-vindas)
    const jaTemNotificacao = await db.query(
      `SELECT id FROM notificacoes_aluno WHERE aluno_id = $1`,
      [usuario.id]
    );

    // Se não tem nenhuma notificação ainda, cria a de boas-vindas
    if (jaTemNotificacao.rows.length === 0) {
      const primeiroNome = usuario.nome.split(' ')[0];
      await db.query(
        `INSERT INTO notificacoes_aluno (aluno_id, tipo, mensagem) VALUES ($1, 'boas-vindas', $2)`,
        [
          usuario.id,
          `Bem-vindo(a) ao MAT-IA, ${primeiroNome}! 🎉 Explore a plataforma e acompanhe seu progresso em matemática.`
        ]
      );
    }

    const token = gerarToken({ id: usuario.id, perfil: 'aluno' });
    return res.status(200).json({ 
      token, 
      usuario: { 
        id: usuario.id, 
        nome: usuario.nome, 
        email: usuario.email, 
        perfil: 'aluno' 
      },
      diagnostico_status: usuario.diagnostico_status // ← ADICIONA O STATUS NO RETORNO
    });

  } catch (error) {
    console.error('[loginAluno] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
}

async function loginProfessor(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { siape, senha } = req.body;

  try {
    const result = await db.query(
      `SELECT id, nome, email, senha, perfil FROM usuarios WHERE siape = $1 AND perfil = 'professor'`,
      [siape]
    );
    const usuario = result.rows[0];

    const hashFake = '$2b$12$invalido.hash.para.evitar.timing.xxxxxxxxxxxxxxxx';
    const hashParaComparar = usuario ? usuario.senha : hashFake;
    const senhaCorreta = await bcrypt.compare(senha, hashParaComparar);

    if (!usuario || !senhaCorreta) return res.status(401).json({ message: 'SIAPE ou senha inválidos.' });

    const token = gerarToken({ id: usuario.id, perfil: 'professor' });
    return res.status(200).json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: 'professor' } });

  } catch (error) {
    console.error('[loginProfessor] Erro:', error);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
}

module.exports = { register, loginAluno, loginProfessor };