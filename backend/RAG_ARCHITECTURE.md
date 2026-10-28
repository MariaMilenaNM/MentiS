# Arquitetura RAG - MentiS

> Documento de referência para implementação futura do sistema RAG (Retrieval-Augmented Generation).
> **Status**: Planejamento - não implementado.

---

## 🎯 Objetivo

Adicionar capacidades de IA generativa com conhecimento clínico ao MentiS, permitindo:
- Psicoeducação personalizada para pacientes
- Suporte a decisão clínica para profissionais
- Sumarização de histórico/anamnese
- Respostas baseadas em protocolos e literatura validada

---

## 🏗️ Estrutura de Pastas Proposta

```
backend/
├── rag/
│   ├── indexer.js           # Carrega docs, chunking, embeddings, upsert no vector DB
│   ├── retriever.js         # Busca semântica + rerank
│   ├── generator.js         # Prompt template + chamada LLM
│   ├── pipeline.js          # Orquestra: query → retrieve → generate → response
│   └── vectorStore.js       # Abstração do vector DB (Chroma, Pinecone, etc.)
├── services/
│   └── ragService.js        # Camada de API (endpoints /rag/query, /rag/index)
└── prisma/
    └── schema.prisma        # + models: Document, Chunk, EmbeddingJob
```

---

## 🔌 Novas Rotas API Propostas

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/rag/index` | Indexa documentos (PDF, TXT, MD) |
| POST | `/rag/query` | Pergunta → busca contexto → gera resposta |
| GET | `/rag/status/:jobId` | Status de job de indexação assíncrono |

---

## 🛠️ Stack Tecnológica Sugerida

| Componente | Opção Local (Privacidade) | Opção Cloud (Performance) |
|------------|---------------------------|---------------------------|
| **Vector DB** | Chroma (SQLite-based) | Pinecone, Weaviate, Qdrant Cloud |
| **Embeddings** | `sentence-transformers` via `node-llama-cpp` / Ollama | OpenAI `text-embedding-3-small`, Cohere, HuggingFace Inference |
| **LLM** | Ollama (Llama 3, Mistral, Gemma) | OpenAI GPT-4o, Anthropic Claude, Gemini |
| **Orquestração** | LangChain.js ou implementação própria leve | LangChain.js, LlamaIndex |

**Recomendação inicial**: **Stack local (Ollama + Chroma)** para privacidade de dados de saúde (LGPD/HIPAA), com fallback para APIs se necessário.

---

## 🗄️ Models Prisma Propostos

```prisma
model Document {
  id          String   @id @default(cuid())
  title       String
  source      String   // "protocol", "anamnesis", "psychoeducation", "custom"
  sourceId    String?  // ID do paciente/profissional se vinculado
  content     String   // Texto original ou path do arquivo
  metadata    Json?    // { autor, data, tags, categoria, etc. }
  status      String   @default("pending") // pending, processing, completed, failed
  chunks      Chunk[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Chunk {
  id            String   @id @default(cuid())
  documentId    String
  document      Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  content       String
  chunkIndex    Int
  tokenCount    Int
  embedding     Byte[]?  // Ou reference para vector DB externo
  metadata      Json?    // { page, section, keywords, etc. }
  createdAt     DateTime @default(now())
  
  @@index([documentId])
}

model EmbeddingJob {
  id          String   @id @default(cuid())
  documentId  String
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  status      String   @default("queued") // queued, processing, completed, failed
  progress    Int      @default(0)
  error       String?
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())
  
  @@index([documentId])
}
```

---

## 🔄 Pipeline RAG (Fluxo de Dados)

### Indexação (Offline/Assíncrono)
```
Documento (PDF/TXT/MD)
    ↓
Text Splitter (RecursiveCharacterTextSplitter / SemanticChunker)
    ↓
Chunks (500-1000 tokens, overlap 100-200)
    ↓
Embedding Model → Vetores (768-3072 dims)
    ↓
Vector DB (Chroma) + Metadados no Prisma
    ↓
Status: completed
```

### Consulta (Online/Síncrono)
```
Query do usuário (paciente ou profissional)
    ↓
Embedding da query
    ↓
Vector Search (top-k: 5-10, similarity threshold)
    ↓
Rerank (opcional: Cross-encoder / LLM-based)
    ↓
Contexto recuperado + Prompt Template
    ↓
LLM → Resposta estruturada
    ↓
Retorna: { answer, sources[], confidence }
```

---

## 🔐 Segurança e Privacidade (CRÍTICO)

- **Dados sensíveis**: Anamneses, prontuários → **NUNCA** enviar para APIs externas sem consentimento explícito e anonimização
- **LGPD/HIPAA**: Preferir stack 100% local (Ollama + Chroma) para dados clínicos
- **Controle de acesso**: 
  - Paciente vê apenas seus documentos + psicoeducação pública
  - Profissional vê seus pacientes + protocolos clínicos
  - Admin vê tudo
- **Auditoria**: Log de todas as queries RAG (quem, o que, quando, quais chunks usados)

---

## 📋 Endpoints Detalhados

### POST `/rag/index`
```json
// Request
{
  "title": "Protocolo Ansiedade Generalizada",
  "source": "protocol",
  "content": "Texto completo do protocolo...",
  "metadata": { "categoria": "ansiedade", "versao": "2024", "autor": "CFP" }
}

// Response
{ "jobId": "emb_abc123", "status: "queued" }
```

### POST `/rag/query`
```json
// Request (requer JWT)
{
  "question": "Como explicar TCC para um paciente com ansiedade?",
  "context": { "pacienteId": 12, "filtro": "psychoeducation" },
  "topK": 5,
  "temperature": 0.3
}

// Response
{
  "answer": "A TCC (Terapia Cognitivo-Comportamental) funciona...",
  "sources": [
    { "documentId": "doc_1", "title": "Protocolo Ansiedade", "chunk": "Trecho relevante...", "score": 0.92 }
  ],
  "confidence": 0.87
}
```

---

## 🧪 Tech Debt / Riscos Conhecidos

1. **Qualidade de embeddings português** - Modelos multilingues (e5, bge-m3) > modelos só inglês
2. **Chunking semântico** - Recursive splitter pode cortar conceitos; avaliar semantic chunking
3. **Latência** - LLM local (Ollama) ~2-10s; considerar streaming + cache
4. **Alucinação** - Sempre citar fontes; implementar "não sei" quando score < threshold
5. **Custo/Recursos** - GPU necessária para embeddings/LLM locais; planejar infra

---

## 📅 Próximos Passos (Quando Implementar)

1. [ ] Definir stack final (local vs cloud) com stakeholder
2. [ ] Adicionar models Prisma + migration
3. [ ] Criar pasta `rag/` com `vectorStore.js` (abstração Chroma)
4. [ ] Implementar `indexer.js` com chunking + embedding
5. [ ] Implementar `retriever.js` + `generator.js`
6. [ ] Criar `pipeline.js` orquestrando tudo
7. [ ] Expor `ragService.js` com endpoints REST
8. [ ] Adicionar autenticação/autorização nos endpoints
9. [ ] Testes de integração + avaliação de qualidade (RAGAS)
10. [ ] Documentar para frontend consumir

---

## 📚 Referências

- [RAGAS Evaluation Framework](https://github.com/explodinggradients/ragas)
- [Chroma DB Docs](https://docs.trychroma.com/)
- [Ollama](https://ollama.com/)
- [LangChain.js](https://js.langchain.com/)
- [Sentence Transformers](https://www.sbert.net/)