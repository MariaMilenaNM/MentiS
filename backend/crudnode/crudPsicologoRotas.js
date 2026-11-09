import express from 'express';
import jwt from 'jsonwebtoken';
import { usuarioRepository } from '../repository/usuarioRepository.js';
import { psicologoRepository } from '../repository/psicologoRepository.js';
import {
  validate,
  psicologoCadastroSchema,
  psicologoAtualizacaoSchema,
} from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const routes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não informado' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (erro) {
    logger.warn('Token inválido ou expirado', { error: erro.message });
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /psicologos - Lista todos os profissionais (público, apenas validados)
routes.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const { validado, modalidade, abordagem, precoMax, especialidade } = req.query;

      const filters = {};
      if (validado !== undefined) filters.validado = validado === 'true';
      if (modalidade) filters.modalidade = modalidade;
      if (abordagem) filters.abordagem = abordagem;
      if (precoMax) filters.precoMax = parseFloat(precoMax);
      if (especialidade) filters.especialidades = [especialidade];

      // Por padrão, mostrar apenas validados para o público
      if (filters.validado === undefined) {
        filters.validado = true;
      }

      const profissionais = await psicologoRepository.findAll(filters);
      return res.status(200).json(profissionais);
    } catch (error) {
      logger.error('Erro ao buscar profissionais', { error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar profissionais' });
    }
  })
);

// GET /psicologos/:id - Busca profissional por ID
routes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      const profissional = await psicologoRepository.findById(id);

      if (!profissional) {
        return res.status(404).json({ erro: 'Profissional não encontrado' });
      }

      // Não retornar senha do usuário
      const { senha: _, ...usuarioSeguro } = profissional.usuario || {};
      const profissionalSeguro = { ...profissional, usuario: usuarioSeguro };

      return res.status(200).json(profissionalSeguro);
    } catch (error) {
      logger.error('Erro ao buscar profissional', { id, error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar profissional' });
    }
  })
);

// POST /psicologos - Cadastra profissional (requer token de admin ou auto-cadastro)
routes.post(
  '/',
  verifyAuthOrAdmin,
  validate(psicologoCadastroSchema),
  asyncHandler(async (req, res) => {
    const dados = req.body;

    try {
      // Verificar se CRP já existe
      const crpExiste = await psicologoRepository.findByCRP(dados.crp);
      if (crpExiste) {
        return res.status(409).json({ erro: 'CRP já cadastrado' });
      }

      // Criar Usuario
      const usuario = await usuarioRepository.create({
        email: `${dados.crp}@profissional.mentis`, // Email temporário baseado no CRP
        senha: 'temp_password_' + Date.now(), // Senha temporária
        role: 'PSICOLOGO',
      });

      // Criar Profissional (model Psicologo no banco)
      const profissional = await psicologoRepository.create(usuario.id, {
        crp: dados.crp,
        bio: dados.bio,
        especialidades: JSON.stringify(dados.especialidades),
        abordagem: dados.abordagem,
        preco: dados.preco,
        modalidade: dados.modalidade,
        validado: false, // Sempre false no cadastro, admin valida depois
        fotoUrl: dados.fotoUrl,
      });

      logger.info('Profissional cadastrado', {
        id: profissional.id,
        crp: profissional.crp,
        usuarioId: usuario.id,
      });
      return res.status(201).json(profissional);
    } catch (error) {
      logger.error('Erro ao criar profissional', { error: error.message, crp: dados.crp });
      if (error.message.includes('CRP já cadastrado')) {
        return res.status(409).json({ erro: 'CRP já cadastrado' });
      }
      return res.status(500).json({ erro: 'Erro ao criar profissional' });
    }
  })
);

// PUT /psicologos/:id - Atualiza profissional (requer token, próprio ou admin)
routes.put(
  '/:id',
  verificarToken,
  validate(psicologoAtualizacaoSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const dados = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      const profissional = await psicologoRepository.findById(id);

      if (!profissional) {
        return res.status(404).json({ erro: 'Profissional não encontrado' });
      }

      // Verificação de posse: profissional só pode atualizar próprio perfil (ou admin)
      if (req.usuario.role !== 'ADMIN' && profissional.usuarioId !== req.usuario.id) {
        return res
          .status(403)
          .json({ erro: 'Acesso negado: você só pode atualizar seu próprio perfil' });
      }

      // Não permitir alterar validação se não for admin
      if (req.usuario.role !== 'ADMIN' && dados.validado !== undefined) {
        delete dados.validado;
      }

      // Verificar unicidade de CRP se está sendo alterado
      if (dados.crp && dados.crp !== profissional.crp) {
        const crpExiste = await psicologoRepository.findByCRP(dados.crp);
        if (crpExiste) {
          return res.status(409).json({ erro: 'CRP já cadastrado por outro profissional' });
        }
      }

      // Converter especialidades para JSON string se fornecido
      if (dados.especialidades) {
        dados.especialidades = JSON.stringify(dados.especialidades);
      }

      const profissionalAtualizado = await psicologoRepository.update(id, dados);
      logger.info('Profissional atualizado', { id });
      return res.status(200).json(profissionalAtualizado);
    } catch (error) {
      logger.error('Erro ao atualizar profissional', { id, error: error.message });
      if (error.message.includes('CRP já cadastrado')) {
        return res.status(409).json({ erro: 'CRP já cadastrado' });
      }
      if (error.message.includes('P2025')) {
        return res.status(404).json({ erro: 'Profissional não encontrado' });
      }
      return res.status(500).json({ erro: 'Erro ao atualizar profissional' });
    }
  })
);

// DELETE /psicologos/:id - Remove profissional (requer token admin)
routes.delete(
  '/:id',
  verificarToken,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    if (req.usuario.role !== 'ADMIN') {
      return res
        .status(403)
        .json({ erro: 'Acesso negado: apenas administradores podem remover profissionais' });
    }

    try {
      const profissional = await psicologoRepository.findById(id);

      if (!profissional) {
        return res.status(404).json({ erro: 'Profissional não encontrado' });
      }

      await psicologoRepository.delete(id);
      logger.info('Profissional removido', { id });
      return res
        .status(200)
        .json({ status: 'removido', mensagem: 'Profissional removido com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar profissional', { id, error: error.message });
      if (error.message.includes('P2025')) {
        return res.status(404).json({ erro: 'Profissional não encontrado' });
      }
      return res.status(500).json({ erro: 'Erro ao deletar profissional' });
    }
  })
);

// Middleware para permitir acesso com token válido (paciente, profissional ou admin)
function verifyAuthOrAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  // Permitir cadastro sem token (público) - remover em produção se necessário
  if (!authHeader) {
    return next();
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

// Middleware de erro global
routes.use((err, req, res, next) => {
  logger.error('Erro não tratado na rota de profissionais', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default routes;
