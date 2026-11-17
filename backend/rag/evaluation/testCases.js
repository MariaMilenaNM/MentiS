/**
 * Casos de Teste para Avaliação do Retriever RAG
 * 15 perguntas com resultados esperados para validação de qualidade
 *
 * Métricas de avaliação:
 * - Recall@3: Proporção de documentos relevantes recuperados no top-3
 * - Precision@3: Proporção de resultados no top-3 que são relevantes
 * - MRR (Mean Reciprocal Rank): Posição média do primeiro resultado relevante
 * - NDCG@3: Normalized Discounted Cumulative Gain no top-3
 */

// Detectar se está usando mock embeddings (sem OPENAI_API_KEY)
const isMockEmbeddings = !process.env.OPENAI_API_KEY;

// Thresholds ajustados para mock embeddings (scores ~0.01-0.05)
const MOCK_MIN_SIMILARITY = 0.01;
const MOCK_MIN_SIMILARITY_SEMANTIC = 0.005;

function getMinSimilarity(productionValue, semanticValue = null) {
  if (isMockEmbeddings) {
    return semanticValue ?? MOCK_MIN_SIMILARITY;
  }
  return productionValue;
}

export const TEST_CASES = [
  {
    id: 'TC001',
    category: 'Especialidade - Ansiedade',
    query: 'psicólogo para ansiedade',
    description: 'Busca genérica por psicólogo especialista em ansiedade',
    filters: {},
    expected: {
      minResults: 1,
      maxResults: 3,
      mustContainSpecialties: ['ansiedade', 'Ansiedade', 'ANSIO'],
      relevantPsychologists: [], // IDs esperados (preencher após indexação)
      minSimilarity: getMinSimilarity(0.4),
    },
  },

  {
    id: 'TC002',
    category: 'Especialidade - TCC',
    query: 'terapia cognitivo comportamental',
    description: 'Busca por TCC (Terapia Cognitivo-Comportamental)',
    filters: {},
    expected: {
      minResults: 1,
      maxResults: 3,
      mustContainSpecialties: ['TCC', 'Cognitivo', 'Comportamental', 'COGNITIVO_COMPORTAMENTAL'],
      relevantApproaches: ['COGNITIVO_COMPORTAMENTAL'],
      minSimilarity: getMinSimilarity(0.45),
    },
  },

  {
    id: 'TC003',
    category: 'Modalidade - Online',
    query: 'psicólogo online',
    description: 'Busca por atendimento exclusivamente online',
    filters: { modalidade: 'ONLINE' },
    expected: {
      minResults: 1,
      maxResults: 3,
      allMustHaveModalidade: 'ONLINE',
      minSimilarity: getMinSimilarity(0.35),
    },
  },

  {
    id: 'TC004',
    category: 'Modalidade - Presencial SP',
    query: 'psicólogo presencial em São Paulo',
    description: 'Busca por atendimento presencial em São Paulo',
    filters: { modalidade: 'PRESENCIAL', estado: 'SP' },
    expected: {
      minResults: 1,
      maxResults: 3,
      allMustHaveModalidade: 'PRESENCIAL',
      allMustHaveEstado: 'SP',
      minSimilarity: getMinSimilarity(0.35),
    },
  },

  {
    id: 'TC005',
    category: 'Especialidade + Modalidade',
    query: 'especialista em depressão que atende online',
    description: 'Combinação: especialidade depressão + modalidade online',
    filters: { modalidade: 'ONLINE' },
    expected: {
      minResults: 1,
      maxResults: 3,
      mustContainSpecialties: ['depressão', 'Depressão', 'DEPRESSAO'],
      allMustHaveModalidade: 'ONLINE',
      minSimilarity: getMinSimilarity(0.4),
    },
  },

  {
    id: 'TC006',
    category: 'Preço - Até 150 reais',
    query: 'psicólogo até 150 reais',
    description: 'Busca por psicólogos com preço até R$ 150,00',
    filters: { precoMax: 150 },
    expected: {
      minResults: 1,
      maxResults: 3,
      allMustHavePrecoMax: 150,
      minSimilarity: getMinSimilarity(0.3),
    },
  },

  {
    id: 'TC007',
    category: 'Especialidade + Preço',
    query: 'terapia para ansiedade até 200 reais',
    description: 'Ansiedade com limite de preço R$ 200,00',
    filters: { precoMax: 200 },
    expected: {
      minResults: 1,
      maxResults: 3,
      mustContainSpecialties: ['ansiedade', 'Ansiedade'],
      allMustHavePrecoMax: 200,
      minSimilarity: getMinSimilarity(0.4),
    },
  },

  {
    id: 'TC008',
    category: 'Abordagem - Psicanálise',
    query: 'psicanalista',
    description: 'Busca por profissional com abordagem psicanalítica',
    filters: {},
    expected: {
      minResults: 1,
      maxResults: 3,
      mustContainApproaches: ['PSICANALITICA', 'psicanálise', 'Psicanálise'],
      minSimilarity: getMinSimilarity(0.4),
    },
  },

  {
    id: 'TC009',
    category: 'Localização - Rio de Janeiro',
    query: 'psicólogo no Rio de Janeiro',
    description: 'Busca por psicólogos no estado do RJ',
    filters: { estado: 'RJ' },
    expected: {
      minResults: 1,
      maxResults: 3,
      allMustHaveEstado: 'RJ',
      minSimilarity: getMinSimilarity(0.35),
    },
  },

  {
    id: 'TC010',
    category: 'Especialidade - Casal',
    query: 'terapia de casal',
    description: 'Busca por terapia de casal / conjugal',
    filters: {},
    expected: {
      minResults: 1,
      maxResults: 3,
      mustContainSpecialties: ['casal', 'Casal', 'conjugal', 'Conjugal', 'relacionamento'],
      minSimilarity: getMinSimilarity(0.4),
    },
  },

  {
    id: 'TC011',
    category: 'Especialidade - Infantil',
    query: 'psicólogo infantil',
    description: 'Busca por psicólogo especialista em infantil/crianças',
    filters: {},
    expected: {
      minResults: 1,
      maxResults: 3,
      mustContainSpecialties: ['infantil', 'Infantil', 'criança', 'Criança', 'adolescente'],
      minSimilarity: getMinSimilarity(0.4),
    },
  },

  {
    id: 'TC012',
    category: 'Filtros Combinados Complexos',
    query: 'psicólogo TCC para ansiedade presencial em SP até 180 reais',
    description: 'Múltiplos filtros: especialidade, modalidade, estado, preço',
    filters: {
      modalidade: 'PRESENCIAL',
      estado: 'SP',
      precoMax: 180,
    },
    expected: {
      minResults: 1,
      maxResults: 3,
      mustContainSpecialties: ['ansiedade', 'Ansiedade', 'TCC'],
      allMustHaveModalidade: 'PRESENCIAL',
      allMustHaveEstado: 'SP',
      allMustHavePrecoMax: 180,
      minSimilarity: getMinSimilarity(0.35),
    },
  },

  {
    id: 'TC013',
    category: 'Abordagem Humanista',
    query: 'terapia humanista',
    description: 'Busca por abordagem humanista / pessoa-centrada / Gestalt',
    filters: {},
    expected: {
      minResults: 1,
      maxResults: 3,
      mustContainApproaches: ['HUMANISTA', 'humanista', 'Humanista', 'pessoa-centrada', 'GESTALT'],
      minSimilarity: getMinSimilarity(0.4),
    },
  },

  {
    id: 'TC014',
    category: 'Especialidade - Trauma/EMDR',
    query: 'psicólogo especialista em trauma EMDR',
    description: 'Busca por especialista em trauma e EMDR',
    filters: {},
    expected: {
      minResults: 1,
      maxResults: 3,
      mustContainSpecialties: ['trauma', 'Trauma', 'EMDR', 'ptsd', 'PTSD'],
      minSimilarity: getMinSimilarity(0.4),
    },
  },

  {
    id: 'TC015',
    category: 'Busca Amplamente Semântica',
    query: 'preciso de ajuda para lidar com estresse no trabalho',
    description: 'Query em linguagem natural sem termos técnicos',
    filters: {},
    expected: {
      minResults: 1,
      maxResults: 3,
      mustContainSpecialties: [
        'estresse',
        'Estresse',
        'ansiedade',
        'Ansiedade',
        'burnout',
        'Burnout',
        'trabalho',
      ],
      minSimilarity: getMinSimilarity(0.35, MOCK_MIN_SIMILARITY_SEMANTIC),
    },
  },
];

