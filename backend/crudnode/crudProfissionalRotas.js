import express from "express";
import { profissionalRepository } from "../repository/profissionalRepository.js";
import { validate, profissionalSchema, profissionalAtualizacaoSchema } from "../utils/validation.js";
import { logger } from "../utils/logger.js";

const routes = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

routes.get("/", asyncHandler(async (req, res) => {
    try {
        const profissionais = await profissionalRepository.findAll();
        res.status(200).json(profissionais);
    } catch (error) {
        logger.error("Erro ao buscar profissionais", { error: error.message });
        res.status(500).json({ erro: "Erro ao buscar profissionais" });
    }
}));

routes.post("/", validate(profissionalSchema), asyncHandler(async (req, res) => {
    const dados = req.body;

    try {
        const novoProfissional = await profissionalRepository.create(dados);
        logger.info("Profissional criado", { id: novoProfissional.id, crp: novoProfissional.crp });
        return res.status(201).json(novoProfissional);
    } catch (error) {
        logger.error("Erro ao criar profissional", { error: error.message, crp: dados.crp });
        if (error.code === "P2002") {
            return res.status(409).json({ erro: "CRP já cadastrado" });
        }
        return res.status(500).json({ erro: "Erro ao criar profissional" });
    }
}));

routes.get("/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    try {
        const profissional = await profissionalRepository.findById(id);

        if (profissional) {
            return res.status(200).json(profissional);
        }
        return res.status(404).json({ erro: "Profissional não encontrado" });
    } catch (error) {
        logger.error("Erro ao buscar profissional", { id, error: error.message });
        return res.status(500).json({ erro: "Erro ao buscar profissional" });
    }
}));

routes.put("/:id", validate(profissionalAtualizacaoSchema), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const dadosNovos = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    try {
        const profissionalAtualizado = await profissionalRepository.update(id, dadosNovos);
        logger.info("Profissional atualizado", { id });
        return res.status(200).json(profissionalAtualizado);
    } catch (error) {
        logger.error("Erro ao atualizar profissional", { id, error: error.message });
        if (error.code === "P2025") {
            return res.status(404).json({ erro: "Profissional não encontrado" });
        }
        if (error.code === "P2002") {
            return res.status(409).json({ erro: "CRP já cadastrado" });
        }
        return res.status(500).json({ erro: "Erro ao atualizar profissional" });
    }
}));

routes.delete("/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    try {
        await profissionalRepository.delete(id);
        logger.info("Profissional removido", { id });
        return res.status(200).json({ status: "removido", mensagem: "Profissional removido com sucesso" });
    } catch (error) {
        logger.error("Erro ao deletar profissional", { id, error: error.message });
        if (error.code === "P2025") {
            return res.status(404).json({ erro: "Profissional não encontrado" });
        }
        return res.status(500).json({ erro: "Erro ao deletar profissional" });
    }
}));

// Middleware de erro global
routes.use((err, req, res, next) => {
    logger.error("Erro não tratado na rota de profissionais", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    return res.status(500).json({ erro: "Erro interno do servidor" });
});

export default routes;