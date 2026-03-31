const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function getPerfil(req, res) {
  try {
    const result = await db.query(`
      SELECT u.id, u.nome, u.email, u.siape, u.criado_em,
             t.id as turma_id, t.nome as turma_nome, t.codigo_acesso
      FROM usuarios u
      LEFT JOIN turmas t ON t.professor_id = u.id
      WHERE u.id = $1 AND u.perfil = 'professor'
    `, [req.usuario.id]);

    const professor = result.rows[0];
    if (!professor) return res.status(404).json({ message: 'Professor não encontrado.' });

    const siapeMascarado = professor.siape ? '****' + professor.siape.slice(-3) : null;

    return res.json({
      professor: {
        id: professor.id,
        nome: professor.nome,
        email: professor.email,
        siape: siapeMascarado,
        criado_em: professor.criado_em,
        turma: professor.turma_id
          ? { id: professor.turma_id, nome: professor.turma_nome, codigo_acesso: professor.codigo_acesso }
          : null,
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}

async function alterarSenha(req, res) {
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha)
    return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });

  const senhaForte = /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(novaSenha);
  if (!senhaForte)
    return res.status(400).json({ message: 'A nova senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um número.' });

  try {
    const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
    const professor = result.rows[0];

    if (!professor) return res.status(404).json({ message: 'Professor não encontrado.' });

    const senhaCorreta = await bcrypt.compare(senhaAtual, professor.senha);
    if (!senhaCorreta) return res.status(401).json({ message: 'Senha atual incorreta.' });

    const novaSenhaHash = await bcrypt.hash(novaSenha, 12);
    await db.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [novaSenhaHash, req.usuario.id]);

    return res.json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}

async function desassociarTurma(req, res) {
  const { senha, turmaId } = req.body;

  if (!senha)
    return res.status(400).json({ message: 'Senha obrigatória para confirmar a desassociação.' });

  try {
    const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
    const professor = result.rows[0];

    if (!professor) return res.status(404).json({ message: 'Professor não encontrado.' });

    const senhaCorreta = await bcrypt.compare(senha, professor.senha);
    if (!senhaCorreta) return res.status(401).json({ message: 'Senha incorreta.' });

    const turmaResult = await db.query('SELECT id FROM turmas WHERE professor_id = $1', [req.usuario.id]);
    if (turmaResult.rows.length === 0)
      return res.status(400).json({ message: 'Nenhuma turma associada.' });

    if (turmaId) {
      await db.query('UPDATE turmas SET professor_id = NULL WHERE id = $1 AND professor_id = $2', [turmaId, req.usuario.id])
    } else {
      await db.query('UPDATE turmas SET professor_id = NULL WHERE professor_id = $1', [req.usuario.id])
    }

    return res.json({ message: 'Turma desassociada com sucesso.' });
  } catch (error) {
    console.error('Erro ao desassociar turma:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}

module.exports = { getPerfil, alterarSenha, desassociarTurma };