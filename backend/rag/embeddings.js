/**
 * Configuração de Embeddings para RAG
 * Suporta OpenAI (pago) ou provedor local via transformers.js
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { logger } from '../utils/logger.js';

/**
 * Cria instância de embeddings baseada na configuração
 * @returns {OpenAIEmbeddings|Object} Instância de embeddings
 */
export function createEmbeddings() {
  // Verificar se tem chave OpenAI
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (openaiApiKey) {
    logger.info('Usando OpenAI Embeddings (text-embedding-3-small)');
    return new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      openAIApiKey: openaiApiKey,
      dimensions: 1536, // text-embedding-3-small usa 1536 dimensões
    });
  }

  // Fallback: embedding mock para desenvolvimento/teste
  // Em produção, configurar OPENAI_API_KEY ou provedor local
  logger.warn('OPENAI_API_KEY não configurada - usando embeddings mock (apenas desenvolvimento)');

  return {
    embedDocuments: async (texts) => {
      // Mock: retorna vetores aleatórios normalizados para teste
      return texts.map(() => {
        const vec = new Array(1536).fill(0).map(() => Math.random() - 0.5);
        // Normalizar
        const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
        return vec.map((v) => v / norm);
      });
    },
    embedQuery: async (_text) => {
      const vec = new Array(1536).fill(0).map(() => Math.random() - 0.5);
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      return vec.map((v) => v / norm);
    },
  };
}

// Instância singleton
let embeddingsInstance = null;

export function getEmbeddings() {
  if (!embeddingsInstance) {
    embeddingsInstance = createEmbeddings();
  }
  return embeddingsInstance;
}
