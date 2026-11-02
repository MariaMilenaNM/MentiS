import express from "express";
import { helloWorld } from "./index.js";

const router = express.Router();

// POST /api/agent/hello  { "mensagem": "Olá" }  ->  { "resposta": "..." }
router.post("/hello", async (req, res) => {
    try {
        const mensagem = req.body?.mensagem || "Olá!";
        const resposta = await helloWorld(mensagem);
        res.json({ resposta });
    } catch (erro) {
        console.error("[agent] erro no hello world:", erro);
        res.status(500).json({ erro: "Falha ao chamar o assistente" });
    }
});

export default router;
