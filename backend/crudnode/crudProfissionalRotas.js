import express from "express";
import { profissionalRepository } from "../repository/profissionalRepository.js"; 

const routes = express.Router();

routes.get("/", async (req, res) => {
    try {
        const profissionais = await profissionalRepository.findAll();
        res.status(200).json(profissionais);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar profissionais" });
    }
});

routes.post("/", async (req, res) => {
    const dados = req.body;

    if (!dados || Object.keys(dados).length === 0) {
        return res.status(400).json({ erro: "Dados inválidos" });
    }

    if (dados.crp) {
        dados.crp = parseInt(dados.crp, 10);
    }

    try {
        const novoProfissional = await profissionalRepository.create(dados);
        return res.status(201).json(novoProfissional);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ erro: "Erro ao criar profissional" });
    }
});

routes.get("/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const profissional = await profissionalRepository.findById(id);

        if (profissional) {
            return res.status(200).json(profissional);
        }
        return res.status(404).json({ erro: "Profissional não encontrado (404)" });
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao buscar profissional" });
    }
});

routes.put("/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const dadosNovos = req.body;

    try {
        const profissionalAtualizado = await profissionalRepository.update(id, dadosNovos);
        return res.status(200).json(profissionalAtualizado);
    } catch (error) {
        return res.status(404).json({ erro: "Profissional não encontrado (404)" });
    }
});

routes.delete("/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        await profissionalRepository.delete(id);
        return res.status(200).json({ status: "removido" });
    } catch (error) {
        return res.status(404).json({ erro: "Profissional não encontrado (404)" });
    }
});

export default routes;