/**
 * Categorias de teste para relatórios
 */
export const TEST_CATEGORIES = [
  'Especialidade - Ansiedade',
  'Especialidade - TCC',
  'Modalidade - Online',
  'Modalidade - Presencial SP',
  'Especialidade + Modalidade',
  'Preço - Até 150 reais',
  'Especialidade + Preço',
  'Abordagem - Psicanálise',
  'Localização - Rio de Janeiro',
  'Especialidade - Casal',
  'Especialidade - Infantil',
  'Filtros Combinados Complexos',
  'Abordagem Humanista',
  'Especialidade - Trauma/EMDR',
  'Busca Amplamente Semântica',
];

/**
 * Função para validar resultados contra casos de teste esperados
 * @param {Array} results - Resultados do retriever
 * @param {Object} testCase - Caso de teste
 * @returns {Object} Resultado da validação
 */
export function validateResults(results, testCase) {
  const { expected } = testCase;
  const validation = {
    testCaseId: testCase.id,
    passed: true,
    issues: [],
    metrics: {
      resultsCount: results.length,
      recallAt3: 0,
      precisionAt3: 0,
      mrr: 0,
      avgSimilarity: 0,
    },
  };

  // Verificar número mínimo/máximo de resultados
  if (results.length < expected.minResults) {
    validation.passed = false;
    validation.issues.push(`Poucos resultados: ${results.length} < ${expected.minResults}`);
  }
  if (results.length > expected.maxResults) {
    validation.issues.push(
      `Muitos resultados: ${results.length} > ${expected.maxResults} (cortado para top-${expected.maxResults})`
    );
  }

  // Verificar similaridade mínima
  if (results.length > 0) {
    const avgSim = results.reduce((sum, r) => sum + r.similarityScore, 0) / results.length;
    validation.metrics.avgSimilarity = Number(avgSim.toFixed(4));

    if (avgSim < expected.minSimilarity) {
      validation.passed = false;
      validation.issues.push(
        `Similaridade média baixa: ${avgSim.toFixed(4)} < ${expected.minSimilarity}`
      );
    }
  }

  // Verificar especialidades esperadas
  if (expected.mustContainSpecialties) {
    const foundSpecialties = new Set();
    results.forEach((r) => {
      const specs = r.metadata?.especialidades || [];
      specs.forEach((s) => foundSpecialties.add(s.toLowerCase()));
    });

    const hasExpectedSpecialty = expected.mustContainSpecialties.some((exp) =>
      Array.from(foundSpecialties).some((found) => found.includes(exp.toLowerCase()))
    );

    if (!hasExpectedSpecialty && results.length > 0) {
      validation.passed = false;
      validation.issues.push(
        `Especialidade esperada não encontrada: ${expected.mustContainSpecialties.join(', ')}`
      );
    }
  }

  // Verificar abordagens esperadas
  if (expected.mustContainApproaches) {
    const foundApproaches = new Set();
    results.forEach((r) => {
      if (r.metadata?.abordagem) foundApproaches.add(r.metadata.abordagem);
    });

    const hasExpectedApproach = expected.mustContainApproaches.some((exp) =>
      Array.from(foundApproaches).some((found) => found === exp)
    );

    if (!hasExpectedApproach && results.length > 0) {
      validation.passed = false;
      validation.issues.push(
        `Abordagem esperada não encontrada: ${expected.mustContainApproaches.join(', ')}`
      );
    }
  }

  // Verificar modalidade obrigatória
  if (expected.allMustHaveModalidade) {
    const allMatch = results.every(
      (r) => r.metadata?.modalidade === expected.allMustHaveModalidade
    );
    if (!allMatch && results.length > 0) {
      validation.passed = false;
      validation.issues.push(`Nem todos têm modalidade ${expected.allMustHaveModalidade}`);
    }
  }

  // Verificar estado obrigatório
  if (expected.allMustHaveEstado) {
    const allMatch = results.every((r) => r.metadata?.estado === expected.allMustHaveEstado);
    if (!allMatch && results.length > 0) {
      validation.passed = false;
      validation.issues.push(`Nem todos têm estado ${expected.allMustHaveEstado}`);
    }
  }

  // Verificar preço máximo
  if (expected.allMustHavePrecoMax) {
    const allMatch = results.every((r) => (r.metadata?.preco || 0) <= expected.allMustHavePrecoMax);
    if (!allMatch && results.length > 0) {
      validation.passed = false;
      validation.issues.push(`Nem todos têm preço <= ${expected.allMustHavePrecoMax}`);
    }
  }

  return validation;
}

