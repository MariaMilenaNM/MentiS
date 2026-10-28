import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const profissionalRepository = {
    findAll: async () => {
        try {
            return await prisma.profissional.findMany();
        } catch (error) {
            throw new Error(`Erro ao buscar profissionais: ${error.message}`);
        }
    },

    create: async (data) => {
        try {
            return await prisma.profissional.create({ data });
        } catch (error) {
            throw new Error(`Erro ao criar profissional: ${error.message}`);
        }
    },

    findById: async (id) => {
        try {
            return await prisma.profissional.findUnique({ where: { id } });
        } catch (error) {
            throw new Error(`Erro ao buscar profissional: ${error.message}`);
        }
    },

    update: async (id, data) => {
        try {
            return await prisma.profissional.update({ where: { id }, data });
        } catch (error) {
            throw new Error(`Erro ao atualizar profissional: ${error.message}`);
        }
    },

    delete: async (id) => {
        try {
            return await prisma.profissional.delete({ where: { id } });
        } catch (error) {
            throw new Error(`Erro ao deletar profissional: ${error.message}`);
        }
    }
};