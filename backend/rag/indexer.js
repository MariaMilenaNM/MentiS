/**
 * Indexador de psicólogos validados no Vector Store.
 * Busca psicólogos com validado=true no banco, constrói texto + metadados, e indexa.
 */

import { psicologoRepository } from '../repository/psicologoRepository.js';
import { addDocuments, clearVectorStore, getVectorStoreStats } from './vectorStore.js';
import { buildPsychologistText, buildPsychologistMetadata } from './textBuilder.js';
import { logger } from '../utils/logger.js';
import { RAG_CONSTANTS } from './utils/constants.js';

/**
 * Indexa todos os psicólogos validados atualmente no banco
 * @param {Object} options - Opções de indexação
 * @param {boolean} options.clearFirst - Se deve limpar o vector store antes
 * @param {number} options.batchSize - Tamanho do lote para processamento
 * @returns {Object} Resultado da indexação
 */
export async function indexValidatedPsychologists(options = {}) {
  const { clearFirst = false, batchSize = RAG_CONSTANTS.INDEXING.BATCH_SIZE } = options;

  const startTime = Date.now();
  logger.info('Iniciando indexação de psicólogos validados', { clearFirst, batchSize });

  try {
    // Limpa vector store se solicitado
    if (clearFirst) {
      await clearVectorStore();
    }

    // Busca psicólogos validados com include do usuário
    const psicologos = await psicologoRepository.findAll({ validado: true });

    if (!psicologos || psicologos.length === 0) {
      logger.warn('Nenhum psicólogo validado encontrado para indexar');
      return {
        success: true,
        indexed: 0,
        skipped: 0,
        errors: 0,
        durationMs: Date.now() - startTime,
        message: 'Nenhum psicólogo validado encontrado',
      };
    }

    logger.info(`Encontrados ${psicologos.length} psicólogos validados para indexar`);

    // Processa em lotes
    let indexed = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < psicologos.length; i += batchSize) {
      const batch = psicologos.slice(i, i + batchSize);
      const batchDocuments = [];

      for (const psicologo of batch) {
        try {
          // Constrói texto e metadados
          const text = buildPsychologistText(psicologo);
          const metadata = buildPsychologistMetadata(psicologo);

          if (!text || text.trim().length < 20) {
            logger.warn('Texto muito curto para indexar, pulando', {
              psicologoId: psicologo.id,
              textLength: text?.length,
            });
            skipped++;
            continue;
          }

          batchDocuments.push({
            pageContent: text,
            metadata,
          });
        } catch (docError) {
          logger.error('Erro ao preparar documento do psicólogo', {
            psicologoId: psicologo.id,
            error: docError.message,
          });
          errors++;
        }
      }

      // Adiciona lote ao vector store
      if (batchDocuments.length > 0) {
        try {
          await addDocuments(batchDocuments);
          indexed += batchDocuments.length;
          logger.debug(`Lote indexado: ${batchDocuments.length} documentos`);
        } catch (batchError) {
          logger.error('Erro ao indexar lote', {
            error: batchError.message,
            batchSize: batchDocuments.length,
          });
          errors += batchDocuments.length;
        }
      }
    }

    // Estatísticas finais
    const stats = await getVectorStoreStats();
    const durationMs = Date.now() - startTime;

    const result = {
      success: errors === 0,
      indexed,
      skipped,
      errors,
      totalInDb: psicologos.length,
      vectorStoreCount: stats.documentCount,
      durationMs,
    };

    logger.info('Indexação de psicólogos validados concluída', result);

    return result;
  } catch (error) {
    logger.error('Erro fatal na indexação de psicólogos', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Indexa um único psicólogo (usado no cadastro automático)
 * @param {number} psicologoId - ID do psicólogo
 * @returns {Object} Resultado da indexação
 */
export async function indexSinglePsychologist(psicologoId) {
  logger.info('Indexando psicólogo individual', { psicologoId });

  try {
    const psicologo = await psicologoRepository.findById(psicologoId);

    if (!psicologo) {
      logger.warn('Psicólogo não encontrado para indexação individual', { psicologoId });
      return { success: false, reason: 'not_found' };
    }

    if (!psicologo.validado) {
      logger.info('Psicólogo não validado, não indexando', { psicologoId });
      return { success: false, reason: 'not_validated' };
    }

    const text = buildPsychologistText(psicologo);
    const metadata = buildPsychologistMetadata(psicologo);

    if (!text || text.trim().length < 20) {
      logger.warn('Texto muito curto para indexar', { psicologoId });
      return { success: false, reason: 'text_too_short' };
    }

    await addDocuments([{ pageContent: text, metadata }]);

    logger.info('Psicólogo indexado com sucesso', { psicologoId });
    return { success: true, psicologoId };
  } catch (error) {
    logger.error('Erro ao indexar psicólogo individual', {
      psicologoId,
      error: error.message,
    });
    return { success: false, reason: 'error', error: error.message };
  }
}

/**
 * Reindexa todos os psicólogos validados (limpa e reindexa)
 */
export async function reindexAllPsychologists() {
  return await indexValidatedPsychologists({ clearFirst: true });
}

/**
 * Remove um psicólogo do vector store (não suportado nativamente no MemoryVectorStore)
 * Para MemoryVectorStore, precisa reindexar tudo.
 * @param {number} psicologoId
 */
export async function removePsychologist(psicologoId) {
  logger.warn('Remoção individual não suportada no MemoryVectorStore - use reindexAllPsychologists()', {
    psicologoId,
  });
  // Futuro: implementar com Chroma server que suporta delete por metadata
  return { success: false, reason: 'not_supported_memory_store' };
}

export default {
  indexValidatedPsychologists,
  indexSinglePsychologist,
  reindexAllPsychologists,
  removePsychologist,
};