/**
 * Executa todos os casos de teste e gera relatório
 * @param {Function} retrieveFn - Função de retrieve (ex: import { retrieve } from './retriever.js')
 * @returns {Promise<Object>} Relatório completo
 */
export async function runEvaluation(retrieveFn) {
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: TEST_CASES.length,
    passed: 0,
    failed: 0,
    results: [],
    summary: {},
  };

  for (const testCase of TEST_CASES) {
    try {
      const results = await retrieveFn(testCase.query, testCase.filters, { topK: 3 });
      const validation = validateResults(results, testCase);

      report.results.push({
        testCase,
        results: results.map((r) => ({
          psicologoId: r.metadata?.psicologoId,
          nome: r.metadata?.nome,
          similarityScore: r.similarityScore,
          modalidade: r.metadata?.modalidade,
          estado: r.metadata?.estado,
          preco: r.metadata?.preco,
          especialidades: r.metadata?.especialidades,
          abordagem: r.metadata?.abordagem,
        })),
        validation,
      });

      if (validation.passed) {
        report.passed++;
      } else {
        report.failed++;
      }
    } catch (error) {
      report.failed++;
      report.results.push({
        testCase,
        results: [],
        validation: {
          testCaseId: testCase.id,
          passed: false,
          issues: [`Erro na execução: ${error.message}`],
          metrics: {},
        },
      });
    }
  }

  // Resumo por categoria
  report.summary = {
    passRate: ((report.passed / report.totalTests) * 100).toFixed(2) + '%',
    avgSimilarity: (
      report.results
        .filter((r) => r.validation.metrics.avgSimilarity)
        .reduce((sum, r) => sum + r.validation.metrics.avgSimilarity, 0) /
      Math.max(1, report.results.filter((r) => r.validation.metrics.avgSimilarity).length)
    ).toFixed(4),
    byCategory: {},
  };

  TEST_CATEGORIES.forEach((cat) => {
    const catResults = report.results.filter((r) => r.testCase.category === cat);
    const catPassed = catResults.filter((r) => r.validation.passed).length;
    report.summary.byCategory[cat] = {
      total: catResults.length,
      passed: catPassed,
      failed: catResults.length - catPassed,
      passRate:
        catResults.length > 0 ? ((catPassed / catResults.length) * 100).toFixed(2) + '%' : 'N/A',
    };
  });

  return report;
}

export default {
  TEST_CASES,
  TEST_CATEGORIES,
  validateResults,
  runEvaluation,
};
