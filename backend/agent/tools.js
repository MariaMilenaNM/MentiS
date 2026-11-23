/**
 * Ferramentas (Tools) do Agente de Triagem LangChain
 *
 * Implementa as ferramentas que o agente pode chamar:
 * 1. buscar_psicologos - Busca profissionais compatíveis via RAG
 * 2. consultar_horarios - Consulta horários disponíveis de um psicólogo
 * 3. agendar_horario - Agenda uma sessão (requer confirmação explícita)
 */

import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

import {
  retrieve,
} from '../rag/retriever.js';

import { horarioRepository } from '../repository/horarioRepository.js';
import { agendamentoRepository } from '../repository/agendamentoRepository.js';
import { pacienteRepository } from '../repository/pacienteRepository.js';
import { psicologoRepository } from '../repository/psicologoRepository.js';
import { logger } from '../utils/logger.js';

// ============================================
// TIPOS E SCHEMAS
// ============================================

// Schema para buscar psicólogos
const BuscarPsicologosSchema = z.object({
  query: z.string().describe('Texto da busca em linguagem natural (ex: "ansiedade TCC online")'),
  motivacao: z.string().optional().describe('Motivação da busca (ex: ansiedade, depressão, relacionamento)'),
  modalidade: z.enum(['ONLINE', 'PRESENCIAL', 'HIBRIDO']).optional().describe('Modalidade preferida'),
  precoMax: z.number().optional().describe('Preço máximo por sessão em reais'),
  especialidade: z.string().optional().describe('Especialidade desejada (ex: TCC, EMDR, Psicanálise)'),
  topK: z.number().default(5).describe('Número máximo de resultados'),
});

// Schema para consultar horários
const ConsultarHorariosSchema = z.object({
  psicologoId: z.number().describe('ID do psicólogo'),
  dataInicio: z.string().optional().describe('Data início no formato ISO (ex: 2026-11-23), padrão: hoje'),
  dataFim: z.string().optional().describe('Data fim no formato ISO (ex: 2026-12-23), padrão: 30 dias'),
});

