/**
 * Script de Execução da Avaliação do Retriever RAG
 * Executa os 15 casos de teste e gera relatório detalhado
 *
 * Uso:
 *   node rag/evaluation/runEvaluation.js
 */

import 'dotenv/config';
import { initializeRAG } from '../index.js';
import { retrieve } from '../retriever.js';
import { runEvaluation, TEST_CASES } from './testCases.js';
import { logger } from '../../utils/logger.js';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       AVALIAÇÃO DO RETRIEVER RAG - MentiS                    ║');
  console.log('║       15 Casos de Teste com Filtros de Metadados             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Inicializar RAG
    console.log('🔄 Inicializando sistema RAG...');
    await initializeRAG();
    console.log('✅ RAG inicializado com sucesso\n');

    // 2. Verificar saúde
    const { healthCheck } = await import('../retriever.js');
    const health = await healthCheck();
    console.log(
      `🏥 Health Check: ${health.status} (VectorStore: ${health.vectorStoreReady ? 'Ready' : 'Not Ready'})\n`
    );

    if (!health.vectorStoreReady) {
      console.error('❌ VectorStore não está pronto. Execute a indexação primeiro.');
      process.exit(1);
    }

    // 3. Mostrar casos de teste
    console.log('📋 Casos de Teste:');
    TEST_CASES.forEach((tc, i) => {
      console.log(`  ${i + 1}. [${tc.category}] ${tc.query}`);
      if (Object.keys(tc.filters).length > 0) {
        console.log(`     Filtros: ${JSON.stringify(tc.filters)}`);
      }
    });
    console.log('');

    // 4. Executar avaliação
    console.log('🚀 Executando avaliação...\n');
    const report = await runEvaluation(retrieve);

    // 5. Exibir resultados
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    RESULTADOS DA AVALIAÇÃO                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Resumo Geral:`);
    console.log(`   Total de testes: ${report.totalTests}`);
    console.log(`   ✅ Aprovados: ${report.passed}`);
    console.log(`   ❌ Reprovados: ${report.failed}`);
    console.log(`   📈 Taxa de aprovação: ${report.summary.passRate}`);
    console.log(`   🎯 Similaridade média: ${report.summary.avgSimilarity}\n`);

    console.log('📂 Por Categoria:');
    Object.entries(report.summary.byCategory).forEach(([cat, stats]) => {
      const icon = stats.failed === 0 ? '✅' : '❌';
      console.log(`   ${icon} ${cat}: ${stats.passed}/${stats.total} (${stats.passRate})`);
    });
    console.log('');

    // Detalhes dos testes reprovados
    const failedTests = report.results.filter((r) => !r.validation.passed);
    if (failedTests.length > 0) {
      console.log('⚠️  Detalhes dos Testes Reprovados:');
      failedTests.forEach((r) => {
        console.log(`\n   ❌ ${r.testCase.id} - ${r.testCase.category}`);
        console.log(`      Query: "${r.testCase.query}"`);
        r.validation.issues.forEach((issue) => {
          console.log(`      → ${issue}`);
        });
        if (r.results.length > 0) {
          console.log(`      Resultados obtidos:`);
          r.results.forEach((res, idx) => {
            console.log(
              `         ${idx + 1}. ${res.nome} (ID: ${res.psicologoId}) - Score: ${res.similarityScore}`
            );
            console.log(
              `             Modalidade: ${res.modalidade} | Estado: ${res.estado} | Preço: R$ ${res.preco}`
            );
            console.log(`             Especialidades: ${res.especialidades?.join(', ') || 'N/A'}`);
            console.log(`             Abordagem: ${res.abordagem || 'N/A'}`);
          });
        } else {
          console.log(`      Nenhum resultado retornado`);
        }
      });
    }

    // Detalhes dos testes aprovados (resumo)
    const passedTests = report.results.filter((r) => r.validation.passed);
    if (passedTests.length > 0) {
      console.log('\n✅ Testes Aprovados (resumo):');
      passedTests.forEach((r) => {
        const topResult = r.results[0];
        if (topResult) {
          console.log(`   ✅ ${r.testCase.id} - ${r.testCase.category}: "${r.testCase.query}"`);
          console.log(`      Top-1: ${topResult.nome} (Score: ${topResult.similarityScore})`);
        }
      });
    }

    // 6. Salvar relatório JSON
    const fs = await import('fs');
    const path = await import('path');
    const reportPath = path.join(process.cwd(), 'rag-evaluation-report.json');
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Relatório completo salvo em: ${reportPath}`);

    // 7. Exit code baseado no resultado
    if (report.failed > 0) {
      console.log('\n⚠️  Avaliação concluída com falhas.');
      process.exit(1);
    } else {
      console.log('\n🎉 Todos os testes passaram!');
      process.exit(0);
    }
  } catch (error) {
    logger.error('Erro na avaliação', { error: error.message, stack: error.stack });
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
main();
