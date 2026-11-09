# Plano de Padronização: "Psicólogo" → "Profissional"

## Objetivo
Padronizar toda a terminologia do projeto para usar exclusivamente **"profissional"** em vez de "psicólogo", mantendo compatibilidade com o banco de dados existente.

---

## Análise do Estado Atual

### Backend - Modelo de Dados (Prisma Schema)
O schema Prisma usa `Psicologo` como model name (entidade do banco). **NÃO DEVE SER ALTERADO** pois:
- Seria breaking change no banco
- Requer migração complexa
- A entidade de domínio continua sendo "Psicólogo" no nível de persistência

### Backend - Rotas e Controladores
- `/profissionais` (crudProfissionalRotas.js) - **Rota de compatibilidade** para frontend legado
- `/psicologos` (crudPsicologoRotas.js) - **Nova rota moderna** com recursos completos
- Ambos usam `psicologoRepository` internamente

### Frontend - Hooks e Services
- `useProfissional.js` - Hook principal para CRUD de profissionais (admin)
- `usePainel.js` - Usa variáveis `todosPsicologos`, `psicologosPagina` (precisa padronizar)
- `crudProfissional.js` - Service para `/profissionais`
- Página `Profissional/index.jsx` - Interface admin para CRUD
- Página `Painel/index.jsx` - Mostra lista de profissionais para pacientes

### Landing Page
- Texto: "REGISTRE-SE COMO PSICÓLOGO" → "REGISTRE-SE COMO PROFISSIONAL"
- FAQ e textos referentes a "psicólogo" → "profissional"

---

## Plano de Ação

### 1. Backend - Padronização de Respostas da API

#### 1.1 Rota `/profissionais` (compatibilidade) - MANTER
- Já retorna formato "profissional" (nome, crp, modalidade, link, numero, contato)
- Comentários internos usam "psicologo" - **alterar para "profissional" nos logs/comentários**

#### 1.2 Rota `/psicologos` (moderna) - MANTER endpoint, padronizar resposta
- Endpoint `/psicologos` deve continuar existindo para novas features
- Resposta JSON deve incluir campo `tipo: "profissional"` ou manter estrutura mas documentar
- **Não alterar URL** para não quebrar clientes novos

### 2. Frontend - Padronização de Variáveis e Nomes

#### 2.1 `usePainel.js`
```javascript
// ANTES
const [todosPsicologos, setTodosPsicologos] = useState([]);
const psicologos = await getProfissionais();
setTodosPsicologos(psicologos || []);
const psicologosPagina = todosPsicologos.slice(...);

// DEPOIS
const [todosProfissionais, setTodosProfissionais] = useState([]);
const profissionais = await getProfissionais();
setTodosProfissionais(profissionais || []);
const profissionaisPagina = todosProfissionais.slice(...);
```

#### 2.2 `Painel/index.jsx`
- Destructuring: `psicologosPagina` → `profissionaisPagina`
- `todosPsicologos` → `todosProfissionais`
- Loop: `psicologosPagina.map((p) =>` → `profissionaisPagina.map((profissional) =>`
- Variáveis internas: `p` → `profissional`

#### 2.3 `useProfissional.js` - JÁ USA "profissional" ✓
- Verificar se há referências residuais a "psicologo" nos comentários

#### 2.4 `Profissional/index.jsx` - JÁ USA "profissional" ✓
- Textos: "Registre-se como psicólogo" → "Registre-se como profissional"
- Labels e placeholders já usam termos neutros

### 3. Landing Page - Textos Visuais
- "REGISTRE-SE COMO PSICÓLOGO" → "REGISTRE-SE COMO PROFISSIONAL"
- FAQ: "psicólogo" → "profissional"
- Seção "CONHEÇA OS PROFISSIONAIS" - já está correto

### 4. Testes
- `usePainel.test.js`: Atualizar variáveis `psicologosPagina` → `profissionaisPagina`

### 5. Documentação
- `README.md`: Revisar textos para usar "profissional"
- `RAG_ARCHITECTURE.md`: Collection name pode ficar "psicologos" (infraestrutura) mas documentar

### 6. Banco de Dados - NÃO ALTERAR
- Model `Psicologo` permanece
- Enums `UserRole.PSICOLOGO` permanece (é role de autenticação)
- Tabelas e relações internas mantêm nomes técnicos

---

## Considerações para RAG Futuro

O documento `RAG_ARCHITECTURE.md` menciona collection "psicologos" no ChromaDB. Para o RAG:
- Collection name pode permanecer "psicologos" (nível de infraestrutura)
- Metadados dos documentos devem usar `tipo: "profissional"`
- Prompts do LLM devem referenciar "profissional de saúde mental" ou "psicólogo" conforme contexto clínico

---

## Checklist de Implementação

### Backend
- [ ] `crudProfissionalRotas.js`: Comentários/logs "psicologo" → "profissional"
- [ ] `crudPsicologoRotas.js`: Comentários/logs "psicologo" → "profissional" (manter endpoint)
- [ ] `psicologoRepository.js`: Comentários internos
- [ ] `authRotas.js`: Resposta de login inclui dados do profissional

### Frontend
- [ ] `usePainel.js`: Renomear variáveis de estado
- [ ] `Painel/index.jsx`: Atualizar destructuring e loop
- [ ] `useProfissional.js`: Verificar comentários residuais
- [ ] `Profissional/index.jsx`: Textos "psicólogo" → "profissional"
- [ ] `LandingPage/index.jsx`: Botão e FAQ
- [ ] `crudProfissional.js`: Verificar se service está correto

### Testes
- [ ] `usePainel.test.js`: Atualizar variáveis

### Documentação
- [ ] `README.md`: Revisar terminologia
- [ ] `CLAUDE.md` (root, backend, frontend): Verificar consistência

---

## Prioridade

1. **ALTA**: Frontend visível ao usuário (Painel, Profissional, LandingPage)
2. **ALTA**: Hooks que afetam UI (`usePainel.js`)
3. **MÉDIA**: Backend logs/comentários (não afeta API contract)
4. **BAIXA**: Testes e documentação