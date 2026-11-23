/**
 * Agente de Triagem LangChain com Memória por Conversa e Tools
 *
 * Implementa um agente inteligente para triagem de pacientes que buscam psicólogos.
 * Tools disponíveis:
 * 1. buscar_psicologos - Busca profissionais compatíveis via RAG
 * 2. consultar_horarios - Consulta horários disponíveis de um psicólogo
 * 3. agendar_horario - Agenda uma sessão (requer confirmação explícita)
 *
 * Extrai: motivação, modalidade, preço, urgência da conversa.
 * Mantém histórico por conversa (persistido no banco).
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

import {
  healthCheck as retrieverHealthCheck,
} from '../rag/retriever.js';

import { conversaRepository } from '../repository/conversaRepository.js';
import { mensagemRepository } from '../repository/mensagemRepository.js';
import { logger } from '../utils/logger.js';

// Importar tools
import {
  buscarPsicologosTool,
  consultarHorariosTool,
  agendarHorarioTool,
  triageAgentTools,
} from './tools.js';

// ============================================
// CONFIGURAÇÃO DO LLM
// ============================================

let llmInstance = null;
let llmWithToolsInstance = null;

function getLLM() {
  if (!llmInstance) {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (openaiApiKey) {
      logger.info('TriageAgent: Usando OpenAI GPT-4o-mini');
      llmInstance = new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        openAIApiKey: openaiApiKey,
        temperature: 0.3,
        maxTokens: 2000,
      });
    } else {
      // Fallback: mock LLM para desenvolvimento
      logger.warn('TriageAgent: OPENAI_API_KEY não configurada - usando mock LLM');
      llmInstance = new MockLLM();
    }
  }
  return llmInstance;
}

function getLLMWithTools() {
  if (!llmWithToolsInstance) {
    const llm = getLLM();
    // Bind tools apenas se o LLM suportar (OpenAI)
    if (llm.bindTools && typeof llm.bindTools === 'function') {
      llmWithToolsInstance = llm.bindTools(triageAgentTools);
    } else {
      llmWithToolsInstance = llm;
    }
  }
  return llmWithToolsInstance;
}

// Mock LLM para desenvolvimento sem API key
class MockLLM {
  constructor() {
    this.tools = {
      buscar_psicologos: buscarPsicologosTool,
      consultar_horarios: consultarHorariosTool,
      agendar_horario: agendarHorarioTool,
    };
  }

  async invoke(messages) {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage?.content || '';

    // Verificar se há tool calls na mensagem anterior (AIMessage com tool_calls)
    const hasToolCalls = messages.some(m => m.tool_calls && m.tool_calls.length > 0);

    // Se há resultados de tools, processar e gerar resposta final
    if (hasToolCalls) {
      return this.processToolResults(messages);
    }

    // Simula extração de critérios de triagem e decisão de tool
    const lower = content.toLowerCase();

    let motivacao = null;
    if (lower.includes('ansiedade') || lower.includes('ansioso') || lower.includes('estresse')) motivacao = 'Ansiedade/Estresse';
    else if (lower.includes('depressão') || lower.includes('depressao') || lower.includes('triste')) motivacao = 'Depressão';
    else if (lower.includes('relacionamento') || lower.includes('casal') || lower.includes('conjugal')) motivacao = 'Relacionamento';
    else if (lower.includes('trauma') || lower.includes('ptsd') || lower.includes('emdr')) motivacao = 'Trauma';
    else if (lower.includes('carreira') || lower.includes('trabalho') || lower.includes('profiss')) motivacao = 'Carreira';
    else if (lower.includes('infantil') || lower.includes('criança') || lower.includes('crianca') || lower.includes('tdah') || lower.includes('autismo')) motivacao = 'Infantil/Adolescente';

    let modalidade = null;
    if (lower.includes('online') || lower.includes('remota') || lower.includes('vídeo') || lower.includes('video')) modalidade = 'ONLINE';
    else if (lower.includes('presencial') || lower.includes('presencial')) modalidade = 'PRESENCIAL';
    else if (lower.includes('híbrido') || lower.includes('hibrido')) modalidade = 'HIBRIDO';

    let preco = null;
    const precoMatch = content.match(/(?:até|até|máximo|maximo|máx|max)\s*[R$]?\s*(\d+)/i);
    if (precoMatch) preco = `Até R$ ${precoMatch[1]}`;
    else if (lower.includes('acessível') || lower.includes('acessivel') || lower.includes('barato') || lower.includes('econômico') || lower.includes('economico')) preco = 'Acessível';
    else if (lower.includes('premium') || lower.includes('caro') || lower.includes('alto')) preco = 'Premium';

    // urgencia é extraída mas não usada no mock - mantida para compatibilidade futura
    // let urgencia = null;
    // if (lower.includes('urgente') || lower.includes('hoje') || lower.includes('agora') || lower.includes('imediat')) urgencia = 'Alta';
    // else if (lower.includes('esta semana') || lower.includes('essa semana') || lower.includes('breve')) urgencia = 'Média';

    // Decidir qual tool chamar baseado no contexto
    // Se o usuário está pedindo horários de um psicólogo específico
    if (lower.includes('horário') || lower.includes('horario') || lower.includes('agenda') || lower.includes('disponível')) {
      // Tentar extrair ID do psicólogo do contexto (simplificado)
      const psicologoIdMatch = content.match(/psicologo[^0-9]*(\d+)/i) || content.match(/id[^0-9]*(\d+)/i);
      if (psicologoIdMatch) {
        return this.createToolCall('consultar_horarios', {
          psicologoId: parseInt(psicologoIdMatch[1]),
          dataInicio: undefined,
          dataFim: undefined,
        });
      }
    }

    // Se o usuário está confirmando agendamento
    if (lower.includes('confirmo') || lower.includes('sim, quero agendar') || lower.includes('quero agendar') || lower.includes('agendar este')) {
      // Extrair dados do agendamento do contexto (simplificado)
      const dataHoraMatch = content.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      const psicologoIdMatch = content.match(/psicologo[^0-9]*(\d+)/i) || content.match(/id[^0-9]*(\d+)/i);
      if (dataHoraMatch && psicologoIdMatch) {
        return this.createToolCall('agendar_horario', {
          pacienteId: 1, // Será preenchido pelo agente real
          psicologoId: parseInt(psicologoIdMatch[1]),
          dataHora: dataHoraMatch[0],
          confirmacaoExplicita: true,
        });
      }
    }

    // Se tem info suficiente para buscar psicólogos
    if (motivacao || modalidade || preco) {
      return this.createToolCall('buscar_psicologos', {
        query: content,
        motivacao,
        modalidade,
        precoMax: preco ? this.parsePrecoMax(preco) : undefined,
        topK: 5,
      });
    }

    // Caso contrário, responder perguntando mais detalhes
    let resposta = '';
    if (!motivacao) {
      resposta = 'Olá! Sou o assistente de triagem da MentiS. Para te ajudar a encontrar o psicólogo ideal, me conte: **o que te traz à terapia hoje?** (ex: ansiedade, depressão, problemas de relacionamento, trauma, carreira, etc.)';
    } else if (!modalidade) {
      resposta = `Entendi que você busca ajuda para **${motivacao}**. **Qual modalidade você prefere?** (Online, Presencial ou Híbrido)`;
    } else if (!preco) {
      resposta = `Entendido: **${motivacao}** na modalidade **${modalidade}**. **Qual sua faixa de preço por sessão?** (ex: até R$ 150, acessível, médio, premium)`;
    } else {
      resposta = `Perfeito! Resumo do seu perfil:\n- **Motivação:** ${motivacao}\n- **Modalidade:** ${modalidade}\n- **Preço:** ${preco}\n\nVou buscar profissionais compatíveis...`;
      return this.createToolCall('buscar_psicologos', {
        query: content,
        motivacao,
        modalidade,
        precoMax: this.parsePrecoMax(preco),
        topK: 5,
      });
    }

    return {
      content: resposta,
      tool_calls: [],
    };
  }

  createToolCall(name, args) {
    return {
      content: '',
      tool_calls: [{
        id: `call_${Date.now()}`,
        name,
        args,
      }],
    };
  }

  async processToolResults(messages) {
    // Encontrar a última AIMessage com tool_calls
    const aiMessage = [...messages].reverse().find(m => m.tool_calls && m.tool_calls.length > 0);
    if (!aiMessage) {
      return { content: 'Erro interno: tool calls não encontrados', tool_calls: [] };
    }

    // Processar cada tool call
    const results = [];
    for (const toolCall of aiMessage.tool_calls) {
      const tool = this.tools[toolCall.name];
      if (tool) {
        try {
          const result = await tool.invoke(toolCall.args);
          results.push({
            tool_call_id: toolCall.id,
            name: toolCall.name,
            content: result,
          });
        } catch (error) {
          results.push({
            tool_call_id: toolCall.id,
            name: toolCall.name,
                content: JSON.stringify({ success: false, error: error.message }),
          });
        }
      }
    }

    // Gerar resposta baseada nos resultados
    let respostaFinal = '';
    for (const result of results) {
      try {
        const parsed = JSON.parse(result.content);
        if (parsed.texto) {
          respostaFinal += parsed.texto + '\n\n';
        }
      } catch {
        respostaFinal += result.content + '\n\n';
      }
    }

    return {
      content: respostaFinal.trim() || 'Operação realizada com sucesso.',
      tool_calls: [],
    };
  }

  buildSearchQuery(triagem, _originalQuery) {
    const parts = [];
    if (triagem.motivacao !== 'Não identificado') parts.push(`psicólogo para ${triagem.motivacao.toLowerCase()}`);
    if (triagem.modalidade !== 'Não especificada') parts.push(triagem.modalidade.toLowerCase());
    if (parts.length === 0) parts.push('psicólogo');
    return parts.join(' ');
  }

  parsePrecoMax(precoStr) {
    if (!precoStr) return undefined;
    const match = String(precoStr).match(/(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  // Para compatibilidade com RunnableSequence
  pipe() { return this; }
  async stream() { return []; }

  // Bind tools (mock)
  bindTools() { return this; }
}

// ============================================
// SYSTEM PROMPT DE TRIAGEM COM TOOLS
// ============================================

const TRIAGE_SYSTEM_PROMPT = `Você é o **Assistente de Triagem da MentiS**, um sistema inteligente que ajuda pacientes a encontrar e agendar com o psicólogo ideal.

## SUA MISSÃO
Guiar o paciente em uma conversa natural para extrair 4 critérios essenciais e usar as ferramentas disponíveis:

1. **MOTIVAÇÃO** - O que traz o paciente à terapia? (ex: ansiedade, depressão, relacionamento, trauma, carreira, infantil, autoconhecimento)
2. **MODALIDADE** - Online, Presencial ou Híbrido?
3. **PREÇO** - Faixa de valor por sessão (ex: até R$ 150, acessível, médio, premium)
4. **URGÊNCIA** - Alta (hoje/agora), Média (esta semana), Normal (sem pressa)

## FERRAMENTAS DISPONÍVEIS

### 1. buscar_psicologos
**Quando usar:** Após ter pelo menos a motivação OU modalidade OU preço do paciente.
**Parâmetros:** query (texto livre), motivacao, modalidade (ONLINE|PRESENCIAL|HIBRIDO), precoMax (número), especialidade, topK
**Retorna:** Lista de psicólogos compatíveis com score de match

### 2. consultar_horarios
**Quando usar:** Após o paciente escolher um psicólogo específico e pedir para ver horários.
**Parâmetros:** psicologoId (obrigatório), dataInicio, dataFim (opcionais, ISO string)
**Retorna:** Slots disponíveis de 50min nos próximos 30 dias

### 3. agendar_horario
**Quando usar:** APENAS após confirmação EXPLÍCITA do paciente ("sim, quero agendar", "confirmo o agendamento").
**Parâmetros:** pacienteId, psicologoId, dataHora (ISO), horarioId (opcional), duracaoMin, observacoes, confirmacaoExplicita (DEVE SER true)
**Retorna:** Agendamento confirmado com ID

## REGRAS CRÍTICAS

### Fluxo de Conversa
1. **Saudação + pergunta aberta**: "O que te traz aqui hoje?"
2. **Extrair motivação** → confirmar
3. **Perguntar modalidade** → confirmar
4. **Perguntar faixa de preço** → confirmar
5. **Perguntar urgência** → confirmar
6. **Chamar buscar_psicologos** → apresentar top 3 matches
7. **Oferecer próximos passos**: "Gostaria de ver horários de algum deles?"
8. **Se escolher um** → chamar consultar_horarios
9. **Se escolher horário** → PEDIR CONFIRMAÇÃO EXPLÍCITA
10. **Se confirmar** → chamar agendar_horario

### Regras de Ouro
- **NUNCA assuma** - sempre confirme com o paciente
- **Uma pergunta por vez** para não sobrecarregar
- **Seja empático e acolhedor** - primeira vez na terapia é comum
- **agendar_horario SÓ com confirmacaoExplicita: true** - se não tiver, peça confirmação
- **Não invente IDs** - use os IDs retornados pelas tools anteriores
- **Mantenha contexto** - lembre qual psicólogo foi escolhido

## FORMATO DE RESPOSTA
Use **function calling** nativo do LangChain. Não retorne JSON manualmente.
O sistema executará as tools automaticamente e te dará os resultados.`;

// ============================================
// MEMÓRIA DE CONVERSA (Persistida no Banco)
// ============================================

/**
 * Carrega histórico de uma conversa do banco de dados
 * @param {number} conversaId - ID da conversa
 * @returns {Promise<BaseMessage[]>} Array de mensagens LangChain
 */
