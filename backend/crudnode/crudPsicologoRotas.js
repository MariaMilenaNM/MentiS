import express from "express";
import jwt from "jsonwebtoken";
import { usuarioRepository } from "../repository/usuarioRepository.js";
import { psicologoRepository } from "../repository/psicologoRepository.js";
import { validate, psicologoCadastroSchema, psicologoAtualizacaoSchema } from "../utils/validation.js";
import { logger } from "../utils/logger.js";

const routes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: "Token não informado" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.usuario = payload;
        next();
    } catch (erro) {
        logger.warn("Token inválido ou expirado", { error: erro.message });
        return res.status(401).json({ erro: "Token inválido ou expirado" });
    }
}

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /psicologos - Lista todos os psicólogos (público, apenas validados)
routes.get("/", asyncHandler(async (req, res) => {
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

        const psicologos = await psicologoRepository.findAll(filters);
        return res.status(200).json(psicologos);
    } catch (error) {
        logger.error("Erro ao buscar psicólogos", { error: error.message });
        return res.status(500).json({ erro: "Erro ao buscar psicólogos" });
    }
}));

// GET /psicologos/:id - Busca psicólogo por ID
routes.get("/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    try {
        const psicologo = await psicologoRepository.findById(id);

        if (!psicologo) {
            return res.status(404).json({ erro: "Psicólogo não encontrado" });
        }

        // Não retornar senha do usuário
        const { senha: _, ...usuarioSeguro } = psicologo.usuario || {};
        const psicologoSeguro = { ...psicologo, usuario: usuarioSeguro };

        return res.status(200).json(psicologoSeguro);
    } catch (error) {
        logger.error("Erro ao buscar psicólogo", { id, error: error.message });
        return res.status(500).json({ erro: "Erro ao buscar psicólogo" });
    }
}));

// POST /psicologos - Cadastra psicólogo (requer token de admin ou auto-cadastro)
routes.post("/", verifyAuthOrAdmin, validate(psicologoCadastroSchema), asyncHandler(async (req, res) => {
    const dados = req.body;

    try {
        // Verificar se CRP já existe
        const crpExiste = await psicologoRepository.findByCRP(dados.crp);
        if (crpExiste) {
            return res.status(409).json({ erro: "CRP já cadastrado" });
        }

        // Criar Usuario
        const usuario = await usuarioRepository.create({
            email: `${dados.crp}@psicologo.mentis`, // Email temporário baseado no CRP
            senha: "temp_password_" + Date.now(), // Senha temporária
            role: "PSICOLOGO"
        });

        // Criar Psicologo
        const psicologo = await psicologoRepository.create(usuario.id, {
            crp: dados.crp,
            bio: dados.bio,
            especialidades: JSON.stringify(dados.especialidades),
            abordagem: dados.abordagem,
            preco: dados.preco,
            modalidade: dados.modalidade,
            validado: false, // Sempre false no cadastro, admin valida depois
            fotoUrl: dados.fotoUrl
        });

        logger.info("Psicólogo cadastrado", { id: psicologo.id, crp: psicologo.crp, usuarioId: usuario.id });
        return res.status(201).json(psicologo);
    } catch (error) {
        logger.error("Erro ao criar psicólogo", { error: error.message, crp: dados.crp });
        if (error.message.includes("CRP já cadastrado")) {
            return res.status(409).json({ erro: "CRP já cadastrado" });
        }
        return res.status(500).json({ erro: "Erro ao criar psicólogo" });
    }
}));

// PUT /psicologos/:id - Atualiza psicólogo (requer token, próprio ou admin)
routes.put("/:id", verificarToken, validate(psicologoAtualizacaoSchema), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const dados = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    try {
        const psicologo = await psicologoRepository.findById(id);

        if (!psicologo) {
            return res.status(404).json({ erro: "Psicólogo não encontrado" });
        }

        // Verificação de posse: psicólogo só pode atualizar próprio perfil (ou admin)
        if (req.usuario.role !== "ADMIN" && psicologo.usuarioId !== req.usuario.id) {
            return res.status(403).json({ erro: "Acesso negado: você só pode atualizar seu próprio perfil" });
        }

        // Não permitir alterar validação se não for admin
        if (req.usuario.role !== "ADMIN" && dados.validado !== undefined) {
            delete dados.validado;
        }

        // Verificar unicidade de CRP se está sendo alterado
        if (dados.crp && dados.crp !== psicologo.crp) {
            const crpExiste = await psicologoRepository.findByCRP(dados.crp);
            if (crpExiste) {
                return res.status(409).json({ erro: "CRP já cadastrado por outro psicólogo" });
            }
        }

        // Converter especialidades para JSON string se fornecido
        if (dados.especialidades) {
            dados.especialidades = JSON.stringify(dados.especialidades);
        }

        const psicologoAtualizado = await psicologoRepository.update(id, dados);
        logger.info("Psicólogo atualizado", { id });
        return res.status(200).json(psicologoAtualizado);
    } catch (error) {
        logger.error("Erro ao atualizar psicólogo", { id, error: error.message });
        if (error.message.includes("CRP já cadastrado")) {
            return res.status(409).json({ erro: "CRP já cadastrado" });
        }
        if (error.message.includes("P2025")) {
            return res.status(404).json({ erro: "Psicólogo não encontrado" });
        }
        return res.status(500).json({ erro: "Erro ao atualizar psicólogo" });
    }
}));

// DELETE /psicologos/:id - Remove psicólogo (requer token admin)
routes.delete("/:id", verificarToken, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    if (req.usuario.role !== "ADMIN") {
        return res.status(403).json({ erro: "Acesso negado: apenas administradores podem remover psicólogos" });
    }

    try {
        const psicologo = await psicologoRepository.findById(id);

        if (!psicologo) {
            return res.status(404).json({ erro: "Psicólogo não encontrado" });
        }

        await psicologoRepository.delete(id);
        logger.info("Psicólogo removido", { id });
        return res.status(200).json({ status: "removido", mensagem: "Psicólogo removido com sucesso" });
    } catch (error) {
        logger.error("Erro ao deletar psicólogo", { id, error: error.message });
        if (error.message.includes("P2025")) {
            return res.status(404).json({ erro: "Psicólogo não encontrado" });
        }
        return res.status(500).json({ erro: "Erro ao deletar psicólogo" });
    }
}));

// Middleware para permitir acesso com token válido (paciente, psicólogo ou admin)
function verifyAuthOrAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    // Permitir cadastro sem token (público) - remover em produção se necessário
    if (!authHeader) {
        return next();
    }

    const token = authHeader.replace("Bearer ", "");

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.usuario = payload;
        next();
    } catch (erro) {
        return res.status(401).json({ erro: "Token inválido ou expirado" });
    }
}

// Middleware de erro global
routes.use((err, req, res, next) => {
    logger.error("Erro não tratado na rota de psicólogos", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    return res.status(500).json({ erro: "Erro interno do servidor" });
});

export default routes;