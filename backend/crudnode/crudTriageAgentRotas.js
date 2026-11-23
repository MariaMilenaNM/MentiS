/**
 * Rotas do Agente de Triagem LangChain
 * Endpoint para chat inteligente com memória por conversa
 */

import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../utils/validation.js';
import { z } from 'zod';
import { verificarToken } from './authMiddleware.js';
import {
  runTriageAgent,
  loadConversationMemory,
  getOrCreateTriageConversation,
} from '../agent/triageAgent.js';
import { conversaRepository } from '../repository/conversaRepository.js';
import { pacienteRepository } from '../repository/pacienteRepository.js';
import { logger } from '../utils/logger.js';

const routes = express.Router();

// Schema para validação
const triageAgentSchema = z.object({
  mensagem: z.string().trim().min(1, 'Mensagem é obrigatória').max(2000),
  conversaId: z.number().int().positive().optional(),
  // Se não tiver conversaId, usa o paciente logado para criar/buscar
});

const triageInitSchema = z.object({
  // Para iniciar nova triagem
  pacienteId: z.number().int().positive().optional(),
});

/**
 * POST /triage-agent/chat
 * Envia mensagem para o agente de triagem
 * Requer autenticação (JWT)
 * Body: { mensagem: string, conversaId?: number }
 */
