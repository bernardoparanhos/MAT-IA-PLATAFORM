const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Ativa foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Criação das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    ra TEXT UNIQUE,
    perfil TEXT NOT NULL CHECK(perfil IN ('aluno', 'professor')),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS turmas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo_acesso TEXT UNIQUE NOT NULL,
    professor_id INTEGER NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES usuarios(id)
  );

  CREATE TABLE IF NOT EXISTS turma_alunos (
    turma_id INTEGER NOT NULL,
    aluno_id INTEGER NOT NULL,
    PRIMARY KEY (turma_id, aluno_id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id)
  );

  CREATE TABLE IF NOT EXISTS materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    ordem INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exercicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    materia_id INTEGER NOT NULL,
    enunciado TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('multipla_escolha', 'aberta')),
    gabarito TEXT NOT NULL,
    dificuldade TEXT NOT NULL CHECK(dificuldade IN ('basico', 'intermediario', 'avancado')),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
  );

  CREATE TABLE IF NOT EXISTS respostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER NOT NULL,
    exercicio_id INTEGER NOT NULL,
    resposta TEXT NOT NULL,
    acerto INTEGER NOT NULL CHECK(acerto IN (0, 1)),
    respondido_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id),
    FOREIGN KEY (exercicio_id) REFERENCES exercicios(id)
  );

  CREATE TABLE IF NOT EXISTS diagnosticos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER UNIQUE NOT NULL,
    resultado_json TEXT NOT NULL,
    feito_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id)
  );

  CREATE TABLE IF NOT EXISTS progressos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER NOT NULL,
    materia_id INTEGER NOT NULL,
    percentual REAL DEFAULT 0,
    ultimo_acesso DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
  );

  CREATE TABLE IF NOT EXISTS conquistas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    icone TEXT
  );

  CREATE TABLE IF NOT EXISTS aluno_conquistas (
    aluno_id INTEGER NOT NULL,
    conquista_id INTEGER NOT NULL,
    desbloqueado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (aluno_id, conquista_id),
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id),
    FOREIGN KEY (conquista_id) REFERENCES conquistas(id)
  );

  CREATE TABLE IF NOT EXISTS forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER NOT NULL,
    materia_id INTEGER,
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id)
  );

  CREATE TABLE IF NOT EXISTS forum_respostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    aluno_id INTEGER NOT NULL,
    conteudo TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(id),
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id)
  );

  CREATE TABLE IF NOT EXISTS jogos_resultados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER NOT NULL,
    jogo TEXT NOT NULL,
    pontuacao INTEGER NOT NULL,
    jogado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id)
  );
`);

console.log('✅ Banco de dados conectado e tabelas criadas!');

module.exports = db;