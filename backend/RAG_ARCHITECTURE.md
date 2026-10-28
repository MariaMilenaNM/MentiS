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
│   ├── indexer.js              # Indexa perfis de psicólogos + protocolos clínicos (LangChain loaders/splitters)
│   ├── retriever.js            # Busca semântica: query do paciente → perfis compatíveis (LangChain retrievers)
│   ├── generator.js            # Prompt templates + LLM chains (LangChain prompts + runnables)
│   ├── pipeline.js             # Orquestra: triagem chat → retrieve → generate → ranking (LangChain chains/agents)
│   ├── triageAgent.js          # Agente principal: gerencia conversa + extrai features (LangChain Agent/Tools)
│   ├── chains/                 # Chains reutilizáveis
│   │   ├── featureExtractionChain.js  // Extrai features do chat (structured output)
│   │   ├── queryExpansionChain.js     // Expande query com features
│   │   ├── matchExplanationChain.js   // Gera explicação do match
│   │   └── triageResponseChain.js     // Resposta conversacional do assistente
│   ├── tools/                  # Tools para o agente
│   │   ├── searchPsychologists.js     // Tool: busca híbrida no vector store
│   │   ├── filterByMetadata.js        // Tool: filtra por modalidade/preço/horário
│   │   └── getPsychologistDetails.js  // Tool: busca detalhes completos do profissional
│   └── vectorStore.js          # Abstração do vector DB (Chroma via LangChain)
├── services/
│   └── triageService.js        # Camada de API (endpoints POST /triage/*)
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
| **Orquestração** | **LangChain.js** (chains, agents, retrievers, callbacks) | LangChain.js, LlamaIndex |

**Decisão**: **Stack 100% local (Ollama + Chroma + LangChain.js)** obrigatória para dados de saúde (LGPD). Zero dados clínicos saem da infraestrutura.

### Integração LangChain.js (Local)

```javascript
// Exemplo de setup local com LangChain.js
import { Ollama } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

// LLM local via Ollama
const llm = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "llama3.1:8b",
  temperature: 0.3,
});

// Embeddings local via Ollama
const embeddings = new OllamaEmbeddings({
  baseUrl: "http://localhost:11434",
  model: "bge-m3", // ou "nomic-embed-text"
});

// Vector Store Chroma (embedded)
const vectorStore = await Chroma.fromExistingCollection(embeddings, {
  collectionName: "psicologos",
  url: "http://localhost:8000", // Chroma server mode para produção
  // Ou embedded: path: "./chroma_db"
});

// Text Splitter para documentos clínicos
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 100,
  separators: ["\n\n", "\n", ". ", " ", ""],
});
```

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

## 🧠 Agente de Triagem (triageAgent.js) - Lógica Central com LangChain

### Arquitetura do Agente (LangChain Agent + Tools)

```javascript
// rag/triageAgent.js
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatOllama } from "@langchain/ollama";
import { pull } from "langchain/hub";
import { searchPsychologistsTool } from "./tools/searchPsychologists.js";
import { filterByMetadataTool } from "./tools/filterByMetadata.js";
import { getPsychologistDetailsTool } from "./tools/getPsychologistDetails.js";

const llm = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "llama3.1:8b",
  temperature: 0.3,
});

// Tools disponíveis para o agente
const tools = [
  searchPsychologistsTool,     // Busca semântica + híbrida
  filterByMetadataTool,        // Filtros práticos (modalidade, preço, horário)
  getPsychologistDetailsTool,  // Detalhes completos do perfil
];

// Prompt do agente (system + chat history + agent_scratchpad)
const prompt = await pull("hwchase17/openai-tools-agent"); // Adaptar para português

const agent = createToolCallingAgent({ llm, tools, prompt });
const agentExecutor = new AgentExecutor({ agent, tools, verbose: true });

// Execução por rodada de chat
export async function runTriageAgent(sessionId, userMessage, chatHistory) {
  const result = await agentExecutor.invoke({
    input: userMessage,
    chat_history: chatHistory, // Array de { role, content }
    session_id: sessionId,
  });
  return result.output; // Resposta estruturada do agente
}
```

### Extração de Features Estruturada (LangChain Structured Output)