export async function loadConversationMemory(conversaId) {
  try {
    const conversa = await conversaRepository.findById(conversaId);
    if (!conversa || !conversa.mensagens) {
      return [];
    }

    return conversa.mensagens.map((msg) => {
      if (msg.remetenteId === conversa.paciente.usuarioId) {
        return new HumanMessage(msg.conteudo);
      } else {
        return new AIMessage(msg.conteudo);
      }
    });
  } catch (error) {
    logger.error('Erro ao carregar memória da conversa', { conversaId, error: error.message });
    return [];
  }
}

/**
 * Salva mensagem no banco de dados
 * @param {number} conversaId - ID da conversa
 * @param {number} remetenteId - ID do usuário remetente
 * @param {string} conteudo - Conteúdo da mensagem
 * @returns {Promise<Object>} Mensagem criada
 */
export async function saveMessage(conversaId, remetenteId, conteudo) {
  return await mensagemRepository.create({
    conversaId,
    remetenteId,
    conteudo,
  });
}

/**
 * Obtém ou cria conversa entre paciente e "sistema" (agente)
 * @param {number} pacienteId - ID do paciente
 * @returns {Promise<Object>} Conversa
 */
export async function getOrCreateTriageConversation(pacienteId) {
  const conversas = await conversaRepository.findByPaciente(pacienteId);

  if (conversas.length > 0) {
    return conversas[0];
  }

  return null;
}

