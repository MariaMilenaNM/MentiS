import { initChatModel } from "langchain";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { agentConfig } from "./config.js";

let cachedModel = null;

// Fábrica única do modelo de chat usado pelo agente.
// Trocar de provedor (resultado do spike MB-03) = mudar LLM_MODEL no .env
// e instalar o pacote do provedor (ex.: npm i @langchain/anthropic).
export async function getChatModel() {
    if (cachedModel) return cachedModel;

    if (agentConfig.llmModel === "fake") {
        cachedModel = new FakeListChatModel({
            responses: [
                "Olá! Eu sou o assistente de triagem do MentiS (modo de teste, sem LLM real).",
            ],
        });
    } else {
        cachedModel = await initChatModel(agentConfig.llmModel, {
            temperature: agentConfig.temperature,
        });
    }
    return cachedModel;
}
