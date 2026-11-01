import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const agendamentoRepository = {
  findAll: async (filters = {}) => {
    try {
      const where = {};

      if (filters.pacienteId) where.pacienteId = filters.pacienteId;
      if (filters.psicologoId) where.psicologoId = filters.psicologoId;
      if (filters.status) where.status = filters.status;
      if (filters.dataInicio || filters.dataFim) {
        where.dataHora = {};
        if (filters.dataInicio) where.dataHora.gte = new Date(filters.dataInicio);
        if (filters.dataFim) where.dataHora.lte = new Date(filters.dataFim);
      }

      return await prisma.agendamento.findMany({
        where,
        include: {
          paciente: { include: { usuario: true } },
          psicologo: { include: { usuario: true } },
          horario: true
        },
        orderBy: { dataHora: 'asc' }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
    }
  },

  findById: async (id) => {
    try {
      return await prisma.agendamento.findUnique({
        where: { id },
        include: {
          paciente: { include: { usuario: true } },
          psicologo: { include: { usuario: true } },
          horario: true
        }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar agendamento: ${error.message}`);
    }
  },

  create: async (data) => {
    try {
      // Verificar se o horário está disponível
      const agendamentoExistente = await prisma.agendamento.findFirst({
        where: {
          psicologoId: data.psicologoId,
          dataHora: new Date(data.dataHora),
          status: { in: ['AGENDADO', 'CONFIRMADO'] }
        }
      });

      if (agendamentoExistente) {
        throw new Error('Horário já agendado para este psicólogo');
      }

      return await prisma.agendamento.create({ data });
    } catch (error) {
      throw new Error(`Erro ao criar agendamento: ${error.message}`);
    }
  },

  update: async (id, data) => {
    try {
      // Se está alterando dataHora ou psicologoId, verificar conflito
      if (data.dataHora || data.psicologoId) {
        const agendamento = await prisma.agendamento.findUnique({ where: { id } });
        const psicologoId = data.psicologoId || agendamento.psicologoId;
        const dataHora = data.dataHora ? new Date(data.dataHora) : agendamento.dataHora;

        const conflito = await prisma.agendamento.findFirst({
          where: {
            id: { not: id },
            psicologoId,
            dataHora,
            status: { in: ['AGENDADO', 'CONFIRMADO'] }
          }
        });

        if (conflito) {
          throw new Error('Horário já agendado para este psicólogo');
        }
      }

      return await prisma.agendamento.update({ where: { id }, data });
    } catch (error) {
      throw new Error(`Erro ao atualizar agendamento: ${error.message}`);
    }
  },

  updateStatus: async (id, status) => {
    try {
      return await prisma.agendamento.update({
        where: { id },
        data: { status }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Agendamento não encontrado');
      }
      throw new Error(`Erro ao atualizar status do agendamento: ${error.message}`);
    }
  },

  delete: async (id) => {
    try {
      return await prisma.agendamento.delete({ where: { id } });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Agendamento não encontrado');
      }
      throw new Error(`Erro ao deletar agendamento: ${error.message}`);
    }
  },

  findByPaciente: async (pacienteId) => {
    try {
      return await prisma.agendamento.findMany({
        where: { pacienteId },
        include: {
          psicologo: { include: { usuario: true } },
          horario: true
        },
        orderBy: { dataHora: 'asc' }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar agendamentos do paciente: ${error.message}`);
    }
  },

  findByPsicologo: async (psicologoId) => {
    try {
      return await prisma.agendamento.findMany({
        where: { psicologoId },
        include: {
          paciente: { include: { usuario: true } },
          horario: true
        },
        orderBy: { dataHora: 'asc' }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar agendamentos do psicólogo: ${error.message}`);
    }
  },
};