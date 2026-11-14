import express from 'express';
import jwt from 'jsonwebtoken';
import { horarioRepository } from '../repository/horarioRepository.js';
import { agendamentoRepository } from '../repository/agendamentoRepository.js';
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

// GET /horarios/profissional/:psicologoId - Lista horários disponíveis de um profissional para agendamento
// Query params: dataInicio (ISO string), dataFim (ISO string) - opcionais
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