routes.post(
  '/chat',
  verificarToken,
  validate(triageAgentSchema),
  asyncHandler(async (req, res) => {
    try {
      const { mensagem, conversaId } = req.body;
      const usuario = req.usuario;

      // Obter pacienteId do usuário logado
      let pacienteId;
      if (usuario.role === 'PACIENTE') {
        const paciente = await pacienteRepository.findByUsuarioId(usuario.id);
        if (!paciente) {
          return res.status(404).json({ erro: 'Perfil de paciente não encontrado' });
        }
        pacienteId = paciente.id;
      } else {
        return res.status(403).json({ erro: 'Apenas pacientes podem usar o agente de triagem' });
      }

      let finalConversaId = conversaId;

      // Se não tem conversaId, buscar ou criar conversa de triagem
      if (!finalConversaId) {
        const conversa = await getOrCreateTriageConversation(pacienteId);
        if (conversa) {
          finalConversaId = conversa.id;
        } else {
          // Criar conversa "virtual" com sistema (psicologoId = 0 ou similar)
          // Como o schema exige psicologoId, vamos criar uma conversa especial
          // Usamos o primeiro psicólogo validado como "sistema" ou criamos entrada especial
          // Por enquanto, retornamos erro pedindo para criar conversa primeiro
          return res.status(400).json({
            erro: 'Conversa não encontrada. Inicie uma conversa primeiro via POST /conversas',
            needsConversation: true,
          });
        }
      }

      // Verificar permissão na conversa
      if (finalConversaId) {
        const conversa = await conversaRepository.findById(finalConversaId);
        if (!conversa) {
          return res.status(404).json({ erro: 'Conversa não encontrada' });
        }

        if (conversa.pacienteId !== pacienteId) {
          return res.status(403).json({ erro: 'Acesso negado a esta conversa' });
        }
      }

      // Executar agente (salva mensagem do usuário internamente)
      const resultado = await runTriageAgent({
        conversaId: finalConversaId,
        pacienteId,
        userMessage: mensagem,
        isNewConversation: !conversaId,
      });

      if (!resultado.success) {
        return res.status(500).json({
          erro: resultado.error || 'Erro no agente de triagem',
          resposta: resultado.resposta,
        });
      }

      logger.info('TriageAgent: Mensagem processada', {
        conversaId: finalConversaId,
        pacienteId,
        acao: resultado.acao,
        triagem: resultado.triagem,
      });

      return res.status(200).json({
        conversaId: finalConversaId,
        resposta: resultado.resposta,
        triagem: resultado.triagem,
        acao: resultado.acao,
        profissionais: resultado.profissionais || [],
        proximaPergunta: resultado.proximaPergunta,
      });
    } catch (error) {
      logger.error('Erro no endpoint /triage-agent/chat', {
        error: error.message,
        stack: error.stack,
        body: req.body,
      });
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  })
);

/**
 * POST /triage-agent/init
 * Inicializa nova sessão de triagem
 * Requer autenticação (JWT)
 */
routes.post(
  '/init',
  verificarToken,
  validate(triageInitSchema),
  asyncHandler(async (req, res) => {
    try {
      const usuario = req.usuario;

      let pacienteId;
      if (usuario.role === 'PACIENTE') {
        const paciente = await pacienteRepository.findByUsuarioId(usuario.id);
        if (!paciente) {
          return res.status(404).json({ erro: 'Perfil de paciente não encontrado' });
        }
        pacienteId = paciente.id;
      } else {
        return res.status(403).json({ erro: 'Apenas pacientes podem iniciar triagem' });
      }

      // Buscar conversa existente ou indicar que precisa criar
      const conversa = await getOrCreateTriageConversation(pacienteId);

      if (conversa) {
        // Carregar histórico
        const memory = await loadConversationMemory(conversa.id);

        return res.status(200).json({
          conversaId: conversa.id,
          hasHistory: memory.length > 0,
          message: 'Sessão de triagem existente encontrada',
        });
      }

      return res.status(200).json({
        conversaId: null,
        hasHistory: false,
        message: 'Nenhuma conversa de triagem existente. Crie uma via POST /conversas',
      });
    } catch (error) {
      logger.error('Erro no endpoint /triage-agent/init', {
        error: error.message,
        stack: error.stack,
      });
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  })
);

/**
 * GET /triage-agent/history/:conversaId
 * Obtém histórico da conversa de triagem
 * Requer autenticação (JWT)
 */
routes.get(
  '/history/:conversaId',
  verificarToken,
  asyncHandler(async (req, res) => {
    try {
      const conversaId = parseInt(req.params.conversaId);
      const usuario = req.usuario;

      if (isNaN(conversaId)) {
        return res.status(400).json({ erro: 'ID da conversa inválido' });
      }

      const conversa = await conversaRepository.findById(conversaId);
      if (!conversa) {
        return res.status(404).json({ erro: 'Conversa não encontrada' });
      }

      // Verificar permissão
      let temPermissao = false;
      if (usuario.role === 'ADMIN') {
        temPermissao = true;
      } else if (usuario.role === 'PACIENTE') {
        const paciente = await pacienteRepository.findByUsuarioId(usuario.id);
        temPermissao = paciente && conversa.pacienteId === paciente.id;
      }

      if (!temPermissao) {
        return res.status(403).json({ erro: 'Acesso negado' });
      }

      // Carregar memória formatada
      const memory = await loadConversationMemory(conversaId);

      const history = memory.map((msg, index) => ({
        index,
        role: msg._getType(), // 'human' ou 'ai'
        content: msg.content,
      }));

      return res.status(200).json({
        conversaId,
        history,
        count: history.length,
      });
    } catch (error) {
      logger.error('Erro no endpoint /triage-agent/history', {
        error: error.message,
        stack: error.stack,
        conversaId: req.params.conversaId,
      });
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  })
);

/**
 * GET /triage-agent/health
 * Health check do agente
 */
routes.get(
  '/health',
  asyncHandler(async (req, res) => {
    try {
      const { healthCheck } = await import('../rag/retriever.js');
      const retrieverHealth = await healthCheck();

      return res.status(200).json({
        status: 'ok',
        agent: 'triage-agent',
        retriever: retrieverHealth,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(503).json({
        status: 'degraded',
        agent: 'triage-agent',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  })
);

// Middleware de erro global
routes.use((err, req, res, _next) => {
  logger.error('Erro não tratado na rota do TriageAgent', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default routes;