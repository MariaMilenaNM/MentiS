/**
 * Retriever RAG - Interface de alto nível para busca semântica com filtros de metadados
 * Retorna top-k resultados (padrão: 3) com suporte a filtros combinados
 */

import {
  similaritySearch,
  similaritySearchWithScore,
  isVectorStoreReady,
  getStats,
} from './vectorStore.js';
import { logger } from '../utils/logger.js';

/**
 * Configurações padrão do Retriever
 * Em desenvolvimento (mock embeddings), usa threshold mais baixo
 */
const isMockEmbeddings = !process.env.OPENAI_API_KEY;

export const RETRIEVER_DEFAULTS = {
  topK: 3,
  minSimilarity: isMockEmbeddings ? 0.01 : 0.3, // Mock: threshold muito baixo; OpenAI: 0.3
  fetchMultiplier: 3, // Buscar Nx mais resultados para compensar filtros
};

/**
 * Filtros de metadados suportados
 * @typedef {Object} MetadataFilters
 * @property {string} [especialidade] - Especialidade do psicólogo (ex: "ansiedade", "TCC")
 * @property {string} [modalidade] - Modalidade: "ONLINE" | "PRESENCIAL" | "HIBRIDO"
 * @property {string} [estado] - Estado (UF): "SP", "RJ", etc.
 * @property {string} [cidade] - Cidade
 * @property {number} [precoMax] - Preço máximo da sessão
 * @property {string} [abordagem] - Abordagem terapêutica
 * @property {boolean} [validado] - Se o psicólogo está validado (padrão: true)
 */

/**
 * Resultado da busca
 * @typedef {Object} RetrievalResult
 * @property {string} content - Conteúdo do documento
 * @property {Object} metadata - Metadados do psicólogo
 * @property {number} similarityScore - Score de similaridade (0-1)
 */

/**
 * Busca semântica com filtros de metadados retornando top-k
 * @param {string} query - Texto da busca (linguagem natural)
 * @param {MetadataFilters} filters - Filtros de metadados
 * @param {Object} options - Opções adicionais
 * @param {number} options.topK - Número de resultados (padrão: 3)
 * @param {number} options.minSimilarity - Score mínimo de similaridade (padrão: 0.3)
 * @returns {Promise<RetrievalResult[]>} Top-k resultados ordenados por relevância
 */
export async function retrieve(query, filters = {}, options = {}) {
  const {
    topK = RETRIEVER_DEFAULTS.topK,
    minSimilarity = RETRIEVER_DEFAULTS.minSimilarity,
    fetchMultiplier = RETRIEVER_DEFAULTS.fetchMultiplier,
  } = options;

  if (!isVectorStoreReady()) {
    logger.warn('Retriever: VectorStore não está pronto');
    return [];
  }

  if (!query || query.trim().length === 0) {
    logger.warn('Retriever: Query vazia');
    return [];
  }

  try {
    // Normalizar filtros: remover valores undefined/null
    const normalizedFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== null)
    );

    // Sempre filtrar por validado = true por padrão
    if (normalizedFilters.validado === undefined) {
      normalizedFilters.validado = true;
    }

    logger.debug('Retriever: Executando busca', {
      query: query.substring(0, 100),
      filters: normalizedFilters,
      topK,
      minSimilarity,
    });

    // Buscar mais resultados para compensar filtros (fetchMultiplier * topK)
    const fetchK = topK * fetchMultiplier;

    const results = await similaritySearch(query.trim(), fetchK, normalizedFilters);

    // Filtrar por score mínimo e limitar a topK
    const filtered = results
      .filter((r) => r.score >= minSimilarity)
      .slice(0, topK)
      .map((r) => ({
        content: r.pageContent,
        metadata: r.metadata,
        similarityScore: Number(r.score.toFixed(4)),
      }));

    logger.info('Retriever: Busca concluída', {
      query: query.substring(0, 100),
      resultsCount: filtered.length,
      topK,
      filters: normalizedFilters,
    });

    return filtered;
  } catch (error) {
    logger.error('Retriever: Erro na busca', {
      error: error.message,
      query: query.substring(0, 100),
    });
    throw error;
  }
}

