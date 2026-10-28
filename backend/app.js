import express from "express";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { logger } from "./utils/logger.js";
import crudProfissional from "./crudnode/crudProfissionalRotas.js";
import crudPaciente from "./crudnode/crudPacienteRotas.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: { erro: "Muitas requisições, tente novamente mais tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting específico para auth (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas de login/cadastro por IP
  message: { erro: "Muitas tentativas de autenticação, tente novamente em 15 minutos" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para profissionais
const profissionalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 requisições por IP
  message: { erro: "Muitas requisições, tente novamente mais tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());

// Logs estruturados com Morgan + Winston
app.use(morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(limiter);

// Rotas de autenticação com rate limiting mais restritivo
// As rotas reais são /pacientes/cadastrar e /pacientes/login (prefixo adicionado pelo app.use('/pacientes', crudPaciente))
// Aplicamos o limiter nas rotas específicas ANTES do mount do crudPaciente
app.use("/pacientes/cadastrar", authLimiter);
app.use("/pacientes/login", authLimiter);

// Rotas de profissionais com rate limiting e proteção futura
app.use("/profissionais", profissionalLimiter, crudProfissional);
app.use("/pacientes", crudPaciente);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});