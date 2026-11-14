/**
 * Configuração de Embeddings para RAG
 * Suporta OpenAI (pago) ou provedor local via transformers.js
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { logger } from '../utils/logger.js';

/**
 * Palavras-chave para embeddings mock inteligentes
 * Textos contendo estas palavras terão vetores mais similares
 */
const KEYWORD_VECTORS = {
  ansiedade: 'ansiedade',
  depressao: 'depressao',
  tcc: 'tcc',
  cognitivo: 'tcc',
  comportamental: 'tcc',
  psicanalise: 'psicanalise',
  psicanalista: 'psicanalise',
  lacaniana: 'psicanalise',
  humanista: 'humanista',
  rogers: 'humanista',
  centrada: 'humanista',
  sistemica: 'sistemica',
  familiar: 'sistemica',
  casal: 'sistemica',
  constelacoes: 'sistemica',
  online: 'online',
  presencial: 'presencial',
  hibrido: 'hibrido',
  sao: 'saopaulo',
  paulo: 'saopaulo',
  sp: 'saopaulo',
  rio: 'riodejaneiro',
  janeiro: 'riodejaneiro',
  rj: 'riodejaneiro',
  minas: 'minasgerais',
  gerais: 'minasgerais',
  mg: 'minasgerais',
  brasilia: 'distritofederal',
  df: 'distritofederal',
};

/**
 * Gera vetor baseado em palavras-chave do texto (para mock embeddings inteligentes)
 * Textos com palavras-chave similares terão vetores similares
 * @param {string} text - Texto para gerar embedding
 * @param {number} dimensions - Número de dimensões
 * @returns {number[]} Vetor normalizado
 */
function generateKeywordBasedEmbedding(text, dimensions = 1536) {
  const lowerText = text.toLowerCase();
  const foundKeywords = [];

  // Encontrar palavras-chave no texto
  for (const [keyword, category] of Object.entries(KEYWORD_VECTORS)) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(category);
    }
  }

  // Usar as categorias encontradas como seed
  const seedText = foundKeywords.length > 0 ? foundKeywords.sort().join(' ') : text.substring(0, 100);

  // Hash determinístico baseado nas palavras-chave
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    const char = seedText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  let seed = Math.abs(hash) || 1;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const vec = new Array(dimensions).fill(0).map(() => random() - 0.5);
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map((v) => v / (norm || 1));
}

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
      dimensions: 1536,
    });
  }

  // Fallback: embedding mock baseado em palavras-chave para desenvolvimento/teste
  logger.warn('OPENAI_API_KEY não configurada - usando embeddings mock baseados em palavras-chave (apenas desenvolvimento)');

  return {
    embedDocuments: async (texts) => {
      return texts.map((text) => generateKeywordBasedEmbedding(text));
    },
    embedQuery: async (text) => {
      return generateKeywordBasedEmbedding(text);
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
