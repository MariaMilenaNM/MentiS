/**
 * Funcionalidade de busca semântica no VectorStore RAG
 */

import { similaritySearchWithScore, isVectorStoreReady } from './vectorStore.js';
import { logger } from '../utils/logger.js';

/**
 * Busca psicólogos por similaridade semântica
 * @param {string} query - Texto da busca (ex: "psicólogo especialista em ansiedade em São Paulo")
 * @param {Object} options - Opções de busca
 * @param {number} options.k - Número de resultados (padrão: 5)
 * @param {Object} options.filters - Filtros de metadados (ex: { modalidade: 'ONLINE', estado: 'SP' })
 * @param {number} options.minScore - Score mínimo de similaridade 0-1 (padrão: 0.3)
 * @returns {Promise<Array<Object>>} Resultados da busca
 */
export async function searchPsychologists(query, options = {}) {
  const { k = 5, filters = {}, minScore = 0.3 } = options;

  if (!isVectorStoreReady()) {
    logger.warn('Busca RAG solicitada mas VectorStore não está pronto');
    return [];
  }

  if (!query || query.trim().length === 0) {
    logger.warn('Query de busca vazia');
    return [];
  }

  try {
    logger.debug('Executando busca semântica', { query, k, filters, minScore });

    // Buscar com score
    const results = await similaritySearchWithScore(query, k, filters);

    // Filtrar por score mínimo e formatar resposta
    const filtered = results
      .filter(([_, score]) => 1 - score >= minScore)
      .map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        similarityScore: 1 - score, // 0-1, maior = mais similar
      }));

    logger.info(`Busca RAG: ${filtered.length} resultados para "${query}"`);
    return filtered;
  } catch (error) {
    logger.error('Erro na busca semântica', { error: error.message, query });
    throw error;
  }
}

/**
 * Busca psicólogos por especialidade (combina busca semântica + filtro)
 * @param {string} especialidade - Especialidade desejada
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Array<Object>>}
 */
export async function searchByEspecialidade(especialidade, options = {}) {
  const query = `psicólogo especialista em ${especialidade}`;

  // Como HNSWLib tem suporte limitado a filtros,
  // fazemos busca semântica ampla e filtramos em memória
  const results = await searchPsychologists(query, { ...options, k: options.k || 10 });

  // Filtrar em memória por especialidade
  const filtered = results.filter((r) =>
    r.metadata.especialidades?.some((e) => e.toLowerCase().includes(especialidade.toLowerCase()))
  );

  return filtered.slice(0, options.k || 5);
}

/**
 * Busca psicólogos por localização
 * @param {string} cidade - Cidade
 * @param {string} estado - Estado (UF)
 * @param {Object} options - Opções
 * @returns {Promise<Array<Object>>}
 */
export async function searchByLocation(cidade, estado, options = {}) {
  const query = `psicólogo em ${cidade} ${estado}`;
  const results = await searchPsychologists(query, { ...options, k: options.k || 10 });

  // Filtrar em memória por localização
  const filtered = results.filter(
    (r) =>
      r.metadata.cidade?.toLowerCase().includes(cidade.toLowerCase()) ||
      r.metadata.estado?.toLowerCase() === estado.toLowerCase()
  );

  return filtered.slice(0, options.k || 5);
}

/**
 * Busca psicólogos por faixa de preço
 * @param {number} precoMax - Preço máximo
 * @param {Object} options - Opções
 * @returns {Promise<Array<Object>>}
 */
export async function searchByPrice(precoMax, options = {}) {
  const query = `psicólogo preço até ${precoMax} reais`;
  const results = await searchPsychologists(query, { ...options, k: options.k || 10 });

  const filtered = results.filter((r) => r.metadata.preco <= precoMax);
  return filtered.slice(0, options.k || 5);
}

/**
 * Busca combinada: texto + filtros opcionais
 * @param {string} query - Texto livre
 * @param {Object} filters - Filtros: { especialidade, modalidade, estado, precoMax }
 * @param {number} k - Limite de resultados
 * @returns {Promise<Array<Object>>}
 */
export async function advancedSearch(query, filters = {}, k = 5) {
  let results = await searchPsychologists(query, { k: k * 3 }); // Buscar mais para filtrar

  // Aplicar filtros em memória (MemoryVectorStore tem suporte limitado)
  if (filters.especialidade) {
    results = results.filter((r) =>
      r.metadata.especialidades?.some((e) =>
        e.toLowerCase().includes(filters.especialidade.toLowerCase())
      )
    );
  }
  if (filters.modalidade) {
    results = results.filter((r) => r.metadata.modalidade === filters.modalidade);
  }
  if (filters.estado) {
    results = results.filter(
      (r) => r.metadata.estado?.toLowerCase() === filters.estado.toLowerCase()
    );
  }
  if (filters.precoMax) {
    results = results.filter((r) => r.metadata.preco <= filters.precoMax);
  }

  return results.slice(0, k);
}

/**
 * Obtém sugestões de busca baseadas em consultas populares
 * @returns {Array<string>}
 */
export function getSearchSuggestions() {
  return [
    'psicólogo para ansiedade',
    'terapia cognitivo comportamental',
    'psicólogo online',
    'psicólogo presencial em São Paulo',
    'especialista em depressão',
    'terapia de casal',
    'psicólogo infantil',
    'atendimento humanista',
    'psicanálise',
    'terapia breve',
  ];
}
