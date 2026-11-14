/**
 * Hook customizado para gerenciar estado do chat de triagem.
 * Integra com API real de profissionais e verifica status de login.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getProfissionais } from '../services/crudProfissional.js';
import { getPacienteLogado } from '../services/crudPaciente.js';

// Mapeamento de palavras-chave para especialidades/abordagens
const KEYWORD_MAP = {
  // Ansiedade
  ansiedade: {
    especialidades: ['ansiedade', 'ansiedade generalizada'],
    abordagens: ['cognitivo_comportamental', 'tcc', 'act'],
  },
  ansioso: { especialidades: ['ansiedade'], abordagens: ['cognitivo_comportamental', 'tcc'] },
  pânico: {
    especialidades: ['pânico', 'ansiedade'],
    abordagens: ['cognitivo_comportamental', 'tcc'],
  },
  panico: {
    especialidades: ['pânico', 'ansiedade'],
    abordagens: ['cognitivo_comportamental', 'tcc'],
  },
  medo: {
    especialidades: ['ansiedade', 'fobias'],
    abordagens: ['cognitivo_comportamental', 'tcc'],
  },
  preocupação: { especialidades: ['ansiedade'], abordagens: ['cognitivo_comportamental', 'tcc'] },
  preocupacao: { especialidades: ['ansiedade'], abordagens: ['cognitivo_comportamental', 'tcc'] },
  nervoso: { especialidades: ['ansiedade'], abordagens: ['cognitivo_comportamental', 'tcc'] },
  estresse: {
    especialidades: ['estresse', 'ansiedade'],
    abordagens: ['cognitivo_comportamental', 'act', 'mindfulness'],
  },
  estress: {
    especialidades: ['estresse', 'ansiedade'],
    abordagens: ['cognitivo_comportamental', 'act', 'mindfulness'],
  },

  // Depressão
  depressão: {
    especialidades: ['depressão', 'depressao', 'transtorno depressivo'],
    abordagens: ['cognitivo_comportamental', 'humanista', 'psicanalítica'],
  },
  depressao: {
    especialidades: ['depressão', 'depressao'],
    abordagens: ['cognitivo_comportamental', 'humanista', 'psicanalítica'],
  },
  triste: { especialidades: ['depressão'], abordagens: ['humanista', 'cognitivo_comportamental'] },
  tristeza: {
    especialidades: ['depressão'],
    abordagens: ['humanista', 'cognitivo_comportamental'],
  },
  vazio: { especialidades: ['depressão'], abordagens: ['humanista', 'psicanalítica'] },
  desânimo: {
    especialidades: ['depressão'],
    abordagens: ['cognitivo_comportamental', 'humanista'],
  },
  desanimo: {
    especialidades: ['depressão'],
    abordagens: ['cognitivo_comportamental', 'humanista'],
  },
  'sem vontade': {
    especialidades: ['depressão'],
    abordagens: ['cognitivo_comportamental', 'humanista'],
  },
  'sem energia': {
    especialidades: ['depressão'],
    abordagens: ['cognitivo_comportamental', 'humanista'],
  },

  // Trauma
  trauma: {
    especialidades: ['trauma', 'tept', 'estresse pós-traumático'],
    abordagens: ['emdr', 'cognitivo_comportamental', 'psicanalítica'],
  },
  tept: { especialidades: ['tept', 'trauma'], abordagens: ['emdr', 'cognitivo_comportamental'] },
  ptsd: { especialidades: ['tept', 'trauma'], abordagens: ['emdr', 'cognitivo_comportamental'] },
  abuso: {
    especialidades: ['trauma', 'abuso'],
    abordagens: ['emdr', 'psicanalítica', 'humanista'],
  },
  violência: { especialidades: ['trauma'], abordagens: ['emdr', 'psicanalítica'] },
  violencia: { especialidades: ['trauma'], abordagens: ['emdr', 'psicanalítica'] },

  // Relacionamento/Casal
  casal: {
    especialidades: ['casal', 'relacionamento', 'terapia de casal'],
    abordagens: ['sistêmica', 'cognitivo_comportamental'],
  },
  relacionamento: {
    especialidades: ['relacionamento', 'casal'],
    abordagens: ['sistêmica', 'cognitivo_comportamental', 'humanista'],
  },
  namorado: { especialidades: ['relacionamento'], abordagens: ['sistêmica', 'humanista'] },
  namorada: { especialidades: ['relacionamento'], abordagens: ['sistêmica', 'humanista'] },
  casamento: {
    especialidades: ['casal', 'relacionamento'],
    abordagens: ['sistêmica', 'cognitivo_comportamental'],
  },
  divórcio: { especialidades: ['casal', 'separação'], abordagens: ['sistêmica', 'humanista'] },
  divorcio: { especialidades: ['casal', 'separação'], abordagens: ['sistêmica', 'humanista'] },
  separação: { especialidades: ['separação', 'casal'], abordagens: ['sistêmica', 'humanista'] },
  separacao: { especialidades: ['separação', 'casal'], abordagens: ['sistêmica', 'humanista'] },
  conflito: {
    especialidades: ['relacionamento', 'conflitos'],
    abordagens: ['sistêmica', 'cognitivo_comportamental'],
  },

  // Abordagens específicas
  tcc: { especialidades: [], abordagens: ['cognitivo_comportamental'] },
  cognitivo: { especialidades: [], abordagens: ['cognitivo_comportamental'] },
  comportamental: { especialidades: [], abordagens: ['cognitivo_comportamental'] },
  emdr: { especialidades: [], abordagens: ['emdr'] },
  humanista: { especialidades: [], abordagens: ['humanista'] },
  psicanalítica: { especialidades: [], abordagens: ['psicanalítica'] },
  psicanalitica: { especialidades: [], abordagens: ['psicanalítica'] },
  sistêmica: { especialidades: [], abordagens: ['sistêmica'] },
  sistemica: { especialidades: [], abordagens: ['sistêmica'] },
  act: { especialidades: [], abordagens: ['act'] },
  mindfulness: { especialidades: [], abordagens: ['act', 'mindfulness'] },
  jung: { especialidades: [], abordagens: ['junguiana'] },
  junguiana: { especialidades: [], abordagens: ['junguiana'] },
  gestalt: { especialidades: [], abordagens: ['gestalt'] },

  // Modalidades
  online: { modalidades: ['online', 'hibrido', 'híbrido'] },
  remoto: { modalidades: ['online', 'hibrido', 'híbrido'] },
  virtual: { modalidades: ['online', 'hibrido', 'híbrido'] },
  presencial: { modalidades: ['presencial', 'hibrido', 'híbrido'] },
  híbrido: { modalidades: ['hibrido', 'híbrido', 'online', 'presencial'] },
  hibrido: { modalidades: ['hibrido', 'híbrido', 'online', 'presencial'] },

  // Primeira vez
  'primeira vez': { primeiraVez: true },
  primeiravez: { primeiraVez: true },
  'nunca fiz': { primeiraVez: true },
  'nunca fiz terapia': { primeiraVez: true },
  iniciante: { primeiraVez: true },
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Remove acentos
    .replace(/[.,!?;:]/g, ' ');
}

/**
 * Extrai features da mensagem do usuário baseada em palavras-chave
 */
