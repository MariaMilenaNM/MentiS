import express from "express";
import jwt from "jsonwebtoken";
import { usuarioRepository } from "../repository/usuarioRepository.js";
import { pacienteRepository } from "../repository/pacienteRepository.js";
import { psicologoRepository } from "../repository/psicologoRepository.js";
import { validate, pacienteLoginSchema } from "../utils/validation.js";
import { logger } from "../utils/logger.js";

const routes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error("JWT_SECRET não configurado nas variáveis de ambiente");
  process.exit(1);
}

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /auth/login - Login unificado (paciente ou profissional)
routes.post("/login", validate(pacienteLoginSchema), asyncHandler(async (req, res) => {
    const { email, senha } = req.body;

    const usuario = await usuarioRepository.findByEmailAndSenha(email, senha);

    if (!usuario || !usuario.ativo) {
        logger.warn("Tentativa de login falhou", { email });
        return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    let perfil = null;

    if (usuario.role === "PACIENTE") {
        const paciente = await pacienteRepository.findByUsuarioId(usuario.id);
        if (!paciente) {
            return res.status(404).json({ erro: "Perfil de paciente não encontrado" });
        }
        perfil = {
            id: paciente.id,
            nome: paciente.nome,
            email: usuario.email,
            telefone: paciente.telefone,
            cidade: paciente.cidade,
            estado: paciente.estado
        };
    } else if (usuario.role === "PSICOLOGO") {
        const profissional = await psicologoRepository.findByUsuarioId(usuario.id);
        if (!profissional) {
            return res.status(404).json({ erro: "Perfil de profissional não encontrado" });
        }
        perfil = {
            id: profissional.id,
            nome: profissional.nome || profissional.usuario?.email || 'Profissional',
            email: usuario.email,
            crp: profissional.crp,
            especialidades: profissional.especialidades ? JSON.parse(profissional.especialidades) : [],
            abordagem: profissional.abordagem,
            preco: profissional.preco,
            modalidade: profissional.modalidade,
            fotoUrl: profissional.fotoUrl
        };
    } else {
        return res.status(401).json({ erro: "Tipo de usuário não autorizado" });
    }

    const token = jwt.sign(
        { id: usuario.id, email: usuario.email, role: usuario.role },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    logger.info("Login realizado com sucesso", { email, usuarioId: usuario.id, role: usuario.role });
    return res.status(200).json({
        token,
        usuario: {
            id: usuario.id,
            email: usuario.email,
            role: usuario.role
        },
        perfil
    });
}));

// Middleware de erro global
routes.use((err, req, res, next) => {
    logger.error("Erro não tratado na rota de auth", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    return res.status(500).json({ erro: "Erro interno do servidor" });
});

export default routes;