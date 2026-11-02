import express from 'express';
import jwt from 'jsonwebtoken';
import { psicologoRepository } from '../repository/psicologoRepository.js';
import { usuarioRepository } from '../repository/usuarioRepository.js';
import {
  validate,
  psicologoCadastroSchema as profissionalSchema,
  psicologoAtualizacaoSchema as profissionalAtualizacaoSchema,
} from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const routes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /profissionais - Lista todos os psicólogos validados (compatibilidade)
routes.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const psicologos = await psicologoRepository.findValidados();

      // Transformar para formato antigo esperado pelo frontend
      const profissionais = psicologos.map((p) => ({
        id: p.id,
        nome: p.nome || p.usuario?.email || 'Psicólogo',
        crp: parseInt(p.crp) || p.id,
        modalidade:
          p.modalidade === 'ONLINE'
            ? 'Remota'
            : p.modalidade === 'PRESENCIAL'
              ? 'Presencial'
              : 'Presencial e Remota',
        link: p.fotoUrl || '',
        numero: p.usuario?.email || '',
        contato: p.usuario?.email || '',
      }));

      res.status(200).json(profissionais);
    } catch (error) {
      logger.error('Erro ao buscar profissionais (compat)', { error: error.message });
      res.status(500).json({ erro: 'Erro ao buscar profissionais' });
    }
  })
);

// POST /profissionais - Cria novo psicólogo (compatibilidade - apenas admin)
routes.post(
  '/',
  validate(profissionalSchema),
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
        email: `${dados.crp}@psicologo.mentis`,
        senha: 'temp_password_' + Date.now(),
        role: 'PSICOLOGO',
      });

      // Criar Psicologo
      const psicologo = await psicologoRepository.create(usuario.id, {
        crp: dados.crp,
        bio: dados.bio,
        especialidades: JSON.stringify(dados.especialidades || ['Geral']),
        abordagem: dados.abordagem || 'OUTRA',
        preco: dados.preco || 150.0,
        modalidade: dados.modalidade || 'ONLINE',
        validado: false,
        fotoUrl: dados.fotoUrl,
      });

      logger.info('Profissional criado (compat)', { id: psicologo.id, crp: psicologo.crp });

      // Retornar formato antigo
      const profissional = {
        id: psicologo.id,
        nome: dados.nome || psicologo.usuario?.email || 'Psicólogo',
        crp: parseInt(psicologo.crp) || psicologo.id,
        modalidade:
          psicologo.modalidade === 'ONLINE'
            ? 'Remota'
            : psicologo.modalidade === 'PRESENCIAL'
              ? 'Presencial'
              : 'Presencial e Remota',
        link: psicologo.fotoUrl || '',
        numero: psicologo.usuario?.email || '',
        contato: psicologo.usuario?.email || '',
      };

      return res.status(201).json(profissional);
    } catch (error) {
      logger.error('Erro ao criar profissional (compat)', { error: error.message, crp: dados.crp });
      if (error.code === 'P2002' || error.message.includes('CRP já cadastrado')) {
        return res.status(409).json({ erro: 'CRP já cadastrado' });
      }
      return res.status(500).json({ erro: 'Erro ao criar profissional' });
    }
  })
);

// GET /profissionais/:id - Busca por ID (compatibilidade)
routes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      const psicologo = await psicologoRepository.findById(id);

      if (!psicologo) {
        return res.status(404).json({ erro: 'Profissional não encontrado' });
      }

      // Retornar formato antigo
      const profissional = {
        id: psicologo.id,
        nome: psicologo.nome || psicologo.usuario?.email || 'Psicólogo',
        crp: parseInt(psicologo.crp) || psicologo.id,
        modalidade:
          psicologo.modalidade === 'ONLINE'
            ? 'Remota'
            : psicologo.modalidade === 'PRESENCIAL'
              ? 'Presencial'
              : 'Presencial e Remota',
        link: psicologo.fotoUrl || '',
        numero: psicologo.usuario?.email || '',
        contato: psicologo.usuario?.email || '',
      };

      return res.status(200).json(profissional);
    } catch (error) {
      logger.error('Erro ao buscar profissional (compat)', { id, error: error.message });
      return res.status(500).json({ erro: 'Erro ao buscar profissional' });
    }
  })
);

// PUT /profissionais/:id - Atualiza por ID (compatibilidade)
routes.put(
  '/:id',
  validate(profissionalAtualizacaoSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const dadosNovos = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      // Converter formato antigo para novo
      const dadosAtualizados = {};
      if (dadosNovos.nome) dadosAtualizados.nome = dadosNovos.nome; // Não existe no novo modelo, mas podemos ignorar
      if (dadosNovos.crp) dadosAtualizados.crp = String(dadosNovos.crp);
      if (dadosNovos.modalidade) {
        dadosAtualizados.modalidade =
          dadosNovos.modalidade === 'Remota'
            ? 'ONLINE'
            : dadosNovos.modalidade === 'Presencial'
              ? 'PRESENCIAL'
              : 'HIBRIDO';
      }
      if (dadosNovos.link) dadosAtualizados.fotoUrl = dadosNovos.link;

      const psicologoAtualizado = await psicologoRepository.update(id, dadosAtualizados);
      logger.info('Profissional atualizado (compat)', { id });
      return res.status(200).json({
        id: psicologoAtualizado.id,
        nome: psicologoAtualizado.nome || psicologoAtualizado.usuario?.email || 'Psicólogo',
        crp: parseInt(psicologoAtualizado.crp) || psicologoAtualizado.id,
        modalidade:
          psicologoAtualizado.modalidade === 'ONLINE'
            ? 'Remota'
            : psicologoAtualizado.modalidade === 'PRESENCIAL'
              ? 'Presencial'
              : 'Presencial e Remota',
        link: psicologoAtualizado.fotoUrl || '',
        numero: psicologoAtualizado.usuario?.email || '',
        contato: psicologoAtualizado.usuario?.email || '',
      });
    } catch (error) {
      logger.error('Erro ao atualizar profissional (compat)', { id, error: error.message });
      if (error.code === 'P2025') {
        return res.status(404).json({ erro: 'Profissional não encontrado' });
      }
      if (error.code === 'P2002' || error.message.includes('CRP já cadastrado')) {
        return res.status(409).json({ erro: 'CRP já cadastrado' });
      }
      return res.status(500).json({ erro: 'Erro ao atualizar profissional' });
    }
  })
);

// DELETE /profissionais/:id - Remove por ID (compatibilidade)
routes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    try {
      await psicologoRepository.delete(id);
      logger.info('Profissional removido (compat)', { id });
      return res
        .status(200)
        .json({ status: 'removido', mensagem: 'Profissional removido com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar profissional (compat)', { id, error: error.message });
      if (error.code === 'P2025') {
        return res.status(404).json({ erro: 'Profissional não encontrado' });
      }
      return res.status(500).json({ erro: 'Erro ao deletar profissional' });
    }
  })
);

// Middleware de erro global
routes.use((err, req, res, next) => {
  logger.error('Erro não tratado na rota de profissionais (compat)', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default routes;
