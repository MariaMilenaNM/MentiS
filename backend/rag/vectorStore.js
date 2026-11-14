/**
 * Abstração do Vector Store usando MemoryVectorStore do LangChain (desenvolvimento local).
 * Em produção, migrar para Chroma server ou Qdrant.
 */

import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OllamaEmbeddings } from '@langchain/ollama';
import { logger } from '../utils/logger.js';
import { RAG_CONSTANTS } from './utils/constants.js';

let vectorStoreInstance = null;
let embeddingsInstance = null;

/**
 * Inicializa (ou retorna instância existente) do MemoryVectorStore com embeddings Ollama
 */
export async function getVectorStore() {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  try {
    // Inicializa embeddings Ollama
    embeddingsInstance = new OllamaEmbeddings({
      baseUrl: RAG_CONSTANTS.OLLAMA.BASE_URL,
      model: RAG_CONSTANTS.OLLAMA.EMBEDDING_MODEL,
    });

    // Testa conexão com Ollama
    await embeddingsInstance.embedQuery('teste de conexão');
    logger.info('Conexão com Ollama embeddings estabelecida', {
      model: RAG_CONSTANTS.OLLAMA.EMBEDDING_MODEL,
      baseUrl: RAG_CONSTANTS.OLLAMA.BASE_URL,
    });

    // Cria MemoryVectorStore vazio (documentos serão adicionados via indexer)
    vectorStoreInstance = new MemoryVectorStore(embeddingsInstance);

    logger.info('MemoryVectorStore inicializado com sucesso');
    return vectorStoreInstance;
  } catch (error) {
    logger.error('Erro ao inicializar Vector Store', {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Falha ao inicializar Vector Store: ${error.message}`);
  }
}

/**
 * Adiciona documentos ao vector store
 * @param {Array<{pageContent: string, metadata: Object}>} documents - Documentos para indexar
 */
export async function addDocuments(documents) {
  const store = await getVectorStore();

  if (!documents || documents.length === 0) {
    logger.warn('addDocuments: nenhum documento fornecido');
    return;
  }

  try {
    await store.addDocuments(documents);
    logger.info('Documentos adicionados ao Vector Store', {
      count: documents.length,
    });
  } catch (error) {
    logger.error('Erro ao adicionar documentos ao Vector Store', {
      error: error.message,
      count: documents.length,
    });
    throw error;
  }
}

/**
 * Busca por similaridade no vector store
 * @param {string} query - Query de busca
 * @param {number} k - Número de resultados
 * @param {Object} filter - Filtro de metadados (opcional)
 * @returns {Array<{pageContent: string, metadata: Object, score: number}>}
 */
export async function similaritySearch(query, k = 10, filter = {}) {
  const store = await getVectorStore();

  try {
    // MemoryVectorStore não suporta filtro nativo, filtramos após a busca
    const results = await store.similaritySearchWithScore(query, k * 3); // Busca mais para compensar filtro manual

    let filtered = results
      .filter(([doc]) => {
        if (Object.keys(filter).length === 0) return true;
        return Object.entries(filter).every(([key, value]) => doc.metadata[key] === value);
      })
      .slice(0, k)
      .map(([doc, score]) => ({
        pageContent: doc.pageContent,
        metadata: doc.metadata,
        // Converter distance para similarity (0-1, onde 1 = mais similar)
        similarity: 1 - Math.min(score, 1),
      }));

    logger.debug('Busca por similaridade realizada', {
      query: query.substring(0, 100),
      resultsCount: filtered.length,
      requestedK: k,
    });

    return filtered;
  } catch (error) {
    logger.error('Erro na busca por similaridade', {
      error: error.message,
      query: query.substring(0, 100),
    });
    throw error;
  }
}

/**
 * Busca por similaridade com score bruto (para debug/rerank)
 * @param {string} query
 * @param {number} k
 * @returns {Array<{pageContent: string, metadata: Object, score: number}>}
 */
export async function similaritySearchWithScore(query, k = 10) {
  const store = await getVectorStore();

  try {
    const results = await store.similaritySearchWithScore(query, k);
    return results.map(([doc, score]) => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
      score, // distance score (menor = mais similar)
      similarity: 1 - Math.min(score, 1),
    }));
  } catch (error) {
    logger.error('Erro na busca com score', { error: error.message });
    throw error;
  }
}

/**
 * Limpa o vector store (recria instância vazia)
 */
export async function clearVectorStore() {
  vectorStoreInstance = null;
  embeddingsInstance = null;
  logger.info('Vector Store limpo - próxima chamada recriará instância');
}

/**
 * Retorna estatísticas do vector store
 */
export async function getVectorStoreStats() {
  const store = await getVectorStore();
  // MemoryVectorStore não expõe count diretamente, estimativa via busca ampla
  try {
    const all = await store.similaritySearchWithScore('', 1000);
    return {
      documentCount: all.length,
      type: 'MemoryVectorStore',
      embeddingModel: RAG_CONSTANTS.OLLAMA.EMBEDDING_MODEL,
    };
  } catch {
    return {
      documentCount: 0,
      type: 'MemoryVectorStore',
      embeddingModel: RAG_CONSTANTS.OLLAMA.EMBEDDING_MODEL,
    };
  }
}

/**
 * Verifica se o vector store está saudável (consegue fazer embedding)
 */
export async function healthCheck() {
  try {
    const store = await getVectorStore();
    await store.similaritySearchWithScore('health check', 1);
    return { status: 'healthy', type: 'MemoryVectorStore' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

export default {
  getVectorStore,
  addDocuments,
  similaritySearch,
  similaritySearchWithScore,
  clearVectorStore,
  getVectorStoreStats,
  healthCheck,
};