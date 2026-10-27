# CLAUDE.md - MentiS Frontend

**Sempre leia este arquivo antes de trabalhar no frontend.**

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
│   │   ├── usePainel.js          # Dashboard: perfil, psicólogos, paginação, edição
│   │   └── useProfissional.js    # CRUD psicólogos: create, read, update, delete
│   ├── services/                 # Camada de API (fetch abstraído)
│   │   ├── crudPaciente.js       # POST /cadastrar, POST /login, GET /:id
│   │   ├── crudProfissional.js   # CRUD completo /profissionais
│   │   └── crudPainel.js         # GET/PUT /pacientes/:id (com token)
│   ├── styles/                   # CSS
│   │   ├── style.css             # Global + LandingPage
│   │   ├── login.css             # Paciente + Profissional pages
│   │   ├── painel.css            # Dashboard
│   │   └── media.css             # Media queries (responsivo)
│   ├── App.jsx                   # Definição de rotas
│   └── main.jsx                  # Entry point (BrowserRouter + StrictMode)
├── index.html
├── package.json
├── vite.config.js
└── eslint.config.js
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
- Base URL hardcoded: `http://127.0.0.1:5000` ⚠️ **Tech debt: usar variável de ambiente**.

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

| Página | Rota | Hook | Services | Descrição |
|--------|------|------|----------|-----------|
| `LandingPage` | `/` | — | — | Pública, marketing, navegação |
| `Paciente` | `/paciente` | `usePaciente` | `crudPaciente` | Login / Cadastro |
| `Painel` | `/painel` | `usePainel` | `crudPainel`, `crudProfissional` | Dashboard logado: perfil + lista psicólogos (paginada) |
| `Profissional` | `/profissional` | `useProfissional` | `crudProfissional` | Admin: CRUD completo de psicólogos |

---

## ⚠️ Frontend-Specific Tech Debt
1. **Hardcoded API URL** - `http://127.0.0.1:5000` em services (usar `import.meta.env.VITE_API_URL`)
2. **Sem Error Boundaries** - Falha em componente quebra app inteiro
3. **Senha no localStorage** - Token JWT guardado, mas não há refresh/renewal
4. **Validação fraca no front** - Depende do backend para validações
5. **Acessibilidade** - Faltando ARIA labels, foco visível, contraste em alguns pontos
6. **TypeScript** - Projeto em JS puro, migração futura recomendada
7. **Testes** - Nenhum teste unitário/integrado configurado

---

## 🚀 Comandos Frequentes
```bash
cd frontReact
npm install                 # Instalar dependências
npm run dev                 # Dev server (porta 5173 default)
npm run build               # Build produção (output em /dist)
npm run lint                # ESLint (verifica hooks, react-refresh)
npm run preview             # Preview do build de produção
```

---

## 🧩 Convenções de Nomenclatura (Resumo)
| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componente React | `PascalCase` | `CardProfissional.jsx` |
| Página (pasta + index) | `PascalCase` | `Painel/index.jsx` |
| Hook customizado | `camelCase` + `use` prefix | `usePaciente.js` |
| Service/API function | `camelCase` | `getProfissionais()` |
| Variável/estado | `camelCase` | `pacienteLogado` |
| CSS Class | `kebab-case` | `.psi-card`, `.auth-container-page` |
| Constante | `UPPER_SNAKE_CASE` | `ITENS_POR_PAGINA` |