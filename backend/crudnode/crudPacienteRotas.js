import express from "express";
import jwt from "jsonwebtoken";
import { pacienteRepository } from "../repository/pacienteRepository.js";
import { validate, pacienteCadastroSchema, pacienteLoginSchema, pacienteAtualizacaoSchema } from "../utils/validation.js";
import { logger } from "../utils/logger.js";

const routes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  logger.error("JWT_SECRET não configurado nas variáveis de ambiente");
  process.exit(1);
}

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
        logger.warn("Token inválido ou expirado", { error: erro.message });
        return res.status(401).json({ erro: "Token inválido ou expirado" });
    }
}

// Middleware de tratamento de erros assíncronos
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

routes.post("/cadastrar", validate(pacienteCadastroSchema), asyncHandler(async (req, res) => {
    const dados = req.body;

    const jaExiste = await pacienteRepository.findByEmail(dados.email);

    if (jaExiste) {
        return res.status(409).json({ status: "duplicado", erro: "E-mail já cadastrado" });
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

    logger.info("Paciente cadastrado com sucesso", { email: dados.email });
    return res.status(201).json({ status: "ok", mensagem: "Paciente cadastrado com sucesso" });
}));

routes.post("/login", validate(pacienteLoginSchema), asyncHandler(async (req, res) => {
    const { email, senha } = req.body;

    const paciente = await pacienteRepository.findByEmailAndSenha(email, senha);

    if (!paciente) {
        logger.warn("Tentativa de login falhou", { email });
        return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const token = jwt.sign(
        { id: paciente.id, email: paciente.email },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    logger.info("Login realizado com sucesso", { email, pacienteId: paciente.id });
    return res.status(200).json({ token, paciente: { id: paciente.id, nome: paciente.nome, email: paciente.email } });
}));

routes.get("/:id", verificarToken, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    // Verificação de posse: paciente só pode acessar próprio perfil
    if (req.paciente.id !== id) {
        return res.status(403).json({ erro: "Acesso negado: você só pode visualizar seu próprio perfil" });
    }

    const paciente = await pacienteRepository.findById(id);

    if (!paciente) {
        return res.status(404).json({ erro: "Paciente não encontrado" });
    }

    const { senha: _, ...pacienteSeguro } = paciente;
    return res.status(200).json(pacienteSeguro);
}));

routes.put("/:id", verificarToken, validate(pacienteAtualizacaoSchema), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const dados = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    // Verificação de posse: paciente só pode atualizar próprio perfil
    if (req.paciente.id !== id) {
        return res.status(403).json({ erro: "Acesso negado: você só pode atualizar seu próprio perfil" });
    }

    const existe = await pacienteRepository.findById(id);

    if (!existe) {
        return res.status(404).json({ erro: "Paciente não encontrado" });
    }

    // Verifica unicidade de email se está sendo alterado
    if (dados.email && dados.email !== existe.email) {
        const emailExiste = await pacienteRepository.findByEmail(dados.email);
        if (emailExiste) {
            return res.status(409).json({ erro: "E-mail já cadastrado por outro paciente" });
        }
    }

    await pacienteRepository.update(id, dados);
    logger.info("Paciente atualizado", { id });
    return res.status(200).json({ status: "atualizado", mensagem: "Perfil atualizado com sucesso" });
}));

routes.delete("/:id", verificarToken, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    // Verificação de posse: paciente só pode deletar próprio perfil
    if (req.paciente.id !== id) {
        return res.status(403).json({ erro: "Acesso negado: você só pode remover seu próprio perfil" });
    }

    const existe = await pacienteRepository.findById(id);

    if (!existe) {
        return res.status(404).json({ erro: "Paciente não encontrado" });
    }

    await pacienteRepository.delete(id);
    logger.info("Paciente removido", { id });
    return res.status(200).json({ status: "removido", mensagem: "Paciente removido com sucesso" });
}));

// Middleware de erro global
routes.use((err, req, res, next) => {
    logger.error("Erro não tratado na rota de pacientes", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    return res.status(500).json({ erro: "Erro interno do servidor" });
});

export default routes;