// ============================================
// AGENTE PRINCIPAL COM FUNCTION CALLING
// ============================================

/**
 * Executa uma rodada do agente de triagem com tools
 * @param {Object} input - Entrada do agente
 * @returns {Promise<Object>} Resposta estruturada do agente
 */
export async function runTriageAgent(input) {
  const {
    conversaId,
    pacienteId,
    userMessage,
  } = input;

  const llm = getLLMWithTools();

  try {
    // 1. Carregar memória da conversa
    let memory = [];
    if (conversaId) {
      memory = await loadConversationMemory(conversaId);
    }

    // 2. Preparar mensagens: system + histórico + user message
    const messages = [
      new SystemMessage(TRIAGE_SYSTEM_PROMPT),
      ...memory.slice(-10), // Últimas 10 mensagens para contexto
      new HumanMessage(userMessage),
    ];

    // 3. Loop de function calling (máximo 3 iterações para evitar loops infinitos)
    let iterations = 0;
    const maxIterations = 3;
    let finalResponse = null;

    while (iterations < maxIterations) {
      iterations++;

      const response = await llm.invoke(messages);

      // Adicionar resposta do assistente ao histórico
      messages.push(response);

      // Verificar se há tool calls
      if (response.tool_calls && response.tool_calls.length > 0) {
        // Executar cada tool call
        for (const toolCall of response.tool_calls) {
          const tool = findToolByName(toolCall.name);
          if (tool) {
            try {
              // Injetar pacienteId se necessário (para agendar_horario)
              let args = { ...toolCall.args };
              if (toolCall.name === 'agendar_horario' && !args.pacienteId && pacienteId) {
                args.pacienteId = pacienteId;
              }

              const result = await tool.invoke(args);

              // Adicionar resultado da tool como ToolMessage
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: result,
                name: toolCall.name,
              });
            } catch (error) {
              logger.error(`Erro ao executar tool ${toolCall.name}`, { error: error.message });
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({ success: false, error: error.message }),
                name: toolCall.name,
              });
            }
          }
        }
        // Continuar o loop para o LLM processar os resultados das tools
        continue;
      }

      // Se não há tool calls, é a resposta final
      finalResponse = response;
      break;
    }

    // Se atingiu max iterations sem resposta final
    if (!finalResponse) {
      finalResponse = { content: 'Desculpe, tive um problema ao processar sua solicitação. Pode tentar novamente?', tool_calls: [] };
    }

    // 4. Salvar resposta do agente no banco
    if (conversaId && finalResponse.content) {
      await saveMessage(conversaId, 0, finalResponse.content);
    }

    // 5. Extrair informações estruturadas da resposta final (opcional)
    const extracted = extractTriagemInfo(finalResponse.content, messages);

    return {
      success: true,
      resposta: finalResponse.content,
      triagem: extracted.triagem,
      acao: extracted.acao,
      profissionais: extracted.profissionais || [],
      slots: extracted.slots || [],
      agendamento: extracted.agendamento || null,
      conversaId,
    };
  } catch (error) {
    logger.error('Erro no runTriageAgent', { error: error.message, stack: error.stack, input });
    return {
      success: false,
      error: 'Erro interno do agente de triagem',
      resposta: 'Desculpe, ocorreu um erro. Por favor, tente novamente em um momento.',
      triagem: { motivacao: null, modalidade: null, preco: null, urgencia: null },
      acao: 'erro',
    };
  }
}

