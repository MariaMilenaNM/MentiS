import express from 'express';
import jwt from 'jsonwebtoken';
import { horarioRepository } from '../repository/horarioRepository.js';
import { psicologoRepository } from '../repository/psicologoRepository.js';
import { validate, horarioCadastroSchema, horarioAtualizacaoSchema } from '../utils/validation.js';
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

// GET /horarios/psicologo/:psicologoId - Lista horários de um psicólogo
routes.get(
  '/psicologo/:psicologoId',
  asyncHandler(async (req, res) => {
    const psicologoId = parseInt(req.params.psicologoId);

    if (isNaN(psicologoId)) {
      return res.status(400).json({ erro: 'ID do psicólogo inválido' });
    }

    try {
      const horarios = await horarioRepository.findByPsicologoId(psicologoId);
      return res.status(200).json(horarios);
    } catch (error) {
      logger.error('Erro ao buscar horários', { psicologoId, error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar horários' });
    }
  })
);

// GET /horarios/:id - Busca horário por ID
routes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      const horario = await horarioRepository.findById(id);

      if (!horario) {
        return res.status(404).json({ erro: 'Horário não encontrado' });
      }

      return res.status(200).json(horario);
    } catch (error) {
      logger.error('Erro ao buscar horário', { id, error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar horário' });
    }
  })
);

// POST /horarios - Cadastra horário (requer token, próprio psicólogo ou admin)
routes.post(
  '/',
  verificarToken,
  validate(horarioCadastroSchema),
  asyncHandler(async (req, res) => {
    const dados = req.body;

    try {
      // Verificar se o psicólogo existe
      const psicologo = await psicologoRepository.findById(dados.psicologoId);
      if (!psicologo) {
        return res.status(404).json({ erro: 'Psicólogo não encontrado' });
      }

      // Verificação de posse: psicólogo só pode cadastrar seus próprios horários (ou admin)
      if (req.usuario.role !== 'ADMIN' && psicologo.usuarioId !== req.usuario.id) {
        return res
          .status(403)
          .json({ erro: 'Acesso negado: você só pode cadastrar horários para seu próprio perfil' });
      }

      const horario = await horarioRepository.create(dados);
      logger.info('Horário cadastrado', { id: horario.id, psicologoId: horario.psicologoId });
      return res.status(201).json(horario);
    } catch (error) {
      logger.error('Erro ao criar horário', { error: error.message });
      if (error.message.includes('Horário já cadastrado')) {
        return res.status(409).json({ erro: 'Horário já cadastrado para este psicólogo' });
      }
      return res.status(500).json({ erro: 'Erro ao criar horário' });
    }
  })
);

// PUT /horarios/:id - Atualiza horário (requer token, próprio psicólogo ou admin)
routes.put(
  '/:id',
  verificarToken,
  validate(horarioAtualizacaoSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const dados = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      const horario = await horarioRepository.findById(id);

      if (!horario) {
        return res.status(404).json({ erro: 'Horário não encontrado' });
      }

      const psicologo = await psicologoRepository.findById(horario.psicologoId);

      // Verificação de posse
      if (req.usuario.role !== 'ADMIN' && psicologo.usuarioId !== req.usuario.id) {
        return res
          .status(403)
          .json({ erro: 'Acesso negado: você só pode atualizar seus próprios horários' });
      }

      const horarioAtualizado = await horarioRepository.update(id, dados);
      logger.info('Horário atualizado', { id });
      return res.status(200).json(horarioAtualizado);
    } catch (error) {
      logger.error('Erro ao atualizar horário', { id, error: error.message });
      if (error.message.includes('Horário já cadastrado')) {
        return res.status(409).json({ erro: 'Horário já cadastrado para este psicólogo' });
      }
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ erro: error.message });
      }
      return res.status(500).json({ erro: 'Erro ao atualizar horário' });
    }
  })
);

// DELETE /horarios/:id - Remove horário (requer token, próprio psicólogo ou admin)
routes.delete(
  '/:id',
  verificarToken,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      const horario = await horarioRepository.findById(id);

      if (!horario) {
        return res.status(404).json({ erro: 'Horário não encontrado' });
      }

      const psicologo = await psicologoRepository.findById(horario.psicologoId);

      // Verificação de posse
      if (req.usuario.role !== 'ADMIN' && psicologo.usuarioId !== req.usuario.id) {
        return res
          .status(403)
          .json({ erro: 'Acesso negado: você só pode remover seus próprios horários' });
      }

      await horarioRepository.delete(id);
      logger.info('Horário removido', { id });
      return res.status(200).json({ status: 'removido', mensagem: 'Horário removido com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar horário', { id, error: error.message });
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ erro: error.message });
      }
      return res.status(500).json({ erro: 'Erro ao deletar horário' });
    }
  })
);

// Middleware de erro global
routes.use((err, req, res, next) => {
  logger.error('Erro não tratado na rota de horários', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default routes;
