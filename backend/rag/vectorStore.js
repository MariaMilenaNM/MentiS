/**
 * HNSWLib VectorStore Singleton para RAG
 * Armazena documentos dos psicólogos validados em memória com embeddings
 * Usa HNSWLib (Hierarchical Navigable Small World) para busca vetorial eficiente
 */

import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { getEmbeddings } from './embeddings.js';
import { logger } from '../utils/logger.js';
import { promises as fs } from 'fs';
import path from 'path';

// Instância singleton do vector store
let vectorStoreInstance = null;
let isInitialized = false;
const STORE_PATH = path.join(process.cwd(), 'rag-store');

/**
 * Obtém a instância do HNSWLib VectorStore
 * @returns {HNSWLib|null} Instância do vector store ou null se não inicializado
 */
export function getVectorStore() {
  return vectorStoreInstance;
}

/**
 * Verifica se o vector store está inicializado
 * @returns {boolean}
 */
export function isVectorStoreReady() {
  return isInitialized && vectorStoreInstance !== null;
}

/**
 * Inicializa o HNSWLib VectorStore
 * Tenta carregar do disco se existir, senão cria novo
 * @returns {Promise<HNSWLib>} Instância inicializada
 */
export async function initializeVectorStore() {
  if (isInitialized && vectorStoreInstance) {
    logger.info('VectorStore já inicializado');
    return vectorStoreInstance;
  }

  try {
    const embeddings = getEmbeddings();

    // Tentar carregar store existente
    let storeExists = false;
    try {
      await fs.access(STORE_PATH);
      storeExists = true;
    } catch {
      storeExists = false;
    }

    if (storeExists) {
      logger.info('Carregando VectorStore existente do disco...');
      vectorStoreInstance = await HNSWLib.load(STORE_PATH, embeddings);
    } else {
      logger.info('Criando novo VectorStore (HNSWLib)...');
      vectorStoreInstance = await HNSWLib.fromTexts(
        [], // textos vazios inicialmente
        [], // metadados vazios
        embeddings
      );
    }

    isInitialized = true;
    logger.info('HNSWLib VectorStore inicializado com sucesso');
    return vectorStoreInstance;
  } catch (error) {
    logger.error('Erro ao inicializar HNSWLib VectorStore', { error: error.message });
    throw error;
  }
}

/**
 * Salva o vector store no disco
 * @returns {Promise<void>}
 */
export async function saveVectorStore() {
  if (!isVectorStoreReady()) {
    logger.warn('VectorStore não inicializado - nada para salvar');
    return;
  }

  try {
    await fs.mkdir(STORE_PATH, { recursive: true });
    await vectorStoreInstance.save(STORE_PATH);
    logger.info('VectorStore salvo no disco', { path: STORE_PATH });
  } catch (error) {
    logger.error('Erro ao salvar VectorStore', { error: error.message });
  }
}

/**
 * Adiciona documentos ao vector store
 * @param {Array<{pageContent: string, metadata: Object}>} documents - Documentos no formato LangChain
 * @returns {Promise<void>}
 */
export async function addDocuments(documents) {
  if (!isVectorStoreReady()) {
    await initializeVectorStore();
  }

  try {
    await vectorStoreInstance.addDocuments(
      documents.map((d) => ({
        pageContent: d.pageContent,
        metadata: d.metadata,
      }))
    );

    // Salvar após adicionar
    await saveVectorStore();

    logger.info(`Adicionados ${documents.length} documentos ao VectorStore`);
  } catch (error) {
    logger.error('Erro ao adicionar documentos ao VectorStore', { error: error.message });
    throw error;
  }
}

/**
 * Busca por similaridade no vector store
 * @param {string} query - Texto da busca
 * @param {number} k - Número de resultados (padrão: 5)
 * @param {Object} filter - Filtro de metadados (opcional - HNSWLib tem suporte limitado)
 * @returns {Promise<Array<{pageContent: string, metadata: Object, score: number}>>}
 */
export async function similaritySearch(query, k = 5, filter = {}) {
  if (!isVectorStoreReady()) {
    logger.warn('VectorStore não inicializado - retornando resultados vazios');
    return [];
  }

  try {
    const results = await vectorStoreInstance.similaritySearchWithScore(query, k, filter);
    return results.map(([doc, score]) => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
      score: 1 - score, // Converter distância para similaridade (0-1)
    }));
  } catch (error) {
    logger.error('Erro na busca por similaridade', { error: error.message, query });
    throw error;
  }
}

/**
 * Busca por similaridade com score bruto
 * @param {string} query
 * @param {number} k
 * @param {Object} filter
 * @returns {Promise<Array<{doc: Document, score: number}>>}
 */
export async function similaritySearchWithScore(query, k = 5, filter = {}) {
  if (!isVectorStoreReady()) {
    return [];
  }
  return await vectorStoreInstance.similaritySearchWithScore(query, k, filter);
}

/**
 * Obtém estatísticas do vector store
 * @returns {Object} Estatísticas
 */
export function getStats() {
  if (!vectorStoreInstance) {
    return { initialized: false, documentCount: 0 };
  }

  return {
    initialized: isInitialized,
    documentCount: vectorStoreInstance.docstore?.length || 0,
  };
}

/**
 * Adiciona ou atualiza um único documento no vector store (upsert)
 * Nota: HNSWLib não suporta deleção por ID, então isso apenas adiciona.
 * Para updates reais, recomenda-se re-ingestão completa.
 * @param {Object} document - Documento no formato { pageContent, metadata }
 * @returns {Promise<void>}
 */
export async function upsertDocument(document) {
  if (!isVectorStoreReady()) {
    await initializeVectorStore();
  }

  try {
    await vectorStoreInstance.addDocuments([
      {
        pageContent: document.pageContent,
        metadata: document.metadata,
      },
    ]);

    // Salvar após adicionar
    await saveVectorStore();

    logger.info(`Documento upsertado no VectorStore`, {
      psicologoId: document.metadata?.psicologoId,
    });
  } catch (error) {
    logger.error('Erro ao fazer upsert de documento', { error: error.message });
    throw error;
  }
}

/**
 * Reseta o vector store (útil para testes ou re-ingestão completa)
 * @returns {Promise<void>}
 */
export async function resetVectorStore() {
  vectorStoreInstance = null;
  isInitialized = false;
  // Remover diretório do store
  try {
    await fs.rm(STORE_PATH, { recursive: true, force: true });
  } catch {
    // Ignorar erro se não existir
  }
  await initializeVectorStore();
  logger.info('VectorStore resetado');
}
