# Arquitetura RAG - MentiS (Assistente de Triagem)

> Documento de referência para implementação do sistema RAG (Retrieval-Augmented Generation) para o **Assistente de Triagem**.
> **Status**: Planejamento - não implementado.
> **Foco**: Match inteligente entre pacientes e psicólogos baseado no chat de triagem.

---

## 🎯 Objetivo Específico: Assistente de Triagem

Implementar um sistema RAG que **conecta pacientes aos psicólogos mais adequados** através de uma conversa de triagem inteligente:

- **Entrada**: Chat livre do paciente descrevendo suas dores, sintomas, preferências
- **Processamento**: RAG recupera perfis de psicólogos + especialidades + abordagens terapêuticas
- **Saída**: Ranking de 3-5 psicólogos compatíveis com explicação do match (why this professional)

### Casos de Uso Principais

| Cenário | Entrada do Paciente | Saída Esperada |
|---------|---------------------|----------------|
| Ansiedade + TCC | "Tenho crises de ansiedade, quero terapia cognitivo-comportamental" | Psicólogos especialistas em TCC/ansiedade, modalidade online/presencial |
| Depressão + Humanista | "Me sinto vazio, quero me entender melhor, prefiro abordagem humanista" | Psicólogos com formação humanista/centrada na pessoa |
| Casal + Online | "Problemas no relacionamento, só posso fazer online à noite" | Psicólogos de terapia de casal com horário noturno online |
| Trauma + EMDR | "Trauma na infância, li que EMDR ajuda" | Psicólogos certificados em EMDR |
| Primeira vez | "Nunca fiz terapia, não sei por onde começar" | Psicólogos acolhedores para primeira experiência + psicoeducação |

---

## 🏗️ Estrutura de Pastas Proposta

```
backend/
├── rag/
│   ├── indexer.js              # Indexa perfis de psicólogos + protocolos clínicos
│   ├── retriever.js            # Busca semântica: query do paciente → perfis compatíveis
│   ├── generator.js            # Prompt template: explica o match + recomendações
│   ├── pipeline.js             # Orquestra: triagem chat → retrieve → generate → ranking
│   ├── triageAgent.js          # Agente principal: gerencia conversa + extrai features
│   └── vectorStore.js          # Abstração do vector DB (Chroma local)
├── services/
│   └── triageService.js        # Camada de API (endpoint POST /triage/chat)
└── prisma/
    └── schema.prisma           # + models: PsicologoProfile, TriageSession, MatchResult
```

---

## 🔌 Novas Rotas API Propostas

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/triage/start` | Inicia sessão de triagem (cria sessionId) |
| POST | `/triage/chat` | Envia mensagem do paciente → retorna resposta do assistente + sugestões parciais |
| POST | `/triage/finalize` | Finaliza triagem → retorna ranking final de psicólogos (top 5) |
| GET | `/triage/session/:sessionId` | Recupera histórico da sessão |
| POST | `/triage/index-psychologists` | Reindexa base de psicólogos (admin) |

---

## 🛠️ Stack Tecnológica Sugerida

| Componente | Opção Local (Privacidade - **Recomendada**) | Opção Cloud |
|------------|---------------------------------------------|-------------|
| **Vector DB** | Chroma (SQLite-based, embedded) | Pinecone, Qdrant Cloud |
| **Embeddings** | `bge-m3` ou `e5-large` via Ollama / `sentence-transformers` (Python sidecar) | OpenAI `text-embedding-3-small`, Cohere |
| **LLM** | Ollama (Llama 3.1 8B, Nemotron 3 Ultra) | OpenAI GPT-4o-mini, Anthropic Claude Haiku |
| **Orquestração** | Implementação própria leve (sem LangChain - menos overhead) | LangChain.js, LlamaIndex |

**Decisão**: **Stack 100% local (Ollama + Chroma)** obrigatória para dados de saúde (LGPD). Zero dados clínicos saem da infraestrutura.

---

## 🗄️ Models Prisma Propostos (Adicionais)

```prisma
// Perfil enriquecido do psicólogo para RAG (além do model Profissional existente)
model PsicologoProfile {
  id              String   @id @default(cuid())
  profissionalId  Int      @unique  // FK para model Profissional
  profissional    Profissional @relation(fields: [profissionalId], references: [id], onDelete: Cascade)
  
  // Dados para embedding/busca semântica
  bioCompleta     String   // Texto rico: formação, abordagem, experiência, filosofia
  especialidades  String[] // ["ansiedade", "depressao", "casal", "trauma", "tdah", ...]
  abordagens      String[] // ["tcc", "humanista", "psicanalise", "emdr", "act", "dbt", ...]
  publicoAlvo     String[] // ["adultos", "adolescentes", "idosos", "casais", "familias", ...]
  modalidades     String[] // ["online", "presencial", "hibrido"]
  faixaPreco      String   // "social", "popular", "particular", "convênio: [lista]"
  disponibilidade Json     // { manha: true, tarde: true, noite: true, sabado: false }
  idiomas         String[] // ["pt-BR", "en", "es"]
  certificacoes   String[] // ["EMDR", "DBT", "ACT", "Neurofeedback", ...]
  keywords        String[] // Palavras-chave extraídas para busca híbrida
  
  // Metadados de indexação
  embeddingVersion Int     @default(1)
  lastIndexedAt    DateTime @default(now())
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([profissionalId])
}