/**
 * Busca semântica retornando também o score bruto (para debug/rerank)
 * @param {string} query - Texto da busca
 * @param {MetadataFilters} filters - Filtros de metadados
 * @param {Object} options - Opções
 * @returns {Promise<Array<{content, metadata, similarityScore, rawScore}>>}
 */
export async function retrieveWithScore(query, filters = {}, options = {}) {
  const { topK = RETRIEVER_DEFAULTS.topK, fetchMultiplier = RETRIEVER_DEFAULTS.fetchMultiplier } =
    options;

  if (!isVectorStoreReady()) {
    return [];
  }

  const normalizedFilters = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null)
  );

  if (normalizedFilters.validado === undefined) {
    normalizedFilters.validado = true;
  }

  const fetchK = topK * fetchMultiplier;
  const results = await similaritySearchWithScore(query.trim(), fetchK, normalizedFilters);

  return results.slice(0, topK).map(([doc, score]) => ({
    content: doc.pageContent,
    metadata: doc.metadata,
    similarityScore: Number((1 - Math.min(score, 1)).toFixed(4)),
    rawScore: score, // distance score (menor = mais similar)
  }));
}

/**
 * Busca por especialidade específica
 * @param {string} especialidade - Especialidade desejada
 * @param {Object} options - Opções (topK, modalidade, estado, precoMax)
 * @returns {Promise<RetrievalResult[]>}
 */
export async function retrieveByEspecialidade(especialidade, options = {}) {
  const query = `psicólogo especialista em ${especialidade}`;
  const { topK = 3, ...filters } = options;
  return retrieve(query, { ...filters, especialidade }, { topK });
}

/**
 * Busca por modalidade (online/presencial/hibrido)
 * @param {string} modalidade - "ONLINE" | "PRESENCIAL" | "HIBRIDO"
 * @param {Object} options - Opções
 * @returns {Promise<RetrievalResult[]>}
 */
export async function retrieveByModalidade(modalidade, options = {}) {
  const query = `psicólogo ${modalidade.toLowerCase()}`;
  const { topK = 3, ...filters } = options;
  return retrieve(query, { ...filters, modalidade }, { topK });
}

/**
 * Busca por localização (estado/cidade)
 * @param {string} estado - UF do estado
 * @param {string} [cidade] - Cidade opcional
 * @param {Object} options - Opções
 * @returns {Promise<RetrievalResult[]>}
 */
export async function retrieveByLocation(estado, cidade, options = {}) {
  const query = cidade ? `psicólogo em ${cidade} ${estado}` : `psicólogo em ${estado}`;
  const { topK = 3, ...filters } = options;
  return retrieve(query, { ...filters, estado, cidade }, { topK });
}

/**
 * Busca por faixa de preço
 * @param {number} precoMax - Preço máximo
 * @param {Object} options - Opções
 * @returns {Promise<RetrievalResult[]>}
 */
export async function retrieveByPrice(precoMax, options = {}) {
  const query = `psicólogo preço até ${precoMax} reais`;
  const { topK = 3, ...filters } = options;
  return retrieve(query, { ...filters, precoMax }, { topK });
}

/**
 * Busca combinada avançada (texto livre + múltiplos filtros)
 * @param {string} query - Texto livre
 * @param {MetadataFilters} filters - Filtros combinados
 * @param {number} topK - Limite de resultados
 * @returns {Promise<RetrievalResult[]>}
 */
export async function advancedRetrieve(query, filters = {}, topK = 3) {
  return retrieve(query, filters, { topK });
}

/**
 * Obtém estatísticas do retriever/vector store
 * @returns {Promise<Object>}
 */
export async function getRetrieverStats() {
  const stats = getStats();
  return {
    ...stats,
    retrieverDefaults: RETRIEVER_DEFAULTS,
  };
}

/**
 * Verifica saúde do retriever
 * @returns {Promise<{status: string, vectorStoreReady: boolean}>}
 */
export async function healthCheck() {
  return {
    status: isVectorStoreReady() ? 'healthy' : 'unhealthy',
    vectorStoreReady: isVectorStoreReady(),
  };
}

export default {
  retrieve,
  retrieveWithScore,
  retrieveByEspecialidade,
  retrieveByModalidade,
  retrieveByLocation,
  retrieveByPrice,
  advancedRetrieve,
  getRetrieverStats,
  healthCheck,
  RETRIEVER_DEFAULTS,
};
