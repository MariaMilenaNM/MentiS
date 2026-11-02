import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const pacienteRepository = {
  findByUsuarioId: async (usuarioId) => {
    try {
      return await prisma.paciente.findUnique({ where: { usuarioId } });
    } catch (error) {
      throw new Error(`Erro ao buscar paciente por usuarioId: ${error.message}`);
    }
  },

  findById: async (id) => {
    try {
      return await prisma.paciente.findUnique({ where: { id } });
    } catch (error) {
      throw new Error(`Erro ao buscar paciente por ID: ${error.message}`);
    }
  },

  create: async (usuarioId, data) => {
    try {
      return await prisma.paciente.create({
        data: { ...data, usuarioId },
      });
    } catch (error) {
      throw new Error(`Erro ao criar paciente: ${error.message}`);
    }
  },

  update: async (id, data) => {
    try {
      return await prisma.paciente.update({ where: { id }, data });
    } catch (error) {
      throw new Error(`Erro ao atualizar paciente: ${error.message}`);
    }
  },

  delete: async (id) => {
    try {
      return await prisma.paciente.delete({ where: { id } });
    } catch (error) {
      throw new Error(`Erro ao deletar paciente: ${error.message}`);
    }
  },

  findAll: async () => {
    try {
      return await prisma.paciente.findMany({
        include: { usuario: true },
      });
    } catch (error) {
      throw new Error(`Erro ao buscar pacientes: ${error.message}`);
    }
  },

  findWithAgendamentos: async (id) => {
    try {
      return await prisma.paciente.findUnique({
        where: { id },
        include: {
          agendamentos: {
            include: {
              psicologo: {
                include: { usuario: true },
              },
              horario: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error(`Erro ao buscar paciente com agendamentos: ${error.message}`);
    }
  },

  findWithConversas: async (id) => {
    try {
      return await prisma.paciente.findUnique({
        where: { id },
        include: {
          conversas: {
            include: {
              psicologo: {
                include: { usuario: true },
              },
              mensagens: {
                orderBy: { criadoEm: 'asc' },
              },
            },
          },
        },
      });
    } catch (error) {
      throw new Error(`Erro ao buscar paciente com conversas: ${error.message}`);
    }
  },
};
