# Guia de Contribuição - MentiS

Obrigado por contribuir com o MentiS! Este documento descreve o fluxo de trabalho, padrões de commit e como configurar o ambiente.

---

## 🌿 Estratégia de Branches (GitFlow Simplificado)

```
main (protegida)
  │
  ├── develop (branch de integração)
  │     │
  │     ├── feature/nova-funcionalidade
  │     ├── fix/correcao-bug
  │     ├── refactor/melhoria-codigo
  │     └── chore/atualizacao-deps
  │
  └── hotfix/correcao-urgente (apenas a partir de main)
```

### Regras

| Branch | Origem | Merge Para | Descrição |
|--------|--------|------------|-----------|
| `main` | — | — | Produção. **Protegida** - só via PR aprovado |
| `develop` | `main` | `main` | Integração contínua. Deploy em staging |
| `feature/*` | `develop` | `develop` | Novas funcionalidades |
| `fix/*` | `develop` | `develop` | Correções de bugs |
| `refactor/*` | `develop` | `develop` | Refatoração sem mudança de comportamento |
| `chore/*` | `develop` | `develop` | Atualizações de deps, config, tooling |
| `hotfix/*` | `main` | `main` + `develop` | Correções urgentes em produção |

### Fluxo de Trabalho

1. **Iniciar trabalho**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nome-da-feature
   ```

2. **Desenvolver** com commits seguindo [Conventional Commits](#-padrão-de-commits)

3. **Abrir PR** para `develop` (nunca direto para `main`)

4. **Code Review** obrigatório (mínimo 1 aprovação)

5. **Merge** via squash ou rebase (mantém histórico limpo)

6. **Deploy automático** em staging ao merge em `develop`

7. **Release**: PR de `develop` → `main` com tag de versão

---

## 📝 Padrão de Commits (Conventional Commits)

```
<tipo>(<escopo>): <descrição curta>

[corpo opcional]

[rodapé opcional]
```

### Tipos

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `feat` | Nova funcionalidade | `feat(auth): adiciona refresh token JWT` |
| `fix` | Correção de bug | `fix(paciente): corrige validação de email` |
| `docs` | Documentação | `docs: atualiza README com setup do backend` |
| `style` | Formatação (sem lógica) | `style: ajusta indentação no usePainel` |
| `refactor` | Refatoração | `refactor(repository): extrai query comum` |
| `perf` | Performance | `perf(db): adiciona índice no email` |
| `test` | Testes | `test(hooks): adiciona testes para useProfissional` |
| `chore` | Manutenção | `chore(deps): atualiza eslint para v9` |

### Escopos Comuns

- `auth` - Autenticação/autorização
- `paciente` - Funcionalidades do paciente
- `profissional` - Funcionalidades do profissional
- `api` - Rotas/contratos da API
- `db` - Banco de dados/Prisma
- `ui` - Interface/Componentes
- `hooks` - Hooks customizados
- `ci` - CI/CD
- `deps` - Dependências

### Exemplos

```bash
feat(api): adiciona endpoint de busca de psicólogos por cidade
fix(auth): corrige expiração de token não tratada no frontend
refactor(db): otimiza query de listagem com paginação
docs: adiciona diagrama de arquitetura no README
chore(deps): atualiza react-router-dom para v7
```

---

## 🛠️ Setup do Ambiente

### Pré-requisitos
- Node.js 20+
- npm 10+
- Git

### Backend
```bash
cd backend
cp .env.example .env
# Edite .env com suas configurações (JWT_SECRET obrigatório)
npm install
npx prisma generate
npx prisma migrate dev
npm run dev  # http://127.0.0.1:5000
```

### Frontend
```bash
cd frontReact
cp .env.example .env
# Edite .env se necessário (VITE_API_URL)
npm install
npm run dev  # http://localhost:5173
```

---

## ✅ Checklist de Pull Request

Antes de abrir o PR, verifique:

- [ ] Branch atualizada com `develop` (`git rebase develop` ou `git merge develop`)
- [ ] Commits seguem Conventional Commits
- [ ] `npm run lint` passa (backend e frontend)
- [ ] `npm run format:check` passa (backend e frontend)
- [ ] Testes passam (`npm run test` no frontend)
- [ ] Build passa (`npm run build` no frontend)
- [ ] Variáveis de ambiente documentadas no `.env.example`
- [ ] Documentação atualizada se necessário
- [ ] PR tem descrição clara do que muda e por quê
- [ ] Labels corretas aplicadas (tipo, área, prioridade)

---

## 🏷️ Labels Obrigatórias no PR

Toda PR deve ter pelo menos:
- **Tipo**: `type: feature`, `type: fix`, `type: refactor`, `type: chore`, `type: test`
- **Área**: `area: backend`, `area: frontend`, `area: database`, `area: ci/cd`
- **Prioridade**: `priority: high`, `priority: medium`, `priority: low`

---

## 🔒 Branches Protegidas

### `main`
- Requer PR com 1+ aprovações
- Requer CI passando
- Requer branches atualizadas
- Não permite force push
- Não permite delete

### `develop`
- Requer PR com 1+ aprovações
- Requer CI passando
- Não permite force push

---

## 🚀 Deploy

| Branch | Ambiente | Trigger |
|--------|----------|---------|
| `develop` | Staging | Auto ao merge |
| `main` | Produção | Manual (tag de release) |

---

## 📞 Dúvidas?

- Abra uma issue com label `documentation` ou `help wanted`
- Consulte `CLAUDE.md` na raiz e nas pastas `backend/` e `frontReact/`
- Veja `README.md` para visão geral do projeto