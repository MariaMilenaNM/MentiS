/**
 * Módulo RAG - Exportações principais
 * Sistema de Retrieval-Augmented Generation para psicólogos validados
 */

// Embeddings
export { createEmbeddings, getEmbeddings } from './embeddings.js';

// Vector Store
export {
  getVectorStore,
  isVectorStoreReady,
  initializeVectorStore,
  addDocuments,
  upsertDocument,
  similaritySearch,
  similaritySearchWithScore,
  getStats,
  resetVectorStore,
} from './vectorStore.js';

// Ingestion
export {
  ingestPsychologists,
  reingestPsychologist,
  upsertPsychologist,
  initializeRAG,
  formatPsychologistDocument,
} from './ingestion.js';

// Search
export {
  searchPsychologists,
  searchByEspecialidade,
  searchByLocation,
  searchByPrice,
  advancedSearch,
  getSearchSuggestions,
} from './search.js';