// Schema para agendar horário
const AgendarHorarioSchema = z.object({
  pacienteId: z.number().describe('ID do paciente'),
  psicologoId: z.number().describe('ID do psicólogo'),
  dataHora: z.string().describe('Data e hora no formato ISO (ex: 2026-11-23T14:00:00.000Z)'),
  horarioId: z.number().optional().describe('ID do horário recorrente (opcional)'),
  duracaoMin: z.number().default(50).describe('Duração em minutos (padrão: 50)'),
  observacoes: z.string().optional().describe('Observações para o agendamento'),
  confirmacaoExplicita: z.boolean().describe('Confirmação explícita do paciente (DEVE SER TRUE)'),
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Constrói query semântica para busca de psicólogos
 */
function buildSearchQuery(params) {
  const parts = [];

  if (params.query) parts.push(params.query);
  if (params.motivacao) parts.push(`psicólogo para ${params.motivacao}`);
  if (params.modalidade) parts.push(params.modalidade.toLowerCase());
  if (params.especialidade) parts.push(`especialista em ${params.especialidade}`);
  if (params.precoMax) parts.push(`preço até ${params.precoMax} reais`);

  return parts.length > 0 ? parts.join(' ') : 'psicólogo';
}

/**
 * Formata resultados de psicólogos para resposta do agente
 */
function formatPsicologosResponse(results, triagem) {
  if (!results || results.length === 0) {
    return {
      texto: 'Não encontrei profissionais com esse perfil no momento. Poderia ajustar os critérios de busca?',
      psicologos: [],
    };
  }

  const psicologos = results.map((r, i) => ({
    rank: i + 1,
    id: r.metadata.profissionalId || r.metadata.psicologoId,
    nome: r.metadata.nome,
    crp: r.metadata.crp,
    abordagem: r.metadata.abordagem,
    especialidades: r.metadata.especialidades || [],
    modalidade: r.metadata.modalidade,
    preco: r.metadata.preco,
    fotoUrl: r.metadata.fotoUrl,
    cidade: r.metadata.cidade,
    estado: r.metadata.estado,
    score: r.similarityScore,
    matchReasons: generateMatchReasons(triagem, r.metadata),
  }));

  let texto = `Encontrei **${psicologos.length} profissional${psicologos.length !== 1 ? 'is' : ''}** compatível${psicologos.length !== 1 ? 'eis' : ''}`;

  if (triagem?.motivacao) texto += ` para **${triagem.motivacao}**`;
  if (triagem?.modalidade) texto += ` na modalidade **${triagem.modalidade}**`;
  if (triagem?.precoMax) texto += ` com orçamento até **R$ ${triagem.precoMax}**`;
  texto += ':\n\n';

  psicologos.slice(0, 3).forEach((p) => {
    texto += `${p.rank}. **${p.nome}** (CRP: ${p.crp})\n`;
    texto += `   💡 ${p.abordagem} | ${p.especialidades?.join(', ') || 'Especialidades não informadas'}\n`;
    texto += `   💻 ${p.modalidade} | 💰 R$ ${p.preco?.toFixed(2) || 'Não informado'}/sessão`;
    if (p.cidade && p.estado) texto += ` | 📍 ${p.cidade}/${p.estado}`;
    texto += ` | 🎯 ${(p.score * 100).toFixed(0)}% match\n`;
    if (p.matchReasons?.length) texto += `   ✨ ${p.matchReasons.join(' • ')}\n`;
    texto += '\n';
  });

  texto += 'Gostaria de ver os horários disponíveis de algum deles?';

  return { texto, psicologos };
}

/**
 * Gera razões de match para exibição
 */
function generateMatchReasons(triagem, metadata) {
  const reasons = [];

  if (triagem?.motivacao && metadata.especialidades) {
    const matched = metadata.especialidades.filter((s) =>
      s.toLowerCase().includes(triagem.motivacao.toLowerCase()) ||
      triagem.motivacao.toLowerCase().includes(s.toLowerCase())
    );
    if (matched.length > 0) reasons.push(`Especialista em ${matched.slice(0, 2).join(', ')}`);
  }

  if (triagem?.modalidade && metadata.modalidade) {
    const modMap = { ONLINE: 'online', PRESENCIAL: 'presencial', HIBRIDO: 'híbrido' };
    if (modMap[triagem.modalidade] === metadata.modalidade.toLowerCase() ||
        (triagem.modalidade === 'HIBRIDO' && metadata.modalidade === 'HIBRIDO')) {
      reasons.push(`Atende ${modMap[triagem.modalidade] || metadata.modalidade.toLowerCase()}`);
    }
  }

  if (triagem?.precoMax && metadata.preco) {
    if (metadata.preco <= triagem.precoMax) {
      reasons.push(`Dentro do orçamento (R$ ${metadata.preco}/sessão)`);
    }
  }

  if (reasons.length === 0) reasons.push('Perfil compatível');
  return reasons.slice(0, 3);
}

/**
 * Formata horários disponíveis para resposta
 */
function formatHorariosResponse(slots, psicologoNome) {
  if (!slots || slots.length === 0) {
    return {
      texto: `Não há horários disponíveis para ${psicologoNome} no período solicitado.`,
      slots: [],
    };
  }

  // Agrupar por data
  const porData = {};
  slots.forEach((slot) => {
    if (!porData[slot.data]) porData[slot.data] = [];
    porData[slot.data].push(slot);
  });

  let texto = `Horários disponíveis para **${psicologoNome}**:\n\n`;

  Object.entries(porData).slice(0, 7).forEach(([data, slotsDoDia]) => {
    const dataFormatada = new Date(data).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    texto += `📅 **${dataFormatada}**:\n`;
    slotsDoDia.slice(0, 5).forEach((slot) => {
      texto += `   🕐 ${slot.hora} (horarioId: ${slot.horarioId})\n`;
    });
    if (slotsDoDia.length > 5) {
      texto += `   ... e mais ${slotsDoDia.length - 5} horários\n`;
    }
    texto += '\n';
  });

  texto += 'Qual horário você prefere? Responda com a data e hora desejada (ex: "2026-11-25T14:00:00.000Z") para eu agendar.';

  return { texto, slots };
}

/**
 * Formata resposta de agendamento
 */
function formatAgendamentoResponse(agendamento, psicologoNome, pacienteNome) {
  const dataFormatada = new Date(agendamento.dataHora).toLocaleString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    texto: `✅ **Agendamento confirmado!**\n\n` +
      `📋 **Detalhes:**\n` +
      `   👤 Paciente: ${pacienteNome}\n` +
      `   👨‍⚕️ Psicólogo: ${psicologoNome}\n` +
      `   📅 Data/Hora: ${dataFormatada}\n` +
      `   ⏱️ Duração: ${agendamento.duracaoMin} minutos\n` +
      `   📍 Status: ${agendamento.status}\n` +
      `   🆔 ID do agendamento: #${agendamento.id}\n\n` +
      `O profissional receberá uma notificação. Lembre-se de comparecer com 10 minutos de antecedência.`,
    agendamento: {
      id: agendamento.id,
      dataHora: agendamento.dataHora,
      duracaoMin: agendamento.duracaoMin,
      status: agendamento.status,
      psicologoId: agendamento.psicologoId,
      pacienteId: agendamento.pacienteId,
    },
  };
}

// ============================================
// TOOL 1: BUSCAR PSICÓLOGOS
// ============================================

export const buscarPsicologosTool = new StructuredTool({
  name: 'buscar_psicologos',
  description: 'Busca psicólogos compatíveis usando busca semântica (RAG). Use quando o paciente descrever o que procura (motivação, modalidade, preço, especialidade).',
  schema: BuscarPsicologosSchema,

  async invoke(input) {
    try {
      logger.info('Tool: buscar_psicologos chamado', { input });

      const health = await (await import('../rag/retriever.js')).healthCheck();
      if (health.status !== 'healthy') {
        return 'Serviço de busca temporariamente indisponível. Tente novamente em alguns minutos.';
      }

      // Construir query semântica
      const searchQuery = buildSearchQuery(input);

      // Construir filtros
      const filters = {};
      if (input.modalidade) filters.modalidade = input.modalidade;
      if (input.precoMax) filters.precoMax = input.precoMax;
      if (input.especialidade) filters.especialidade = input.especialidade;
      filters.validado = true;

      const results = await retrieve(searchQuery, filters, {
        topK: input.topK,
        minSimilarity: 0.1
      });

      // Formatar resposta
      const triagem = {
        motivacao: input.motivacao,
        modalidade: input.modalidade,
        precoMax: input.precoMax,
        especialidade: input.especialidade,
      };

      const response = formatPsicologosResponse(results, triagem);

      // Retornar JSON stringificado para o agente
      return JSON.stringify({
        success: true,
        texto: response.texto,
        psicologos: response.psicologos,
        triagem,
      });
    } catch (error) {
      logger.error('Erro na tool buscar_psicologos', { error: error.message, input });
      return JSON.stringify({
        success: false,
        error: 'Erro ao buscar psicólogos',
        texto: 'Ocorreu um erro ao buscar profissionais. Tente novamente.',
      });
    }
  },
});

// ============================================
// TOOL 2: CONSULTAR HORÁRIOS
// ============================================

export const consultarHorariosTool = new StructuredTool({
  name: 'consultar_horarios',
  description: 'Consulta horários disponíveis para agendamento de um psicólogo específico. Retorna slots de 50 minutos nos próximos 30 dias (padrão).',
  schema: ConsultarHorariosSchema,

  async invoke(input) {
    try {
      logger.info('Tool: consultar_horarios chamado', { input });

      // Buscar dados do psicólogo
      const psicologo = await psicologoRepository.findById(input.psicologoId);
      if (!psicologo) {
        return JSON.stringify({
          success: false,
          error: 'Psicólogo não encontrado',
          texto: 'Profissional não encontrado.',
        });
      }

      // Definir range de datas
      const inicio = input.dataInicio ? new Date(input.dataInicio) : new Date();
      const fim = input.dataFim ? new Date(input.dataFim) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Buscar horários recorrentes ativos
      const horarios = await horarioRepository.findByPsicologoId(input.psicologoId);
      if (!horarios || horarios.length === 0) {
        return JSON.stringify({
          success: true,
          texto: `O profissional ${psicologo.nome} não possui horários cadastrados no momento.`,
          slots: [],
        });
      }

      // Buscar agendamentos existentes no período
      const agendamentos = await agendamentoRepository.findAll({
        psicologoId: input.psicologoId,
        dataInicio: inicio.toISOString(),
        dataFim: fim.toISOString(),
      });

      // Criar set de horários ocupados
      const horariosOcupados = new Set(
        (agendamentos || [])
          .filter((a) => a.status !== 'CANCELADO_PACIENTE' && a.status !== 'CANCELADO_PSICOLOGO')
          .map((a) => new Date(a.dataHora).toISOString())
      );

      // Gerar slots disponíveis
      const slotsDisponiveis = [];
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      for (let d = 0; d < 30; d++) {
        const dataAtual = new Date(hoje);
        dataAtual.setDate(hoje.getDate() + d);

        if (dataAtual < inicio) continue;
        if (dataAtual > fim) continue;

        const diaSemana = dataAtual.getDay();
        const horariosDoDia = horarios.filter((h) => h.diaSemana === diaSemana && h.ativo);

        for (const horario of horariosDoDia) {
          const inicioMin = timeToMinutes(horario.horaInicio);
          const fimMin = timeToMinutes(horario.horaFim);
          const duracaoSessao = 50;

          for (let min = inicioMin; min + duracaoSessao <= fimMin; min += duracaoSessao) {
            const horaSlot = minutesToTime(min);
            const dataHoraSlot = new Date(dataAtual);
            const [h, m] = horaSlot.split(':').map(Number);
            dataHoraSlot.setHours(h, m, 0, 0);

            const isoString = dataHoraSlot.toISOString();

            if (dataHoraSlot > new Date() && !horariosOcupados.has(isoString)) {
              slotsDisponiveis.push({
                dataHora: isoString,
                data: dataAtual.toISOString().split('T')[0],
                hora: horaSlot,
                horarioId: horario.id,
                diaSemana: diaSemana,
              });
            }
          }
        }
      }

      // Ordenar por data/hora
      slotsDisponiveis.sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));

      const response = formatHorariosResponse(slotsDisponiveis, psicologo.nome);

      return JSON.stringify({
        success: true,
        texto: response.texto,
        slots: response.slots,
        psicologo: {
          id: psicologo.id,
          nome: psicologo.nome,
          crp: psicologo.crp,
        },
      });
    } catch (error) {
      logger.error('Erro na tool consultar_horarios', { error: error.message, input });
      return JSON.stringify({
        success: false,
        error: 'Erro ao consultar horários',
        texto: 'Ocorreu um erro ao buscar horários disponíveis. Tente novamente.',
      });
    }
  },
});

