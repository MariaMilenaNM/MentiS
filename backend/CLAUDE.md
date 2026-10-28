# CLAUDE.md - MentiS Backend

**Sempre leia este arquivo antes de trabalhar no backend.**

---

## 🤖 Orquestração Automática de Sub-agentes e Code Review

Você atua como o especialista focado no Backend. Sempre que receber uma tarefa neste escopo, siga este fluxo automaticamente:

1. **Analise:** Qual é o escopo do pedido no backend? (Rotas, Repositório, IA, Banco).
2. **Leia o Contexto:** Use sua ferramenta de leitura de arquivos para ler silenciosamente as diretrizes do agente especialista na pasta `.claude/agents/` local correspondente à tarefa:
   - Para regras gerais de Node, Express e Middlewares: leia `.claude/agents/node-specialist.md` ou `.claude/agents/backend-developer.md`.
   - Para contratos de API e JSON: leia `.claude/agents/api-designer.md`.
   - Para consultas Prisma, performance SQL e migrations: leia `.claude/agents/database-optimizer.md`.
   - Para RAG, Prompts e Vector DB: leia `.claude/agents/ai-engineer.md` ou `.claude/agents/llm-architect.md`.
3. **Execute:** Incorpore as regras que você acabou de ler e gere a solução completa.
4. **Revise (Code Review OBRIGATÓRIO):** ANTES de dar a tarefa como concluída, suba um nível de diretório e leia o arquivo do revisor em `../.claude/agents/code-reviewer.md` (na raiz). Faça uma autocrítica rigorosa do código que você acabou de gerar. Se encontrar problemas de performance (ex: _N+1 queries_), segurança ou desvio dos padrões arquiteturais, corrija-os internamente antes de me apresentar o resultado final.

---

## 🛠️ Tecnologias

- Node.js (ESM)
- Express 5
- Prisma ORM
- SQLite
- Zod (validação)
- Winston (logs estruturados)
- bcrypt (hash de senhas)
- express-rate-limit (rate limiting)
- dotenv (variáveis de ambiente)

---

## 📁 Estrutura

```
backend/
├── app.js                      # Express server entry point (porta 5000)
├── crudnode/                   # Controladores e rotas (recebem HTTP, enviam resposta)
│   ├── crudProfissionalRotas.js
│   └── crudPacienteRotas.js
├── repository/                 # Camada de acesso a dados (centraliza comunicação com BD)
│   ├── profissionalRepository.js
│   └── pacienteRepository.js
├── utils/                      # Utilitários compartilhados
│   ├── validation.js           # Schemas Zod + middleware validate()
│   ├── logger.js               # Winston logger configurado
│   └── rateLimiter.js          # express-rate-limit config
├── prisma/
│   ├── schema.prisma           # Models: Profissional & Paciente
│   └── migrations/
├── .env                        # JWT_SECRET, PORT, NODE_ENV
└── package.json
```

---

## 📐 Padrões de Código

### 1. Nomenclatura

- Módulos, funções e variáveis em **`camelCase`** (ex: `pacienteRepository.js`, `findByEmail`).
- Arquivos de rota: `crud<Entidade>Rotas.js`.

### 2. Camada de Banco de Dados (CRITICAL)

- **O `PrismaClient` NUNCA deve ser instanciado/chamado diretamente nos arquivos de rota (`/crudnode`).**
- Centralize **todas** as operações de banco no `/repository`.
- Verifique sempre o `schema.prisma` antes de criar métodos para garantir tipagem correta.

### 3. Tratamento de Erros

- **Todas** as funções e rotas assíncronas devem utilizar blocos `try/catch`.
- Retorne respostas de erro consistentes: `{ erro: "mensagem" }`.

### 4. Respostas HTTP (Status Codes Corretos)

| Código | Uso                                      |
| ------ | ---------------------------------------- |
| `200`  | OK (sucesso genérico, GET, PUT)          |
| `201`  | Created (POST bem-sucedido)              |
| `400`  | Bad Request (dados inválidos, validação) |
| `401`  | Unauthorized (token ausente/inválido)    |
| `404`  | Not Found (recurso não existe)           |
| `409`  | Conflict (ex: email duplicado)           |
| `500`  | Internal Server Error (erro inesperado)  |

