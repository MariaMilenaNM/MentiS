#!/usr/bin/env node
/**
 * Script CLI para reindexação completa de todos os psicólogos validados.
 * Uso: npm run rag:reindex
 *      node scripts/reindexPsychologists.js
 */

import 'dotenv/config';
import { reindexAllPsychologists } from '../rag/indexer.js';
import { logger } from '../utils/logger.js';

async function main() {
  console.log('🔄 Iniciando reindexação completa de psicólogos validados...\n');
  console.log('⚠️  Isso vai LIMPAR o vector store e reindexar tudo do zero.');

  try {
    const result = await reindexAllPsychologists();

    console.log('\n✅ Reindexação concluída!');
    console.log('────────────────────────────────────');
    console.log(`Indexados:     ${result.indexed}`);
    console.log(`Pulados:       ${result.skipped}`);
    console.log(`Erros:         ${result.errors}`);
    console.log(`Total no DB:   ${result.totalInDb}`);
    console.log(`No Vector Store: ${result.vectorStoreCount}`);
    console.log(`Duração:       ${(result.durationMs / 1000).toFixed(2)}s`);
    console.log('────────────────────────────────────');

    if (!result.success) {
      console.log('⚠️  Reindexação concluída com erros');
      process.exit(1);
    }

    console.log('🎉 Reindexação completa realizada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro fatal na reindexação:', error.message);
    logger.error('Erro fatal no script de reindexação', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

main();