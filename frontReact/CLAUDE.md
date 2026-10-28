# CLAUDE.md - MentiS Frontend

**Sempre leia este arquivo antes de trabalhar no frontend.**

---

## 🤖 Orquestração Automática de Sub-agentes e Code Review

Você atua como o especialista focado no Frontend. Sempre que receber uma tarefa neste escopo, siga este fluxo automaticamente:

1. **Analise:** Qual é o escopo do pedido no frontend? (Componentes, Hooks, Estilo, Testes).
2. **Leia o Contexto:** Use sua ferramenta de leitura de arquivos para ler silenciosamente as diretrizes do agente especialista na pasta `.claude/agents/` local correspondente à tarefa:
   - Para estruturação de páginas, hooks e lógica do React: leia `.claude/agents/react-specialist.md` ou `.claude/agents/frontend-developer.md`.
   - Para CSS, HTML, classes e design responsivo: leia `.claude/agents/ui-designer.md`.
   - Para acessibilidade (ARIA, navegação por teclado): leia `.claude/agents/accessibility-tester.md`.
   - Para criar ou atualizar testes com Vitest/React Testing Library: leia `.claude/agents/test-automator.md`.
3. **Execute:** Incorpore as regras que você acabou de ler e gere a solução completa (JSX + Hook + Service + CSS).
4. **Revise (Code Review OBRIGATÓRIO):** ANTES de dar a tarefa como concluída, suba um nível de diretório e leia o arquivo do revisor em `../.claude/agents/code-reviewer.md` (na raiz). Faça uma autocrítica rigorosa do código que você acabou de gerar. Se encontrar problemas de renderização desnecessária, estado solto, falta de tratamento de erro no fetch ou quebra de responsabilidade (ex: fetch direto no JSX), corrija-os internamente antes de me apresentar o resultado final.

---

## 🛠️ Tecnologias

- React 19 (Functional Components + Hooks)
- Vite
- React Router DOM 7
- Plain CSS (sem framework)
- ES6+ Modules

---

## 📁 Estrutura

```
frontReact/
├── src/
│   ├── pages/                    # Páginas/Rotas principais
│   │   ├── LandingPage/          # Página pública (index.jsx)
│   │   ├── Paciente/             # Login/Cadastro (index.jsx)
│   │   ├── Painel/               # Dashboard do paciente (index.jsx)
│   │   └── Profissional/         # CRUD de psicólogos (index.jsx)
│   ├── hooks/                    # Hooks customizados (lógica de negócio + estado)
│   │   ├── usePaciente.js        # Auth: login, cadastro, localStorage
│   │   ├── usePaciente.test.js   # Testes usePaciente
│   │   ├── usePainel.js          # Dashboard: perfil, psicólogos, paginação, edição
│   │   ├── usePainel.test.js     # Testes usePainel
│   │   ├── useProfissional.js    # CRUD psicólogos: create, read, update, delete
│   │   └── useProfissional.test.js # Testes useProfissional
│   ├── test/                     # Configuração de testes
│   │   └── setup.js              # Setup global Vitest
│   ├── services/                 # Camada de API (fetch abstraído)
│   │   ├── crudPaciente.js       # POST /cadastrar, POST /login, GET /:id
│   │   ├── crudProfissional.js   # CRUD completo /profissionais
│   │   └── crudPainel.js         # GET/PUT /pacientes/:id (com token)
│   ├── components/               # Componentes reutilizáveis
│   │   └── ErrorBoundary.jsx     # Error Boundary para capturar erros de renderização
│   ├── styles/                   # CSS
│   │   ├── style.css             # Global + LandingPage
│   │   ├── login.css             # Paciente + Profissional pages
│   │   ├── painel.css            # Dashboard
│   │   └── media.css             # Media queries (responsivo)
│   ├── App.jsx                   # Definição de rotas (com ErrorBoundary)
│   └── main.jsx                  # Entry point (BrowserRouter + StrictMode)
├── index.html
├── package.json
├── vite.config.js
├── vitest.config.js
├── eslint.config.js
└── .env                          # VITE_API_URL
```

---

## 📐 Padrões de Código

### 1. Componentes

- **Sempre componentes funcionais.**
- Arquivos e componentes React em **`PascalCase`** (ex: `CardPaciente.jsx`, `Painel/index.jsx`).
- Mantenha componentes **pequenos e com responsabilidade única**.
- Uma página = um arquivo `index.jsx` dentro de `pages/<NomePagina>/`.

### 2. Hooks e Utilitários

