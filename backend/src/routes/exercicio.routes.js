const express = require('express')
const multer = require('multer')
const crypto = require('crypto')
const { verifyToken, requirePerfil } = require('../middlewares/auth.middleware')
const db = require('../config/database')
const { uploadImagem, gerarUrlAssinada, deletarImagem } = require('../services/storage.service')
const { corrigirResolucaoFoto } = require('../services/openai.service')
const { registrarCorrecaoExercicio } = require('../services/sheets.service')
const rateLimit = require('express-rate-limit')

// ─── RATE LIMITS ──────────────────────────────────────────────────────────────
const limiterUpload = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Limite de uploads atingido. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const limiterRecorrigir = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { message: 'Limite de recorreções atingido. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ─── MULTER ───────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('TIPO_INVALIDO'))
    }
  }
})

const router = express.Router()

// ─── PROFESSOR: CRIA LISTA ────────────────────────────────────────────────────
router.post('/listas', verifyToken, requirePerfil('professor'), async (req, res) => {
  try {
    const { turmaId, titulo, descricao, data_entrega } = req.body

    if (!turmaId || !titulo || !data_entrega)
      return res.status(400).json({ message: 'turmaId, titulo e data_entrega são obrigatórios.' })

    const turma = await db.query(
      'SELECT id FROM turmas WHERE id = $1 AND professor_id = $2',
      [turmaId, req.usuario.id]
    )
    if (turma.rows.length === 0)
      return res.status(403).json({ message: 'Sem permissão.' })

    const result = await db.query(`
      INSERT INTO listas_exercicios (professor_id, turma_id, titulo, descricao, data_entrega)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [req.usuario.id, turmaId, titulo, descricao || null, data_entrega])

    return res.status(201).json({ id: result.rows[0].id })
  } catch (e) {
    console.error('[exercicios/listas POST] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── PROFESSOR: ADICIONA QUESTÃO À LISTA ─────────────────────────────────────
router.post('/listas/:id/questoes', verifyToken, requirePerfil('professor'), async (req, res) => {
  try {
    const { questaoId, numero, peso, criterios_ia } = req.body

    if (!questaoId || !numero)
      return res.status(400).json({ message: 'questaoId e numero são obrigatórios.' })

    const lista = await db.query(`
      SELECT le.id FROM listas_exercicios le
      INNER JOIN turmas t ON t.id = le.turma_id
      WHERE le.id = $1 AND t.professor_id = $2
    `, [req.params.id, req.usuario.id])
    if (lista.rows.length === 0)
      return res.status(403).json({ message: 'Sem permissão.' })

    const count = await db.query(
      'SELECT COUNT(*) FROM lista_questoes WHERE lista_id = $1',
      [req.params.id]
    )
    if (parseInt(count.rows[0].count) >= 12)
      return res.status(400).json({ message: 'Limite de 12 questões por lista.' })

    const result = await db.query(`
      INSERT INTO lista_questoes (lista_id, questao_id, numero, peso, criterios_ia)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [req.params.id, questaoId, numero, peso || 1.0, criterios_ia || null])

    return res.status(201).json({ id: result.rows[0].id })
  } catch (e) {
    console.error('[exercicios/listas/:id/questoes POST] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── PROFESSOR: LISTA AS PRÓPRIAS LISTAS ─────────────────────────────────────
router.get('/listas/minhas', verifyToken, requirePerfil('professor'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT le.id, le.titulo, le.descricao, le.data_entrega, le.ativa, le.criado_em,
             t.nome as turma,
             COUNT(lq.id) as total_questoes
      FROM listas_exercicios le
      INNER JOIN turmas t ON t.id = le.turma_id
      LEFT JOIN lista_questoes lq ON lq.lista_id = le.id
      WHERE le.professor_id = $1
      GROUP BY le.id, t.nome
      ORDER BY le.criado_em DESC
    `, [req.usuario.id])

    return res.json({ listas: result.rows })
  } catch (e) {
    console.error('[exercicios/listas/minhas GET] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── ALUNO: VÊ LISTAS DA TURMA ───────────────────────────────────────────────
router.get('/listas/turma/:turmaId', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    const turma = await db.query(
      'SELECT id FROM turma_alunos WHERE turma_id = $1 AND aluno_id = $2',
      [req.params.turmaId, req.usuario.id]
    )
    if (turma.rows.length === 0)
      return res.status(403).json({ message: 'Sem permissão.' })

    const result = await db.query(`
      SELECT le.id, le.titulo, le.descricao, le.data_entrega, le.ativa,
             COUNT(lq.id) as total_questoes
      FROM listas_exercicios le
      LEFT JOIN lista_questoes lq ON lq.lista_id = le.id
      WHERE le.turma_id = $1 AND le.ativa = true
      GROUP BY le.id
      ORDER BY le.data_entrega ASC
    `, [req.params.turmaId])

    return res.json({ listas: result.rows })
  } catch (e) {
    console.error('[exercicios/listas/turma GET] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── ALUNO: ENVIA FOTO ────────────────────────────────────────────────────────
router.post('/submissoes', verifyToken, requirePerfil('aluno'), limiterUpload, upload.single('imagem'), async (req, res) => {
  try {
    const { listaId, listaquestaoId } = req.body

    if (!listaId || !listaquestaoId)
      return res.status(400).json({ message: 'listaId e listaquestaoId são obrigatórios.' })

    if (!req.file)
      return res.status(400).json({ message: 'Imagem é obrigatória.' })

    // Valida magic bytes
    const buffer = req.file.buffer
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
    if (!isJpeg && !isPng)
      return res.status(415).json({ message: 'Formato de imagem inválido.' })

    // Verifica se aluno pertence à turma da lista
    const lista = await db.query(`
      SELECT le.id, le.data_entrega, le.turma_id
      FROM listas_exercicios le
      INNER JOIN turma_alunos ta ON ta.turma_id = le.turma_id
      WHERE le.id = $1 AND ta.aluno_id = $2 AND le.ativa = true
    `, [listaId, req.usuario.id])
    if (lista.rows.length === 0)
      return res.status(403).json({ message: 'Sem permissão.' })

    // Verifica prazo
    if (new Date() > new Date(lista.rows[0].data_entrega))
      return res.status(400).json({ message: 'Prazo encerrado.' })

    // Verifica limite de tentativas
    const tentativas = await db.query(
      'SELECT COUNT(*) FROM submissoes_exercicio WHERE lista_id = $1 AND questao_id = $2 AND aluno_id = $3',
      [listaId, listaquestaoId, req.usuario.id]
    )
    if (parseInt(tentativas.rows[0].count) >= 3)
      return res.status(400).json({ message: 'Limite de 3 tentativas atingido.' })

    // Idempotência — hash do buffer
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    const existente = await db.query(
      `SELECT id, status FROM submissoes_exercicio 
       WHERE aluno_id = $1 AND questao_id = $2 AND imagem_cloudinary_id LIKE $3`,
      [req.usuario.id, listaquestaoId, `%${hash.slice(0, 16)}%`]
    )
    if (existente.rows.length > 0 && existente.rows[0].status !== 'erro')
      return res.json({ id: existente.rows[0].id, status: existente.rows[0].status })

    // Upload Cloudinary
    const pasta = `mat-ia/exercicios/${lista.rows[0].turma_id}/${listaId}/${req.usuario.id}`
    const { url, publicId } = await uploadImagem(buffer, req.file.mimetype, pasta)

    const numeroTentativa = parseInt(tentativas.rows[0].count) + 1

    // Salva submissão
    const submissao = await db.query(`
      INSERT INTO submissoes_exercicio
        (lista_id, questao_id, aluno_id, imagem_url, imagem_cloudinary_id, status, tentativa)
      VALUES ($1, $2, $3, $4, $5, 'processando', $6)
      RETURNING id
    `, [listaId, listaquestaoId, req.usuario.id, url, `${publicId}_${hash.slice(0, 16)}`, numeroTentativa])

    const submissaoId = submissao.rows[0].id

    // Processa em background
    setImmediate(async () => {
      try {
        const lq = await db.query(`
          SELECT lq.criterios_ia, q.enunciado
          FROM lista_questoes lq
          INNER JOIN questoes q ON q.id = lq.questao_id
          WHERE lq.id = $1
        `, [listaquestaoId])

        if (lq.rows.length === 0) throw new Error('Questão não encontrada')

        const { enunciado, criterios_ia } = lq.rows[0]
        const imagemAssinada = await gerarUrlAssinada(publicId)

        const resultado = await corrigirResolucaoFoto({
          enunciado,
          criterios: criterios_ia,
          imagemUrl: imagemAssinada
        })

        await db.query(`
          UPDATE submissoes_exercicio SET
            status = 'corrigido',
            nota_ia = $1,
            nota_final = $1,
            feedback_ia = $2,
            erros_identificados = $3,
            resposta_ia_raw = $4,
            questao_identificada = $5,
            metodo_correto = $6,
            corrigido_em = NOW()
          WHERE id = $7
        `, [
          resultado.nota,
          resultado.feedback,
          JSON.stringify(resultado.erros),
          resultado.raw,
          resultado.questao_identificada,
          resultado.metodo_correto,
          submissaoId
        ])

        // Notifica aluno
        await db.query(`
          INSERT INTO notificacoes_aluno (aluno_id, tipo, mensagem)
          VALUES ($1, 'correcao_exercicio', $2)
        `, [req.usuario.id, `Sua resolução foi corrigida. Nota: ${resultado.nota}/10`])

        // Sheets fire-and-forget
        const dadosAluno = await db.query(
          'SELECT u.nome, u.ra, t.nome as turma FROM usuarios u LEFT JOIN turma_alunos ta ON ta.aluno_id = u.id LEFT JOIN turmas t ON t.id = ta.turma_id WHERE u.id = $1',
          [req.usuario.id]
        )
        const listaInfo = await db.query('SELECT titulo FROM listas_exercicios WHERE id = $1', [listaId])

        registrarCorrecaoExercicio({
          nome: dadosAluno.rows[0]?.nome || '-',
          ra: dadosAluno.rows[0]?.ra || '-',
          turma: dadosAluno.rows[0]?.turma || '-',
          lista: listaInfo.rows[0]?.titulo || '-',
          questao: enunciado.slice(0, 100),
          nota_ia: resultado.nota,
          nota_final: resultado.nota,
          feedback_ia: resultado.feedback,
          tempo_segundos: null
        }).catch(e => console.error('[sheets] Erro ao registrar correção:', e))

      } catch (e) {
        console.error('[exercicios/submissoes background] Erro:', e)
        await db.query(
          "UPDATE submissoes_exercicio SET status = 'erro' WHERE id = $1",
          [submissaoId]
        ).catch(() => {})
      }
    })

    return res.status(202).json({ id: submissaoId, status: 'processando' })
  } catch (e) {
    console.error('[exercicios/submissoes POST] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── PROFESSOR: VÊ SUBMISSÕES DA LISTA ───────────────────────────────────────
router.get('/submissoes/lista/:listaId', verifyToken, requirePerfil('professor'), async (req, res) => {
  try {
    const lista = await db.query(`
      SELECT le.id FROM listas_exercicios le
      INNER JOIN turmas t ON t.id = le.turma_id
      WHERE le.id = $1 AND t.professor_id = $2
    `, [req.params.listaId, req.usuario.id])
    if (lista.rows.length === 0)
      return res.status(403).json({ message: 'Sem permissão.' })

    const result = await db.query(`
      SELECT se.id, se.status, se.nota_ia, se.nota_final, se.feedback_ia,
             se.tentativa, se.enviado_em, se.corrigido_em, se.questao_identificada,
             se.metodo_correto, se.nota_alterada_em,
             u.nome, u.ra,
             q.enunciado
      FROM submissoes_exercicio se
      INNER JOIN usuarios u ON u.id = se.aluno_id
      INNER JOIN lista_questoes lq ON lq.id = se.questao_id
      INNER JOIN questoes q ON q.id = lq.questao_id
      WHERE se.lista_id = $1 AND se.deletado_em IS NULL
      ORDER BY u.nome ASC, se.enviado_em DESC
    `, [req.params.listaId])

    return res.json({ submissoes: result.rows })
  } catch (e) {
    console.error('[exercicios/submissoes/lista GET] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── ALUNO: VÊ PRÓPRIAS SUBMISSÕES ───────────────────────────────────────────
router.get('/submissoes/minhas', verifyToken, requirePerfil('aluno'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT se.id, se.status, se.nota_ia, se.nota_final, se.feedback_ia,
             se.tentativa, se.enviado_em, se.corrigido_em,
             le.titulo as lista,
             q.enunciado
      FROM submissoes_exercicio se
      INNER JOIN listas_exercicios le ON le.id = se.lista_id
      INNER JOIN lista_questoes lq ON lq.id = se.questao_id
      INNER JOIN questoes q ON q.id = lq.questao_id
      WHERE se.aluno_id = $1 AND se.deletado_em IS NULL
      ORDER BY se.enviado_em DESC
    `, [req.usuario.id])

    return res.json({ submissoes: result.rows })
  } catch (e) {
    console.error('[exercicios/submissoes/minhas GET] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── PROFESSOR: FORÇA NOVA CORREÇÃO ──────────────────────────────────────────
router.post('/submissoes/:id/recorrigir', verifyToken, requirePerfil('professor'), limiterRecorrigir, async (req, res) => {
  try {
    const submissao = await db.query(`
      SELECT se.*, le.turma_id FROM submissoes_exercicio se
      INNER JOIN listas_exercicios le ON le.id = se.lista_id
      INNER JOIN turmas t ON t.id = le.turma_id
      WHERE se.id = $1 AND t.professor_id = $2 AND se.deletado_em IS NULL
    `, [req.params.id, req.usuario.id])
    if (submissao.rows.length === 0)
      return res.status(403).json({ message: 'Sem permissão.' })

    await db.query(
      "UPDATE submissoes_exercicio SET status = 'processando' WHERE id = $1",
      [req.params.id]
    )

    const s = submissao.rows[0]

    setImmediate(async () => {
      try {
        const lq = await db.query(`
          SELECT lq.criterios_ia, q.enunciado
          FROM lista_questoes lq
          INNER JOIN questoes q ON q.id = lq.questao_id
          WHERE lq.id = $1
        `, [s.questao_id])

        const { enunciado, criterios_ia } = lq.rows[0]
        const publicId = s.imagem_cloudinary_id.split('_')[0]
        const imagemAssinada = await gerarUrlAssinada(publicId)

        const resultado = await corrigirResolucaoFoto({
          enunciado,
          criterios: criterios_ia,
          imagemUrl: imagemAssinada
        })

        await db.query(`
          UPDATE submissoes_exercicio SET
            status = 'corrigido',
            nota_ia = $1,
            nota_final = $1,
            feedback_ia = $2,
            erros_identificados = $3,
            resposta_ia_raw = $4,
            questao_identificada = $5,
            metodo_correto = $6,
            corrigido_em = NOW()
          WHERE id = $7
        `, [resultado.nota, resultado.feedback, JSON.stringify(resultado.erros), resultado.raw, resultado.questao_identificada, resultado.metodo_correto, req.params.id])

      } catch (e) {
        console.error('[exercicios/recorrigir background] Erro:', e)
        await db.query("UPDATE submissoes_exercicio SET status = 'erro' WHERE id = $1", [req.params.id]).catch(() => {})
      }
    })

    return res.status(202).json({ status: 'processando' })
  } catch (e) {
    console.error('[exercicios/recorrigir POST] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── PROFESSOR: ALTERA NOTA MANUALMENTE ──────────────────────────────────────
router.patch('/submissoes/:id/nota', verifyToken, requirePerfil('professor'), async (req, res) => {
  try {
    const { nota } = req.body
    if (nota === undefined || nota < 0 || nota > 10)
      return res.status(400).json({ message: 'Nota deve estar entre 0 e 10.' })

    const submissao = await db.query(`
      SELECT se.id FROM submissoes_exercicio se
      INNER JOIN listas_exercicios le ON le.id = se.lista_id
      INNER JOIN turmas t ON t.id = le.turma_id
      WHERE se.id = $1 AND t.professor_id = $2 AND se.deletado_em IS NULL
    `, [req.params.id, req.usuario.id])
    if (submissao.rows.length === 0)
      return res.status(403).json({ message: 'Sem permissão.' })

    await db.query(`
      UPDATE submissoes_exercicio SET
        nota_final = $1,
        nota_alterada_por = $2,
        nota_alterada_em = NOW()
      WHERE id = $3
    `, [nota, req.usuario.id, req.params.id])

    return res.json({ ok: true })
  } catch (e) {
    console.error('[exercicios/nota PATCH] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

// ─── AMBOS: GERA SIGNED URL DA IMAGEM ────────────────────────────────────────
router.get('/submissoes/:id/imagem', verifyToken, requirePerfil('aluno', 'professor'), async (req, res) => {
  try {
    let submissao

    if (req.usuario.perfil === 'aluno') {
      submissao = await db.query(
        'SELECT imagem_cloudinary_id FROM submissoes_exercicio WHERE id = $1 AND aluno_id = $2 AND deletado_em IS NULL',
        [req.params.id, req.usuario.id]
      )
    } else {
      submissao = await db.query(`
        SELECT se.imagem_cloudinary_id FROM submissoes_exercicio se
        INNER JOIN listas_exercicios le ON le.id = se.lista_id
        INNER JOIN turmas t ON t.id = le.turma_id
        WHERE se.id = $1 AND t.professor_id = $2 AND se.deletado_em IS NULL
      `, [req.params.id, req.usuario.id])
    }

    if (submissao.rows.length === 0)
      return res.status(403).json({ message: 'Sem permissão.' })

    const publicId = submissao.rows[0].imagem_cloudinary_id.split('_')[0]
    const url = await gerarUrlAssinada(publicId)

    return res.json({ url })
  } catch (e) {
    console.error('[exercicios/imagem GET] Erro:', e)
    return res.status(500).json({ message: 'Erro interno.' })
  }
})

module.exports = router