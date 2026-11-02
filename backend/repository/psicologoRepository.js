import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const psicologoRepository = {
  findAll: async (filters = {}) => {
    try {
      const where = {};

      if (filters.validado !== undefined) {
        where.validado = filters.validado;
      }
      if (filters.modalidade) {
        where.modalidade = filters.modalidade;
      }
      if (filters.abordagem) {
        where.abordagem = filters.abordagem;
      }
      if (filters.precoMax) {
        where.preco = { lte: filters.precoMax };
      }
      if (filters.especialidades && filters.especialidades.length > 0) {
        // Busca por especialidades no JSON stringificado
        where.especialidades = { contains: filters.especialidades[0] };
      }

      return await prisma.psicologo.findMany({
        where,
        include: {
          usuario: true,
          horarios: { where: { ativo: true } },
        },
        orderBy: { criadoEm: 'desc' },
      });
    } catch (error) {
      throw new Error(`Erro ao buscar psicólogos: ${error.message}`);
    }
  },

  findById: async (id) => {
    try {
      return await prisma.psicologo.findUnique({
        where: { id },
        include: {
          usuario: true,
          horarios: { where: { ativo: true } },
        },
      });
    } catch (error) {
      throw new Error(`Erro ao buscar psicólogo: ${error.message}`);
    }
  },

  findByUsuarioId: async (usuarioId) => {
    try {
      return await prisma.psicologo.findUnique({
        where: { usuarioId },
        include: {
          usuario: true,
          horarios: { where: { ativo: true } },
        },
      });
    } catch (error) {
      throw new Error(`Erro ao buscar psicólogo por usuarioId: ${error.message}`);
    }
  },

  findByCRP: async (crp) => {
    try {
      return await prisma.psicologo.findUnique({
        where: { crp },
        include: { usuario: true },
      });
    } catch (error) {
      throw new Error(`Erro ao buscar psicólogo por CRP: ${error.message}`);
    }
  },

  create: async (usuarioId, data) => {
    try {
      return await prisma.psicologo.create({
        data: { ...data, usuarioId },
      });
    } catch (error) {
      throw new Error(`Erro ao criar psicólogo: ${error.message}`);
    }
  },

  update: async (id, data) => {
    try {
      return await prisma.psicologo.update({ where: { id }, data });
    } catch (error) {
      throw new Error(`Erro ao atualizar psicólogo: ${error.message}`);
    }
  },

  delete: async (id) => {
    try {
      return await prisma.psicologo.delete({ where: { id } });
    } catch (error) {
      throw new Error(`Erro ao deletar psicólogo: ${error.message}`);
    }
  },

  findValidados: async () => {
    try {
      return await prisma.psicologo.findMany({
        where: { validado: true },
        include: {
          usuario: true,
          horarios: { where: { ativo: true } },
        },
      });
    } catch (error) {
      throw new Error(`Erro ao buscar psicólogos validados: ${error.message}`);
    }
  },

  searchByEspecialidade: async (especialidade) => {
    try {
      return await prisma.psicologo.findMany({
        where: {
          validado: true,
          especialidades: { contains: especialidade },
        },
        include: {
          usuario: true,
          horarios: { where: { ativo: true } },
        },
      });
    } catch (error) {
      throw new Error(`Erro ao buscar psicólogos por especialidade: ${error.message}`);
    }
  },
};
