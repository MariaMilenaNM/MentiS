import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const usuarioRepository = {
  findByEmail: async (email) => {
    try {
      return await prisma.usuario.findUnique({ where: { email } });
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por email: ${error.message}`);
    }
  },

  findById: async (id) => {
    try {
      return await prisma.usuario.findUnique({ where: { id } });
    } catch (error) {
      throw new Error(`Erro ao buscar usuário por ID: ${error.message}`);
    }
  },

  create: async (data) => {
    try {
      const hashedSenha = await bcrypt.hash(data.senha, SALT_ROUNDS);
      return await prisma.usuario.create({
        data: { ...data, senha: hashedSenha },
      });
    } catch (error) {
      throw new Error(`Erro ao criar usuário: ${error.message}`);
    }
  },

  findByEmailAndSenha: async (email, senha) => {
    try {
      const usuario = await prisma.usuario.findUnique({ where: { email } });
      if (!usuario) {
        return null;
      }
      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      return senhaValida ? usuario : null;
    } catch (error) {
      throw new Error(`Erro ao validar credenciais: ${error.message}`);
    }
  },

  update: async (id, data) => {
    try {
      const dataToUpdate = { ...data };
      if (dataToUpdate.senha) {
        dataToUpdate.senha = await bcrypt.hash(dataToUpdate.senha, SALT_ROUNDS);
      }
      return await prisma.usuario.update({ where: { id }, data: dataToUpdate });
    } catch (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
  },

  delete: async (id) => {
    try {
      return await prisma.usuario.delete({ where: { id } });
    } catch (error) {
      throw new Error(`Erro ao deletar usuário: ${error.message}`);
    }
  },

  findByRole: async (role) => {
    try {
      return await prisma.usuario.findMany({ where: { role } });
    } catch (error) {
      throw new Error(`Erro ao buscar usuários por role: ${error.message}`);
    }
  },
};
