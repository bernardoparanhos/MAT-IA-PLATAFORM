# 🤖 MAT-IA — Contexto para IAs (AGENTS.md)
# Este arquivo NÃO sobe pro GitHub (.gitignore)
# Lido automaticamente por Cursor, Copilot, Claude Code e similares

---

## Identidade do projeto

MAT-IA é uma plataforma web educacional full-stack para diagnóstico e nivelamento em
Fundamentos de Matemática para alunos ingressantes de Engenharia na UTFPR Campus Medianeira.
Projeto aprovado no Edital InovaGrad 53/2025 — bolsista: Bernardo Paranhos Borges Oliveira.

- Produção: https://plataformamati.dev
- API: https://api.plataformamati.dev
- Repositório: https://github.com/bernardoparanhos/MAT-IA-PLATAFORM

---

## Stack

### Frontend (Vercel)
- React 19 + Vite 7 + Tailwind v4 + React Router 7
- Recharts, KaTeX, canvas-confetti, DOMPurify
- Fonte Outfit (Google Fonts)
- HTML5 Audio API — player de música (15 faixas em frontend/public/musicas/)

### Backend (Render)
- Node.js + Express
- PostgreSQL no Neon (DATABASE_URL no .env)
- JWT + bcryptjs (12 rounds, 8h)
- Helmet + CORS + express-rate-limit
- Brevo HTTP API (emails — NUNCA nodemailer/SMTP)
- googleapis (Google Sheets analytics)
- OpenAI GPT-4o-mini (análises pedagógicas)

### Ambiente local
- Windows + PowerShell (NUNCA sugerir grep — usar Select-String)
- WebStorm como IDE principal
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

---

## Estrutura de pastas

```
MAT-IA-PLATAFORM/
├── backend/
│   └── src/
│       ├── config/database.js         ← Pool Neon com SSL condicional por NODE_ENV
│       ├── controllers/               ← auth, aluno, professor
│       ├── routes/auth.routes.js      ← ARQUIVO PRINCIPAL — todas as rotas + RBAC
│       ├── routes/professor.routes.js
│       ├── services/sheets.service.js ← Google Sheets v2.0 (abas por turma)
│       ├── services/ia.service.js
│       ├── middlewares/auth.middleware.js ← verifyToken + requirePerfil
│       ├── data/questoes.json         ← 20 questões diagnóstico (gabarito só aqui)
│       ├── app.js                     ← Express, Helmet, CORS, rate limit, error handler
│       └── server.js                  ← Porta 3000 + listeners unhandledRejection
└── frontend/
    └── src/
        ├── pages/                     ← Login, Cadastro, Dashboard, Materias, Nivelamento...
        ├── components/                ← Formula, Sidebar*, HUDAluno, RankingCard, PlayerMusica
        ├── context/                   ← AuthContext, NotificacoesContext*, MusicContext
        └── services/                  ← alunoService, professorService, materiasService, api
```

---

## Padrões de código obrigatórios

### RBAC — toda rota autenticada tem requirePerfil
```js
// Professor
router.get('/rota', verifyToken, requirePerfil('professor'), async (req, res) => {})
// Aluno
router.get('/rota', verifyToken, requirePerfil('aluno'), async (req, res) => {})
// Compartilhado
router.get('/rota', verifyToken, requirePerfil('aluno', 'professor'), async (req, res) => {})
```

### Fetch autenticado (frontend)
```js
const token = localStorage.getItem('token')
const API = import.meta.env.VITE_API_URL
const res = await fetch(`${API}/auth/rota`, {
  headers: { Authorization: `Bearer ${token}` }
})
```

### Catch blocks — NUNCA vazio
```js
catch (e) { console.error('mensagem descritiva', e) }
```

### DOMPurify — obrigatório antes de dangerouslySetInnerHTML com dados do banco
```jsx
import DOMPurify from 'dompurify'
<span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(conteudo) }} />
```

### Commits — Conventional Commits em português
- feat:, fix:, refactor:, chore:, docs:
- NUNCA usar "security", "vulnerability", "hardcoded" nas mensagens

---

## Design system (paleta sagrada — não alterar sem perguntar)

| Token | Valor |
|---|---|
| Fundo global | `#0f172a` |
| Cards / sidebar | `#1e2d3d` |
| Destaque | `orange-500` / `orange-400` |
| Texto principal | `text-white` |
| Texto secundário | `text-slate-400` |
| Erro | `bg-red-500/10 text-red-400` |
| Sucesso | `bg-green-500/10 text-green-400` |
| Fonte | Outfit (Google Fonts) |
| Cards | `rounded-2xl` |
| Inputs/botões | `rounded-xl` |
| Ícones SVG | `strokeWidth="1.5"` |

---

## Modelo de dados — tabelas principais

```
usuarios           — id, nome, email, senha, ra, siape, perfil, diagnostico_status,
                     boas_vindas_enviada, musicas_favoritas JSONB,
                     pontos_totais, questoes_respondidas, questoes_corretas
turmas             — id, nome, codigo_acesso, professor_id, analise_ia
turma_alunos       — turma_id, aluno_id (PK composta)
diagnosticos       — id, aluno_id UNIQUE, resultado_json JSONB, analise_ia
questoes           — id, bloco, enunciado, alternativas JSONB, correta, latex, dificuldade, origem, ativa
questoes_historico — id, aluno_id, questao_id, resposta_dada, acertou BOOLEAN,
                     respondido_em, tempo_segundos, pontos_ganhos
questoes_favoritas — questao_id, aluno_id (PK composta)
feedbacks_diagnostico — id, aluno_id UNIQUE, nota (0-10), comentario
feedbacks          — id, aluno_id, tipo, mensagem, permitir_contato
notificacoes       — id, professor_id, tipo, mensagem, lida
notificacoes_aluno — id, aluno_id, tipo, mensagem, lida
tokens_recuperacao — id, usuario_id, token UNIQUE, expira_em, usado
```

