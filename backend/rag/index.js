/**
 * Exportações principais do módulo RAG
 */

export * from './vectorStore.js';
export * from './indexer.js';
export * from './textBuilder.js';
export * from './utils/constants.js';

// Re-export para compatibilidade
import * as vectorStore from './vectorStore.js';
import * as indexer from './indexer.js';
import * as textBuilder from './textBuilder.js';
import * as constants from './utils/constants.js';

export default {
  vectorStore,
  indexer,
  textBuilder,
  constants,
};