// Sessão de triagem do paciente
model TriageSession {
  id           String   @id @default(cuid())
  pacienteId   Int?     // Null se anônimo (não logado)
  status       String   @default("active") // active, completed, abandoned
  messages     Json     // Array: { role: "user|assistant", content: string, timestamp }
  extractedFeatures Json?  // Features extraídas: { dores, preferencias, urgencia, ... }
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  completedAt  DateTime?

  @@index([pacienteId])
  @@index([status])
}

// Resultado do match (persistido para auditoria/métricas)
model MatchResult {
  id             String   @id @default(cuid())
  sessionId      String
  session        TriageSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  profissionalId Int
  profissional   Profissional @relation(fields: [profissionalId], references: [id], onDelete: Cascade)
  rank           Int      // 1, 2, 3, 4, 5
  score          Float    // Score de similaridade 0-1
  matchReasons   String[] // ["Especialista em TCC para ansiedade", "Atende online à noite", ...]
  createdAt      DateTime @default(now())

  @@index([sessionId])
  @@index([profissionalId])
}

// Documentos clínicos de referência (protocolos, psicoeducação)
model ClinicalDocument {
  id          String   @id @default(cuid())
  title       String
  category    String   // "protocol", "psychoeducation", "technique", "guideline"
  tags        String[] // ["ansiedade", "tcc", "protocolo-cfp", ...]
  content     String   // Texto completo
  source      String   // "CFP", "APA", "Ministerio Saude", "custom"
  embedding   Byte[]?  // Ou reference para vector DB
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
}
```

---

## 🔄 Pipeline RAG para Triagem (Fluxo de Dados)

### 1. Indexação Offline (Psicólogos + Documentos Clínicos)

```
Psicólogos (tabela Profissional + PsicologoProfile)
    ↓
Text Builder: Concatena bio + especialidades + abordagens + público + modalidades
    ↓
Chunking: 1 chunk por psicólogo (texto ~500-1500 tokens)
    ↓
Embedding Model (bge-m3 / e5-large) → Vetores (1024 dims)
    ↓
Vector DB (Chroma) collection: "psicologos"
    ↓
Metadados no Prisma: PsicologoProfile.embeddingVersion++
```

```
Documentos Clínicos (ClinicalDocument)
    ↓
Semantic Chunking (500 tokens, overlap 100)
    ↓
Embedding → Vetores
    ↓