- Hooks customizados em **`camelCase`** (ex: `usePaciente.js`, `useAgendamento.js`).
- Hooks encapsulam **toda a lógica de estado e efeitos colaterais** da página.
- Páginas devem ser "buras" — apenas JSX + chamadas ao hook.

### 3. Integração com API (Services)

- **NUNCA** faça `fetch`/`axios` diretamente no JSX ou no componente.
- Crie funções em `/services` para abstrair a comunicação com o backend.
- Services exportam funções assíncronas nomeadas (ex: `cadastrarPaciente`, `getProfissionais`).
- Base URL via env: `import.meta.env.VITE_API_URL` (com fallback para `http://127.0.0.1:5000`).

### 4. Estilização

- CSS puro, organizado por arquivo por página/funcionalidade.
- Use classes semânticas (ex: `.psi-card`, `.auth-container-page`).
- `media.css` para breakpoints responsivos.
- Evite estilos inline exceto para valores dinâmicos simples.

### 5. Estado e Navegação

- `useState`/`useEffect`/`useCallback` para estado local.
- `useNavigate` (React Router) para redirecionamento programático.
- `localStorage` para persistir `pacienteLogado` e `token` (JWT).
- Pagination controlada no hook (`usePainel`: 6 itens/página).

### 6. Boas Práticas (Lint)

- Execute `npm run lint` antes de commit.
- Siga regras do `eslint.config.js` (React Hooks, React Refresh).
- Evite `any` — use tipagem inferida ou JSDoc.

### 7. Testes

- Execute `npm run test` para rodar testes unitários (Vitest + Testing Library).
- Testes localizados em `src/hooks/*.test.js`.
- Cobertura atual: `usePaciente`, `usePainel`, `useProfissional`.

---

## 🔄 Fluxo de Dados Típico (Ex: Login)

```
Paciente/index.jsx (JSX)
    ↓ onClick handleLogin
usePaciente.js (hook)
    ↓ chama service
services/crudPaciente.js → POST /pacientes/login
    ↓ retorna token + dados
localStorage.setItem('token', token)
localStorage.setItem('pacienteLogado', JSON.stringify(dados))
    ↓ navigate('/painel')
Painel/index.jsx → usePainel.js → carrega perfil + psicólogos
```

---

## 📄 Páginas e Responsabilidades

| Página         | Rota            | Hook              | Services                         | Descrição                                              |
| -------------- | --------------- | ----------------- | -------------------------------- | ------------------------------------------------------ |
| `LandingPage`  | `/`             | —                 | —                                | Pública, marketing, navegação                          |
| `Paciente`     | `/paciente`     | `usePaciente`     | `crudPaciente`                   | Login / Cadastro                                       |
| `Painel`       | `/painel`       | `usePainel`       | `crudPainel`, `crudProfissional` | Dashboard logado: perfil + lista psicólogos (paginada) |
| `Profissional` | `/profissional` | `useProfissional` | `crudProfissional`               | Admin: CRUD completo de psicólogos                     |

---

## ⚠️ Frontend-Specific Tech Debt

1. **Token JWT refresh/renewal** - Token guardado no localStorage, mas não há mecanismo de refresh (expira em 1h)
2. **TypeScript** - Projeto em JS puro, migração futura recomendada
3. **Acessibilidade** - Melhorias contínuas em ARIA labels, foco visível, contraste

---

## 🚀 Comandos Frequentes

```bash
cd frontReact
npm install                 # Instalar dependências
npm run dev                 # Dev server (porta 5173 default)
npm run build               # Build produção (output em /dist)
npm run lint                # ESLint (verifica hooks, react-refresh)
npm run preview             # Preview do build de produção
npm run test                # Rodar testes (Vitest)
npm run test:watch          # Rodar testes em modo watch
```

---

## 🧩 Convenções de Nomenclatura (Resumo)

| Tipo                   | Convenção                  | Exemplo                             |
| ---------------------- | -------------------------- | ----------------------------------- |
| Componente React       | `PascalCase`               | `CardProfissional.jsx`              |
| Página (pasta + index) | `PascalCase`               | `Painel/index.jsx`                  |
| Hook customizado       | `camelCase` + `use` prefix | `usePaciente.js`                    |
| Service/API function   | `camelCase`                | `getProfissionais()`                |
| Variável/estado        | `camelCase`                | `pacienteLogado`                    |
| CSS Class              | `kebab-case`               | `.psi-card`, `.auth-container-page` |
| Constante              | `UPPER_SNAKE_CASE`         | `ITENS_POR_PAGINA`                  |
