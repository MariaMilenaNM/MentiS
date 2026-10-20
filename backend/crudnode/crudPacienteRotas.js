import express from "express";
import jwt from "jsonwebtoken";
import { pacienteRepository } from "../repository/pacienteRepository.js"; 

const routes = express.Router();
const JWT_SECRET = "TiaMimi";

function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: "Token não informado" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.paciente = payload;
        next();
    } catch (erro) {
        return res.status(401).json({ erro: "Token inválido" });
    }
}

routes.post("/cadastrar", async (req, res) => {
    const dados = req.body;

    const jaExiste = await pacienteRepository.findByEmail(dados.email);
    
    if (jaExiste) {
        return res.status(409).json({ status: "duplicado" });
    }

    await pacienteRepository.create({
        nome:     dados.nome,
        data:     dados.data,
        email:    dados.email,
        telefone: dados.telefone,
        cidade:   dados.cidade,
        estado:   dados.estado,
        senha:    dados.senha
    });
    
    return res.status(201).json({ status: "ok" });
});

routes.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    const paciente = await pacienteRepository.findByEmailAndSenha(email, senha);
    
    if (!paciente) {
        return res.status(404).json({ erro: "Não encontrado" });
    }

    const token = jwt.sign(
        { id: paciente.id, email: paciente.email },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    return res.status(200).json({ token });
});

routes.get("/:id", verificarToken, async (req, res) => {
    const id = parseInt(req.params.id);

    const paciente = await pacienteRepository.findById(id);
    
    if (!paciente) {
        return res.status(404).json({ erro: "Paciente não encontrado" });
    }

    const { senha: _, ...pacienteSeguro } = paciente;
    return res.status(200).json(pacienteSeguro);
});

routes.put("/:id", verificarToken, async (req, res) => {
    const id = parseInt(req.params.id);
    const dados = req.body;

    const existe = await pacienteRepository.findById(id);
    
    if (!existe) {
        return res.status(404).json({ erro: "Paciente não encontrado" });
    }

    const dadosAtualizados = {
        ...(dados.nome     && { nome:     dados.nome }),
        ...(dados.telefone && { telefone: dados.telefone }),
        ...(dados.cidade   && { cidade:   dados.cidade }),
        ...(dados.estado   && { estado:   dados.estado })
    };

    await pacienteRepository.update(id, dadosAtualizados);
    return res.status(200).json({ status: "atualizado" });
});

routes.delete("/:id", verificarToken, async (req, res) => {
    const id = parseInt(req.params.id);

    const existe = await pacienteRepository.findById(id);
    
    if (!existe) {
        return res.status(404).json({ erro: "Paciente não encontrado" });
    }

    await pacienteRepository.delete(id);
    return res.status(200).json({ status: "removido" });
});

export default routes;