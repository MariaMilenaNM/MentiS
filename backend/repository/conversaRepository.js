import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const conversaRepository = {
  findByPacienteAndPsicologo: async (pacienteId, psicologoId) => {
    try {
      return await prisma.conversa.findUnique({
        where: {
          pacienteId_psicologoId: {
            pacienteId,
            psicologoId
          }
        },
        include: {
          mensagens: {
            orderBy: { criadoEm: 'asc' },
            include: { remetente: true }
          },
          paciente: { include: { usuario: true } },
          psicologo: { include: { usuario: true } }
        }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar conversa: ${error.message}`);
    }
  },

  findById: async (id) => {
    try {
      return await prisma.conversa.findUnique({
        where: { id },
        include: {
          mensagens: {
            orderBy: { criadoEm: 'asc' },
            include: { remetente: true }
          },
          paciente: { include: { usuario: true } },
          psicologo: { include: { usuario: true } }
        }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar conversa por ID: ${error.message}`);
    }
  },

  create: async (pacienteId, psicologoId) => {
    try {
      return await prisma.conversa.create({
        data: { pacienteId, psicologoId },
        include: {
          paciente: { include: { usuario: true } },
          psicologo: { include: { usuario: true } }
        }
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error('Conversa já existe entre este paciente e psicólogo');
      }
      throw new Error(`Erro ao criar conversa: ${error.message}`);
    }
  },

  findByPaciente: async (pacienteId) => {
    try {
      return await prisma.conversa.findMany({
        where: { pacienteId, ativa: true },
        include: {
          psicologo: { include: { usuario: true } },
          mensagens: {
            orderBy: { criadoEm: 'desc' },
            take: 1
          }
        },
        orderBy: { atualizadoEm: 'desc' }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar conversas do paciente: ${error.message}`);
    }
  },

  findByPsicologo: async (psicologoId) => {
    try {
      return await prisma.conversa.findMany({
        where: { psicologoId, ativa: true },
        include: {
          paciente: { include: { usuario: true } },
          mensagens: {
            orderBy: { criadoEm: 'desc' },
            take: 1
          }
        },
        orderBy: { atualizadoEm: 'desc' }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar conversas do psicólogo: ${error.message}`);
    }
  },

  updateAtividade: async (id, ativa) => {
    try {
      return await prisma.conversa.update({
        where: { id },
        data: { ativa }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Conversa não encontrada');
      }
      throw new Error(`Erro ao atualizar atividade da conversa: ${error.message}`);
    }
  },
};