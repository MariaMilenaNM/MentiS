import express from 'express';
import jwt from 'jsonwebtoken';
import { agendamentoRepository } from '../repository/agendamentoRepository.js';
import { pacienteRepository } from '../repository/pacienteRepository.js';
import { psicologoRepository } from '../repository/psicologoRepository.js';
import { horarioRepository } from '../repository/horarioRepository.js';
import {
  validate,
  agendamentoCadastroSchema,
  agendamentoAtualizacaoSchema,
} from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const routes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não informado' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (erro) {
    logger.warn('Token inválido ou expirado', { error: erro.message });
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /agendamentos - Lista agendamentos (com filtros, requer token)
routes.get(
  '/',
  verificarToken,
  asyncHandler(async (req, res) => {
    try {
      const { pacienteId, psicologoId, status, dataInicio, dataFim } = req.query;

      const filters = {};
      if (pacienteId) filters.pacienteId = parseInt(pacienteId);
      if (psicologoId) filters.psicologoId = parseInt(psicologoId);
      if (status) filters.status = status;
      if (dataInicio) filters.dataInicio = dataInicio;
      if (dataFim) filters.dataFim = dataFim;

      // Filtros de permissão
      if (req.usuario.role === 'PACIENTE') {
        const paciente = await pacienteRepository.findByUsuarioId(req.usuario.id);
        if (paciente) filters.pacienteId = paciente.id;
      } else if (req.usuario.role === 'PSICOLOGO') {
        const psicologo = await psicologoRepository.findByUsuarioId(req.usuario.id);
        if (psicologo) filters.psicologoId = psicologo.id;
      }
      // ADMIN vê todos

      const agendamentos = await agendamentoRepository.findAll(filters);
      return res.status(200).json(agendamentos);
    } catch (error) {
      logger.error('Erro ao buscar agendamentos', { error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar agendamentos' });
    }
  })
);

// GET /agendamentos/:id - Busca agendamento por ID (requer token)
routes.get(
  '/:id',
  verificarToken,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      const agendamento = await agendamentoRepository.findById(id);

      if (!agendamento) {
        return res.status(404).json({ erro: 'Agendamento não encontrado' });
      }

      // Verificação de permissão
      const temPermissao =
        req.usuario.role === 'ADMIN' ||
        (req.usuario.role === 'PACIENTE' && agendamento.paciente.usuarioId === req.usuario.id) ||
        (req.usuario.role === 'PSICOLOGO' && agendamento.psicologo.usuarioId === req.usuario.id);

      if (!temPermissao) {
        return res.status(403).json({ erro: 'Acesso negado' });
      }

      return res.status(200).json(agendamento);
    } catch (error) {
      logger.error('Erro ao buscar agendamento', { id, error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar agendamento' });
    }
  })
);

// POST /agendamentos - Cria agendamento (requer token paciente)
routes.post(
  '/',
  verificarToken,
  validate(agendamentoCadastroSchema),
  asyncHandler(async (req, res) => {
    const dados = req.body;

    // Apenas pacientes podem criar agendamentos
    if (req.usuario.role !== 'PACIENTE') {
      return res.status(403).json({ erro: 'Apenas pacientes podem criar agendamentos' });
    }

    try {
      // Buscar pacienteId do usuário logado
      const paciente = await pacienteRepository.findByUsuarioId(req.usuario.id);
      if (!paciente) {
        return res.status(404).json({ erro: 'Perfil de paciente não encontrado' });
      }

      // Verificar se o psicólogo existe e está validado
      const psicologo = await psicologoRepository.findById(dados.psicologoId);
      if (!psicologo) {
        return res.status(404).json({ erro: 'Psicólogo não encontrado' });
      }
      if (!psicologo.validado) {
        return res.status(400).json({ erro: 'Psicólogo não validado' });
      }

      // Se horarioId fornecido, verificar se pertence ao psicólogo
      if (dados.horarioId) {
        const horario = await horarioRepository.findById(dados.horarioId);
        if (!horario || horario.psicologoId !== dados.psicologoId) {
          return res.status(400).json({ erro: 'Horário inválido para este psicólogo' });
        }
        if (!horario.ativo) {
          return res.status(400).json({ erro: 'Horário não está mais disponível' });
        }
      }

      const agendamento = await agendamentoRepository.create({
        ...dados,
        pacienteId: paciente.id,
        dataHora: new Date(dados.dataHora),
        status: 'AGENDADO',
      });

      logger.info('Agendamento criado', {
        id: agendamento.id,
        pacienteId: paciente.id,
        psicologoId: dados.psicologoId,
      });
      return res.status(201).json(agendamento);
    } catch (error) {
      logger.error('Erro ao criar agendamento', { error: error.message });
      if (error.message.includes('Horário já agendado')) {
        return res.status(409).json({ erro: 'Horário já agendado para este psicólogo' });
      }
      return res.status(500).json({ erro: 'Erro ao criar agendamento' });
    }
  })
);

// PUT /agendamentos/:id - Atualiza agendamento (requer token, paciente ou psicólogo envolvido)
routes.put(
  '/:id',
  verificarToken,
  validate(agendamentoAtualizacaoSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const dados = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      const agendamento = await agendamentoRepository.findById(id);

      if (!agendamento) {
        return res.status(404).json({ erro: 'Agendamento não encontrado' });
      }

      // Verificação de permissão
      const isPaciente =
        req.usuario.role === 'PACIENTE' && agendamento.paciente.usuarioId === req.usuario.id;
      const isPsicologo =
        req.usuario.role === 'PSICOLOGO' && agendamento.psicologo.usuarioId === req.usuario.id;
      const isAdmin = req.usuario.role === 'ADMIN';

      if (!isPaciente && !isPsicologo && !isAdmin) {
        return res.status(403).json({ erro: 'Acesso negado' });
      }

      // Regras de transição de status
      if (dados.status) {
        const transicoesValidas = {
          AGENDADO: ['CONFIRMADO', 'CANCELADO_PACIENTE', 'CANCELADO_PSICOLOGO'],
          CONFIRMADO: ['REALIZADO', 'FALTOU', 'CANCELADO_PACIENTE', 'CANCELADO_PSICOLOGO'],
          CANCELADO_PACIENTE: [],
          CANCELADO_PSICOLOGO: [],
          REALIZADO: [],
          FALTOU: [],
        };

        const transicoesPermitidas = transicoesValidas[agendamento.status] || [];
        if (!transicoesPermitidas.includes(dados.status)) {
          return res.status(400).json({
            erro: `Transição de status inválida: ${agendamento.status} → ${dados.status}`,
          });
        }

        // Apenas psicólogo pode confirmar
        if (dados.status === 'CONFIRMADO' && !isPsicologo && !isAdmin) {
          return res.status(403).json({ erro: 'Apenas o psicólogo pode confirmar o agendamento' });
        }

        // Apenas paciente pode cancelar como paciente
        if (dados.status === 'CANCELADO_PACIENTE' && !isPaciente && !isAdmin) {
          return res.status(403).json({ erro: 'Apenas o paciente pode cancelar como paciente' });
        }

        // Apenas psicólogo pode cancelar como psicólogo
        if (dados.status === 'CANCELADO_PSICOLOGO' && !isPsicologo && !isAdmin) {
          return res.status(403).json({ erro: 'Apenas o psicólogo pode cancelar como psicólogo' });
        }
      }

      const agendamentoAtualizado = await agendamentoRepository.update(id, {
        ...dados,
        dataHora: dados.dataHora ? new Date(dados.dataHora) : undefined,
      });

      logger.info('Agendamento atualizado', { id, status: dados.status });
      return res.status(200).json(agendamentoAtualizado);
    } catch (error) {
      logger.error('Erro ao atualizar agendamento', { id, error: error.message });
      if (error.message.includes('Horário já agendado')) {
        return res.status(409).json({ erro: 'Horário já agendado para este psicólogo' });
      }
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ erro: error.message });
      }
      return res.status(500).json({ erro: 'Erro ao atualizar agendamento' });
    }
  })
);

