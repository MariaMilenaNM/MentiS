import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate, triageSearchSchema } from "../utils/validation.js";
import { similaritySearch, healthCheck } from "../rag/vectorStore.js";
import { logger } from "../utils/logger.js";

const routes = express.Router();

/**
 * POST /triage/search
 * Busca profissionais compatíveis via RAG (similarity search no vector store)
 * Body: { query: string, k?: number, filters?: object }
 *
 * Para usuários não logados: retorna matches básicos (nome, CRP, abordagem, modalidade, especialidades, score)
 * Para usuários logados: retorna matches completos (inclui contato, telefone, link)
 */
routes.post("/search", validate(triageSearchSchema), asyncHandler(async (req, res) => {
  try {
    const { query, k = 10, filters = {} } = req.body;

    // Verifica saúde do vector store
    const health = await healthCheck();
    if (health.status !== 'healthy') {
      logger.warn('Vector store unhealthy, fallback para busca vazia', { health });
      return res.status(503).json({
        erro: "Serviço de busca temporariamente indisponível",
        matches: [],
        total: 0
      });
    }

    // Busca por similaridade
    const results = await similaritySearch(query.trim(), k, filters);

    // Verifica se o usuário está autenticado (opcional - para futuras expansões)
    const authHeader = req.headers.authorization;
    const isLoggedIn = !!authHeader;

    // Formata resultados baseado no status de login
    const matches = results.map((doc, index) => {
      const baseMatch = {
        rank: index + 1,
        profissional: {
          id: doc.metadata.profissionalId,
          nome: doc.metadata.nome,
          crp: doc.metadata.crp,
          abordagem: doc.metadata.abordagem,
          especialidades: doc.metadata.especialidades,
          modalidade: doc.metadata.modalidade,
          preco: doc.metadata.preco,
          fotoUrl: doc.metadata.fotoUrl || null,
          validado: doc.metadata.validado,
        },
        score: Number(doc.similarity.toFixed(4)),
        matchReasons: generateMatchReasons(query, doc.metadata),
      };

      // Se logado, inclui dados de contato
      if (isLoggedIn) {
        return {
          ...baseMatch,
          profissional: {
            ...baseMatch.profissional,
            // Estes campos viriam do banco em implementação completa
            // Por enquanto, placeholders que o frontend pode usar
            contato: `profissional${doc.metadata.profissionalId}@mentis.com`,
            numero: '(11) 99999-9999',
            link: null,
          }
        };
      }

      return baseMatch;
    });

    logger.info('Busca de triagem realizada', {
      query: query.substring(0, 100),
      resultsCount: matches.length,
      isLoggedIn,
    });

    return res.status(200).json({
      matches,
      total: matches.length,
      query: query.trim(),
      isLoggedIn,
    });
  } catch (error) {
    logger.error('Erro na busca de triagem', {
      error: error.message,
      stack: error.stack,
      query: req.body?.query?.substring(0, 100),
    });
    return res.status(500).json({
      erro: "Erro interno na busca",
      matches: [],
      total: 0
    });
  }
}));

/**
 * GET /triage/health
 * Health check do serviço de triagem
 */
routes.get("/health", asyncHandler(async (req, res) => {
  const health = await healthCheck();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  return res.status(statusCode).json(health);
}));

/**
 * Gera razões de match baseadas na query e metadados do profissional
 */
function generateMatchReasons(query, metadata) {
  const reasons = [];
  const lowerQuery = query.toLowerCase();

  // Verifica especialidades
  if (metadata.especialidades && metadata.especialidades.length > 0) {
    const matchedSpecs = metadata.especialidades.filter(spec =>
      lowerQuery.includes(spec.toLowerCase()) || spec.toLowerCase().includes(lowerQuery)
    );
    if (matchedSpecs.length > 0) {
      reasons.push(`Especialista em ${matchedSpecs.slice(0, 2).join(' e ')}`);
    }
  }

  // Verifica abordagem
  const abordagemMap = {
    'COGNITIVO_COMPORTAMENTAL': 'TCC',
    'PSICANALITICA': 'Psicanálise',
    'HUMANISTA': 'Humanista',
    'SISTEMICA': 'Sistêmica',
    'GESTALT': 'Gestalt',
    'JUNGUIANA': 'Junguiana',
  };
  const abordagemNome = abordagemMap[metadata.abordagem] || metadata.abordagem;
  if (abordagemNome && lowerQuery.includes(abordagemNome.toLowerCase())) {
    reasons.push(`Abordagem ${abordagemNome}`);
  }

  // Verifica modalidade
  if (metadata.modalidade) {
    const modalidadeLower = metadata.modalidade.toLowerCase();
    if (lowerQuery.includes('online') && (modalidadeLower === 'online' || modalidadeLower === 'hibrido')) {
      reasons.push('Atende online');
    }
    if (lowerQuery.includes('presencial') && (modalidadeLower === 'presencial' || modalidadeLower === 'hibrido')) {
      reasons.push('Atende presencial');
    }
  }

  // Fallback genérico
  if (reasons.length === 0) {
    reasons.push('Perfil compatível com sua busca');
  }

  return reasons.slice(0, 3);
}

// ============================================
// Middleware de erro global
// ============================================
routes.use((err, req, res, _next) => {
  logger.error("Erro não tratado na rota de triagem", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  return res.status(500).json({ erro: "Erro interno do servidor" });
});

export default routes;