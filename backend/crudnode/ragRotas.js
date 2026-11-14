/**
 * Rotas da API RAG - Busca semântica de psicólogos
 * Endpoints para busca por similaridade e filtros combinados
 */

import express from 'express';
import {
  searchPsychologists,
  advancedSearch,
  getSearchSuggestions,
  searchByEspecialidade,
  searchByLocation,
  searchByPrice,
} from '../rag/index.js';
import { logger } from '../utils/logger.js';
import { verificarToken, requerAdmin } from './authMiddleware.js';

const routes = express.Router();

// Middleware async handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /rag/suggestions
 * Retorna sugestões de busca populares
 * Público (não requer autenticação)
 */
routes.get(
  '/suggestions',
  asyncHandler(async (req, res) => {
    const suggestions = getSearchSuggestions();
    res.status(200).json({ suggestions });
  })
);

/**
 * POST /rag/search
 * Busca semântica de psicólogos validados
 * Body: { query: string, k?: number, filters?: object, minScore?: number }
 * Requer autenticação (JWT)
 */
routes.post(
  '/search',
  verificarToken,
  asyncHandler(async (req, res) => {
    const { query, k = 5, filters = {}, minScore = 0.3 } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res
        .status(400)
        .json({ erro: 'Campo "query" é obrigatório e deve ser uma string não vazia' });
    }

    try {
      const results = await searchPsychologists(query.trim(), { k, filters, minScore });
      res.status(200).json({
        query: query.trim(),
        count: results.length,
        results,
      });
    } catch (error) {
      logger.error('Erro no endpoint /rag/search', { error: error.message, query });
      res.status(500).json({ erro: 'Erro ao realizar busca semântica' });
    }
  })
);

/**
 * POST /rag/advanced-search
 * Busca avançada com query livre + filtros estruturados
 * Body: { query: string, filters?: { especialidade, modalidade, estado, precoMax }, k?: number }
 * Requer autenticação (JWT)
 */
routes.post(
  '/advanced-search',
  verificarToken,
  asyncHandler(async (req, res) => {
    const { query, filters = {}, k = 5 } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ erro: 'Campo "query" é obrigatório' });
    }

    try {
      const results = await advancedSearch(query.trim(), filters, k);
      res.status(200).json({
        query: query.trim(),
        filters,
        count: results.length,
        results,
      });
    } catch (error) {
      logger.error('Erro no endpoint /rag/advanced-search', { error: error.message, query });
      res.status(500).json({ erro: 'Erro ao realizar busca avançada' });
    }
  })
);

/**
 * GET /rag/especialidade/:especialidade
 * Busca por especialidade específica
 * Query params: k, modalidade, estado, precoMax
 * Requer autenticação (JWT)
 */
routes.get(
  '/especialidade/:especialidade',
  verificarToken,
  asyncHandler(async (req, res) => {
    const { especialidade } = req.params;
    const { k = 5, modalidade, estado, precoMax } = req.query;

    const filters = {};
    if (modalidade) filters.modalidade = modalidade;
    if (estado) filters.estado = estado;
    if (precoMax) filters.precoMax = parseFloat(precoMax);

    try {
      const results = await searchByEspecialidade(especialidade, { k: parseInt(k), filters });
      res.status(200).json({
        especialidade,
        filters,
        count: results.length,
        results,
      });
    } catch (error) {
      logger.error('Erro no endpoint /rag/especialidade', { error: error.message, especialidade });
      res.status(500).json({ erro: 'Erro ao buscar por especialidade' });
    }
  })
);

/**
 * GET /rag/location/:cidade/:estado
 * Busca por localização (cidade/estado)
 * Query params: k, especialidade, modalidade, precoMax
 * Requer autenticação (JWT)
 */
routes.get(
  '/location/:cidade/:estado',
  verificarToken,
  asyncHandler(async (req, res) => {
    const { cidade, estado } = req.params;
    const { k = 5, especialidade, modalidade, precoMax } = req.query;

    const filters = {};
    if (especialidade) filters.especialidade = especialidade;
    if (modalidade) filters.modalidade = modalidade;
    if (precoMax) filters.precoMax = parseFloat(precoMax);

    try {
      const results = await searchByLocation(cidade, estado, { k: parseInt(k), filters });
      res.status(200).json({
        cidade,
        estado,
        filters,
        count: results.length,
        results,
      });
    } catch (error) {
      logger.error('Erro no endpoint /rag/location', { error: error.message, cidade, estado });
      res.status(500).json({ erro: 'Erro ao buscar por localização' });
    }
  })
);

/**
 * GET /rag/price/:precoMax
 * Busca por faixa de preço máximo
 * Query params: k, especialidade, modalidade, estado
 * Requer autenticação (JWT)
 */
routes.get(
  '/price/:precoMax',
  verificarToken,
  asyncHandler(async (req, res) => {
    const { precoMax } = req.params;
    const { k = 5, especialidade, modalidade, estado } = req.query;

    const maxPrice = parseFloat(precoMax);
    if (isNaN(maxPrice)) {
      return res.status(400).json({ erro: 'precoMax deve ser um número válido' });
    }

    const filters = {};
    if (especialidade) filters.especialidade = especialidade;
    if (modalidade) filters.modalidade = modalidade;
    if (estado) filters.estado = estado;

    try {
      const results = await searchByPrice(maxPrice, { k: parseInt(k), filters });
      res.status(200).json({
        precoMax: maxPrice,
        filters,
        count: results.length,
        results,
      });
    } catch (error) {
      logger.error('Erro no endpoint /rag/price', { error: error.message, precoMax });
      res.status(500).json({ erro: 'Erro ao buscar por preço' });
    }
  })
);

/**
 * GET /rag/stats
 * Retorna estatísticas do VectorStore
 * Requer autenticação (JWT)
 */
routes.get(
  '/stats',
  verificarToken,
  asyncHandler(async (req, res) => {
    try {
      const { getStats } = await import('../rag/index.js');
      const stats = getStats();
      res.status(200).json(stats);
    } catch (error) {
      logger.error('Erro no endpoint /rag/stats', { error: error.message });
      res.status(500).json({ erro: 'Erro ao obter estatísticas' });
    }
  })
);

/**
 * POST /rag/reingest
 * Força re-ingestão completa (apenas admin)
 * Requer autenticação + role ADMIN
 */
routes.post(
  '/reingest',
  verificarToken,
  requerAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { ingestPsychologists } = await import('../rag/index.js');
      const result = await ingestPsychologists(true); // force reset
      res.status(200).json({
        mensagem: 'Re-ingestão concluída',
        ...result,
      });
    } catch (error) {
      logger.error('Erro no endpoint /rag/reingest', { error: error.message });
      res.status(500).json({ erro: 'Erro ao re-ingerir dados' });
    }
  })
);

// Middleware de erro
routes.use((err, req, res, next) => {
  logger.error('Erro não tratado na rota RAG', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default routes;
