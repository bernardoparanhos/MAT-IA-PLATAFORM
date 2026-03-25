const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function getPerfil(req, res) {
  try {
    const result = await db.query(`
      SELECT u.id, u.nome, u.email, u.ra, u.criado_em,
             t.id as turma_id, t.nome as turma_nome
      FROM usuarios u
      LEFT JOIN turma_alunos ta ON ta.aluno_id = u.id
      LEFT JOIN turmas t ON t.id = ta.turma_id
      WHERE u.id = $1 AND u.perfil = 'aluno'
    `, [req.usuario.id]);

    const aluno = result.rows[0];
    if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });

    return res.json({
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        email: aluno.email,
        ra: aluno.ra,
        criado_em: aluno.criado_em,
        turma: aluno.turma_id ? { id: aluno.turma_id, nome: aluno.turma_nome } : null,
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil do aluno:', error);
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
    const aluno = result.rows[0];

    if (!aluno) return res.status(404).json({ message: 'Aluno não encontrado.' });

    const senhaCorreta = await bcrypt.compare(senhaAtual, aluno.senha);
    if (!senhaCorreta) return res.status(401).json({ message: 'Senha atual incorreta.' });

    const novaSenhaHash = await bcrypt.hash(novaSenha, 12);
    await db.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [novaSenhaHash, req.usuario.id]);

    return res.json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar senha do aluno:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}

module.exports = { getPerfil, alterarSenha };