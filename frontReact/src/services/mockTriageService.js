/**
 * Mock Service para simular respostas do Assistente de Triagem (RAG).
 * Substituir por chamadas reais à API /triage/* quando backend estiver pronto.
 */

// Simula delay de rede
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Base de psicólogos mockados (simula resultado do RAG)
const MOCK_PSYCHOLOGISTS = [
  {
    id: 1,
    nome: 'Dra. Maria Santos',
    crp: '06/123456',
    abordagem: 'Cognitivo-Comportamental',
    especialidades: ['Ansiedade', 'Depressão', 'TCC', 'Pânico'],
    modalidade: 'Online',
    preco: 180,
    fotoUrl: '',
    matchReasons: [
      'Especialista em TCC para ansiedade e transtorno do pânico',
      'Atende online com horários noturnos disponíveis',
      '10 anos de experiência com casos similares',
    ],
    score: 0.94,
  },
  {
    id: 2,
    nome: 'Dr. João Silva',
    crp: '06/234567',
    abordagem: 'Humanista',
    especialidades: ['Depressão', 'Autoestima', 'Relacionamentos', 'Luto'],
    modalidade: 'Híbrido',
    preco: 150,
    fotoUrl: '',
    matchReasons: [
      'Abordagem humanista centrada na pessoa',
      'Experiência com depressão e questões de autoestima',
      'Atende online e presencial em São Paulo',
    ],
    score: 0.89,
  },
  {
    id: 3,
    nome: 'Dra. Ana Costa',
    crp: '06/345678',
    abordagem: 'EMDR',
    especialidades: ['Trauma', 'EMDR', 'TEPT', 'Ansiedade'],
    modalidade: 'Online',
    preco: 200,
    fotoUrl: '',
    matchReasons: [
      'Certificada em EMDR para trauma',
      'Especialista em TEPT e traumas complexos',
      'Atendimento 100% online',
    ],
    score: 0.85,
  },
  {
    id: 4,
    nome: 'Dr. Carlos Oliveira',
    crp: '06/456789',
    abordagem: 'Sistêmica',
    especialidades: ['Casais', 'Família', 'Relacionamentos', 'Comunicação'],
    modalidade: 'Presencial',
    preco: 170,
    fotoUrl: '',
    matchReasons: [
      'Terapia sistêmica para casais e famílias',
      'Foco em comunicação e resolução de conflitos',
      'Atendimento presencial no centro de SP',
    ],
    score: 0.81,
  },
  {
    id: 5,
    nome: 'Dra. Patricia Lima',
    crp: '06/567890',
    abordagem: 'ACT',
    especialidades: ['Ansiedade', 'ACT', 'Mindfulness', 'Estresse'],
    modalidade: 'Online',
    preco: 160,
    fotoUrl: '',
    matchReasons: [
      'Especialista em ACT (Terapia de Aceitação e Compromisso)',
      'Integra mindfulness no tratamento de ansiedade',
      'Horários flexíveis incluindo sábados',
    ],
    score: 0.78,
  },
];

