import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const mensagemRepository = {
  create: async (data) => {
    try {
      const mensagem = await prisma.mensagem.create({
        data,
        include: { remetente: true }
      });

      // Atualizar updatedAt da conversa
      await prisma.conversa.update({
        where: { id: data.conversaId },
        data: { atualizadoEm: new Date() }
      });

      return mensagem;
    } catch (error) {
      throw new Error(`Erro ao criar mensagem: ${error.message}`);
    }
  },

  findByConversaId: async (conversaId, limit = 50, offset = 0) => {
    try {
      return await prisma.mensagem.findMany({
        where: { conversaId },
        include: { remetente: true },
        orderBy: { criadoEm: 'asc' },
        take: limit,
        skip: offset
      });
    } catch (error) {
      throw new Error(`Erro ao buscar mensagens: ${error.message}`);
    }
  },

  marcarComoLida: async (id) => {
    try {
      return await prisma.mensagem.update({
        where: { id },
        data: { lida: true }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Mensagem não encontrada');
      }
      throw new Error(`Erro ao marcar mensagem como lida: ${error.message}`);
    }
  },

  marcarTodasComoLidas: async (conversaId, remetenteId) => {
    try {
      return await prisma.mensagem.updateMany({
        where: {
          conversaId,
          remetenteId: { not: remetenteId },
          lida: false
        },
        data: { lida: true }
      });
    } catch (error) {
      throw new Error(`Erro ao marcar mensagens como lidas: ${error.message}`);
    }
  },

  countNaoLidas: async (conversaId, remetenteId) => {
    try {
      return await prisma.mensagem.count({
        where: {
          conversaId,
          remetenteId: { not: remetenteId },
          lida: false
        }
      });
    } catch (error) {
      throw new Error(`Erro ao contar mensagens não lidas: ${error.message}`);
    }
  },
};