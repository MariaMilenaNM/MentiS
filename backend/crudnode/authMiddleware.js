/**
 * Middleware de autenticação JWT compartilhado
 * Usado por todas as rotas que requerem autenticação
 */

import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error('JWT_SECRET não configurado nas variáveis de ambiente');
  process.exit(1);
}

/**
 * Middleware para verificar token JWT
 * Adiciona req.usuario com { id, email, role }
 */
export function verificarToken(req, res, next) {
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

/**
 * Middleware para verificar se é admin
 * Deve ser usado APÓS verificarToken
 */
export function requerAdmin(req, res, next) {
  if (req.usuario?.role !== 'ADMIN') {
    return res.status(403).json({ erro: 'Acesso negado: apenas administradores' });
  }
  next();
}

/**
 * Middleware para verificar se é paciente
 * Deve ser usado APÓS verificarToken
 */
export function requerPaciente(req, res, next) {
  if (req.usuario?.role !== 'PACIENTE') {
    return res.status(403).json({ erro: 'Acesso negado: apenas pacientes' });
  }
  next();
}

/**
 * Middleware para verificar se é psicólogo
 * Deve ser usado APÓS verificarToken
 */
export function requerPsicologo(req, res, next) {
  if (req.usuario?.role !== 'PSICOLOGO') {
    return res.status(403).json({ erro: 'Acesso negado: apenas psicólogos' });
  }
  next();
}
