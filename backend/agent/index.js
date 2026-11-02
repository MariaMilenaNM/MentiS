import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getChatModel } from "./llm.js";
import { SYSTEM_PROMPT } from "./prompts/systemPrompt.js";

// Ponto de entrada público do agente. O resto do backend só importa daqui.

// Hello world: uma chamada simples ao modelo, sem memória e sem tools.
export async function helloWorld(mensagem = "Olá!") {
    const model = await getChatModel();
    const resposta = await model.invoke([
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(mensagem),
    ]);
    return typeof resposta.content === "string"
        ? resposta.content
        : resposta.content.map((parte) => parte.text ?? "").join("");
}