function extractFeaturesFromMessage(message) {
  const normalized = normalizeText(message);
  const words = normalized.split(/\s+/);

  const features = {
    especialidades: new Set(),
    abordagens: new Set(),
    modalidades: new Set(),
    primeiraVez: false,
    palavrasChave: [],
  };

  // Verifica palavras-chave individuais
  for (const word of words) {
    if (KEYWORD_MAP[word]) {
      const map = KEYWORD_MAP[word];
      if (map.especialidades) map.especialidades.forEach((e) => features.especialidades.add(e));
      if (map.abordagens) map.abordagens.forEach((a) => features.abordagens.add(a));
      if (map.modalidades) map.modalidades.forEach((m) => features.modalidades.add(m));
      if (map.primeiraVez) features.primeiraVez = true;
      features.palavrasChave.push(word);
    }
  }

  // Verifica frases compostas (2-3 palavras)
  for (let i = 0; i < words.length - 1; i++) {
    const phrase2 = `${words[i]} ${words[i + 1]}`;
    if (KEYWORD_MAP[phrase2]) {
      const map = KEYWORD_MAP[phrase2];
      if (map.especialidades) map.especialidades.forEach((e) => features.especialidades.add(e));
      if (map.abordagens) map.abordagens.forEach((a) => features.abordagens.add(a));
      if (map.modalidades) map.modalidades.forEach((m) => features.modalidades.add(m));
      if (map.primeiraVez) features.primeiraVez = true;
      features.palavrasChave.push(phrase2);
    }
    if (i < words.length - 2) {
      const phrase3 = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (KEYWORD_MAP[phrase3]) {
        const map = KEYWORD_MAP[phrase3];
        if (map.especialidades) map.especialidades.forEach((e) => features.especialidades.add(e));
        if (map.abordagens) map.abordagens.forEach((a) => features.abordagens.add(a));
        if (map.modalidades) map.modalidades.forEach((m) => features.modalidades.add(m));
        if (map.primeiraVez) features.primeiraVez = true;
        features.palavrasChave.push(phrase3);
      }
    }
  }

  return {
    especialidades: Array.from(features.especialidades),
    abordagens: Array.from(features.abordagens),
    modalidades: Array.from(features.modalidades),
    primeiraVez: features.primeiraVez,
    palavrasChave: Array.from(new Set(features.palavrasChave)),
  };
}

