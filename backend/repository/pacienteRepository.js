import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const pacienteRepository = {
    findByEmail: async (email) => {
        return await prisma.paciente.findUnique({ where: { email } });
    },
    
    create: async (data) => {
        return await prisma.paciente.create({ data });
    },
    
    findByEmailAndSenha: async (email, senha) => {
        return await prisma.paciente.findFirst({ where: { email, senha } });
    },
    
    findById: async (id) => {
        return await prisma.paciente.findUnique({ where: { id } });
    },
    
    update: async (id, data) => {
        return await prisma.paciente.update({ where: { id }, data });
    },
    
    delete: async (id) => {
        return await prisma.paciente.delete({ where: { id } });
    }
};