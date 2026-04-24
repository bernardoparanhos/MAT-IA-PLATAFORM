const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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
  bloco TEXT NOT NULL CHECK(bloco IN ('inteiros','fracoes','raizes','potencias','geometria')),
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
  console.log('✅ Banco de dados PostgreSQL conectado e tabelas criadas!')
}

initDB().catch(e => console.error('Erro ao iniciar banco:', e))

module.exports = pool