/**
 * Filtra profissionais baseado nas features extraídas
 */
function filterProfissionais(profissionais, features) {
  return profissionais
    .filter((p) => {
      // Só profissionais validados
      if (p.validado === false) return false;

      let score = 0;

      // Match por especialidades
      const profEspecialidades = (p.especialidades || '').toLowerCase();
      for (const esp of features.especialidades) {
        if (profEspecialidades.includes(esp.toLowerCase())) score += 3;
      }

      // Match por abordagem
      const profAbordagem = (p.abordagem || '').toLowerCase();
      for (const ab of features.abordagens) {
        if (profAbordagem.includes(ab.toLowerCase())) score += 2;
      }

      // Match por modalidade
      const profModalidade = (p.modalidade || '').toLowerCase();
      for (const mod of features.modalidades) {
        if (profModalidade.includes(mod.toLowerCase())) score += 2;
      }

      // Boost para primeira vez - profissionais humanistas/acolhedores
      if (features.primeiraVez) {
        if (profAbordagem.includes('humanista') || profAbordagem.includes('psicanalítica'))
          score += 1;
      }

      return score > 0;
    })
    .map((p) => {
      // Calcula score para ordenação
      let score = 0;
      const profEspecialidades = (p.especialidades || '').toLowerCase();
      const profAbordagem = (p.abordagem || '').toLowerCase();
      const profModalidade = (p.modalidade || '').toLowerCase();

      for (const esp of features.especialidades) {
        if (profEspecialidades.includes(esp.toLowerCase())) score += 3;
      }
      for (const ab of features.abordagens) {
        if (profAbordagem.includes(ab.toLowerCase())) score += 2;
      }
      for (const mod of features.modalidades) {
        if (profModalidade.includes(mod.toLowerCase())) score += 2;
      }
      if (features.primeiraVez) {
        if (profAbordagem.includes('humanista') || profAbordagem.includes('psicanalítica'))
          score += 1;
      }

      return { ...p, matchScore: score };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Gera resposta do assistente baseada nas features e matches
 */
function generateAssistantResponse(features, matches, isLoggedIn) {
  const temMatches = matches.length > 0;
  const topMatches = matches.slice(0, 3);

  if (!temMatches) {
    return {
      text: 'Entendo que você está buscando ajuda. Infelizmente não encontrei profissionais com esse perfil específico no momento. Poderia me contar um pouco mais sobre o que você procura? Por exemplo: ansiedade, depressão, relacionamento, trauma, ou se tem preferência por alguma abordagem (TCC, humanista, EMDR) ou modalidade (online/presencial).',
      matches: [],
      action: 'continue',
    };
  }

  const especialidadesTexto =
    features.especialidades.length > 0
      ? ` para ${features.especialidades.slice(0, 2).join(' e ')}`
      : '';

  const abordagemTexto =
    features.abordagens.length > 0
      ? ` com abordagem ${features.abordagens[0].replace('_', ' ')}`
      : '';

  const modalidadeTexto = features.modalidades.length > 0 ? ` (${features.modalidades[0]})` : '';

  let text = `Encontrei ${matches.length} profissional${matches.length !== 1 ? 'is' : ''} compatível${matches.length !== 1 ? 'eis' : ''}${especialidadesTexto}${abordagemTexto}${modalidadeTexto}. `;

  if (isLoggedIn) {
    text += 'Aqui estão as melhores opções para você:';
    return { text, matches: topMatches, action: 'show_matches' };
  } else {
    text +=
      'Para ver os detalhes e contatos desses profissionais, você precisa fazer login ou criar uma conta.';
    return { text, matches: topMatches, action: 'require_login' };
  }
}

export function useTriageChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profissionais, setProfissionais] = useState([]);
  const [loadingProfissionais, setLoadingProfissionais] = useState(true);
  const [erroProfissionais, setErroProfissionais] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pacienteLogado, setPacienteLogado] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Carrega profissionais na inicialização
  useEffect(() => {
    const carregarProfissionais = async () => {
      try {
        setLoadingProfissionais(true);
        const dados = await getProfissionais();
        const validados = (dados || []).filter((p) => p.validado !== false);
        setProfissionais(validados);
      } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
        setErroProfissionais('Não foi possível carregar os profissionais');
      } finally {
        setLoadingProfissionais(false);
      }
    };

    carregarProfissionais();

    // Verifica se está logado
    const storage = getPacienteLogado();
    if (storage) {
      setIsLoggedIn(true);
      setPacienteLogado(storage);
    }
  }, []);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Inicia conversa com mensagem inicial do assistente
  useEffect(() => {
    if (messages.length === 0 && !loadingProfissionais) {
      const initialMsg = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content:
          'Olá! Sou o assistente de triagem da MentiS. Me conte o que você está buscando — por exemplo: ansiedade, depressão, problemas de relacionamento, trauma, ou se tem preferência por alguma abordagem (TCC, humanista, EMDR) ou modalidade (online/presencial). Vou verificar quais profissionais temos disponíveis para você.',
        timestamp: new Date().toISOString(),
      };
      setMessages([initialMsg]);
    }
  }, [loadingProfissionais]);

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim() || isLoading) return;

      setIsLoading(true);

      // Adiciona mensagem do usuário
      const userMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        // Extrai features da mensagem
        const features = extractFeaturesFromMessage(content);

        // Filtra profissionais
        const matches = filterProfissionais(profissionais, features);

        // Gera resposta
        const response = generateAssistantResponse(features, matches, isLoggedIn);

        // Simula delay de digitação
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 500));

        const assistantMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: response.text,
          timestamp: new Date().toISOString(),
          matches: response.matches,
          action: response.action,
          features,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Erro no chat:', error);
        const errorMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro. Tente novamente em um momento.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [profissionais, isLoggedIn, isLoading]
  );

  const handleLoginRedirect = useCallback(() => {
    // Navega para página de login
    window.location.href = '/paciente';
  }, []);

  const handleNewSearch = useCallback(() => {
    setMessages([]);
    // A mensagem inicial será adicionada pelo useEffect
  }, []);

  return {
    messages,
    isLoading,
    isLoggedIn,
    pacienteLogado,
    loadingProfissionais,
    erroProfissionais,
    messagesEndRef,
    messagesContainerRef,
    sendMessage,
    handleLoginRedirect,
    handleNewSearch,
  };
}

export default useTriageChat;
