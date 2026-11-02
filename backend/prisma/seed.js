import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Dados de 25 psicólogos fictícios variados
// Abordagens: PSICANALITICA, COGNITIVO_COMPORTAMENTAL, HUMANISTA, SISTEMICA, GESTALT, JUNGUIANA, OUTRA
// Modalidades: ONLINE, PRESENCIAL, HIBRIDO
// Preços: 80-300
// CRPs fictícios (formato: números + UF)

const psicologosData = [
  // 1. Psicanalítica - Presencial - Preço médio-alto
  {
    email: 'maria.silva@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Maria Silva',
    crp: '06/12345-SP',
    bio: 'Psicanalista com 15 anos de experiência clínica. Formação em psicanálise lacaniana pela SBPdePA. Atende adultos e adolescentes em processo de análise profunda. Especialista em questões de desejo, angústia e sintomas neuróticos.',
    especialidades: JSON.stringify([
      'Psicanálise',
      'Ansiedade',
      'Depressão',
      'Relacionamentos',
      'Autoconhecimento',
    ]),
    abordagem: 'PSICANALITICA',
    preco: 220.0,
    modalidade: 'PRESENCIAL',
    validado: true,
    fotoUrl: null,
  },
  // 2. Cognitivo-Comportamental - Online - Preço acessível
  {
    email: 'joao.santos@mentis.com',
    senha: 'senha123',
    nome: 'Dr. João Santos',
    crp: '05/23456-RJ',
    bio: 'Psicólogo especialista em Terapia Cognitivo-Comportamental (TCC) com certificação pelo BECK Institute. Foco em protocolos baseados em evidência para ansiedade, depressão, TOC e fobias. Atendimento 100% online com ferramentas digitais de monitoramento.',
    especialidades: JSON.stringify(['TCC', 'Ansiedade', 'Depressão', 'TOC', 'Fobias', 'Pânico']),
    abordagem: 'COGNITIVO_COMPORTAMENTAL',
    preco: 120.0,
    modalidade: 'ONLINE',
    validado: true,
    fotoUrl: null,
  },
  // 3. Humanista - Híbrido - Preço médio
  {
    email: 'ana.costa@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Ana Costa',
    crp: '08/34567-MG',
    bio: 'Psicóloga humanista com abordagem centrada na pessoa (Rogers). Cria espaço de acolhimento incondicional para autodescoberta e crescimento pessoal. Experiência com crises existenciais, luto, autoestima e transições de vida. Atende presencial em BH e online.',
    especialidades: JSON.stringify([
      'Abordagem Centrada na Pessoa',
      'Luto',
      'Autoestima',
      'Crise Existencial',
      'Crescimento Pessoal',
    ]),
    abordagem: 'HUMANISTA',
    preco: 160.0,
    modalidade: 'HIBRIDO',
    validado: true,
    fotoUrl: null,
  },
  // 4. Sistêmica - Presencial - Preço médio
  {
    email: 'carlos.oliveira@mentis.com',
    senha: 'senha123',
    nome: 'Dr. Carlos Oliveira',
    crp: '07/45678-DF',
    bio: 'Terapeuta familiar e de casal com abordagem sistêmica. Especialista em constelações familiares e terapia narrativa. Atende famílias, casais e indivíduos com foco nas dinâmicas relacionais e padrões intergeracionais. CRP ativo no CFP.',
    especialidades: JSON.stringify([
      'Terapia Familiar',
      'Terapia de Casal',
      'Constelações',
      'Conflitos Familiares',
      'Comunicação',
    ]),
    abordagem: 'SISTEMICA',
    preco: 180.0,
    modalidade: 'PRESENCIAL',
    validado: true,
    fotoUrl: null,
  },
  // 5. Gestalt - Online - Preço acessível
  {
    email: 'fernanda.lima@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Fernanda Lima',
    crp: '04/56789-RS',
    bio: 'Psicóloga Gestalt-terapeuta com formação pelo IGT (Instituto de Gestalt-Terapia). Trabalha com consciência corporal, aqui-e-agora, integração de polaridades. Experiência com ansiedade, bloqueios criativos, questões de identidade e expressão emocional.',
    especialidades: JSON.stringify([
      'Gestalt',
      'Ansiedade',
      'Bloqueios Criativos',
      'Identidade',
      'Expressão Emocional',
      'Corpo',
    ]),
    abordagem: 'GESTALT',
    preco: 110.0,
    modalidade: 'ONLINE',
    validado: true,
    fotoUrl: null,
  },
  // 6. Junguiana - Presencial - Preço alto
  {
    email: 'roberto.almeida@mentis.com',
    senha: 'senha123',
    nome: 'Dr. Roberto Almeida',
    crp: '06/67890-SP',
    bio: 'Analista junguiano formado pelo Instituto Junguiano de São Paulo. Trabalha com sonhos, simbolismo, arquétipos, processo de individuação e sombra. Atende adultos em processo de análise profunda. Experiência com depressão existencial, crise de meia-idade, espiritualidade.',
    especialidades: JSON.stringify([
      'Psicologia Analítica',
      'Sonhos',
      'Individuação',
      'Sombra',
      'Espiritualidade',
      'Depressão Existencial',
    ]),
    abordagem: 'JUNGUIANA',
    preco: 280.0,
    modalidade: 'PRESENCIAL',
    validado: true,
    fotoUrl: null,
  },
  // 7. Cognitivo-Comportamental - Híbrido - Preço médio
  {
    email: 'juliana.ferreira@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Juliana Ferreira',
    crp: '12/78901-PE',
    bio: 'Especialista em TCC e Terapia do Esquema (Schema Therapy). Certificada pela ISST. Foco em padrões emocionais profundos, trauma complexo, transtorno de personalidade borderline. Atende online e presencial no Recife. Abordagem estruturada e compassiva.',
    especialidades: JSON.stringify([
      'TCC',
      'Schema Therapy',
      'Trauma Complexo',
      'Borderline',
      'Transtornos de Personalidade',
      'Regulação Emocional',
    ]),
    abordagem: 'COGNITIVO_COMPORTAMENTAL',
    preco: 190.0,
    modalidade: 'HIBRIDO',
    validado: true,
    fotoUrl: null,
  },
  // 8. Humanista - Online - Preço social
  {
    email: 'pedro.ribeiro@mentis.com',
    senha: 'senha123',
    nome: 'Dr. Pedro Ribeiro',
    crp: '09/89012-PR',
    bio: 'Psicólogo com abordagem humanista-existencial. Foco em autonomia, responsabilidade e sentido de vida. Atende prioritariamente online com valor social acessível. Experiência com estudantes, jovens adultos, orientação vocacional e crises de sentido.',
    especialidades: JSON.stringify([
      'Humanista-Existencial',
      'Orientação Vocacional',
      'Jovens Adultos',
      'Crise de Sentido',
      'Autonomia',
    ]),
    abordagem: 'HUMANISTA',
    preco: 85.0,
    modalidade: 'ONLINE',
    validado: true,
    fotoUrl: null,
  },
  // 9. Sistêmica - Híbrido - Preço médio-alto
  {
    email: 'lucia.martins@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Lucia Martins',
    crp: '03/90123-CE',
    bio: 'Terapeuta sistêmica com especialização em terapia de casal pelo Ackerman Institute. Trabalha com ciclos de vida familiar, parentalidade, divórcio, reconstrução de vínculos. Atende presencial em Fortaleza e online para todo Brasil.',
    especialidades: JSON.stringify([
      'Terapia de Casal',
      'Parentalidade',
      'Divórcio',
      'Vínculos Familiares',
      'Ciclos de Vida',
    ]),
    abordagem: 'SISTEMICA',
    preco: 210.0,
    modalidade: 'HIBRIDO',
    validado: true,
    fotoUrl: null,
  },
  // 10. Cognitivo-Comportamental - Presencial - Preço médio
  {
    email: 'rafael.barbosa@mentis.com',
    senha: 'senha123',
    nome: 'Dr. Rafael Barbosa',
    crp: '06/01234-SP',
    bio: 'Especialista em TCC para infância e adolescência. Certificado em Terapia Comportamental Dialética (DBT) para adolescentes. Atende presencial em São Paulo. Trabalha com ansiedade escolar, TDAH, problemas de conduta, bullying e regulação emocional.',
    especialidades: JSON.stringify([
      'TCC Infantojuvenil',
      'DBT',
      'TDAH',
      'Ansiedade Escolar',
      'Bullying',
      'Regulação Emocional',
    ]),
    abordagem: 'COGNITIVO_COMPORTAMENTAL',
    preco: 170.0,
    modalidade: 'PRESENCIAL',
    validado: true,
    fotoUrl: null,
  },
  // 11. Psicanalítica - Online - Preço médio
  {
    email: 'carla.rocha@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Carla Rocha',
    crp: '05/12345-RJ',
    bio: 'Psicanalista com formação em psicanálise freudiana e pós-freudiana. Atendimento online com setting analítico adaptado ao virtual. Trabalha com sintomas, sonhos, atos falhos, transferência. Experiência com depressão, ansiedade, dificuldades relacionais.',
    especialidades: JSON.stringify([
      'Psicanálise Freudiana',
      'Depressão',
      'Ansiedade',
      'Sonhos',
      'Relacionamentos',
      'Sintomas',
    ]),
    abordagem: 'PSICANALITICA',
    preco: 150.0,
    modalidade: 'ONLINE',
    validado: true,
    fotoUrl: null,
  },
  // 12. Gestalt - Presencial - Preço médio
  {
    email: 'marcos.pereira@mentis.com',
    senha: 'senha123',
    nome: 'Dr. Marcos Pereira',
    crp: '08/23456-MG',
    bio: 'Gestalt-terapeuta com ênfase em fenomenologia e consciência corporal. Formação em terapia focada em emoções (EFT). Atende presencial em Belo Horizonte. Trabalha com trauma, dissociação, alexitimia, reconexão corpo-mente.',
    especialidades: JSON.stringify([
      'Gestalt',
      'EFT',
      'Trauma',
      'Dissociação',
      'Alexitimia',
      'Corpo-Mente',
    ]),
    abordagem: 'GESTALT',
    preco: 140.0,
    modalidade: 'PRESENCIAL',
    validado: true,
    fotoUrl: null,
  },
  // 13. Junguiana - Híbrido - Preço alto
  {
    email: 'patricia.gomes@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Patricia Gomes',
    crp: '07/34567-DF',
    bio: 'Analista junguiana com especialização em sandplay therapy (terapia de areia) e trabalho com imaginação ativa. Atende adultos e adolescentes. Foco em processo criativo, simbolismo, feminino/masculino, espiritualidade. Presencial em Brasília e online.',
    especialidades: JSON.stringify([
      'Psicologia Analítica',
      'Sandplay',
      'Imaginação Ativa',
      'Criatividade',
      'Espiritualidade',
      'Adolescentes',
    ]),
    abordagem: 'JUNGUIANA',
    preco: 300.0,
    modalidade: 'HIBRIDO',
    validado: true,
    fotoUrl: null,
  },
  // 14. Cognitivo-Comportamental - Online - Preço acessível
  {
    email: 'bruno.costa@mentis.com',
    senha: 'senha123',
    nome: 'Dr. Bruno Costa',
    crp: '11/45678-SC',
    bio: 'Psicólogo especialista em TCC para ansiedade e estresse ocupacional. Protocolo unificado para transtornos emocionais (Barlow). Atendimento 100% online com plataforma própria de exercícios e monitoramento. Foco em profissionais de alta performance, burnout.',
    especialidades: JSON.stringify([
      'TCC',
      'Ansiedade',
      'Burnout',
      'Estresse Ocupacional',
      'Alta Performance',
      'Protocolo Unificado',
    ]),
    abordagem: 'COGNITIVO_COMPORTAMENTAL',
    preco: 130.0,
    modalidade: 'ONLINE',
    validado: true,
    fotoUrl: null,
  },
  // 15. Humanista - Presencial - Preço médio
  {
    email: 'isabela.nunes@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Isabela Nunes',
    crp: '06/56789-SP',
    bio: 'Psicóloga humanista com formação em Focusing (Gendlin) e Psicologia Positiva Aplicada. Atende presencial em São Paulo. Trabalha com autoconhecimento, valores, propósito de vida, bem-estar, florescimento humano. Abordagem experiencial e gentil.',
    especialidades: JSON.stringify([
      'Humanista',
      'Focusing',
      'Psicologia Positiva',
      'Propósito',
      'Bem-estar',
      'Autoconhecimento',
    ]),
    abordagem: 'HUMANISTA',
    preco: 155.0,
    modalidade: 'PRESENCIAL',
    validado: true,
    fotoUrl: null,
  },
  // 16. Sistêmica - Online - Preço médio
  {
    email: 'felipe.lima@mentis.com',
    senha: 'senha123',
    nome: 'Dr. Felipe Lima',
    crp: '04/67890-RS',
    bio: 'Terapeuta sistêmico com experiência em mediação de conflitos e terapia narrativa. Atende online casais, famílias e indivíduos. Ferramentas de genograma, linha da vida, externalização do problema. Especialista em comunicação não-violenta aplicada à terapia.',
    especialidades: JSON.stringify([
      'Terapia Narrativa',
      'Mediação',
      'Comunicação Não-Violenta',
      'Casais',
      'Famílias',
      'Genograma',
    ]),
    abordagem: 'SISTEMICA',
    preco: 145.0,
    modalidade: 'ONLINE',
    validado: true,
    fotoUrl: null,
  },
  // 17. Cognitivo-Comportamental - Híbrido - Preço médio-alto
  {
    email: 'gabriela.souza@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Gabriela Souza',
    crp: '06/78901-SP',
    bio: 'Especialista em ACT (Terapia de Aceitação e Compromisso) e TCC contextual. Certificada pela ACBS. Atende presencial e online. Foco em flexibilidade psicológica, valores, mindfulness clínico, dor crônica, doenças crônicas, aceitação.',
    especialidades: JSON.stringify([
      'ACT',
      'TCC Contextual',
      'Mindfulness Clínico',
      'Dor Crônica',
      'Doenças Crônicas',
      'Flexibilidade Psicológica',
    ]),
    abordagem: 'COGNITIVO_COMPORTAMENTAL',
    preco: 200.0,
    modalidade: 'HIBRIDO',
    validado: true,
    fotoUrl: null,
  },
  // 18. Psicanalítica - Híbrido - Preço médio
  {
    email: 'rodrigo.alves@mentis.com',
    senha: 'senha123',
    nome: 'Dr. Rodrigo Alves',
    crp: '05/89012-RJ',
    bio: 'Psicanalista com formação em psicanálise relacional e teoria do apego. Integra conceitos psicanalíticos com neurociência afetiva. Atende híbrido (Rio de Janeiro e online). Trabalha com trauma desenvolvimental, apego, regulação afetiva.',
    especialidades: JSON.stringify([
      'Psicanálise Relacional',
      'Teoria do Apego',
      'Trauma Desenvolvimental',
      'Regulação Afetiva',
      'Neurociência Afetiva',
    ]),
    abordagem: 'PSICANALITICA',
    preco: 185.0,
    modalidade: 'HIBRIDO',
    validado: true,
    fotoUrl: null,
  },
  // 19. Gestalt - Online - Preço acessível
  {
    email: 'camila.ferreira@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Camila Ferreira',
    crp: '12/90123-PE',
    bio: 'Gestalt-terapeuta com foco em grupos e terapia expressiva. Experiência em psicodrama, arte-terapia, movimento autêntico. Atende online com abordagem criativa e corporal. Trabalha com expressão emocional, criatividade, bloqueios, grupos terapêuticos.',
    especialidades: JSON.stringify([
      'Gestalt',
      'Psicodrama',
      'Arte-Terapia',
      'Movimento Autêntico',
      'Grupos',
      'Expressão Criativa',
    ]),
    abordagem: 'GESTALT',
    preco: 95.0,
    modalidade: 'ONLINE',
    validado: true,
    fotoUrl: null,
  },
  // 20. Junguiana - Presencial - Preço alto
  {
    email: 'eduardo.martins@mentis.com',
    senha: 'senha123',
    nome: 'Dr. Eduardo Martins',
    crp: '08/01234-MG',
    bio: 'Analista junguiano sênior com 25 anos de experiência. Especialista em alquimia psicológica, mitologia comparada, processo de individuação na segunda metade da vida. Atende presencial em Belo Horizonte. Supervisão de analistas em formação.',
    especialidades: JSON.stringify([
      'Psicologia Analítica',
      'Alquimia',
      'Mitologia',
      'Individuação',
      'Segunda Metade da Vida',
      'Supervisão',
    ]),
    abordagem: 'JUNGUIANA',
    preco: 290.0,
    modalidade: 'PRESENCIAL',
    validado: true,
    fotoUrl: null,
  },
  // 21. Humanista - Online - Preço social
  {
    email: 'lara.oliveira@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Lara Oliveira',
    crp: '09/12345-PR',
    bio: 'Psicóloga humanista com abordagem centrada na pessoa e experiência em atendimento universitário. Valor social para estudantes e baixa renda. Atende 100% online. Foco em acolhimento, escuta ativa, suporte emocional, prevenção ao suicídio.',
    especialidades: JSON.stringify([
      'Centrada na Pessoa',
      'Estudantes',
      'Baixa Renda',
      'Acolhimento',
      'Prevenção Suicídio',
      'Suporte Emocional',
    ]),
    abordagem: 'HUMANISTA',
    preco: 80.0,
    modalidade: 'ONLINE',
    validado: true,
    fotoUrl: null,
  },
  // 22. Cognitivo-Comportamental - Presencial - Preço médio-alto
  {
    email: 'thiago.ribeiro@mentis.com',
    senha: 'senha123',
    nome: 'Dr. Thiago Ribeiro',
    crp: '06/23456-SP',
    bio: 'Especialista em TCC para TOC, ansiedade e transtornos relacionados. Treinamento avançado em ERP (Exposição com Prevenção de Resposta). Atende presencial em São Paulo. Protocolo intensivo para TOC grave. Publicações científicas na área.',
    especialidades: JSON.stringify([
      'TCC',
      'TOC',
      'ERP',
      'Ansiedade',
      'Transtornos Relacionados',
      'Protocolo Intensivo',
    ]),
    abordagem: 'COGNITIVO_COMPORTAMENTAL',
    preco: 230.0,
    modalidade: 'PRESENCIAL',
    validado: true,
    fotoUrl: null,
  },
  // 23. Sistêmica - Presencial - Preço médio
  {
    email: 'vanessa.costa@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Vanessa Costa',
    crp: '03/34567-CE',
    bio: 'Terapeuta familiar sistêmica com especialização em violência doméstica, abuso, trauma intergeracional. Atende presencial em Fortaleza. Trabalho com famílias em situação de vulnerabilidade, proteção infantil, rede de apoio. Abordagem sensível ao trauma.',
    especialidades: JSON.stringify([
      'Terapia Familiar',
      'Violência Doméstica',
      'Trauma Intergeracional',
      'Proteção Infantil',
      'Vulnerabilidade Social',
      'Sensível ao Trauma',
    ]),
    abordagem: 'SISTEMICA',
    preco: 135.0,
    modalidade: 'PRESENCIAL',
    validado: true,
    fotoUrl: null,
  },
  // 24. Psicanalítica - Online - Preço médio-alto
  {
    email: 'andre.gomes@mentis.com',
    senha: 'senha123',
    nome: 'Dr. André Gomes',
    crp: '07/45678-DF',
    bio: 'Psicanalista com formação em psicanálise contemporânea e filosofia da psicanálise. Atende online para todo Brasil. Trabalha com subjetividade contemporânea, mal-estar na cultura, vazio existencial, medicalização da vida, sofrimento psíquico na modernidade.',
    especialidades: JSON.stringify([
      'Psicanálise Contemporânea',
      'Filosofia',
      'Mal-estar na Cultura',
      'Vazio Existencial',
      'Medicalização',
      'Modernidade',
    ]),
    abordagem: 'PSICANALITICA',
    preco: 205.0,
    modalidade: 'ONLINE',
    validado: true,
    fotoUrl: null,
  },
  // 25. OUTRA (Integrativa/ECLETICA) - Híbrido - Preço médio
  {
    email: 'beatriz.almeida@mentis.com',
    senha: 'senha123',
    nome: 'Dra. Beatriz Almeida',
    crp: '06/56789-SP',
    bio: 'Psicóloga com abordagem integrativa/ecletica baseada em evidência. Integra TCC, ACT, Mindfulness, Psicologia Positiva, Neurociência. Personaliza tratamento para cada paciente. Atende híbrido em São Paulo. Experiência ampla: ansiedade, depressão, relacionamentos, desempenho, bem-estar.',
    especialidades: JSON.stringify([
      'Integrativa',
      'TCC',
      'ACT',
      'Mindfulness',
      'Psicologia Positiva',
      'Neurociência',
      'Ansiedade',
      'Depressão',
      'Relacionamentos',
      'Desempenho',
    ]),
    abordagem: 'OUTRA',
    preco: 175.0,
    modalidade: 'HIBRIDO',
    validado: true,
    fotoUrl: null,
  },
];

