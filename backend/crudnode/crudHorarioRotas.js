import express from 'express';
import jwt from 'jsonwebtoken';
import { horarioRepository } from '../repository/horarioRepository.js';
import { agendamentoRepository } from '../repository/agendamentoRepository.js';
import { psicologoRepository } from '../repository/psicologoRepository.js';
import { validate, horarioCadastroSchema, horarioAtualizacaoSchema } from '../utils/validation.js';
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

// ============================================
// GET /horarios/profissional/:psicologoId - Lista horários disponíveis para agendamento (paciente)
// Query params: dataInicio, dataFim (ISO strings) - opcionais
// ============================================
routes.get(
  '/profissional/:psicologoId',
  verificarToken,
  asyncHandler(async (req, res) => {
    const psicologoId = parseInt(req.params.psicologoId);
    const { dataInicio, dataFim } = req.query;

    if (isNaN(psicologoId)) {
      return res.status(400).json({ erro: 'ID do profissional inválido' });
    }

    try {
      // Buscar todos os horários ativos do profissional
      const horarios = await horarioRepository.findByPsicologoId(psicologoId);

      if (!horarios || horarios.length === 0) {
        return res.status(200).json([]);
      }

      // Definir range de datas para buscar agendamentos existentes
      const inicio = dataInicio ? new Date(dataInicio) : new Date();
      const fim = dataFim ? new Date(dataFim) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias por padrão

      // Buscar agendamentos existentes no período para este profissional
      const agendamentos = await agendamentoRepository.findAll({
        psicologoId,
        dataInicio: inicio.toISOString(),
        dataFim: fim.toISOString(),
      });

      // Criar set de horários já ocupados (dataHora ISO string)
      const horariosOcupados = new Set(
        (agendamentos || [])
          .filter((a) => a.status !== 'CANCELADO_PACIENTE' && a.status !== 'CANCELADO_PSICOLOGO')
          .map((a) => new Date(a.dataHora).toISOString())
      );

      // Gerar slots disponíveis para os próximos 30 dias baseado nos horários recorrentes
      const slotsDisponiveis = [];
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      for (let d = 0; d < 30; d++) {
        const dataAtual = new Date(hoje);
        dataAtual.setDate(hoje.getDate() + d);

        // Pular datas passadas
        if (dataAtual < inicio) continue;
        if (dataAtual > fim) continue;

        const diaSemana = dataAtual.getDay(); // 0=Domingo ... 6=Sábado

        // Filtrar horários deste dia da semana
        const horariosDoDia = horarios.filter((h) => h.diaSemana === diaSemana && h.ativo);

        for (const horario of horariosDoDia) {
          // Gerar slots de 50 min (duração padrão da sessão) dentro do intervalo
          const inicioMin = timeToMinutes(horario.horaInicio);
          const fimMin = timeToMinutes(horario.horaFim);
          const duracaoSessao = 50; // minutos

          for (let min = inicioMin; min + duracaoSessao <= fimMin; min += duracaoSessao) {
            const horaSlot = minutesToTime(min);
            const dataHoraSlot = new Date(dataAtual);
            const [h, m] = horaSlot.split(':').map(Number);
            dataHoraSlot.setHours(h, m, 0, 0);

            const isoString = dataHoraSlot.toISOString();

            // Verificar se não está no passado e não está ocupado
            if (dataHoraSlot > new Date() && !horariosOcupados.has(isoString)) {
              slotsDisponiveis.push({
                dataHora: isoString,
                data: dataAtual.toISOString().split('T')[0],
                hora: horaSlot,
                horarioId: horario.id,
                diaSemana: diaSemana,
              });
            }
          }
        }
      }

      // Ordenar por data/hora
      slotsDisponiveis.sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));

      return res.status(200).json(slotsDisponiveis);
    } catch (error) {
      logger.error('Erro ao buscar horários disponíveis', { psicologoId, error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar horários disponíveis' });
    }
  })
);

