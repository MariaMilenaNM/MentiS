import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const horarioRepository = {
  findByPsicologoId: async (psicologoId) => {
    try {
      return await prisma.horarioDisponivel.findMany({
        where: { psicologoId, ativo: true },
        orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
      });
    } catch (error) {
      throw new Error(`Erro ao buscar horários do psicólogo: ${error.message}`);
    }
  },

  findById: async (id) => {
    try {
      return await prisma.horarioDisponivel.findUnique({ where: { id } });
    } catch (error) {
      throw new Error(`Erro ao buscar horário: ${error.message}`);
    }
  },

  create: async (data) => {
    try {
      return await prisma.horarioDisponivel.create({ data });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Horário já cadastrado para este psicólogo');
      }
      throw new Error(`Erro ao criar horário: ${error.message}`);
    }
  },

  update: async (id, data) => {
    try {
      return await prisma.horarioDisponivel.update({ where: { id }, data });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Horário já cadastrado para este psicólogo');
      }
      if (error.code === 'P2025') {
        throw new Error('Horário não encontrado');
      }
      throw new Error(`Erro ao atualizar horário: ${error.message}`);
    }
  },

  delete: async (id) => {
    try {
      return await prisma.horarioDisponivel.delete({ where: { id } });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Horário não encontrado');
      }
      throw new Error(`Erro ao deletar horário: ${error.message}`);
    }
  },

  findDisponiveisParaAgendamento: async (psicologoId, dataHora) => {
    try {
      const diaSemana = new Date(dataHora).getDay(); // 0=Domingo ... 6=Sábado
      const hora = dataHora.toTimeString().slice(0, 5); // HH:mm

      return await prisma.horarioDisponivel.findMany({
        where: {
          psicologoId,
          ativo: true,
          diaSemana,
          horaInicio: { lte: hora },
          horaFim: { gt: hora },
        },
      });
    } catch (error) {
      throw new Error(`Erro ao buscar horários disponíveis: ${error.message}`);
    }
  },
};
