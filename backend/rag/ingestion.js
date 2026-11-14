/**
 * Ingestão de dados dos psicólogos validados para o VectorStore RAG
 * Cria 1 documento por psicólogo com texto rico + metadados estruturados
 */

import { psicologoRepository } from '../repository/psicologoRepository.js';
import { addDocuments, initializeVectorStore, resetVectorStore } from './vectorStore.js';
import { logger } from '../utils/logger.js';

/**
 * Formata um psicólogo como documento LangChain (pageContent + metadata)
 * @param {Object} psicologo - Objeto do psicólogo do Prisma (com include usuario)
 * @returns {Object} Documento no formato { pageContent, metadata }
 */
export function formatPsychologistDocument(psicologo) {
  const usuario = psicologo.usuario || {};
  const especialidades = psicologo.especialidades ? JSON.parse(psicologo.especialidades) : [];

  // Construir texto rico para embedding
  const pageContent = `
Nome: ${psicologo.nome || usuario.email || 'Psicólogo'}
CRP: ${psicologo.crp}
Bio: ${psicologo.bio || 'Não informada'}
Especialidades: ${especialidades.join(', ') || 'Não informadas'}
Abordagem: ${psicologo.abordagem}
Preço por sessão: R$ ${psicologo.preco?.toFixed(2) || 'Não informado'}
Modalidade: ${psicologo.modalidade}
Localização: ${psicologo.cidade || 'Não informada'}, ${psicologo.estado || 'Não informado'}
`.trim();

  // Metadados estruturados para filtragem pós-busca
  const metadata = {
    psicologoId: psicologo.id,
    crp: psicologo.crp,
    nome: psicologo.nome || usuario.email || 'Psicólogo',
    email: usuario.email,
    especialidades: especialidades,
    abordagem: psicologo.abordagem,
    preco: psicologo.preco,
    modalidade: psicologo.modalidade,
    cidade: psicologo.cidade,
    estado: psicologo.estado,
    fotoUrl: psicologo.fotoUrl,
    validado: psicologo.validado,
    criadoEm: psicologo.criadoEm?.toISOString(),
    atualizadoEm: psicologo.atualizadoEm?.toISOString(),
  };

  return { pageContent, metadata };
}

/**
 * Ingere todos os psicólogos validados no VectorStore
 * @param {boolean} forceReset - Se true, limpa o vector store antes de ingerir
 * @returns {Promise<Object>} Resultado da ingestão { count, errors }
 */
export async function ingestPsychologists(forceReset = false) {
  logger.info('Iniciando ingestão RAG de psicólogos validados...');

  try {
    // Reset se forçado (útil para re-ingestão completa)
    if (forceReset) {
      await resetVectorStore();
    } else {
      // Garantir que o vector store está inicializado
      await initializeVectorStore();
    }

    // Buscar psicólogos validados
    const psicologos = await psicologoRepository.findValidados();

    if (!psicologos || psicologos.length === 0) {
      logger.warn('Nenhum psicólogo validado encontrado para ingestão');
      return { count: 0, errors: [] };
    }

    logger.info(`Encontrados ${psicologos.length} psicólogos validados`);

    // Converter para documentos LangChain
    const documents = psicologos.map(formatPsychologistDocument);

    // Adicionar ao vector store em lotes (batch) para performance
    const batchSize = 50;
    let successCount = 0;
    const errors = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      try {
        await addDocuments(batch);
        successCount += batch.length;
        logger.debug(`Lote ${Math.floor(i / batchSize) + 1} ingerido: ${batch.length} documentos`);
      } catch (error) {
        logger.error(`Erro ao ingerir lote ${Math.floor(i / batchSize) + 1}`, {
          error: error.message,
        });
        errors.push({ batch: Math.floor(i / batchSize) + 1, error: error.message });
      }
    }

    logger.info(
      `Ingestão RAG concluída: ${successCount}/${psicologos.length} psicólogos indexados`
    );

    return { count: successCount, errors };
  } catch (error) {
    logger.error('Erro crítico na ingestão RAG', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Re-ingere um único psicólogo (quando atualizado/validado)
 * @param {number} psicologoId - ID do psicólogo
 * @returns {Promise<Object>} Resultado
 */
export async function reingestPsychologist(psicologoId) {
  logger.info(`Re-ingerindo psicólogo ${psicologoId}...`);

  try {
    const psicologo = await psicologoRepository.findById(psicologoId);

    if (!psicologo) {
      logger.warn(`Psicólogo ${psicologoId} não encontrado`);
      return { success: false, error: 'Psicólogo não encontrado' };
    }

    if (!psicologo.validado) {
      logger.info(`Psicólogo ${psicologoId} não está validado - pulando ingestão`);
      return { success: false, error: 'Psicólogo não validado' };
    }

    // Para simplicidade com MemoryVectorStore, fazemos re-ingestão completa
    // Em produção com ChromaDB/Pinecone, faríamos upsert por ID
    await ingestPsychologists(true); // force reset e re-ingestão completa

    logger.info(`Psicólogo ${psicologoId} re-ingerido com sucesso`);
    return { success: true };
  } catch (error) {
    logger.error(`Erro ao re-ingerir psicólogo ${psicologoId}`, { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Inicializa o sistema RAG completo (chamado no startup do app)
 * @returns {Promise<Object>} Resultado da inicialização
 */
export async function initializeRAG() {
  logger.info('=== Inicializando Sistema RAG ===');

  const startTime = Date.now();
  const result = await ingestPsychologists(false);
  const duration = Date.now() - startTime;

  logger.info(`Sistema RAG inicializado em ${duration}ms`, {
    psicologosIndexados: result.count,
    erros: result.errors.length,
  });

  return {
    success: result.errors.length === 0,
    count: result.count,
    errors: result.errors,
    durationMs: duration,
  };
}