// PATCH /agendamentos/:id/status - Atualiza apenas status (atalho)
routes.patch(
  '/:id/status',
  verificarToken,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    if (!status) {
      return res.status(400).json({ erro: 'Status é obrigatório' });
    }

    try {
      const agendamento = await agendamentoRepository.findById(id);

      if (!agendamento) {
        return res.status(404).json({ erro: 'Agendamento não encontrado' });
      }

      // Mesmas regras de permissão do PUT
      const isPaciente =
        req.usuario.role === 'PACIENTE' && agendamento.paciente.usuarioId === req.usuario.id;
      const isPsicologo =
        req.usuario.role === 'PSICOLOGO' && agendamento.psicologo.usuarioId === req.usuario.id;
      const isAdmin = req.usuario.role === 'ADMIN';

      if (!isPaciente && !isPsicologo && !isAdmin) {
        return res.status(403).json({ erro: 'Acesso negado' });
      }

      const transicoesValidas = {
        AGENDADO: ['CONFIRMADO', 'CANCELADO_PACIENTE', 'CANCELADO_PSICOLOGO'],
        CONFIRMADO: ['REALIZADO', 'FALTOU', 'CANCELADO_PACIENTE', 'CANCELADO_PSICOLOGO'],
        CANCELADO_PACIENTE: [],
        CANCELADO_PSICOLOGO: [],
        REALIZADO: [],
        FALTOU: [],
      };

      const transicoesPermitidas = transicoesValidas[agendamento.status] || [];
      if (!transicoesPermitidas.includes(status)) {
        return res.status(400).json({
          erro: `Transição de status inválida: ${agendamento.status} → ${status}`,
        });
      }

      const agendamentoAtualizado = await agendamentoRepository.updateStatus(id, status);
      logger.info('Status do agendamento atualizado', { id, status });
      return res.status(200).json(agendamentoAtualizado);
    } catch (error) {
      logger.error('Erro ao atualizar status do agendamento', { id, error: error.message });
      return res.status(500).json({ erro: 'Erro ao atualizar status do agendamento' });
    }
  })
);

// DELETE /agendamentos/:id - Remove agendamento (requer token, admin apenas)
routes.delete(
  '/:id',
  verificarToken,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    if (req.usuario.role !== 'ADMIN') {
      return res
        .status(403)
        .json({ erro: 'Acesso negado: apenas administradores podem remover agendamentos' });
    }

    try {
      const agendamento = await agendamentoRepository.findById(id);

      if (!agendamento) {
        return res.status(404).json({ erro: 'Agendamento não encontrado' });
      }

      await agendamentoRepository.delete(id);
      logger.info('Agendamento removido', { id });
      return res
        .status(200)
        .json({ status: 'removido', mensagem: 'Agendamento removido com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar agendamento', { id, error: error.message });
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ erro: error.message });
      }
      return res.status(500).json({ erro: 'Erro ao deletar agendamento' });
    }
  })
);

// Middleware de erro global
routes.use((err, req, res, next) => {
  logger.error('Erro não tratado na rota de agendamentos', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default routes;
