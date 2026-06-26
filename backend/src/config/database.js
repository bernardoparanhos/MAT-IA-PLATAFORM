const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
  ? { rejectUnauthorized: true, sslmode: 'verify-full' }
  : { rejectUnauthorized: false }
})

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      ra TEXT UNIQUE,
      siape TEXT UNIQUE,
      perfil TEXT NOT NULL CHECK(perfil IN ('aluno', 'professor')),
      diagnostico_status TEXT DEFAULT 'pendente',
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS turmas (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      codigo_acesso TEXT UNIQUE NOT NULL,
      professor_id INTEGER REFERENCES usuarios(id),
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS turma_alunos (
      turma_id INTEGER NOT NULL REFERENCES turmas(id),
      aluno_id INTEGER NOT NULL REFERENCES usuarios(id),
      PRIMARY KEY (turma_id, aluno_id)
    );

    CREATE TABLE IF NOT EXISTS diagnosticos (
      id SERIAL PRIMARY KEY,
      aluno_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id),
      resultado_json TEXT NOT NULL,
      feito_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notificacoes (
      id SERIAL PRIMARY KEY,
      professor_id INTEGER NOT NULL REFERENCES usuarios(id),
      tipo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      lida INTEGER DEFAULT 0,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notificacoes_aluno (
  id SERIAL PRIMARY KEY,
  aluno_id INTEGER NOT NULL REFERENCES usuarios(id),
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida INTEGER DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

    CREATE TABLE IF NOT EXISTS tokens_recuperacao (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      token TEXT UNIQUE NOT NULL,
      expira_em TIMESTAMP NOT NULL,
      usado INTEGER DEFAULT 0,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS log_recuperacao (
      id SERIAL PRIMARY KEY,
      ip TEXT NOT NULL,
      email TEXT NOT NULL,
      sucesso INTEGER DEFAULT 0,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materias (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      descricao TEXT,
      ordem INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercicios (
      id SERIAL PRIMARY KEY,
      materia_id INTEGER NOT NULL REFERENCES materias(id),
      enunciado TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('multipla_escolha', 'aberta')),
      gabarito TEXT NOT NULL,
      dificuldade TEXT NOT NULL CHECK(dificuldade IN ('basico', 'intermediario', 'avancado'))
    );

    CREATE TABLE IF NOT EXISTS respostas (
      id SERIAL PRIMARY KEY,
      aluno_id INTEGER NOT NULL REFERENCES usuarios(id),
      exercicio_id INTEGER NOT NULL REFERENCES exercicios(id),
      resposta TEXT NOT NULL,
      acerto INTEGER NOT NULL CHECK(acerto IN (0, 1)),
      respondido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS progressos (
      id SERIAL PRIMARY KEY,
      aluno_id INTEGER NOT NULL REFERENCES usuarios(id),
      materia_id INTEGER NOT NULL REFERENCES materias(id),
      percentual REAL DEFAULT 0,
      ultimo_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conquistas (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      descricao TEXT NOT NULL,
      icone TEXT
    );

    CREATE TABLE IF NOT EXISTS aluno_conquistas (
      aluno_id INTEGER NOT NULL REFERENCES usuarios(id),
      conquista_id INTEGER NOT NULL REFERENCES conquistas(id),
      desbloqueado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (aluno_id, conquista_id)
    );

    CREATE TABLE IF NOT EXISTS forum_posts (
      id SERIAL PRIMARY KEY,
      aluno_id INTEGER NOT NULL REFERENCES usuarios(id),
      materia_id INTEGER REFERENCES materias(id),
      titulo TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forum_respostas (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES forum_posts(id),
      aluno_id INTEGER NOT NULL REFERENCES usuarios(id),
      conteudo TEXT NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jogos_resultados (
      id SERIAL PRIMARY KEY,
      aluno_id INTEGER NOT NULL REFERENCES usuarios(id),
      jogo TEXT NOT NULL,
      pontuacao INTEGER NOT NULL,
      jogado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questoes (
                                          id SERIAL PRIMARY KEY,
                                          bloco TEXT NOT NULL CHECK(bloco IN (
                                          'inteiros','fracoes','raizes','potencias','geometria',
                                          'equacao1','equacao2','modulo','exponencial','trigonometria'
    )),
  enunciado TEXT NOT NULL,
  alternativas JSONB NOT NULL,
  correta TEXT NOT NULL CHECK(correta IN ('A','B','C','D')),
  latex BOOLEAN DEFAULT false,
  dificuldade TEXT DEFAULT 'intermediario' CHECK(dificuldade IN ('basico','intermediario','avancado')),
  ativa BOOLEAN DEFAULT true,
  origem TEXT DEFAULT 'manual' CHECK(origem IN ('manual','ia_revisada','moodle_xml')),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questoes_historico (
  id SERIAL PRIMARY KEY,
  aluno_id INTEGER NOT NULL REFERENCES usuarios(id),
  questao_id INTEGER NOT NULL REFERENCES questoes(id),
  resposta_dada TEXT NOT NULL,
  acertou BOOLEAN NOT NULL,
  respondido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  `)

  // ─── COLUNAS ADICIONADAS PÓS-DEPLOY ──────────────────────────────────────
  await pool.query(`
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS boas_vindas_enviada BOOLEAN DEFAULT FALSE;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS musicas_favoritas JSONB;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pontos_totais INTEGER DEFAULT 0;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS questoes_respondidas INTEGER DEFAULT 0;
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS questoes_corretas INTEGER DEFAULT 0;

    ALTER TABLE turmas ADD COLUMN IF NOT EXISTS analise_ia TEXT;
    ALTER TABLE turmas ADD COLUMN IF NOT EXISTS analise_ia_gerada_em TIMESTAMP;

    ALTER TABLE diagnosticos ADD COLUMN IF NOT EXISTS analise_ia TEXT;
    ALTER TABLE diagnosticos ADD COLUMN IF NOT EXISTS analise_ia_gerada_em TIMESTAMP;

    ALTER TABLE questoes_historico ADD COLUMN IF NOT EXISTS tempo_segundos INTEGER;
    ALTER TABLE questoes_historico ADD COLUMN IF NOT EXISTS pontos_ganhos INTEGER;
  `)

  // ─── NOVAS TABELAS — SISTEMA DE EXERCÍCIOS AVALIADOS POR IA ──────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS listas_exercicios (
      id SERIAL PRIMARY KEY,
      professor_id INTEGER REFERENCES usuarios(id),
      turma_id INTEGER REFERENCES turmas(id),
      titulo TEXT NOT NULL,
      descricao TEXT,
      data_entrega TIMESTAMP NOT NULL,
      ativa BOOLEAN DEFAULT true,
      criado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS lista_questoes (
      id SERIAL PRIMARY KEY,
      lista_id INTEGER REFERENCES listas_exercicios(id) ON DELETE CASCADE,
      questao_id INTEGER REFERENCES questoes(id),
      numero INTEGER NOT NULL,
      peso NUMERIC(4,2) DEFAULT 1.0,
      criterios_ia TEXT
    );

    CREATE TABLE IF NOT EXISTS submissoes_exercicio (
      id SERIAL PRIMARY KEY,
      lista_id INTEGER REFERENCES listas_exercicios(id),
      questao_id INTEGER REFERENCES lista_questoes(id),
      aluno_id INTEGER REFERENCES usuarios(id),
      imagem_url TEXT NOT NULL,
      imagem_cloudinary_id TEXT NOT NULL,
      status TEXT DEFAULT 'pendente',
      nota_ia NUMERIC(4,2),
      nota_final NUMERIC(4,2),
      feedback_ia TEXT,
      erros_identificados JSONB,
      resposta_ia_raw TEXT,
      tentativa INTEGER DEFAULT 1,
      questao_identificada BOOLEAN,
      metodo_correto BOOLEAN,
      nota_alterada_por INTEGER REFERENCES usuarios(id),
      nota_alterada_em TIMESTAMP,
      enviado_em TIMESTAMP DEFAULT NOW(),
      corrigido_em TIMESTAMP,
      deletado_em TIMESTAMP
    );
  `)

  // ─── PROFESSORES EXTERNOS — SOLICITAÇÕES E TIPO DE TESTE ─────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS solicitacoes_professor (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      instituicao TEXT NOT NULL,
      tipo_instituicao TEXT NOT NULL CHECK(tipo_instituicao IN ('universitario', 'medio', 'fundamental')),
      mensagem TEXT,
      status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'aprovado', 'rejeitado')),
      criado_em TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE turmas ADD COLUMN IF NOT EXISTS tipo_teste TEXT DEFAULT 'universitario'
      CHECK(tipo_teste IN ('universitario', 'medio', 'fundamental'));

    CREATE TABLE IF NOT EXISTS solicitacoes_aluno (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      ra TEXT NOT NULL,
      turma_id INTEGER NOT NULL REFERENCES turmas(id),
      status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'aprovado', 'rejeitado')),
      criado_em TIMESTAMP DEFAULT NOW()
    );
  `)

  console.log('✅ Banco de dados PostgreSQL conectado e tabelas criadas!')
}

initDB().catch(e => console.error('Erro ao iniciar banco:', e))

module.exports = pool