// ============================================
// TOOL 3: AGENDAR HORÁRIO
// ============================================

export const agendarHorarioTool = new StructuredTool({
  name: 'agendar_horario',
  description: 'Agenda uma sessão com um psicólogo. REQUER confirmação explícita do paciente (confirmacaoExplicita: true). Use apenas após o paciente confirmar que deseja agendar.',
  schema: AgendarHorarioSchema,

  async invoke(input) {
    try {
      logger.info('Tool: agendar_horario chamado', { input });

      // VALIDAÇÃO CRÍTICA: Confirmação explícita obrigatória
      if (!input.confirmacaoExplicita) {
        return JSON.stringify({
          success: false,
          error: 'Confirmação explícita necessária',
          texto: '⚠️ Para agendar, preciso da sua confirmação explícita. Por favor, responda "Sim, quero agendar este horário" ou "Confirmo o agendamento".',
          requerConfirmacao: true,
        });
      }

      // Buscar dados do paciente
      const paciente = await pacienteRepository.findById(input.pacienteId);
      if (!paciente) {
        return JSON.stringify({
          success: false,
          error: 'Paciente não encontrado',
          texto: 'Perfil de paciente não encontrado.',
        });
      }

      // Buscar dados do psicólogo
      const psicologo = await psicologoRepository.findById(input.psicologoId);
      if (!psicologo) {
        return JSON.stringify({
          success: false,
          error: 'Psicólogo não encontrado',
          texto: 'Profissional não encontrado.',
        });
      }

      // Verificar se o horário está disponível
      const dataHora = new Date(input.dataHora);

      // Se horarioId fornecido, verificar
      if (input.horarioId) {
        const horario = await horarioRepository.findById(input.horarioId);
        if (!horario || horario.psicologoId !== input.psicologoId) {
          return JSON.stringify({
            success: false,
            error: 'Horário inválido',
            texto: 'O horário selecionado não é válido para este profissional.',
          });
        }
        if (!horario.ativo) {
          return JSON.stringify({
            success: false,
            error: 'Horário indisponível',
            texto: 'Este horário não está mais disponível.',
          });
        }
      }

      // Criar agendamento
      const agendamento = await agendamentoRepository.create({
        pacienteId: input.pacienteId,
        psicologoId: input.psicologoId,
        dataHora,
        duracaoMin: input.duracaoMin,
        observacoes: input.observacoes,
        horarioId: input.horarioId,
        status: 'AGENDADO',
      });

      const response = formatAgendamentoResponse(agendamento, psicologo.nome, paciente.nome);

      return JSON.stringify({
        success: true,
        texto: response.texto,
        agendamento: response.agendamento,
      });
    } catch (error) {
      logger.error('Erro na tool agendar_horario', { error: error.message, input });

      if (error.message.includes('Horário já agendado')) {
        return JSON.stringify({
          success: false,
          error: 'Horário já agendado',
          texto: '❌ Este horário já foi agendado por outro paciente. Por favor, escolha outro horário.',
        });
      }

      return JSON.stringify({
        success: false,
        error: 'Erro ao agendar',
        texto: 'Ocorreu um erro ao criar o agendamento. Tente novamente ou entre em contato com o suporte.',
      });
    }
  },
});

// ============================================
// FUNÇÕES AUXILIARES (reutilizadas do crudHorarioRotas)
// ============================================

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ============================================
// EXPORTAÇÃO DE TODAS AS TOOLS
// ============================================

export const triageAgentTools = [
  buscarPsicologosTool,
  consultarHorariosTool,
  agendarHorarioTool,
];

export default {
  buscarPsicologosTool,
  consultarHorariosTool,
  agendarHorarioTool,
  triageAgentTools,
};