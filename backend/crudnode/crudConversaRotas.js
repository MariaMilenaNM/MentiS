import express from 'express';
import jwt from 'jsonwebtoken';
import { conversaRepository } from '../repository/conversaRepository.js';
import { mensagemRepository } from '../repository/mensagemRepository.js';
import { pacienteRepository } from '../repository/pacienteRepository.js';
import { psicologoRepository } from '../repository/psicologoRepository.js';
import { validate, conversaCadastroSchema, mensagemCadastroSchema } from '../utils/validation.js';
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

// GET /conversas - Lista conversas do usuário logado (requer token)
routes.get(
  '/',
  verificarToken,
  asyncHandler(async (req, res) => {
    try {
      let conversas = [];

      if (req.usuario.role === 'PACIENTE') {
        const paciente = await pacienteRepository.findByUsuarioId(req.usuario.id);
        if (paciente) {
          conversas = await conversaRepository.findByPaciente(paciente.id);
        }
      } else if (req.usuario.role === 'PSICOLOGO') {
        const psicologo = await psicologoRepository.findByUsuarioId(req.usuario.id);
        if (psicologo) {
          conversas = await conversaRepository.findByPsicologo(psicologo.id);
        }
      } else if (req.usuario.role === 'ADMIN') {
        // Admin pode ver todas - implementar se necessário
        return res.status(501).json({ erro: 'Listagem para admin não implementada' });
      }

      return res.status(200).json(conversas);
    } catch (error) {
      logger.error('Erro ao buscar conversas', { error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar conversas' });
    }
  })
);

// GET /conversas/:id - Busca conversa por ID (requer token)
routes.get(
  '/:id',
  verificarToken,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      const conversa = await conversaRepository.findById(id);

      if (!conversa) {
        return res.status(404).json({ erro: 'Conversa não encontrada' });
      }

      // Verificação de permissão
      const temPermissao =
        req.usuario.role === 'ADMIN' ||
        (req.usuario.role === 'PACIENTE' && conversa.paciente.usuarioId === req.usuario.id) ||
        (req.usuario.role === 'PSICOLOGO' && conversa.psicologo.usuarioId === req.usuario.id);

      if (!temPermissao) {
        return res.status(403).json({ erro: 'Acesso negado' });
      }

      // Marcar mensagens do outro participante como lidas
      await mensagemRepository.marcarTodasComoLidas(conversa.id, req.usuario.id);

      return res.status(200).json(conversa);
    } catch (error) {
      logger.error('Erro ao buscar conversa', { id, error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar conversa' });
    }
  })
);

// POST /conversas - Cria ou busca conversa existente (requer token)
routes.post(
  '/',
  verificarToken,
  validate(conversaCadastroSchema),
  asyncHandler(async (req, res) => {
    const { pacienteId, psicologoId } = req.body;

    try {
      // Verificação de permissão
      if (req.usuario.role === 'PACIENTE') {
        const paciente = await pacienteRepository.findByUsuarioId(req.usuario.id);
        if (!paciente || paciente.id !== pacienteId) {
          return res
            .status(403)
            .json({ erro: 'Acesso negado: você só pode iniciar conversas como paciente' });
        }
      } else if (req.usuario.role === 'PSICOLOGO') {
        const psicologo = await psicologoRepository.findByUsuarioId(req.usuario.id);
        if (!psicologo || psicologo.id !== psicologoId) {
          return res
            .status(403)
            .json({ erro: 'Acesso negado: você só pode iniciar conversas como psicólogo' });
        }
      }
      // ADMIN pode criar qualquer conversa

      // Verificar se paciente e psicólogo existem
      const paciente = await pacienteRepository.findById(pacienteId);
      if (!paciente) {
        return res.status(404).json({ erro: 'Paciente não encontrado' });
      }

      const psicologo = await psicologoRepository.findById(psicologoId);
      if (!psicologo) {
        return res.status(404).json({ erro: 'Psicólogo não encontrado' });
      }

      // Buscar ou criar conversa
      let conversa = await conversaRepository.findByPacienteAndPsicologo(pacienteId, psicologoId);

      if (!conversa) {
        conversa = await conversaRepository.create(pacienteId, psicologoId);
        logger.info('Nova conversa criada', { pacienteId, psicologoId });
      }

      return res.status(200).json(conversa);
    } catch (error) {
      logger.error('Erro ao criar/buscar conversa', { error: error.message });
      if (error.message.includes('já existe')) {
        // Se já existe, buscar e retornar
        const conversa = await conversaRepository.findByPacienteAndPsicologo(
          pacienteId,
          psicologoId
        );
        return res.status(200).json(conversa);
      }
      return res.status(500).json({ erro: 'Erro ao criar conversa' });
    }
  })
);

// POST /conversas/:id/mensagens - Envia mensagem na conversa (requer token)
routes.post(
  '/:id/mensagens',
  verificarToken,
  validate(mensagemCadastroSchema),
  asyncHandler(async (req, res) => {
    const conversaId = parseInt(req.params.id);
    const { conteudo } = req.body;

    if (isNaN(conversaId)) {
      return res.status(400).json({ erro: 'ID da conversa inválido' });
    }

    try {
      const conversa = await conversaRepository.findById(conversaId);

      if (!conversa) {
        return res.status(404).json({ erro: 'Conversa não encontrada' });
      }

      // Verificação de permissão
      const temPermissao =
        req.usuario.role === 'ADMIN' ||
        (req.usuario.role === 'PACIENTE' && conversa.paciente.usuarioId === req.usuario.id) ||
        (req.usuario.role === 'PSICOLOGO' && conversa.psicologo.usuarioId === req.usuario.id);

      if (!temPermissao) {
        return res.status(403).json({ erro: 'Acesso negado' });
      }

      if (!conversa.ativa) {
        return res.status(400).json({ erro: 'Conversa não está ativa' });
      }

      const mensagem = await mensagemRepository.create({
        conversaId,
        remetenteId: req.usuario.id,
        conteudo,
      });

      logger.info('Mensagem enviada', { conversaId, remetenteId: req.usuario.id });
      return res.status(201).json(mensagem);
    } catch (error) {
      logger.error('Erro ao enviar mensagem', { conversaId, error: error.message });
      return res.status(500).json({ erro: 'Erro ao enviar mensagem' });
    }
  })
);

// GET /conversas/:id/mensagens - Lista mensagens da conversa (requer token)
routes.get(
  '/:id/mensagens',
  verificarToken,
  asyncHandler(async (req, res) => {
    const conversaId = parseInt(req.params.id);
    const { limit = 50, offset = 0 } = req.query;

    if (isNaN(conversaId)) {
      return res.status(400).json({ erro: 'ID da conversa inválido' });
    }

    try {
      const conversa = await conversaRepository.findById(conversaId);

      if (!conversa) {
        return res.status(404).json({ erro: 'Conversa não encontrada' });
      }

      // Verificação de permissão
      const temPermissao =
        req.usuario.role === 'ADMIN' ||
        (req.usuario.role === 'PACIENTE' && conversa.paciente.usuarioId === req.usuario.id) ||
        (req.usuario.role === 'PSICOLOGO' && conversa.psicologo.usuarioId === req.usuario.id);

      if (!temPermissao) {
        return res.status(403).json({ erro: 'Acesso negado' });
      }

      // Marcar como lidas
      await mensagemRepository.marcarTodasComoLidas(conversaId, req.usuario.id);

      const mensagens = await mensagemRepository.findByConversaId(
        conversaId,
        parseInt(limit),
        parseInt(offset)
      );
      return res.status(200).json(mensagens);
    } catch (error) {
      logger.error('Erro ao buscar mensagens', { conversaId, error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar mensagens' });
    }
  })
);

// PATCH /conversas/:id - Atualiza status da conversa (arquivar/reativar)
routes.patch(
  '/:id',
  verificarToken,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { ativa } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    if (typeof ativa !== 'boolean') {
      return res.status(400).json({ erro: "Campo 'ativa' deve ser booleano" });
    }

    try {
      const conversa = await conversaRepository.findById(id);

      if (!conversa) {
        return res.status(404).json({ erro: 'Conversa não encontrada' });
      }

      // Verificação de permissão
      const temPermissao =
        req.usuario.role === 'ADMIN' ||
        (req.usuario.role === 'PACIENTE' && conversa.paciente.usuarioId === req.usuario.id) ||
        (req.usuario.role === 'PSICOLOGO' && conversa.psicologo.usuarioId === req.usuario.id);

      if (!temPermissao) {
        return res.status(403).json({ erro: 'Acesso negado' });
      }

      const conversaAtualizada = await conversaRepository.updateAtividade(id, ativa);
      logger.info('Status da conversa atualizado', { id, ativa });
      return res.status(200).json(conversaAtualizada);
    } catch (error) {
      logger.error('Erro ao atualizar conversa', { id, error: error.message });
      return res.status(500).json({ erro: 'Erro ao atualizar conversa' });
    }
  })
);

// Middleware de erro global
routes.use((err, req, res, next) => {
  logger.error('Erro não tratado na rota de conversas', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default routes;
