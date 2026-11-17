/**
 * Configuração de Embeddings para RAG
 * Suporta OpenAI (pago) ou provedor local via transformers.js
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { logger } from '../utils/logger.js';

/**
 * Categorias de palavras-chave para embeddings mock
 * Cada categoria será uma dimensão no vetor (one-hot/multi-hot encoding)
 * Isso garante que sobreposição de palavras-chave = similaridade semântica
 */
const KEYWORD_CATEGORIES = [
  'ansiedade',
  'depressao',
  'tcc',
  'psicanalise',
  'humanista',
  'sistemica',
  'gestalt',
  'junguiana',
  'trauma',
  'infantil',
  'casal',
  'carreira',
  'preco_acessivel',
  'preco_medio',
  'preco_premium',
  'online',
  'presencial',
  'hibrido',
  'saopaulo',
  'riodejaneiro',
  'minasgerais',
  'distritofederal',
];

// Mapeamento de palavras-chave para categorias
const KEYWORD_TO_CATEGORY = {
  ansiedade: 'ansiedade',
  ansioso: 'ansiedade',
  estresse: 'ansiedade',
  stress: 'ansiedade',
  depressao: 'depressao',
  depressivo: 'depressao',
  depressão: 'depressao',
  tcc: 'tcc',
  cognitivo: 'tcc',
  comportamental: 'tcc',
  psicanalise: 'psicanalise',
  psicanalista: 'psicanalise',
  lacaniana: 'psicanalise',
  psicanálise: 'psicanalise',
  humanista: 'humanista',
  rogers: 'humanista',
  centrada: 'humanista',
  'pessoa-centrada': 'humanista',
  gestalt: 'humanista', // Gestalt é abordagem humanista
  sistemica: 'sistemica',
  familiar: 'sistemica',
  casal: 'casal',
  conjugal: 'casal',
  relacionamento: 'casal',
  constelacoes: 'sistemica',
  junguiana: 'junguiana',
  jung: 'junguiana',
  sonhos: 'junguiana',
  individuacao: 'junguiana',
  trauma: 'trauma',
  emdr: 'trauma',
  ptsd: 'trauma',
  tept: 'trauma',
  luto: 'trauma',
  infantil: 'infantil',
  crianca: 'infantil',
  criança: 'infantil',
  adolescente: 'infantil',
  tdah: 'infantil',
  autismo: 'infantil',
  carreira: 'carreira',
  trabalho: 'carreira',
  emprego: 'carreira',
  profissao: 'carreira',
  profissão: 'carreira',
  performance: 'carreira',
  online: 'online',
  presencial: 'presencial',
  hibrido: 'hibrido',
  híbrido: 'hibrido',
  sao: 'saopaulo',
  paulo: 'saopaulo',
  sp: 'saopaulo',
  'sao paulo': 'saopaulo',
  rio: 'riodejaneiro',
  janeiro: 'riodejaneiro',
  rj: 'riodejaneiro',
  'rio de janeiro': 'riodejaneiro',
  minas: 'minasgerais',
  gerais: 'minasgerais',
  mg: 'minasgerais',
  'belo horizonte': 'minasgerais',
  brasilia: 'distritofederal',
  df: 'distritofederal',
  // Preço - palavras que indicam busca por preço acessível
  ate: 'preco_acessivel',
  até: 'preco_acessivel',
  barato: 'preco_acessivel',
  economico: 'preco_acessivel',
  econômico: 'preco_acessivel',
  acessivel: 'preco_acessivel',
  acessível: 'preco_acessivel',
  'preco baixo': 'preco_acessivel',
  'preço baixo': 'preco_acessivel',
  'preco acessivel': 'preco_acessivel',
  'preço acessível': 'preco_acessivel',
  medio: 'preco_medio',
  médio: 'preco_medio',
  'preco medio': 'preco_medio',
  'preço médio': 'preco_medio',
  premium: 'preco_premium',
  'preco premium': 'preco_premium',
  'preço premium': 'preco_premium',
  caro: 'preco_premium',
  'alto custo': 'preco_premium',
};

/**
 * Gera vetor baseado em palavras-chave do texto (para mock embeddings inteligentes)
 * Usa encoding multi-hot: cada dimensão = uma categoria.
 * Sobreposição de categorias = similaridade cosseno alta.
 * @param {string} text - Texto para gerar embedding
 * @param {number} dimensions - Número de dimensões (padrão = num categorias)
 * @returns {number[]} Vetor normalizado
 */
function generateKeywordBasedEmbedding(text, dimensions = KEYWORD_CATEGORIES.length) {
  const lowerText = text.toLowerCase();
  const foundCategories = new Set();

  // Encontrar categorias no texto
  for (const [keyword, category] of Object.entries(KEYWORD_TO_CATEGORY)) {
    if (lowerText.includes(keyword)) {
      foundCategories.add(category);
    }
  }

  // Criar vetor multi-hot: 1 para categorias presentes, 0 para ausentes
  // Preencher até dimensions com ruído determinístico pequeno para variabilidade
  const vec = new Array(dimensions).fill(0);

  // Primeiras N dimensões = categorias conhecidas (multi-hot encoding)
  const categoryToIndex = Object.fromEntries(KEYWORD_CATEGORIES.map((cat, i) => [cat, i]));

  for (const category of foundCategories) {
    const idx = categoryToIndex[category];
    if (idx !== undefined && idx < dimensions) {
      vec[idx] = 1;
    }
  }

  // Dimensões restantes: ruído determinístico baseado no hash do texto original
  // Isso dá variabilidade para textos com mesmas categorias
  const remainingDims = dimensions - KEYWORD_CATEGORIES.length;
  if (remainingDims > 0) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    let seed = Math.abs(hash) || 1;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = KEYWORD_CATEGORIES.length; i < dimensions; i++) {
      vec[i] = (random() - 0.5) * 0.1; // Ruído pequeno
    }
  }

  // Normalizar
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
  logger.warn(
    'OPENAI_API_KEY não configurada - usando embeddings mock baseados em palavras-chave (apenas desenvolvimento)'
  );

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