// ============================================
// GET /horarios/meus - Lista horários recorrentes do psicólogo logado (para gerenciamento)
// ============================================
routes.get(
  '/meus',
  verificarToken,
  asyncHandler(async (req, res) => {
    // Apenas psicólogos podem acessar
    if (req.usuario.role !== 'PSICOLOGO') {
      return res
        .status(403)
        .json({ erro: 'Acesso negado: apenas psicólogos podem gerenciar horários' });
    }

    try {
      // Buscar psicólogo do usuário logado
      const psicologo = await psicologoRepository.findByUsuarioId(req.usuario.id);
      if (!psicologo) {
        return res.status(404).json({ erro: 'Perfil de psicólogo não encontrado' });
      }

      const horarios = await horarioRepository.findByPsicologoId(psicologo.id);
      return res.status(200).json(horarios || []);
    } catch (error) {
      logger.error('Erro ao buscar horários do psicólogo', { error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar horários' });
    }
  })
);

// ============================================
// POST /horarios - Cria novo horário recorrente (psicólogo logado)
// Body: { diaSemana (0-6), horaInicio (HH:mm), horaFim (HH:mm) }
// ============================================
routes.post(
  '/',
  verificarToken,
  validate(horarioCadastroSchema),
  asyncHandler(async (req, res) => {
    // Apenas psicólogos podem criar horários
    if (req.usuario.role !== 'PSICOLOGO') {
      return res
        .status(403)
        .json({ erro: 'Acesso negado: apenas psicólogos podem criar horários' });
    }

    try {
      // Buscar psicólogo do usuário logado
      const psicologo = await psicologoRepository.findByUsuarioId(req.usuario.id);
      if (!psicologo) {
        return res.status(404).json({ erro: 'Perfil de psicólogo não encontrado' });
      }

      const { diaSemana, horaInicio, horaFim } = req.body;

      // Verificar se já existe horário para este dia/horário
      const existente = await horarioRepository.findByPsicologoId(psicologo.id);
      const conflito = existente?.find(
        (h) =>
          h.diaSemana === diaSemana &&
          h.horaInicio === horaInicio &&
          h.horaFim === horaFim &&
          h.ativo
      );

      if (conflito) {
        return res
          .status(409)
          .json({ erro: 'Já existe horário cadastrado para este dia e horário' });
      }

      const horario = await horarioRepository.create({
        psicologoId: psicologo.id,
        diaSemana,
        horaInicio,
        horaFim,
        ativo: true,
      });

      logger.info('Horário criado', { psicologoId: psicologo.id, horarioId: horario.id });
      return res.status(201).json(horario);
    } catch (error) {
      logger.error('Erro ao criar horário', { error: error.message });
      if (error.message.includes('já cadastrado')) {
        return res.status(409).json({ erro: error.message });
      }
      return res.status(500).json({ erro: 'Erro ao criar horário' });
    }
  })
);

// ============================================
// PUT /horarios/:id - Atualiza horário recorrente (psicólogo logado)
// Body: { diaSemana?, horaInicio?, horaFim?, ativo? }
// ============================================
routes.put(
  '/:id',
  verificarToken,
  validate(horarioAtualizacaoSchema),
  asyncHandler(async (req, res) => {
    // Apenas psicólogos podem atualizar horários
    if (req.usuario.role !== 'PSICOLOGO') {
      return res
        .status(403)
        .json({ erro: 'Acesso negado: apenas psicólogos podem atualizar horários' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      // Buscar psicólogo do usuário logado
      const psicologo = await psicologoRepository.findByUsuarioId(req.usuario.id);
      if (!psicologo) {
        return res.status(404).json({ erro: 'Perfil de psicólogo não encontrado' });
      }

      // Verificar se o horário pertence a este psicólogo
      const horario = await horarioRepository.findById(id);
      if (!horario || horario.psicologoId !== psicologo.id) {
        return res.status(404).json({ erro: 'Horário não encontrado' });
      }

      const { diaSemana, horaInicio, horaFim, ativo } = req.body;

      // Se alterando dia/hora, verificar conflito
      if (diaSemana !== undefined || horaInicio !== undefined || horaFim !== undefined) {
        const novoDia = diaSemana !== undefined ? diaSemana : horario.diaSemana;
        const novoInicio = horaInicio !== undefined ? horaInicio : horario.horaInicio;
        const novoFim = horaFim !== undefined ? horaFim : horario.horaFim;

        const existentes = await horarioRepository.findByPsicologoId(psicologo.id);
        const conflito = existentes?.find(
          (h) =>
            h.id !== id &&
            h.diaSemana === novoDia &&
            h.horaInicio === novoInicio &&
            h.horaFim === novoFim &&
            h.ativo
        );

        if (conflito) {
          return res
            .status(409)
            .json({ erro: 'Já existe horário cadastrado para este dia e horário' });
        }
      }

      const horarioAtualizado = await horarioRepository.update(id, {
        diaSemana,
        horaInicio,
        horaFim,
        ativo,
      });
      logger.info('Horário atualizado', { psicologoId: psicologo.id, horarioId: id });
      return res.status(200).json(horarioAtualizado);
    } catch (error) {
      logger.error('Erro ao atualizar horário', { id, error: error.message });
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ erro: 'Horário não encontrado' });
      }
      if (error.message.includes('já cadastrado')) {
        return res.status(409).json({ erro: error.message });
      }
      return res.status(500).json({ erro: 'Erro ao atualizar horário' });
    }
  })
);

// ============================================
// DELETE /horarios/:id - Desativa horário recorrente (psicólogo logado)
// ============================================
routes.delete(
  '/:id',
  verificarToken,
  asyncHandler(async (req, res) => {
    // Apenas psicólogos podem deletar horários
    if (req.usuario.role !== 'PSICOLOGO') {
      return res
        .status(403)
        .json({ erro: 'Acesso negado: apenas psicólogos podem remover horários' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      // Buscar psicólogo do usuário logado
      const psicologo = await psicologoRepository.findByUsuarioId(req.usuario.id);
      if (!psicologo) {
        return res.status(404).json({ erro: 'Perfil de psicólogo não encontrado' });
      }

      // Verificar se o horário pertence a este psicólogo
      const horario = await horarioRepository.findById(id);
      if (!horario || horario.psicologoId !== psicologo.id) {
        return res.status(404).json({ erro: 'Horário não encontrado' });
      }

      // Soft delete: marcar como inativo (mantém histórico de agendamentos)
      await horarioRepository.update(id, { ativo: false });
      logger.info('Horário desativado', { psicologoId: psicologo.id, horarioId: id });
      return res
        .status(200)
        .json({ status: 'desativado', mensagem: 'Horário desativado com sucesso' });
    } catch (error) {
      logger.error('Erro ao desativar horário', { id, error: error.message });
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ erro: 'Horário não encontrado' });
      }
      return res.status(500).json({ erro: 'Erro ao desativar horário' });
    }
  })
);

// Funções auxiliares
function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default routes;
