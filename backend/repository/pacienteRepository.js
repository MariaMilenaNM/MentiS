import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const pacienteRepository = {
    findByEmail: async (email) => {
        try {
            return await prisma.paciente.findUnique({ where: { email } });
        } catch (error) {
            throw new Error(`Erro ao buscar paciente por email: ${error.message}`);
        }
    },

    create: async (data) => {
        try {
            const hashedSenha = await bcrypt.hash(data.senha, SALT_ROUNDS);
            return await prisma.paciente.create({
                data: { ...data, senha: hashedSenha }
            });
        } catch (error) {
            throw new Error(`Erro ao criar paciente: ${error.message}`);
        }
    },

    findByEmailAndSenha: async (email, senha) => {
        try {
            const paciente = await prisma.paciente.findUnique({ where: { email } });
            if (!paciente) {
                return null;
            }
            const senhaValida = await bcrypt.compare(senha, paciente.senha);
            return senhaValida ? paciente : null;
        } catch (error) {
            throw new Error(`Erro ao validar credenciais: ${error.message}`);
        }
    },

    findById: async (id) => {
        try {
            return await prisma.paciente.findUnique({ where: { id } });
        } catch (error) {
            throw new Error(`Erro ao buscar paciente por ID: ${error.message}`);
        }
    },

    update: async (id, data) => {
        try {
            // Se estiver atualizando a senha, fazer hash
            if (data.senha) {
                data.senha = await bcrypt.hash(data.senha, SALT_ROUNDS);
            }
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
    }
};