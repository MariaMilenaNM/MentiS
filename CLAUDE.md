# CLAUDE.md - MentiS (Root)

This file provides **general project guidance** for Claude Code when working in the MentiS repository.

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
| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 19, Vite, React Router DOM 7, Plain CSS |
| **Backend** | Node.js (ESM), Express 5, Prisma ORM |
| **Database** | SQLite3 (`dev.db`) |
| **Auth** | JWT (jsonwebtoken) — *hardcoded secret, plain text passwords (tech debt)* |

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
1. **Plain text passwords** - No bcrypt hashing in `pacienteRepository`
2. **Hardcoded JWT secret** - "TiaMimi" in `crudPacienteRotas.js`
3. **No input validation/sanitization** on backend
4. **No error boundaries** in React
5. **CRP validation** - Manual flag only, API integration deferred to v2
6. **RAG/LangChain agent** - Not yet implemented (see README for sprint plan)

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
- Backend API base URL: `http://127.0.0.1:5000` (hardcoded in frontend services)
- Database file: `backend/prisma/dev.db` (gitignored)
- Frontend expects backend running on port 5000