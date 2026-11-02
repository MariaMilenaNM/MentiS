// Tools que o agente pode chamar (MB-18). Cada tool fica em um arquivo próprio nesta pasta:
//   buscarPsicologos.js  -> usa o retriever do RAG (agent/rag/retriever.js)
//   consultarHorarios.js -> lê horários livres no banco (RF11)
//   agendarHorario.js    -> grava agendamento em transação, só após confirmação explícita (RF12)
// Por enquanto o agente não tem tools.
export const tools = [];
