import express from 'express';
import jwt from 'jsonwebtoken';
import { usuarioRepository } from '../repository/usuarioRepository.js';
import { pacienteRepository } from '../repository/pacienteRepository.js';
import {
  validate,
  pacienteCadastroSchema,
  pacienteLoginSchema,
  pacienteAtualizacaoSchema,
} from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const routes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('JWT_SECRET não configurado nas variáveis de ambiente');
  process.exit(1);
}

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

// POST /pacientes/cadastrar - Cadastra paciente (cria Usuario + Paciente)
routes.post(
  '/cadastrar',
  validate(pacienteCadastroSchema),
  asyncHandler(async (req, res) => {
    const dados = req.body;

    // Verificar se email já existe no Usuario
    const usuarioExiste = await usuarioRepository.findByEmail(dados.email);
    if (usuarioExiste) {
      return res.status(409).json({ status: 'duplicado', erro: 'E-mail já cadastrado' });
    }

    // Criar Usuario
    const usuario = await usuarioRepository.create({
      email: dados.email,
      senha: dados.senha,
      role: 'PACIENTE',
    });

    // Criar Paciente vinculado ao Usuario
    const { senha, email, aceiteLGPD, ...pacienteData } = dados;
    await pacienteRepository.create(usuario.id, {
      ...pacienteData,
      dataNasc: new Date(dados.dataNasc),
      aceiteLGPD: dados.aceiteLGPD,
    });

    logger.info('Paciente cadastrado com sucesso', { email: dados.email, usuarioId: usuario.id });
    return res.status(201).json({ status: 'ok', mensagem: 'Paciente cadastrado com sucesso' });
  })
);

// POST /pacientes/login - Login do paciente
routes.post(
  '/login',
  validate(pacienteLoginSchema),
  asyncHandler(async (req, res) => {
    const { email, senha } = req.body;

    const usuario = await usuarioRepository.findByEmailAndSenha(email, senha);

    if (!usuario || usuario.role !== 'PACIENTE') {
      logger.warn('Tentativa de login falhou', { email });
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    if (!usuario.ativo) {
      return res.status(401).json({ erro: 'Usuário inativo' });
    }

    // Buscar dados do paciente
    const paciente = await pacienteRepository.findByUsuarioId(usuario.id);
    if (!paciente) {
      return res.status(404).json({ erro: 'Perfil de paciente não encontrado' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, role: usuario.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    logger.info('Login realizado com sucesso', { email, usuarioId: usuario.id });
    return res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
      },
      paciente: {
        id: paciente.id,
        nome: paciente.nome,
        email: usuario.email,
        telefone: paciente.telefone,
        cidade: paciente.cidade,
        estado: paciente.estado,
      },
    });
  })
);

// GET /pacientes/:id - Perfil do paciente (requer token)
routes.get(
  '/:id',
  verificarToken,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    // Verificação de posse: paciente só pode acessar próprio perfil
    // Para admins, permitir acesso a qualquer paciente
    if (req.usuario.role !== 'ADMIN' && req.usuario.id !== id) {
      // Buscar o usuarioId do paciente
      const paciente = await pacienteRepository.findById(id);
      if (!paciente || paciente.usuarioId !== req.usuario.id) {
        return res
          .status(403)
          .json({ erro: 'Acesso negado: você só pode visualizar seu próprio perfil' });
      }
    }

    const paciente = await pacienteRepository.findById(id);

    if (!paciente) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    const usuario = await usuarioRepository.findById(paciente.usuarioId);
    const { senha: _, ...usuarioSeguro } = usuario || {};

    return res.status(200).json({
      ...paciente,
      usuario: usuarioSeguro,
    });
  })
);

// PUT /pacientes/:id - Atualiza perfil do paciente (requer token)
routes.put(
  '/:id',
  verificarToken,
  validate(pacienteAtualizacaoSchema),
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const dados = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    const paciente = await pacienteRepository.findById(id);

    if (!paciente) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    // Verificação de posse
    if (req.usuario.role !== 'ADMIN' && paciente.usuarioId !== req.usuario.id) {
      return res
        .status(403)
        .json({ erro: 'Acesso negado: você só pode atualizar seu próprio perfil' });
    }

    // Separar dados de Usuario e Paciente
    const usuarioData = {};
    const pacienteData = {};

    if (dados.email) usuarioData.email = dados.email;
    if (dados.senha) usuarioData.senha = dados.senha;

    ['nome', 'telefone', 'cidade', 'estado'].forEach((campo) => {
      if (dados[campo]) pacienteData[campo] = dados[campo];
    });

    if (dados.dataNasc) pacienteData.dataNasc = new Date(dados.dataNasc);

    // Atualizar Usuario se houver dados
    if (Object.keys(usuarioData).length > 0) {
      // Verificar unicidade de email
      if (
        usuarioData.email &&
        usuarioData.email !== (await usuarioRepository.findById(paciente.usuarioId)).email
      ) {
        const emailExiste = await usuarioRepository.findByEmail(usuarioData.email);
        if (emailExiste) {
          return res.status(409).json({ erro: 'E-mail já cadastrado por outro usuário' });
        }
      }
      await usuarioRepository.update(paciente.usuarioId, usuarioData);
    }

    // Atualizar Paciente se houver dados
    if (Object.keys(pacienteData).length > 0) {
      await pacienteRepository.update(id, pacienteData);
    }

    logger.info('Paciente atualizado', { id });
    return res
      .status(200)
      .json({ status: 'atualizado', mensagem: 'Perfil atualizado com sucesso' });
  })
);

// DELETE /pacientes/:id - Remove paciente (requer token)
routes.delete(
  '/:id',
  verificarToken,
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ erro: 'ID inválido' });
    }

    const paciente = await pacienteRepository.findById(id);

    if (!paciente) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    // Verificação de posse
    if (req.usuario.role !== 'ADMIN' && paciente.usuarioId !== req.usuario.id) {
      return res
        .status(403)
        .json({ erro: 'Acesso negado: você só pode remover seu próprio perfil' });
    }

    // Deletar Paciente (cascade deleta Usuario via onDelete: Cascade no schema)
    await pacienteRepository.delete(id);
    logger.info('Paciente removido', { id });
    return res.status(200).json({ status: 'removido', mensagem: 'Paciente removido com sucesso' });
  })
);

// Middleware de erro global
routes.use((err, req, res, next) => {
  logger.error('Erro não tratado na rota de pacientes', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  return res.status(500).json({ erro: 'Erro interno do servidor' });
});

export default routes;
