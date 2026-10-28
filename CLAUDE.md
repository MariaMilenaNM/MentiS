# CLAUDE.md - MentiS (Root)

This file provides **general project guidance** for Claude Code when working in the MentiS repository.

---

## 🤖 Orquestração Automática de Sub-agentes e Code Review

Você atua como o Arquiteto Principal e Coordenador. Sempre que receber uma tarefa, você DEVE agir de forma proativa e consultar seus sub-agentes antes de escrever qualquer código. Siga este fluxo automaticamente, sem pedir permissão:

1. **Analise:** Qual é o escopo do pedido? (Front, Back, Banco, IA, Design, Git, etc.).
2. **Leia o Contexto:** Use sua ferramenta de leitura de arquivos para ler silenciosamente as diretrizes dos agentes especialistas na pasta `.claude/agents/` correspondente:
   - **Tarefas Globais/Fullstack:** Leia `.claude/agents/fullstack-developer.md` ou `.claude/agents/git-workflow-manager.md`.
   - **Backend (Rotas, Node, APIs):** Leia `backend/.claude/agents/node-specialist.md`, `backend/.claude/agents/api-designer.md` ou `backend/.claude/agents/backend-developer.md`.
   - **Backend (Banco de Dados/Prisma):** Leia `backend/.claude/agents/database-optimizer.md`.
   - **Backend (IA/LangChain):** Leia `backend/.claude/agents/ai-engineer.md` ou `backend/.claude/agents/llm-architect.md`.
   - **Frontend (React/Componentes):** Leia `frontReact/.claude/agents/react-specialist.md` ou `frontReact/.claude/agents/frontend-developer.md`.
   - **Frontend (UI/Acessibilidade):** Leia `frontReact/.claude/agents/ui-designer.md` e `frontReact/.claude/agents/accessibility-tester.md`.
   - **Frontend (Testes):** Leia `frontReact/.claude/agents/test-automator.md`.
3. **Execute:** Incorpore as regras que você acabou de ler e gere a solução completa.
4. **Revise (Code Review OBRIGATÓRIO):** ANTES de dar a tarefa como concluída, assuma a persona do revisor lendo o arquivo `.claude/agents/code-reviewer.md` (na raiz). Faça uma autocrítica rigorosa do código que você acabou de gerar. Se encontrar problemas de performance, segurança ou desvio dos padrões (arquitetura, imports, tratamento de erros), corrija-os internamente antes de me apresentar o resultado final.

---

## 🏗️ Arquitetura do Projeto

O projeto MentiS é dividido em duas partes principais:

- `/backend`: API REST (Node.js, Express, Prisma, SQLite)
- `/frontReact`: Aplicação Web (React, Vite)

**Sempre leia o `CLAUDE.md` da pasta específica (`backend/` ou `frontReact/`) antes de trabalhar nela.**

---

## 📋 Padrão de Commits (Conventional Commits)

Todos os commits devem seguir rigorosamente o padrão abaixo:

- `feat:` Nova funcionalidade (ex: `feat: adiciona componente de login`).
- `fix:` Correção de bug (ex: `fix: corrige calculo de datas no agendamento`).
- `docs:` Alterações na documentação (ex: `docs: atualiza readme`).
- `style:` Formatação, ponto e vírgula, etc., sem impacto na lógica do código.
- `refactor:` Refatoração de código (nem nova feature, nem correção de bug).
- `perf:` Melhoria de performance.
- `test:` Adição ou correção de testes.
- `chore:` Atualizações de build, configuração, dependências, etc.

---

## 🤖 Regras Globais do Assistente (Claude)

- **Responda sempre em Português (Brasil).**
- Entenda o contexto da pasta em que está atuando (leia os arquivos `CLAUDE.md` específicos do front ou back).
- Mantenha o código limpo, documentado e focado na responsabilidade única.
- Consulte os arquivos de referência locais antes de implementar mudanças.

---

## 🔧 Tech Stack Overview

| Camada       | Tecnologias                                                                    |
| ------------ | ------------------------------------------------------------------------------ |
| **Frontend** | React 19, Vite, React Router DOM 7, Plain CSS, Vitest                          |
| **Backend**  | Node.js (ESM), Express 5, Prisma ORM, Zod, Winston, bcrypt, express-rate-limit |
| **Database** | SQLite3 (`dev.db`)                                                             |
| **Auth**     | JWT (jsonwebtoken) — _env-based secret, bcrypt password hashing_               |

---

## 📁 Estrutura de Pastas (Resumo)

```
MentiS/
├── CLAUDE.md                    ← Este arquivo (regras gerais)
├── README.md                    ← Escopo do MVP, sprints, equipe
├── backend/
│   ├── CLAUDE.md                ← Regras específicas do backend
│   ├── app.js                   ← Entry point (porta 5000)
│   ├── crudnode/                ← Rotas/Controladores
│   ├── repository/              ← Camada de dados (Prisma)
│   └── prisma/                  ← Schema + migrations
└── frontReact/
    ├── CLAUDE.md                ← Regras específicas do frontend
    ├── src/
    │   ├── pages/               ← LandingPage, Paciente, Painel, Profissional
    │   ├── hooks/               ← usePaciente, usePainel, useProfissional
    │   ├── services/            ← API calls (crudPaciente, crudProfissional, crudPainel)
    │   └── styles/              ← CSS global + por página
    └── package.json
```

---

## ⚠️ Known Technical Debt (Project-Wide)

1. **CRP validation** - Manual flag only, API integration deferred to v2
2. **RAG/LangChain agent** - Not yet implemented (see README for sprint plan)
3. **TypeScript migration** - Project still in plain JavaScript
4. **JWT token refresh** - No refresh/renewal mechanism (1h expiry)
5. **Token rotation** - JWT stored in localStorage without automatic rotation

---

## 🚀 Quick Start Commands

### Backend

```bash
cd backend
npm install
npm start              # Starts on http://127.0.0.1:5000
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

### Frontend

```bash
cd frontReact
npm install
npm run dev            # Starts on http://localhost:5173 (default)
npm run build
npm run lint
npm run preview
```

---

## 📌 Development Notes

- Backend API base URL: `import.meta.env.VITE_API_URL` (frontend) / `process.env.PORT || 5000` (backend)
- Database file: `backend/prisma/dev.db` (gitignored)
- Frontend expects backend running on port 5000
- Environment files: `backend/.env` (JWT_SECRET, PORT, NODE_ENV) and `frontReact/.env` (VITE_API_URL)