// Horários variados por psicólogo (mais realistas)
const gerarHorarios = (psicologoId, seed) => {
  // Usar seed para gerar horários determinísticos mas variados
  const random = (min, max) =>
    Math.floor((((seed * 9301 + 49297) % 233280) / 233280) * (max - min + 1)) + min;

  const horarios = [];
  const diasUteis = [1, 2, 3, 4, 5]; // Seg-Sex
  const numDias = random(3, 5); // 3 a 5 dias por semana
  const diasSelecionados = diasUteis.sort(() => 0.5 - Math.random()).slice(0, numDias);

  for (const dia of diasSelecionados) {
    const periodo = random(1, 3); // 1=manhã, 2=tarde, 3=ambos
    if (periodo === 1 || periodo === 3) {
      const horaIni = random(7, 9); // 07:00 a 09:00
      const horaFim = horaIni + random(3, 4); // 3-4 horas
      horarios.push({
        psicologoId,
        diaSemana: dia,
        horaInicio: `${horaIni.toString().padStart(2, '0')}:00`,
        horaFim: `${horaFim.toString().padStart(2, '0')}:00`,
      });
    }
    if (periodo === 2 || periodo === 3) {
      const horaIni = random(13, 15); // 13:00 a 15:00
      const horaFim = horaIni + random(3, 4);
      horarios.push({
        psicologoId,
        diaSemana: dia,
        horaInicio: `${horaIni.toString().padStart(2, '0')}:00`,
        horaFim: `${horaFim.toString().padStart(2, '0')}:00`,
      });
    }
    // Alguns com sábado
    if (dia === 5 && random(1, 3) === 1) {
      horarios.push({
        psicologoId,
        diaSemana: 6, // Sábado
        horaInicio: '08:00',
        horaFim: '12:00',
      });
    }
  }

  return horarios;
};