### 5. Autenticação (JWT)

- Middleware `verificarToken` em `crudPacienteRotas.js` valida `Authorization: Bearer <token>`.
- Secret via env: `process.env.JWT_SECRET` (obrigatório, servidor falha se ausente).
- Token expira em 1h.
- Rotas protegidas: `GET/PUT/DELETE /pacientes/:id`.
- ⚠️ **Tech debt**: No refresh/renewal mechanism for expired tokens.

---

## 🗄️ Models (Prisma Schema)

```prisma
model Profissional {
  id         Int    @id @default(autoincrement())
  nome       String
  crp        Int    @unique
  modalidade String
  link       String
  numero     String
  contato    String
}

model Paciente {
  id       Int    @id @default(autoincrement())
  nome     String
  data     String
  email    String @unique
  telefone String
  cidade   String
  estado   String
  senha    String  // ✅ Hashed with bcrypt (SALT_ROUNDS=10)
}
```

---

## 🔌 API Routes

### Profissionais (`/profissionais`)

| Método | Rota   | Descrição                                                      |
| ------ | ------ | -------------------------------------------------------------- |
| GET    | `/`    | Lista todos                                                    |
| POST   | `/`    | Cria novo (body: nome, crp, modalidade, link, numero, contato) |
| GET    | `/:id` | Busca por ID                                                   |
| PUT    | `/:id` | Atualiza por ID                                                |
| DELETE | `/:id` | Remove por ID                                                  |

### Pacientes (`/pacientes`)

| Método | Rota         | Descrição                                                                    |
| ------ | ------------ | ---------------------------------------------------------------------------- |
| POST   | `/cadastrar` | Registra paciente (body: nome, data, email, telefone, cidade, estado, senha) |
| POST   | `/login`     | Login (body: email, senha) → retorna `{ token }`                             |
| GET    | `/:id`       | Perfil do paciente (🔒 Requer token)                                         |
| PUT    | `/:id`       | Atualiza perfil (🔒 Requer token)                                            |
| DELETE | `/:id`       | Remove paciente (🔒 Requer token)                                            |

---

## 🧪 Repository Pattern (Exemplo - Atualizado com bcrypt)

```javascript
// repository/pacienteRepository.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const pacienteRepository = {
  findByEmail: async (email) =>
    await prisma.paciente.findUnique({ where: { email } }),

  create: async (data) => {
    const hashedSenha = await bcrypt.hash(data.senha, SALT_ROUNDS);
    return await prisma.paciente.create({
      data: { ...data, senha: hashedSenha },
    });
  },

  findByEmailAndSenha: async (email, senha) => {
    const paciente = await prisma.paciente.findUnique({ where: { email } });
    if (!paciente) return null;
    const senhaValida = await bcrypt.compare(senha, paciente.senha);
    return senhaValida ? paciente : null;
  },

  findById: async (id) => await prisma.paciente.findUnique({ where: { id } }),

  update: async (id, data) => {
    if (data.senha) {
      data.senha = await bcrypt.hash(data.senha, SALT_ROUNDS);
    }
    return await prisma.paciente.update({ where: { id }, data });
  },

  delete: async (id) => await prisma.paciente.delete({ where: { id } }),
};
```

---

## ⚠️ Backend-Specific Tech Debt

1. **CRP** - Apenas flag manual, sem integração com API oficial
2. **JWT token refresh** - No refresh/renewal mechanism (1h expiry)
3. **TypeScript migration** - Project still in plain JavaScript

---

## 🚀 Comandos Frequentes

```bash
cd backend
npm install                 # Instalar dependências
node app.js                 # Iniciar servidor (porta 5000)
# ou: npm run dev           # Com --watch (node --watch app.js)
npx prisma generate         # Gerar Prisma Client
npx prisma migrate dev      # Rodar migrations
npx prisma studio           # Abrir Prisma Studio (GUI)
```
