// Precisa ser o primeiro import: as rotas leem process.env.JWT_SECRET ao serem carregadas
import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger.js';
import crudProfissional from './crudnode/crudProfissionalRotas.js';
import crudPaciente from './crudnode/crudPacienteRotas.js';
import crudPsicologo from './crudnode/crudPsicologoRotas.js';
import crudHorario from './crudnode/crudHorarioRotas.js';
import crudAgendamento from './crudnode/crudAgendamentoRotas.js';
import crudConversa from './crudnode/crudConversaRotas.js';
import authRoutes from './crudnode/authRotas.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: { erro: 'Muitas requisições, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting específico para auth (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas de login/cadastro por IP
  message: { erro: 'Muitas tentativas de autenticação, tente novamente em 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para profissionais
const profissionalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 requisições por IP
  message: { erro: 'Muitas requisições, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para agendamentos
const agendamentoLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // máximo 20 requisições por minuto
  message: { erro: 'Muitas requisições de agendamento, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para chat/conversas
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // máximo 60 mensagens por minuto
  message: { erro: 'Muitas mensagens, aguarde um momento' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());

// Logs estruturados com Morgan + Winston
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.use(limiter);

// Rotas de autenticação com rate limiting mais restritivo
app.use('/auth/login', authLimiter);
app.use('/pacientes/cadastrar', authLimiter);
app.use('/pacientes/login', authLimiter); // manter compatibilidade

// Rotas existentes (manter compatibilidade)
app.use('/profissionais', profissionalLimiter, crudProfissional);
app.use('/pacientes', crudPaciente);
app.use('/auth', authRoutes);

// Novas rotas
app.use('/psicologos', profissionalLimiter, crudPsicologo);
app.use('/horarios', crudHorario);
app.use('/agendamentos', agendamentoLimiter, crudAgendamento);
app.use('/conversas', chatLimiter, crudConversa);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});