async function main() {
  console.log('🌱 Starting seed with 25 psicólogos...');

  for (let i = 0; i < psicologosData.length; i++) {
    const p = psicologosData[i];

    // Create Usuario
    const hashedSenha = await bcrypt.hash(p.senha, SALT_ROUNDS);
    const usuario = await prisma.usuario.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        senha: hashedSenha,
        role: 'PSICOLOGO',
        ativo: true,
      },
    });

    // Create Psicologo
    const psicologo = await prisma.psicologo.upsert({
      where: { crp: p.crp },
      update: {},
      create: {
        usuarioId: usuario.id,
        crp: p.crp,
        bio: p.bio,
        especialidades: p.especialidades,
        abordagem: p.abordagem,
        preco: p.preco,
        modalidade: p.modalidade,
        validado: p.validado,
        fotoUrl: p.fotoUrl,
      },
    });

    // Create Horários variados
    const horarios = gerarHorarios(psicologo.id, i + 1);
    for (const h of horarios) {
      await prisma.horarioDisponivel.upsert({
        where: {
          psicologoId_diaSemana_horaInicio_horaFim: {
            psicologoId: h.psicologoId,
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFim: h.horaFim,
          },
        },
        update: {},
        create: h,
      });
    }

    console.log(
      `✅ [${i + 1}/25] Created: ${p.nome} (CRP: ${p.crp}) | ${p.abordagem} | ${p.modalidade} | R$ ${p.preco.toFixed(2)} | ${horarios.length} horários`
    );
  }

  // Estatísticas finais
  const total = await prisma.psicologo.count();
  const porAbordagem = await prisma.psicologo.groupBy({
    by: ['abordagem'],
    _count: true,
  });
  const porModalidade = await prisma.psicologo.groupBy({
    by: ['modalidade'],
    _count: true,
  });
  const precoStats = await prisma.psicologo.aggregate({
    _min: { preco: true },
    _max: { preco: true },
    _avg: { preco: true },
  });

  console.log('\n📊 Seed Statistics:');
  console.log(`   Total psicólogos: ${total}`);
  console.log(
    `   Preço: Mín R$ ${precoStats._min.preco?.toFixed(2)} | Máx R$ ${precoStats._max.preco?.toFixed(2)} | Méd R$ ${precoStats._avg.preco?.toFixed(2)}`
  );
  console.log('   Por abordagem:');
  porAbordagem.forEach((a) => console.log(`     ${a.abordagem}: ${a._count}`));
  console.log('   Por modalidade:');
  porModalidade.forEach((m) => console.log(`     ${m.modalidade}: ${m._count}`));

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
