import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP por janela
  message: { erro: "Muitas requisições, tente novamente mais tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // limite de 10 tentativas de login/cadastro por IP
  message: { erro: "Muitas tentativas de autenticação, tente novamente em 15 minutos" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // limite de 30 requisições por IP por minuto
  message: { erro: "Limite de requisições excedido" },
  standardHeaders: true,
  legacyHeaders: false,
});