/**
 * Encontra tool pelo nome
 */
function findToolByName(name) {
  const toolMap = {
    buscar_psicologos: buscarPsicologosTool,
    consultar_horarios: consultarHorariosTool,
    agendar_horario: agendarHorarioTool,
  };
  return toolMap[name];
}

/**
 * Extrai informações de triagem da conversa para retorno estruturado
 */
function extractTriagemInfo(content, messages) {
  const result = {
    triagem: { motivacao: null, modalidade: null, preco: null, urgencia: null },
    acao: 'continuar',
    profissionais: [],
    slots: [],
    agendamento: null,
  };

  // Tentar extrair da última tool result
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'tool' && msg.content) {
      try {
        const parsed = JSON.parse(msg.content);
        if (parsed.psicologos) result.profissionais = parsed.psicologos;
        if (parsed.slots) result.slots = parsed.slots;
        if (parsed.agendamento) result.agendamento = parsed.agendamento;
        if (parsed.triagem) result.triagem = { ...result.triagem, ...parsed.triagem };
        if (parsed.acao) result.acao = parsed.acao;
      } catch {
        // Ignorar erros de parse
      }
    }
  }

  // Extrair do conteúdo textual se não veio das tools
  if (content) {
    const lower = content.toLowerCase();
    if (lower.includes('encontrei') && lower.includes('profissional')) result.acao = 'apresentar';
    if (lower.includes('horário') || lower.includes('horario') || lower.includes('disponível')) result.acao = 'mostrar_horarios';
    if (lower.includes('agendamento confirmado') || lower.includes('agendado com sucesso')) result.acao = 'agendado';
  }

  return result;
}

/**
 * Inicializa o agente (chamado no startup)
 */
export async function initializeTriageAgent() {
  logger.info('Inicializando TriageAgent...');
  getLLM(); // Inicializa LLM singleton

  // Verificar saúde do retriever
  const health = await retrieverHealthCheck();
  logger.info('TriageAgent: Retriever health check', { status: health.status });

  return { success: true };
}

export default {
  runTriageAgent,
  initializeTriageAgent,
  loadConversationMemory,
  saveMessage,
  getOrCreateTriageConversation,
};