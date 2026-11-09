import express from "express";
import jwt from "jsonwebtoken";
import { psicologoRepository } from "../repository/psicologoRepository.js";
import { usuarioRepository } from "../repository/usuarioRepository.js";
import { validate, profissionalCadastroSchema, profissionalAtualizacaoSchema, profissionalCompatCadastroSchema } from "../utils/validation.js";
import { logger } from "../utils/logger.js";

const routes = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ============================================
// Middlewares
// ============================================

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

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

// Middleware para permitir acesso com token válido (paciente, profissional ou admin)
// Usado para POST público (cadastro) ou autenticado
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

// ============================================
// Helpers de transformação
// ============================================

// Converte modalidade antigo -> novo
const modalidadeLegacyToModern = {
    "Remota": "ONLINE",
    "Presencial": "PRESENCIAL",
    "Presencial e Remota": "HIBRIDO"
};

// Converte modalidade novo -> antigo (para resposta compatível)
function modalidadeModernToLegacy(modalidade) {
    switch (modalidade) {
        case "ONLINE": return "Remota";
        case "PRESENCIAL": return "Presencial";
        case "HIBRIDO": return "Presencial e Remota";
        default: return "Presencial e Remota";
    }
}

// Transforma modelo Prisma (Psicologo) para formato legado (compatibilidade frontend)
function toLegacyFormat(psicologo) {
    return {
        id: psicologo.id,
        nome: psicologo.nome || psicologo.usuario?.email || "Profissional",
        crp: psicologo.crp, // CRP mantido como string
        modalidade: modalidadeModernToLegacy(psicologo.modalidade),
        link: psicologo.fotoUrl || "",
        numero: psicologo.usuario?.email || "",
        contato: psicologo.usuario?.email || "",
        validado: psicologo.validado
    };
}

// ============================================
// Rotas Públicas (GET) - /profissionais
// ============================================

// GET /profissionais - Lista todos os profissionais com filtros opcionais
routes.get("/", asyncHandler(async (req, res) => {
    try {
        const { validado, modalidade, abordagem, precoMax, especialidade } = req.query;

        const filters = {};
        if (validado !== undefined) filters.validado = validado === "true";
        if (modalidade) filters.modalidade = modalidade;
        if (abordagem) filters.abordagem = abordagem;
        if (precoMax) filters.precoMax = parseFloat(precoMax);
        if (especialidade) filters.especialidades = [especialidade];

        // Por padrão não filtrar por validado - validação de CRP será implementada na v2
        // O cliente pode passar ?validado=true se quiser apenas validados

        const psicologos = await psicologoRepository.findAll(filters);

        // Retornar formato legado para compatibilidade com frontend
        const profissionais = psicologos.map(toLegacyFormat);

        res.status(200).json(profissionais);
    } catch (error) {
        logger.error("Erro ao buscar profissionais", { error: error.message });
        res.status(500).json({ erro: "Erro ao buscar profissionais" });
    }
}));

// GET /profissionais/:id - Busca por ID (público)
routes.get("/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    try {
        const psicologo = await psicologoRepository.findById(id);

        if (!psicologo) {
            return res.status(404).json({ erro: "Profissional não encontrado" });
        }

        // Retornar formato legado
        return res.status(200).json(toLegacyFormat(psicologo));
    } catch (error) {
        logger.error("Erro ao buscar profissional", { id, error: error.message });
        return res.status(500).json({ erro: "Erro ao buscar profissional" });
    }
}));

// ============================================
// Rotas Protegidas (POST/PUT/DELETE) - /profissionais
// ============================================

