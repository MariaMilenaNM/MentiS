#!/usr/bin/env node
import 'dotenv/config';
import { initializeVectorStore, similaritySearch } from '../rag/vectorStore.js';

async function debug() {
  console.log('🔍 Debugando busca com filtros...\n');

  await initializeVectorStore();

  // Teste 1: busca sem filtro
  console.log('--- Teste 1: busca sem filtro ---');
  const results1 = await similaritySearch('psicólogo', 10, {});
  console.log(`Resultados: ${results1.length}`);
  results1.forEach((r, i) => {
    console.log(
      `  ${i + 1}. Score: ${r.score}, validado: ${r.metadata.validado}, modalidade: ${r.metadata.modalidade}`
    );
  });

  // Teste 2: busca com filtro validado
  console.log('\n--- Teste 2: filtro validado=true ---');
  const results2 = await similaritySearch('psicólogo', 10, { validado: true });
  console.log(`Resultados: ${results2.length}`);
  results2.forEach((r, i) => {
    console.log(`  ${i + 1}. Score: ${r.score}, validado: ${r.metadata.validado}`);
  });

  // Teste 3: busca com filtro modalidade ONLINE
  console.log('\n--- Teste 3: filtro modalidade=ONLINE ---');
  const results3 = await similaritySearch('psicólogo', 10, {
    modalidade: 'ONLINE',
    validado: true,
  });
  console.log(`Resultados: ${results3.length}`);
  results3.forEach((r, i) => {
    console.log(
      `  ${i + 1}. Score: ${r.score}, validado: ${r.metadata.validado}, modalidade: ${r.metadata.modalidade}`
    );
  });

  // Teste 4: busca com filtro precoMax
  console.log('\n--- Teste 4: filtro precoMax=150 ---');
  const results4 = await similaritySearch('psicólogo', 10, { precoMax: 150, validado: true });
  console.log(`Resultados: ${results4.length}`);
  results4.forEach((r, i) => {
    console.log(
      `  ${i + 1}. Score: ${r.score}, validado: ${r.metadata.validado}, preco: ${r.metadata.preco}`
    );
  });

  // Teste 5: busca com filtro estado SP
  console.log('\n--- Teste 5: filtro estado=SP ---');
  const results5 = await similaritySearch('psicólogo', 10, { estado: 'SP', validado: true });
  console.log(`Resultados: ${results5.length}`);
  results5.forEach((r, i) => {
    console.log(
      `  ${i + 1}. Score: ${r.score}, validado: ${r.metadata.validado}, estado: ${r.metadata.estado}`
    );
  });
}

debug().catch(console.error);