```javascript
// rag/chains/featureExtractionChain.js
import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

const FeatureSchema = z.object({
  dores: z.array(z.string()).describe("Entidades clínicas: ansiedade, depressao, trauma, etc."),
  sintomas: z.array(z.string()).describe("Sintomas livres descritos pelo paciente"),
  preferencias: z.object({
    modalidade: z.enum(["online", "presencial", "hibrido"]).nullable(),
    abordagem: z.enum(["tcc", "humanista", "psicanalise", "emdr", "act", "dbt", "junguiana", "sistemica"]).nullable(),
    genero: z.enum(["feminino", "masculino", "indiferente"]).nullable(),
    faixaEtaria: z.enum(["jovem", "adulto", "idoso"]).nullable(),
    precoMax: z.number().nullable(),
    horario: z.enum(["manha", "tarde", "noite", "sabado"]).nullable(),
    idioma: z.array(z.string()).default(["pt-BR"]),
  }),
  contexto: z.object({
    primeiraVez: z.boolean(),
    urgencia: z.enum(["baixa", "media", "alta", "emergencia"]),
    duracaoPreferida: z.enum(["curta", "media", "longa"]).nullable(),
  }),
  exclusoes: z.object({
    abordagens: z.array(z.string()),
    especialidades: z.array(z.string()),
  }),
});

const parser = new JsonOutputParser({ pydanticObject: FeatureSchema });

const prompt = PromptTemplate.fromTemplate(`
Você é um assistente de triagem psicológica. Extraia features estruturadas da mensagem do paciente.

Histórico da conversa:
{chat_history}

Mensagem atual: {user_message}

{format_instructions}

IMPORTANTE:
- Capture nuances: "não gosto de tarefa de casa" → pode indicar aversão a TCC clássico
- "primeira vez" / "nunca fiz terapia" → primeiraVez: true
- Urgência: "crise", "urgente", "não aguento mais" → alta/emergencia
- Se não tiver certeza, use null
`);

const chain = prompt.pipe(llm).pipe(parser);

export async function extractFeatures(userMessage, chatHistory) {
  return await chain.invoke({
    user_message: userMessage,
    chat_history: formatChatHistory(chatHistory),
    format_instructions: parser.getFormatInstructions(),
  });
}
```

### Chain de Explicação do Match

```javascript
// rag/chains/matchExplanationChain.js
import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const prompt = PromptTemplate.fromTemplate(`
Você é um assistente de triagem empático. Explique por que cada psicólogo é adequado para o paciente.

Perfil do paciente (features extraídas):
{patient_features}

Psicólogos candidatos:
{psychologists_data}

Instruções:
1. Para cada psicólogo, cite 2-3 razões específicas do match
2. Use linguagem acolhedora, não técnica
3. Destaque fit clínico (especialidade/abordagem) + fit prático (modalidade/horário/preço)
4. Se houver gaps, mencione honestamente
5. Máximo 3 frases por psicólogo

Formato de saída (JSON):
{{
  "matches": [
    {{ "profissionalId": 5, "explanation": "A Dra. Maria é especialista em TCC para ansiedade e pânico, atende online à noite e tem 8 anos de experiência com casos semelhantes." }},
    ...
  ]
}}
`);

const chain = prompt.pipe(llm).pipe(new StringOutputParser());

export async function explainMatches(patientFeatures, psychologists) {
  return await chain.invoke({
    patient_features: JSON.stringify(patientFeatures, null, 2),
    psychologists_data: JSON.stringify(psychologists, null, 2),
  });
}
```

### Chain de Resposta Conversacional

```javascript
// rag/chains/triageResponseChain.js
import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const prompt = PromptTemplate.fromTemplate(`
Você é um assistente de triagem acolhedor e profissional. Responda ao paciente de forma natural.

Contexto da sessão:
- Rodada: {round_number}
- Features conhecidas: {known_features}
- Matches parciais: {partial_matches}

Mensagem do paciente: {user_message}

