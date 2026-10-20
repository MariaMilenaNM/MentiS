import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const profissionalRepository = {
    findAll: async () => {
        return await prisma.profissional.findMany();
    },
    
    create: async (data) => {
        return await prisma.profissional.create({ data });
    },
    
    findById: async (id) => {
        return await prisma.profissional.findUnique({ where: { id } });
    },
    
    update: async (id, data) => {
        return await prisma.profissional.update({ where: { id }, data });
    },
    
    delete: async (id) => {
        return await prisma.profissional.delete({ where: { id } });
    }
};