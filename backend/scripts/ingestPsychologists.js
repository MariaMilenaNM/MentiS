#!/usr/bin/env node
/**
 * Script CLI para ingestão inicial de psicólogos validados no Vector Store.
 * Uso: npm run rag:ingest
 *      node scripts/ingestPsychologists.js [--clear] [--batch-size=10]
 */

import 'dotenv/config';
import { indexValidatedPsychologists } from '../rag/indexer.js';
import { logger } from '../utils/logger.js';

// Parse argumentos CLI
const args = process.argv.slice(2);
const options = {
  clearFirst: args.includes('--clear') || args.includes('-c'),
  batchSize: 10,
};

for (const arg of args) {
  if (arg.startsWith('--batch-size=') || arg.startsWith('-b=')) {
    options.batchSize = parseInt(arg.split('=')[1], 10);
  }
}

async function main() {
  console.log('🚀 Iniciando ingestão de psicólogos validados no RAG...\n');
  console.log('Opções:', JSON.stringify(options, null, 2));

  try {
    const result = await indexValidatedPsychologists(options);

    console.log('\n✅ Ingestão concluída!');
    console.log('────────────────────────────────────');
    console.log(`Indexados:     ${result.indexed}`);
    console.log(`Pulados:       ${result.skipped}`);
    console.log(`Erros:         ${result.errors}`);
    console.log(`Total no DB:   ${result.totalInDb}`);
    console.log(`No Vector Store: ${result.vectorStoreCount}`);
    console.log(`Duração:       ${(result.durationMs / 1000).toFixed(2)}s`);
    console.log('────────────────────────────────────');

    if (!result.success) {
      console.log('⚠️  Ingestão concluída com erros');
      process.exit(1);
    }

    console.log('🎉 Todos os psicólogos validados foram indexados com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro fatal na ingestão:', error.message);
    logger.error('Erro fatal no script de ingestão', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

main();