// POST /profissionais - Cria novo profissional (público ou autenticado)
routes.post("/", verifyAuthOrAdmin, validate(profissionalCompatCadastroSchema), asyncHandler(async (req, res) => {
    const dados = req.body;

    // Converter modalidade do formato antigo para novo
    const modalidadeModern = modalidadeLegacyToModern[dados.modalidade] || "HIBRIDO";

    try {
        // Verificar se CRP já existe
        const crpExiste = await psicologoRepository.findByCRP(dados.crp);
        if (crpExiste) {
            return res.status(409).json({ erro: "CRP já cadastrado" });
        }

        // Criar Usuario
        const usuario = await usuarioRepository.create({
            email: `${dados.crp}@profissional.mentis`,
            senha: "temp_password_" + Date.now(),
            role: "PSICOLOGO"
        });

        // Preparar dados para Psicologo (remover campos que não existem no modelo)
        const { nome, numero, contato, link, ...dadosPsicologo } = dados;

        // Criar Psicologo
        const psicologo = await psicologoRepository.create(usuario.id, {
            crp: dadosPsicologo.crp,
            bio: dadosPsicologo.bio,
            especialidades: JSON.stringify(dadosPsicologo.especialidades),
            abordagem: dadosPsicologo.abordagem,
            preco: dadosPsicologo.preco,
            modalidade: modalidadeModern,
            validado: false,
            fotoUrl: dadosPsicologo.fotoUrl || dadosPsicologo.link
        });

        logger.info("Profissional criado", { id: psicologo.id, crp: psicologo.crp });

        // Retornar formato legado
        return res.status(201).json(toLegacyFormat(psicologo));
    } catch (error) {
        logger.error("Erro ao criar profissional", { error: error.message, crp: dados.crp });
        if (error.code === "P2002" || error.message.includes("CRP já cadastrado")) {
            return res.status(409).json({ erro: "CRP já cadastrado" });
        }
        return res.status(500).json({ erro: "Erro ao criar profissional" });
    }
}));

// PUT /profissionais/:id - Atualiza por ID (requer token, próprio ou admin)
routes.put("/:id", verificarToken, validate(profissionalAtualizacaoSchema), asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const dadosNovos = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    try {
        const psicologo = await psicologoRepository.findById(id);

        if (!psicologo) {
            return res.status(404).json({ erro: "Profissional não encontrado" });
        }

        // Verificação de posse: profissional só pode atualizar próprio perfil (ou admin)
        if (req.usuario.role !== "ADMIN" && psicologo.usuarioId !== req.usuario.id) {
            return res.status(403).json({ erro: "Acesso negado: você só pode atualizar seu próprio perfil" });
        }

        // Não permitir alterar validação se não for admin
        if (req.usuario.role !== "ADMIN" && dadosNovos.validado !== undefined) {
            delete dadosNovos.validado;
        }

        // Converter formato antigo para novo
        const dadosAtualizados = {};
        if (dadosNovos.nome) {
            // 'nome' não existe no modelo Psicologo (vem de Usuario), ignorar por enquanto
        }
        if (dadosNovos.crp) dadosAtualizados.crp = String(dadosNovos.crp);
        if (dadosNovos.modalidade) {
            dadosAtualizados.modalidade = modalidadeLegacyToModern[dadosNovos.modalidade] || "HIBRIDO";
        }
        if (dadosNovos.link) dadosAtualizados.fotoUrl = dadosNovos.link;
        if (dadosNovos.especialidades) dadosAtualizados.especialidades = JSON.stringify(dadosNovos.especialidades);
        if (dadosNovos.abordagem) dadosAtualizados.abordagem = dadosNovos.abordagem;
        if (dadosNovos.preco !== undefined) dadosAtualizados.preco = dadosNovos.preco;
        if (dadosNovos.bio) dadosAtualizados.bio = dadosNovos.bio;

        // Verificar unicidade de CRP se está sendo alterado
        if (dadosAtualizados.crp && dadosAtualizados.crp !== psicologo.crp) {
            const crpExiste = await psicologoRepository.findByCRP(dadosAtualizados.crp);
            if (crpExiste) {
                return res.status(409).json({ erro: "CRP já cadastrado por outro profissional" });
            }
        }

        const psicologoAtualizado = await psicologoRepository.update(id, dadosAtualizados);
        logger.info("Profissional atualizado", { id });
        return res.status(200).json(toLegacyFormat(psicologoAtualizado));
    } catch (error) {
        logger.error("Erro ao atualizar profissional", { id, error: error.message });
        if (error.code === "P2025") {
            return res.status(404).json({ erro: "Profissional não encontrado" });
        }
        if (error.code === "P2002" || error.message.includes("CRP já cadastrado")) {
            return res.status(409).json({ erro: "CRP já cadastrado" });
        }
        return res.status(500).json({ erro: "Erro ao atualizar profissional" });
    }
}));

// DELETE /profissionais/:id - Remove por ID (requer token admin)
routes.delete("/:id", verificarToken, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    if (req.usuario.role !== "ADMIN") {
        return res.status(403).json({ erro: "Acesso negado: apenas administradores podem remover profissionais" });
    }

    try {
        const psicologo = await psicologoRepository.findById(id);

        if (!psicologo) {
            return res.status(404).json({ erro: "Profissional não encontrado" });
        }

        await psicologoRepository.delete(id);
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

// ============================================
// Middleware de erro global
// ============================================
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