Diretrizes:
- Valide a dor do paciente ("Entendo que ansiedade e pânico são muito difíceis...")
- Explique brevemente o que está fazendo ("Estou buscando psicólogos especialistas...")
- Apresente 2-3 opções iniciais com 1 frase cada
- Faça 1-2 perguntas direcionadas para refinar a busca
- Tom: empático, profissional, sem jargão técnico
- Nunca prometa cura ou resultados

Resposta:
`);

const chain = prompt.pipe(llm).pipe(new StringOutputParser());

export async function generateTriageResponse(context) {
  return await chain.invoke(context);
}
```

### Tools para o Agente (LangChain Tools)

```javascript
// rag/tools/searchPsychologists.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { vectorStore } from "../vectorStore.js";

export const searchPsychologistsTool = tool(
  async ({ query, k = 10 }) => {
    // Busca vetorial + filtro de metadados opcional
    const results = await vectorStore.similaritySearchWithScore(query, k);
    return results.map(([doc, score]) => ({
      profissionalId: doc.metadata.profissionalId,
      content: doc.pageContent,
      score: 1 - score, // Converter distance para similarity
      metadata: doc.metadata,
    }));
  },
  {
    name: "search_psychologists",
    description: "Busca psicólogos por similaridade semântica. Use query expandida com dores, abordagem, modalidade.",
    schema: z.object({
      query: z.string().describe("Query expandida para busca semântica"),
      k: z.number().default(10).describe("Número de resultados"),
    }),
  }
);

// rag/tools/filterByMetadata.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "../../prisma/client.js";

export const filterByMetadataTool = tool(
  async ({ profissionalIds, filters }) => {
    // Filtra no Prisma por metadados práticos
    const where = { id: { in: profissionalIds } };
    if (filters.modalidade) where.modalidades = { has: filters.modalidade };
    if (filters.precoMax) where.faixaPreco = { in: getFaixasAte(filters.precoMax) };
    if (filters.horario) where[`disponibilidade.${filters.horario}`] = true;
    if (filters.excluirAbordagens?.length) where.abordagens = { not: { hasSome: filters.excluirAbordagens } };
    
    return await prisma.psicologoProfile.findMany({ where });
  },
  {
    name: "filter_by_metadata",
    description: "Filtra psicólogos por critérios práticos: modalidade, preço, horário, exclusões.",
    schema: z.object({
      profissionalIds: z.array(z.number()),
      filters: z.object({
        modalidade: z.string().optional(),
        precoMax: z.number().optional(),
        horario: z.string().optional(),
        excluirAbordagens: z.array(z.string()).optional(),
      }),
    }),
  }
);

// rag/tools/getPsychologistDetails.js
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "../../prisma/client.js";

export const getPsychologistDetailsTool = tool(
  async ({ profissionalIds }) => {
    return await prisma.psicologoProfile.findMany({
      where: { profissionalId: { in: profissionalIds } },
      include: { profissional: true },
    });
  },
  {
    name: "get_psychologist_details",
    description: "Busca detalhes completos dos psicólogos (bio, certificações, disponibilidade, etc.)",
    schema: z.object({
      profissionalIds: z.array(z.number()),
    }),
  }
);
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
- [ ] Setup Chroma (embedded para dev, server mode para prod)
- [ ] Instalar dependências LangChain: `@langchain/core`, `@langchain/ollama`, `@langchain/community`, `langchain`, `zod`

### Fase 2: Indexação com LangChain (Semana 2-3)
- [ ] Implementar `vectorStore.js` (Chroma.fromExistingCollection / fromDocuments via LangChain)
- [ ] Implementar `indexer.js` usando `RecursiveCharacterTextSplitter` + `OllamaEmbeddings`
- [ ] Script `npm run rag:index-psychologists` para indexar base inicial
- [ ] Validar qualidade: busca "ansiedade tcc online" → retorna perfis certos

### Fase 3: Chains Base (Semana 3-4)
- [ ] Implementar `featureExtractionChain.js` (Structured Output com Zod + JsonOutputParser)
- [ ] Implementar `matchExplanationChain.js` (PromptTemplate + LLM)
- [ ] Implementar `triageResponseChain.js` (PromptTemplate + LLM)
- [ ] Implementar `queryExpansionChain.js` (expande query com features)

### Fase 4: Tools + Agent (Semana 4-5)
- [ ] Implementar tools: `searchPsychologists`, `filterByMetadata`, `getPsychologistDetails`
- [ ] Implementar `triageAgent.js` (createToolCallingAgent + AgentExecutor)
- [ ] Implementar `pipeline.js` (orquestra: extract features → agent → response)
- [ ] Testes unitários das chains e tools isoladamente

### Fase 5: API + Integração (Semana 5-6)
- [ ] Criar `triageService.js` com endpoints REST (`/triage/start`, `/triage/chat`, `/triage/finalize`)
- [ ] Middleware de autenticação opcional (paciente logado vs anônimo)
- [ ] Rate limiting específico para triagem (ex: 30 req/min)
- [ ] Logs estruturados (Winston) para auditoria + callbacks LangChain para tracing

### Fase 6: Frontend + Testes (Semana 6-7)
- [ ] Componente de chat no frontend (`TriageChat.jsx`) com streaming de resposta
- [ ] Integração com API `/triage/*`
- [ ] Testes de integração: cenários completos de triagem
- [ ] Avaliação qualitativa: 50 simulações → medir precisão do top-3

### Fase 7: Observabilidade + Hardening (Semana 7+)
- [ ] Métricas: latência p50/p95, taxa de conversão triagem→agendamento, diversidade top-5
- [ ] A/B testing: prompt templates, pesos de ranking, num rodadas
- [ ] LangSmith/LangFuse para tracing e eval (opcional)
- [ ] Fallback gracioso se Ollama indisponível (busca por keyword apenas)
- [ ] Documentação para equipe + runbook de incidentes

---

## 📚 Referências Técnicas

- [bge-m3 Embeddings](https://huggingface.co/BAAI/bge-m3) - Multilingue, sota português
- [E5-Large](https://huggingface.co/intfloat/multilingual-e5-large) - Alternativa forte
- [Chroma DB](https://docs.trychroma.com/) - Vector DB embedded
- [Ollama](https://ollama.com/) - LLM local
- [LangChain.js Docs](https://js.langchain.com/) - Orquestração, chains, agents, tools
- [LangChain + Ollama](https://js.langchain.com/docs/integrations/llms/ollama/) - Integração nativa
- [LangChain + Chroma](https://js.langchain.com/docs/integrations/vectorstores/chroma/) - Vector store integration
- [Structured Output](https://js.langchain.com/docs/how_to/structured_output/) - Zod + JsonOutputParser
- [Agents](https://js.langchain.com/docs/modules/agents/) - Tool calling agents
- [RAGAS](https://github.com/explodinggradients/ragas) - Framework de avaliação RAG
- [Hybrid Search Patterns](https://www.pinecone.io/learn/hybrid-search/) - Vector + keyword
- [Cross-encoder Reranking](https://www.sbert.net/examples/applications/cross-encoder/README.html)

---

## 📝 Notas de Decisão (ADR)

| Decisão | Justificativa |
|---------|---------------|
| **LangChain.js** | Ecossistema maduro: chains, agents, tools, structured output, streaming, callbacks; reduz boilerplate; integração nativa Chroma/Ollama |
| **Chroma embedded/server** | Zero infra extra (embedded) ou escalável (server); SQLite-based; suficiente para <50k psicólogos; LangChain tem integração nativa |
| **bge-m3 via Ollama** | Melhor qualidade português; roda local; uma instância Ollama serve embeddings + LLM; LangChain suporta nativamente |
| **1 chunk por psicólogo** | Perfil é documento coeso; chunking fragmentaria contexto; rerank resolve granularidade |
| **Sessão anônima first** | Baixa barreira de entrada; LGPD by design; vincula depois se quiser agendar |
| **Features extraídas por LLM (Structured Output)** | Mais flexível que formulário rígido; captura nuances ("não gosto de tarefa de casa" → evita TCC clássico); Zod + JsonOutputParser garante tipagem |
| **Agent + Tools** | Agente decide dinamicamente quais tools usar (buscar, filtrar, detalhar); permite multi-step reasoning; extensível para novas tools |
| **Chains separadas** | FeatureExtraction, MatchExplanation, TriageResponse são chains independentes; testáveis, versionáveis, reutilizáveis; compõem o agente |