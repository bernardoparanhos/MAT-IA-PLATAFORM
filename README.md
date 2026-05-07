# MAT-IA — Plataforma de Suporte Inteligente ao Aprendizado de Matemática

Plataforma web educacional baseada em Inteligência Artificial voltada ao **diagnóstico, nivelamento e reforço** em Fundamentos de Matemática para estudantes ingressantes nos cursos de Engenharia da **UTFPR Campus Medianeira**.

Projeto aprovado no **Edital 53/2025 — PROGRAD/UTFPR**, no âmbito do Programa Institucional de Inovação nos Cursos de Graduação (**InovaGrad**), linha temática *Uso de Inteligência Artificial no Processo Ensino-Aprendizagem*.

🌐 **Acesso:** [plataformamati.dev](https://plataformamati.dev)

---

## 🎯 Objetivo

Apoiar estudantes ingressantes em Engenharia que apresentam dificuldades em matemática básica, por meio de:

- Diagnóstico automatizado do nível de conhecimento prévio
- Análise pedagógica dos resultados assistida por IA
- Dashboard de métricas para o professor acompanhar a turma em tempo real
- Banco de questões de prática com 300+ exercícios em 10 blocos temáticos
- Gamificação com pontuação, ranking e reforço positivo
- Trilhas de reforço direcionadas (em desenvolvimento)
- Tutor inteligente contextualizado por conteúdo (em desenvolvimento)

A proposta contribui para a permanência e o êxito acadêmico dos ingressantes, em alinhamento com o objetivo específico II do Programa InovaGrad.

---

## ✅ Funcionalidades implementadas

### Autenticação e controle de acesso
- Cadastro e login separados para aluno (RA) e professor (SIAPE)
- Validação de domínio institucional `@utfpr.edu.br` para professores
- Recuperação de senha via email (integração Brevo API)
- Rate limiting, log de tentativas e proteção contra força bruta
- JWT para rotas protegidas com controle de perfil (RBAC)

### Diagnóstico de nivelamento
- Teste com **20 questões** cobrindo 5 blocos temáticos: Inteiros, Frações, Raízes, Potências e Geometria
- Renderização de notação matemática com **KaTeX**
- Sistema de dicas progressivas, botão voltar e opção de pular questões
- Embaralhamento de alternativas anti-cola (Fisher-Yates client-side)
- Classificação automática em três níveis: **Básico**, **Intermediário** e **Avançado**
- Feedback opcional do aluno após o diagnóstico (nota 0–10 + comentário)
- Modo preview para professores testarem sem salvar dados

### Módulo de Matérias — banco de questões de prática
- **300+ questões** distribuídas em **10 blocos temáticos:**
  - Números Inteiros, Frações, Raízes, Potências
  - Equações 1º e 2º grau, Módulo, Exponencial
  - Trigonometria, Geometria
- Histórico de respostas com rastreio de acertos e erros
- Questões favoritas (marcação e revisão)
- Busca global por palavra-chave
- Progresso percentual por bloco

### Gamificação
- Sistema de pontuação: +10 pts no 1º acerto, +5 pts no 2º, 0 em erros
- HUD flutuante com pontos atuais e posição no ranking em tempo real
- Ranking Top 10 com desempate por eficiência (quem errou menos)
- Animação de confetes ao acertar questão
- Privacidade garantida: ranking exibe apenas nome, sem RA

### Player de música ambiente
- 15 faixas instrumentais para estudo (lofi, ambiente, jazz)
- Controles completos: play/pause, anterior/próxima, aleatório, repetir
- Favoritas sincronizadas por conta (persiste entre dispositivos)

### Painel do professor
- Gerenciamento de múltiplas turmas
- Dashboard de métricas com gráficos interativos (Recharts)
- Distribuição de alunos por nível, médias por bloco, identificação do conteúdo mais fraco
- Análise pedagógica da turma gerada por IA (GPT-4o-mini)
- Análise individual por aluno gerada por IA (desempenho, tempo, dicas, questões puladas)
- Sistema de notificações em tempo real (professor e aluno)
- Exportação automática para Google Sheets (diagnósticos + feedbacks + prática por turma)
- Relatórios de prática segmentados por turma em abas separadas

### Infraestrutura e segurança
- Backend em produção no Render
- Frontend em produção na Vercel com domínio personalizado
- Banco PostgreSQL permanente no Neon
- Interface responsiva (desktop e mobile)
- Firewall configurado (bloqueio de bots, scanners e scrapers)
- Sanitização de HTML com DOMPurify
- Headers de segurança via Helmet + CSP no `vercel.json`

---

## 🗺️ Roadmap

Funcionalidades planejadas para o ciclo 2026:

- [ ] Expansão do banco de questões para 1.000 (100 por bloco)
- [ ] Tutor IA contextualizado por conteúdo, disponível após o diagnóstico
- [ ] Trilhas de aprendizagem personalizadas por bloco temático
- [ ] Sistema de dificuldade progressiva nas questões de prática
- [ ] Modo revisão (apenas questões erradas)
- [ ] Mini-jogos matemáticos para fixação (Tabuada Veloz, Calculadora Mental)
- [ ] Fórum de dúvidas por turma
- [ ] Conquistas e badges
- [ ] Relatório pedagógico exportável em PDF
- [ ] Análise por item para mapeamento de questões mais difíceis

---

## 🛠️ Stack técnica

**Frontend**
- React 19 + Vite 7
- Tailwind CSS v4
- React Router 7
- Recharts (visualização de dados)
- KaTeX (renderização de fórmulas LaTeX)
- canvas-confetti (animações de reforço positivo)
- DOMPurify (sanitização de HTML)

**Backend**
- Node.js + Express
- PostgreSQL (Neon)
- JWT para autenticação com controle de perfil (RBAC)
- bcryptjs, helmet, express-rate-limit, express-validator

**Integrações**
- OpenAI GPT-4o-mini (análise pedagógica por IA)
- Brevo API (envio transacional de email)
- Google Sheets API (relatórios automáticos por turma)

**Deploy**
- Frontend: Vercel (`plataformamati.dev`)
- Backend: Render (`api.plataformamati.dev`)
- Banco: Neon (PostgreSQL permanente)

---

## 🚀 Como executar localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+ (local ou via conexão remota)
- Conta configurada nos serviços externos (opcional para desenvolvimento)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # preencher variáveis
node src/server.js
```

Variáveis de ambiente necessárias:

```
DATABASE_URL, JWT_SECRET, FRONTEND_URL
BREVO_API_KEY, OPENAI_API_KEY
GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL
GOOGLE_SPREADSHEET_ID, GOOGLE_SPREADSHEET_FEEDBACKS_ID
ALLOWED_ORIGIN, SIAPES_AUTORIZADOS
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # definir VITE_API_URL
npm run dev
```

Acesso local:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

---

## 👥 Equipe

- **Coordenador proponente:** Prof. Dr. Fausto Pinheiro da Silva
- **Discente bolsista:** Bernardo Paranhos Borges Oliveira — Engenharia de Produção
- **Instituição:** UTFPR Campus Medianeira

---

## 📅 Período de execução

Conforme cronograma do Edital 53/2025 — PROGRAD:

- **Início das atividades:** 17 de abril de 2026
- **Término das atividades:** 18 de dezembro de 2026
- **Entrega do relatório final:** até 26 de fevereiro de 2027

---

## 📄 Licença

Este projeto é licenciado sob **Creative Commons Atribuição-NãoComercial-CompartilhaIgual 4.0 Internacional (CC BY-NC-SA 4.0)**, conforme exigido pelo item 5.3 do Edital 53/2025 — PROGRAD.

[![Licença: CC BY-NC-SA 4.0](https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## 📚 Citação

> Este trabalho foi desenvolvido com o apoio do Edital 53/2025 – PROGRAD – Programa Institucional de Inovação nos Cursos de Graduação (InovaGrad), da Universidade Tecnológica Federal do Paraná.

---

<sub>MAT-IA — UTFPR Campus Medianeira · 2026</sub>
