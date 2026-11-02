import "dotenv/config";

// Configuração do agente lida do .env do backend (RNF10: a chave do LLM nunca vai para o frontend).
// LLM_MODEL segue o formato "provedor:modelo" do initChatModel do langchain.js,
// ex.: "anthropic:claude-haiku-5-5", "openai:gpt-4o-mini", "google-genai:gemini-2.0-flash".
// Vazio ou "fake" => usa um modelo falso (útil para desenvolver e testar sem chave).
export const agentConfig = {
    llmModel: process.env.LLM_MODEL?.trim() || "fake",
    temperature: Number(process.env.LLM_TEMPERATURE ?? 0.3),
};