// Respostas iniciais do assistente baseadas em palavras-chave
const INITIAL_RESPONSES = {
  ansiedade: {
    reply:
      'Entendo que a ansiedade pode ser muito desafiadora. A TCC (Terapia Cognitivo-Comportamental) é uma das abordagens mais eficazes para isso. Vou buscar profissionais especialistas...',
    partialMatches: [MOCK_PSYCHOLOGISTS[0], MOCK_PSYCHOLOGISTS[4]],
    extractedFeatures: { dores: ['ansiedade'], preferencias: { abordagem: 'tcc' } },
    nextQuestions: [
      'Você tem preferência por atendimento online ou presencial?',
      'Qual sua faixa de preço por sessão?',
    ],
  },
  depressao: {
    reply:
      'Sinto muito que você esteja passando por isso. A depressão é tratável e existem excelentes profissionais que podem ajudar. Vou buscar opções adequadas...',
    partialMatches: [MOCK_PSYCHOLOGISTS[1], MOCK_PSYCHOLOGISTS[0]],
    extractedFeatures: { dores: ['depressao'], preferencias: {} },
    nextQuestions: ['Você já fez terapia antes?', 'Prefere alguma abordagem específica?'],
  },
  trauma: {
    reply:
      'Traumas são experiências dolorosas, mas existem abordagens específicas como EMDR que ajudam muito. Vou procurar profissionais certificados...',
    partialMatches: [MOCK_PSYCHOLOGISTS[2]],
    extractedFeatures: { dores: ['trauma'], preferencias: { abordagem: 'emdr' } },
    nextQuestions: ['O trauma é recente ou de infância?', 'Já tentou alguma terapia antes?'],
  },
  casal: {
    reply:
      'Problemas de relacionamento são comuns e a terapia de casal pode ajudar muito. Vou buscar terapeutas sistêmicos especializados...',
    partialMatches: [MOCK_PSYCHOLOGISTS[3]],
    extractedFeatures: { dores: ['relacionamento'], preferencias: { abordagem: 'sistemica' } },
    nextQuestions: ['Vocês dois fariam a terapia juntos?', 'Prefere online ou presencial?'],
  },
  default: {
    reply:
      'Olá! Vou te ajudar a encontrar o profissional ideal. Me conte: o que te traz aqui hoje? Você pode falar sobre o que está sentindo, suas preferências ou o que procura em um terapeuta.',
    partialMatches: MOCK_PSYCHOLOGISTS.slice(0, 3),
    extractedFeatures: { dores: [], preferencias: {} },
    nextQuestions: [
      'Qual o principal motivo da busca?',
      'Tem preferência por modalidade (online/presencial)?',
    ],
  },
};

/**
 * Simula o endpoint POST /triage/start
 */
export async function mockTriageStart() {
  await delay(500);
  return {
    sessionId: `triage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message:
      'Olá! Vou te ajudar a encontrar o profissional ideal. Me conte: o que te traz aqui hoje?',
  };
}

/**
 * Simula o endpoint POST /triage/chat
 */
export async function mockTriageChat(sessionId, userMessage) {
  await delay(1500); // Simula processamento

  const lowerMsg = userMessage.toLowerCase();
  let response = INITIAL_RESPONSES.default;

  // Detecção simples de palavras-chave
  if (
    lowerMsg.includes('ansiedade') ||
    lowerMsg.includes('pânico') ||
    lowerMsg.includes('ansioso')
  ) {
    response = INITIAL_RESPONSES.ansiedade;
  } else if (
    lowerMsg.includes('depress') ||
    lowerMsg.includes('triste') ||
    lowerMsg.includes('vazio')
  ) {
    response = INITIAL_RESPONSES.depressao;
  } else if (
    lowerMsg.includes('trauma') ||
    lowerMsg.includes('ptsd') ||
    lowerMsg.includes('abuso')
  ) {
    response = INITIAL_RESPONSES.trauma;
  } else if (
    lowerMsg.includes('casal') ||
    lowerMsg.includes('relacionamento') ||
    lowerMsg.includes('namorad') ||
    lowerMsg.includes('casament')
  ) {
    response = INITIAL_RESPONSES.casal;
  }

  // Se já tem matches parciais, simula refinamento
  return {
    reply: response.reply,
    partialMatches: response.partialMatches,
    extractedFeatures: response.extractedFeatures,
    nextQuestions: response.nextQuestions,
  };
}

/**
 * Simula o endpoint POST /triage/finalize
 */
export async function mockTriageFinalize(sessionId) {
  await delay(1000);
  return {
    matches: MOCK_PSYCHOLOGISTS.map((p, i) => ({
      rank: i + 1,
      profissional: {
        id: p.id,
        nome: p.nome,
        crp: p.crp,
        abordagem: p.abordagem,
        especialidades: p.especialidades,
        modalidade: p.modalidade,
        preco: p.preco,
        fotoUrl: p.fotoUrl,
      },
      score: p.score,
      matchReasons: p.matchReasons,
      nextStep: i < 2 ? 'agendar' : 'ver perfil',
    })),
    sessionId,
    summary: 'Busca personalizada baseada nas suas necessidades',
  };
}

export default {
  mockTriageStart,
  mockTriageChat,
  mockTriageFinalize,
};
