# MAT-IA — Plataforma de Suporte Inteligente ao Aprendizado de Matemática

Plataforma web educacional baseada em Inteligência Artificial voltada ao **diagnóstico, nivelamento e reforço** em Fundamentos de Matemática para estudantes ingressantes nos cursos de Engenharia da **UTFPR Campus Medianeira**.

Projeto aprovado no **Edital 53/2025 — PROGRAD/UTFPR**, no âmbito do Programa Institucional de Inovação nos Cursos de Graduação (**InovaGrad**), linha temática *Uso de Inteligência Artificial no Processo Ensino-Aprendizagem*.

---

## 🎯 Objetivo

Apoiar estudantes ingressantes em Engenharia que apresentam dificuldades em matemática básica, por meio de:

- Diagnóstico automatizado do nível de conhecimento prévio
- Análise pedagógica dos resultados assistida por IA
- Dashboard de métricas para o professor acompanhar a turma
- Trilhas de reforço direcionadas (em desenvolvimento)
- Tutor inteligente contextualizado por conteúdo (em desenvolvimento)

A proposta contribui para a permanência e o êxito acadêmico dos ingressantes, em alinhamento com o objetivo específico II do Programa InovaGrad.

---

## ✅ Funcionalidades implementadas

### Autenticação e controle de acesso
- Cadastro e login separados para aluno (RA) e professor (SIAPE)
- Validação de domínio institucional `@utfpr.edu.br` para professores
- Recuperação de senha via email (integração Brevo API)
- Rate limiting e log de tentativas
- JWT para rotas protegidas por perfil

### Diagnóstico de nivelamento
- Teste com 17 questões cobrindo 5 blocos temáticos:
  - Inteiros, Frações, Raízes, Potências e Geometria
- Renderização de notação matemática com **KaTeX** (Q12–Q17)
- Sistema de dicas progressivas e opção de pular questões
- Embaralhamento de alternativas (Fisher-Yates)
- Classificação automática em três níveis: **Básico**, **Intermediário** e **Avançado**

### Painel do professor
- Gerenciamento de múltiplas turmas
- Dashboard de métricas com gráficos interativos (Recharts)
- Distribuição de alunos por nível, médias por bloco, identificação do conteúdo mais fraco da turma
- Análise pedagógica da turma gerada por IA
- Análise individual por aluno gerada por IA, considerando desempenho, tempo de resposta, uso de dicas e questões puladas
- Sistema de notificações em tempo real
- Exportação integrada para Google Sheets

### Infraestrutura
- Backend em produção no Render
- Frontend em produção na Vercel
- Banco PostgreSQL gerenciado
- Interface responsiva (desktop e mobile)

---

## 🗺️ Roadmap

Funcionalidades planejadas para o ciclo 2026:

- [ ] Tutor IA contextualizado por conteúdo, disponível após o diagnóstico
- [ ] Trilhas de aprendizagem personalizadas por bloco temático
- [ ] Exercícios com feedback automático
- [ ] Mini-jogos matemáticos para fixação
- [ ] Fórum de dúvidas por disciplina
- [ ] Análise por item (item analysis) para mapeamento de questões mais difíceis
- [ ] Relatório pedagógico exportável em PDF

---

## 🛠️ Stack técnica

**Frontend**
- React 18 + Vite
- Tailwind CSS
- React Router
- Recharts (visualização de dados)
- KaTeX (renderização de fórmulas)

**Backend**
- Node.js + Express
- PostgreSQL
- JWT para autenticação
- bcryptjs, helmet, express-rate-limit, express-validator

**Integrações**
- OpenAI GPT-4o-mini (análise pedagógica por IA)
- Brevo API (envio transacional de email)
- Google Sheets API (exportação de resultados)

**Deploy**
- Frontend: Vercel
- Backend: Render
- Banco: PostgreSQL gerenciado (Render)

---

## 🚀 Como executar localmente

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+ (local ou via conexão remota)
- Conta configurada nos serviços externos utilizados (opcional para desenvolvimento)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # preencher variáveis
node src/server.js
```

Variáveis de ambiente necessárias: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `OPENAI_API_KEY`, `BREVO_API_KEY`.

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
- **Discente bolsista:** Bernardo Paranhos Borges Oliveira
- **Instituição:** UTFPR Campus Medianeira — Engenharia de Produção

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
