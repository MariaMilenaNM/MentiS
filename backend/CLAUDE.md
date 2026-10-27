# CLAUDE.md - MentiS Backend

**Sempre leia este arquivo antes de trabalhar no backend.**

---

## 🛠️ Tecnologias
- Node.js (ESM)
- Express 5
- Prisma ORM
- SQLite

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
├── prisma/
│   ├── schema.prisma           # Models: Profissional & Paciente
│   └── migrations/
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
| Código | Uso |
|--------|-----|
| `200` | OK (sucesso genérico, GET, PUT) |
| `201` | Created (POST bem-sucedido) |
| `400` | Bad Request (dados inválidos, validação) |
| `401` | Unauthorized (token ausente/inválido) |
| `404` | Not Found (recurso não existe) |
| `409` | Conflict (ex: email duplicado) |
| `500` | Internal Server Error (erro inesperado) |

### 5. Autenticação (JWT)
- Middleware `verificarToken` em `crudPacienteRotas.js` valida `Authorization: Bearer <token>`.
- Secret hardcoded: `"TiaMimi"` ⚠️ **Tech debt - mover para env**.
- Token expira em 1h.
- Rotas protegidas: `GET/PUT/DELETE /pacientes/:id`.

---

## 🗄️ Models (Prisma Schema)
```prisma
model Profissional {
  id         Int    @id @default(autoincrement())
  nome       String
  crp        Int
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
  senha    String  // ⚠️ PLAIN TEXT - Tech debt: add bcrypt
}
```

---

## 🔌 API Routes

### Profissionais (`/profissionais`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Lista todos |
| POST | `/` | Cria novo (body: nome, crp, modalidade, link, numero, contato) |
| GET | `/:id` | Busca por ID |
| PUT | `/:id` | Atualiza por ID |
| DELETE | `/:id` | Remove por ID |

### Pacientes (`/pacientes`)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/cadastrar` | Registra paciente (body: nome, data, email, telefone, cidade, estado, senha) |
| POST | `/login` | Login (body: email, senha) → retorna `{ token }` |
| GET | `/:id` | Perfil do paciente (🔒 Requer token) |
| PUT | `/:id` | Atualiza perfil (🔒 Requer token) |
| DELETE | `/:id` | Remove paciente (🔒 Requer token) |

---

## 🧪 Repository Pattern (Exemplo)
```javascript
// repository/pacienteRepository.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const pacienteRepository = {
  findByEmail: async (email) => 
    await prisma.paciente.findUnique({ where: { email } }),
  
  create: async (data) => 
    await prisma.paciente.create({ data }),
  
  findByEmailAndSenha: async (email, senha) => 
    await prisma.paciente.findFirst({ where: { email, senha } }),
  
  findById: async (id) => 
    await prisma.paciente.findUnique({ where: { id } }),
  
  update: async (id, data) => 
    await prisma.paciente.update({ where: { id }, data }),
  
  delete: async (id) => 
    await prisma.paciente.delete({ where: { id } })
};
```

---

## ⚠️ Backend-Specific Tech Debt
1. **Senhas em texto plano** - Implementar bcrypt no `create` e `findByEmailAndSenha`
2. **JWT secret hardcoded** - Usar `process.env.JWT_SECRET`
3. **Validação de entrada** - Adicionar validação (ex: Zod, express-validator)
4. **CRP** - Apenas flag manual, sem integração com API oficial
5. **Rate limiting** - Não implementado
6. **Logs estruturados** - Apenas `morgan('dev')`

---

## 🚀 Comandos Frequentes
```bash
cd backend
npm install                 # Instalar dependências
node app.js                 # Iniciar servidor (porta 5000)
# ou: npm run dev           # Se script "dev" for adicionado
npx prisma generate         # Gerar Prisma Client
npx prisma migrate dev      # Rodar migrations
npx prisma studio           # Abrir Prisma Studio (GUI)
```