// Executa o hello world pelo terminal: npm run agent:hello -- "sua mensagem"
import { helloWorld } from "./index.js";
import { agentConfig } from "./config.js";

const mensagem = process.argv.slice(2).join(" ") || "Olá, quem é você?";
console.log(`[agent] modelo: ${agentConfig.llmModel}`);
console.log(`[agent] você: ${mensagem}`);
console.log(`[agent] assistente: ${await helloWorld(mensagem)}`);
