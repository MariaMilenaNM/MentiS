# /agent: Assistente de Triagem (RF16)

Todo o código de IA (LangChain.js) fica isolado nesta pasta (RNF12). O resto do backend importa só de `agent/index.js`.

```
agent/
├── index.js            # API pública do agente (hoje: helloWorld)
├── config.js           # lê LLM_MODEL / LLM_TEMPERATURE do .env
├── llm.js              # fábrica do modelo de chat (fake ou provedor real)
├── agentRotas.js       # rotas Express em /api/agent
├── hello.js            # script de terminal do hello world
├── prompts/
│   └── systemPrompt.js # system prompt de triagem
├── tools/              # buscarPsicologos, consultarHorarios, agendarHorario (MB-18)
├── memory/             # memória por conversa (MB-17)
└── rag/
    └── retriever.js    # busca semântica de psicólogos (MB-12/MB-14)
```

## Hello world

```bash
cp .env.example .env    # LLM_MODEL=fake funciona sem chave
npm run agent:hello -- "Olá, quem é você?"
```

Pela API (com `npm start`):

```bash
curl -X POST http://localhost:5000/api/agent/hello -H "Content-Type: application/json" -d '{"mensagem":"Olá"}'
```

Para usar um LLM real: instale o pacote do provedor (ex.: `npm i @langchain/anthropic`), defina `LLM_MODEL=anthropic:<modelo>` e a chave (`ANTHROPIC_API_KEY`) no `.env`.