### Estrutura alternativas JSONB
```json
[{"letra": "A", "texto": "..."}, {"letra": "B", "texto": "..."}, ...]
```

### Blocos disponíveis
```
inteiros | fracoes | raizes | potencias | equacao1 | equacao2
modulo | exponencial | trigonometria | geometria
```

---

## Segurança — estado atual

- RBAC: 100% das rotas autenticadas protegidas por requirePerfil
- TLS banco: `rejectUnauthorized: process.env.NODE_ENV === 'production'`
- Rate limit: 100 req/15min geral, 10/15min login, 5/15min esqueci-senha
- Error handler: nunca expõe err.message ao cliente
- DOMPurify: aplicado em MateriaBloco.jsx, MateriaFavoritas.jsx, Nivelamento.jsx
- Firewall Vercel: Bot Protection (log), AI Bots (block), WP scanners (deny), paths sensíveis (deny)
- Cache MP3s: Cache-Control imutável no vercel.json
- Gabarito: campo `correta` removido antes de enviar questões ao frontend
- JWT: localStorage (migração para HttpOnly cookie planejada)

---

## Gamificação

- Acerto 1ª tentativa: +10 pts | Acerto 2ª: +5 pts | Erro: 0 pts
- HUD flutuante: position fixed (inline style) — resolve instabilidade mobile
- Ranking: Top 10, desempate por questoes_respondidas ASC (quem errou menos)
- Confete: canvas-confetti com cores laranja ao acertar
- Ranking exibe apenas Nome + 1º Sobrenome (RA oculto por privacidade)

---

## Google Sheets — arquitetura v2.0

- Aba principal: diagnósticos (todos os testes)
- Abas dinâmicas por turma: questões de prática respondidas
- Mapeamento NOMES_BLOCOS: equacao1 → "Equação 1º Grau", fracoes → "Frações", etc.
- Linha em branco automática entre alunos diferentes

---

## NUNCAs — anti-padrões críticos

### Stack
- NUNCA SQLite
- NUNCA nodemailer/SMTP (Render bloqueia — usar Brevo HTTP API)
- NUNCA DBeaver (WebStorm é a IDE oficial)
- NUNCA grep (PowerShell — usar Select-String)
- NUNCA localStorage em artifacts de IA (usar React state)

### Código
- NUNCA NavItems dentro do componente (causa re-render infinito)
- NUNCA reintroduzir duplicação de sidebar (refactor caro já feito)
- NUNCA catch {} vazio
- NUNCA "ou" dentro de delimitadores LaTeX: usar `$5$ ou $-5$` (não `$5ou-5$`)
- NUNCA dificuldade = 'medio' — o valor correto é 'intermediario'
- NUNCA dangerouslySetInnerHTML sem DOMPurify em conteúdo do banco

### Banco
- NUNCA migration sem try/catch de coluna já existente
- NUNCA credenciais inline — sempre variáveis de ambiente
- NUNCA commit messages com "security", "vulnerability", "hardcoded"

### Segurança
- NUNCA rejectUnauthorized: false hardcoded em produção
- NUNCA expor err.message no response ao cliente

---

## Variáveis de ambiente — nomes (nunca valores aqui)

```
# Core
PORT, NODE_ENV, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN

# CORS
ALLOWED_ORIGIN, FRONTEND_URL

# Auth
SIAPES_AUTORIZADOS, RAS_AUTORIZADOS

# Email
BREVO_API_KEY, EMAIL_FROM, FEEDBACK_EMAIL

# Google Sheets
GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY_ID, GOOGLE_PRIVATE_KEY
GOOGLE_CLIENT_EMAIL, GOOGLE_CLIENT_ID
GOOGLE_SPREADSHEET_ID, GOOGLE_SPREADSHEET_FEEDBACKS_ID

# IA
OPENAI_API_KEY

# Frontend
VITE_API_URL
```

---

## Comandos úteis

```powershell
# Iniciar backend
cd backend && node src/server.js

# Iniciar frontend
cd frontend && npm run dev

# Buscar string nos arquivos (PowerShell)
Select-String -Path "frontend/src/*.jsx" -Pattern "useNotificacoes"

# Ver processo na porta 3000
netstat -ano | findstr :3000

# Matar processo
taskkill /PID <PID> /F

# Antes de qualquer commit
git pull --rebase origin main
```

---

## Contexto pedagógico (não alterar sem validar com Prof. Fausto)

- Diagnóstico: 20 questões, 5 blocos, máx 20 pts
- Nível básico: 0-6 pts | intermediário: 7-13 pts | avançado: 14-20 pts
- Gabarito: todas as questões são "A" exceto Q14 e Q18 que são "B"
- IA nunca calcula — só interpreta. Números vêm do sistema, interpretação vem da IA
- Aluno DEVE aguardar tela de resultado antes de fechar (dados podem se perder)

---

*Arquivo local — não sobe pro GitHub. Atualizar após marcos importantes.*
*Última atualização: 07 de maio de 2026*