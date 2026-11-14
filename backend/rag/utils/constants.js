/**
 * Constantes compartilhadas do módulo RAG
 */

export const RAG_CONSTANTS = {
  // Configurações do Vector Store
  VECTOR_STORE: {
    COLLECTION_NAME: 'profissionais',
    // MemoryVectorStore não precisa de URL - é in-memory
  },

  // Configurações do Ollama
  OLLAMA: {
    BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    EMBEDDING_MODEL: process.env.OLLAMA_EMBEDDING_MODEL || 'bge-m3',
    LLM_MODEL: process.env.OLLAMA_LLM_MODEL || 'llama3.1:8b',
  },

  // Configurações de indexação
  INDEXING: {
    CHUNK_SIZE: 500,
    CHUNK_OVERLAP: 100,
    BATCH_SIZE: 10,
  },

  // Metadados padrão para documentos de psicólogos
  PSYCHOLOGIST_METADATA: {
    SOURCE: 'profissional_profile',
    VERSION: 1,
  },
};

export default RAG_CONSTANTS;