Vector DB (Chroma) collection: "clinical_docs"
```

### 2. Triagem Online (Chat com Paciente)

```
┌─────────────────────────────────────────────────────────────┐
│  SESSÃO DE TRIAGEM (múltiplas rodadas de chat)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PACIENTE: "Tenho ansiedade, crises de pânico..."          │
│       ↓                                                      │
│  TRIAGE AGENT: Extrai features (NER/LLM)                   │
│       ↓  { dores: ["ansiedade", "panico"],                 │
│            preferencias: { modalidade: "online",           │
│                           abordagem: "tcc" },              │
│            urgencia: "alta" }                              │
│       ↓                                                      │
│  HYBRID RETRIEVAL:                                          │
│  • Vector Search (query expandida com features)            │
│  • Filtro metadados (modalidade, preço, disponibilidade)   │
│  • Keyword match (especialidades, abordagens)              │
│       ↓                                                      │
│  RERANK: Cross-encoder ou LLM-based scoring                │
│       ↓                                                      │
│  TOP-K (10-15) → GENERATOR:                                │
│  Prompt: "Explique por que cada psicólogo é adequado..."   │
│       ↓                                                      │
│  RESPOSTA DO ASSISTENTE:                                    │
│  "Entendi... Aqui estão 3 opções iniciais:                 │
│  1. Dra. Maria - TCC, ansiedade, online à noite...         │
│  2. Dr. João - EMDR, trauma, online..."                   │
│                                                             │
│  [Paciente responde: 'Gostei da Dra. Maria, mas quero      │
│   saber se tem experiência com pânico']                     │
│       ↓                                                      │
│  LOOP: Refina busca → nova resposta contextualizada        │
└─────────────────────────────────────────────────────────────┘
```

### 3. Finalização (Ranking Final)

```
Session completa (paciente satisfeito ou max rodadas)
    ↓
FINAL RANKING:
• Recupera top 15 da última busca
• Aplica pesos finais: match clínico (40%) + fit prático (30%) + disponibilidade (20%) + avaliação (10%)
• Gera explicação personalizada para top 5
    ↓
Persiste MatchResult (auditoria)
    ↓
Retorna: { matches: [...], sessionId, nextSteps: "agendar" }
```

---

## 🧠 Agente de Triagem (triageAgent.js) - Lógica Central

### Extração de Features (por rodada de chat)

```javascript
// Input: mensagem do paciente + histórico
// Output: features estruturadas
{
  dores: ["ansiedade", "panico", "insonia"],           // Entidades clínicas
  sintomas: ["coração acelerado", "medo de morrer"],  // Sintomas livres
  preferencias: {
    modalidade: "online" | "presencial" | "hibrido" | null,
    abordagem: "tcc" | "humanista" | "emdr" | ... | null,
    genero: "feminino" | "masculino" | "indiferente" | null,
    faixaEtaria: "jovem" | "adulto" | "idoso" | null,
    precoMax: number | null,
    horario: "manha" | "tarde" | "noite" | "sabado" | null,
    idioma: "pt-BR" | "en" | ...
  },
  contexto: {
    primeiraVez: boolean,
    urgencia: "baixa" | "media" | "alta" | "emergencia",
    duracaoPreferida: "curta" | "media" | "longa" | null
  },
  exclusoes: {
    abordagens: [],  // "não quero psicanálise"
    especialidades: []
  }
}
```

### Estratégia de Busca Híbrida

```javascript
// Query expansion com features extraídas
const buildSearchQuery = (features, userMessage) => {
  const parts = [
    userMessage,                                    // Texto original (peso alto)
    ...features.dores,                             // Dores clínicas
    ...features.sintomas,                          // Sintomas
    ...features.preferencias.abordagem ? [features.preferencias.abordagem] : [],
    ...features.preferencias.modailidade ? [features.preferencias.modailidade] : [],
  ];
  return parts.join(" ").trim();
};

// Filtros metadata (hard filters)
const buildMetadataFilter = (features) => ({
  $and: [
    features.preferencias.modalidade ? { modalidades: features.preferencias.modalidade } : {},
    features.preferencias.precoMax ? { faixaPreco: { $in: getFaixasAte(features.preferencias.precoMax) } } : {},
    features.preferencias.horario ? { [`disponibilidade.${features.preferencias.horario}`]: true } : {},
    features.exclusoes.abordagens.length ? { abordagens: { $nin: features.exclusoes.abordagens } } : {},
  ].filter(f => Object.keys(f).length > 0)
});
```

---

## 🔐 Segurança e Privacidade (CRÍTICO - LGPD)

| Camada | Medida |
|--------|--------|
| **Dados da triagem** | Nunca saem do servidor; Ollama + Chroma rodam local |
| **Identificação** | Sessão anônima por default; vincula a pacienteId só se logado + consentimento |
| **Retenção** | TriageSession: 30 dias auto-expiração; MatchResult: 1 ano (auditoria) |
| **Acesso** | Paciente vê apenas sua sessão; Profissional vê apenas matches onde ele aparece; Admin vê agregados anonimizados |
| **Logs** | Audit log: sessionId, timestamp, ação (chat/retrieve/generate), chunks usados |
| **Consentimento** | Termos claros no início: "Esta conversa ajuda a encontrar psicólogos compatíveis. Dados não são compartilhados." |

---

## 📋 Endpoints Detalhados

### POST `/triage/start`
```json
// Request (opcional: pacienteId se logado)
{ "pacienteId": 12 }

// Response
{ "sessionId": "triage_abc123", "message": "Olá! Vou te ajudar a encontrar o psicólogo ideal. Me conte: o que te traz aqui hoje?" }
```

### POST `/triage/chat`
```json
// Request
{ "sessionId": "triage_abc123", "message": "Tenho ansiedade e crises de pânico, quero TCC online" }

// Response
{
  "reply": "Entendo, ansiedade e pânico são desafiadores. A TCC é muito eficaz para isso. Vou buscar psicólogos especialistas...",
  "partialMatches": [
    { "profissionalId": 5, "nome": "Dra. Maria", "score": 0.92, "reasons": ["Especialista TCC + Ansiedade", "Online à noite", "Experiência com pânico"] },
    { "profissionalId": 12, "nome": "Dr. João", "score": 0.87, "reasons": ["TCC + EMDR", "Online", "Trauma/ansiedade"] }
  ],
  "extractedFeatures": { "dores": ["ansiedade", "panico"], "preferencias": { "abordagem": "tcc", "modalidade": "online" } },
  "nextQuestions": ["Tem preferência por horário?", "Faixa de preço?"]
}
```

### POST `/triage/finalize`
```json
// Request
{ "sessionId": "triage_abc123" }

// Response
{
  "matches": [
    { "rank": 1, "profissional": {...}, "score": 0.94, "matchReasons": [...], "nextStep": "agendar" },
    { "rank": 2, "profissional": {...}, "score": 0.89, "matchReasons": [...], "nextStep": "ver perfil" },
    { "rank": 3, "profissional": {...}, "score": 0.85, "matchReasons": [...], "nextStep": "ver perfil" },
    { "rank": 4, "profissional": {...}, "score": 0.81, "matchReasons": [...], "nextStep": "ver perfil" },
    { "rank": 5, "profissional": {...}, "score": 0.78, "matchReasons": [...], "nextStep": "ver perfil" }
  ],
  "sessionId": "triage_abc123",
  "summary": "Busca por TCC para ansiedade/panico, online, horário flexível"
}
```

---

## 🧪 Tech Debt / Riscos Conhecidos

1. **Qualidade de embeddings português clínico** - `bge-m3` e `e5-large` são melhores que multilingues genéricos; testar fine-tuning domínio
2. **Cold start** - Psicólogos novos sem histórico → usar perfil + palavras-chave como fallback
3. **Latência chat** - Target < 2s por rodada; streaming de resposta + cache de embeddings de queries frequentes
4. **Alucinação no match** - Sempre citar fontes (perfil do psicólogo); implementar "não sei" se score < 0.6
5. **Viés de recomendação** - Auditar matches por gênero/etnia/região; métricas de diversidade no top-5
6. **Escala** - Chroma embedded escala até ~100k vetores; acima migrar para Chroma server ou Qdrant

---

## 📅 Próximos Passos (Roadmap de Implementação)

### Fase 1: Fundação (Semana 1-2)
- [ ] Adicionar models Prisma (`PsicologoProfile`, `TriageSession`, `MatchResult`, `ClinicalDocument`)
- [ ] Criar migration + seed com 20-30 perfis de psicólogos realistas
- [ ] Configurar Ollama local (Llama 3.1 8B + bge-m3 embeddings)
- [ ] Setup Chroma embedded no backend

### Fase 2: Indexação (Semana 2-3)
- [ ] Implementar `vectorStore.js` (abstração Chroma: init, upsert, query, delete)
- [ ] Implementar `indexer.js` (text builder → chunking → embed → upsert)
- [ ] Script `npm run rag:index-psychologists` para indexar base inicial
- [ ] Validar qualidade: busca "ansiedade tcc online" → retorna perfis certos

### Fase 3: Triagem Core (Semana 3-4)
- [ ] Implementar `triageAgent.js` (extração features + query expansion)
- [ ] Implementar `retriever.js` (hybrid search: vector + metadata filter + keyword)
- [ ] Implementar `generator.js` (prompt templates: resposta chat + explicação match)
- [ ] Implementar `pipeline.js` (orquestra rodada de chat)

### Fase 4: API + Integração (Semana 4-5)
- [ ] Criar `triageService.js` com endpoints REST
- [ ] Middleware de autenticação opcional (paciente logado vs anônimo)
- [ ] Rate limiting específico para triagem (ex: 30 req/min)
- [ ] Logs estruturados (Winston) para auditoria

### Fase 5: Frontend + Testes (Semana 5-6)
- [ ] Componente de chat no frontend (`TriageChat.jsx`)
- [ ] Integração com API `/triage/*`
- [ ] Testes de integração: cenários completos de triagem
- [ ] Avaliação qualitativa: 50 simulações → medir precisão do top-3

### Fase 6: Observabilidade + Hardening (Semana 6+)
- [ ] Métricas: latência p50/p95, taxa de conversão triagem→agendamento, diversidade top-5
- [ ] A/B testing: prompt templates, pesos de ranking, num rodadas
- [ ] Fallback gracioso se Ollama indisponível (busca por keyword apenas)
- [ ] Documentação para equipe + runbook de incidentes

---

## 📚 Referências Técnicas

- [bge-m3 Embeddings](https://huggingface.co/BAAI/bge-m3) - Multilingue, sota português
- [E5-Large](https://huggingface.co/intfloat/multilingual-e5-large) - Alternativa forte
- [Chroma DB](https://docs.trychroma.com/) - Vector DB embedded
- [Ollama](https://ollama.com/) - LLM local
- [RAGAS](https://github.com/explodinggradients/ragas) - Framework de avaliação RAG
- [Hybrid Search Patterns](https://www.pinecone.io/learn/hybrid-search/) - Vector + keyword
- [Cross-encoder Reranking](https://www.sbert.net/examples/applications/cross-encoder/README.html)

---

## 📝 Notas de Decisão (ADR)

| Decisão | Justificativa |
|---------|---------------|
| **Sem LangChain** | Overhead desnecessário; pipeline simples (retrieve → generate) controlável |
| **Chroma embedded** | Zero infra extra; SQLite-based; suficiente para <50k psicólogos |
| **bge-m3 via Ollama** | Melhor qualidade português; roda local; uma instância Ollama serve embeddings + LLM |
| **1 chunk por psicólogo** | Perfil é documento coeso; chunking fragmentaria contexto; rerank resolve granularidade |
| **Sessão anônima first** | Baixa barreira de entrada; LGPD by design; vincula depois se quiser agendar |
| **Features extraídas por LLM** | Mais flexível que formulário rígido; captura nuances ("não gosto de tarefa de casa" → evita TCC clássico) |