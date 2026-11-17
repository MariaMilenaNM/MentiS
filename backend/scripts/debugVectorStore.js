#!/usr/bin/env node
import 'dotenv/config';
import { initializeVectorStore, getVectorStore, getStats } from '../rag/vectorStore.js';

async function debug() {
  console.log('🔍 Debugando VectorStore...\n');

  await initializeVectorStore();
  const store = getVectorStore();
  const stats = getStats();

  console.log('Stats:', stats);

  if (!store) {
    console.log('Store não inicializado');
    return;
  }

  // Acessar documentos do docstore
  const docstore = store.docstore;
  let docsMap = null;

  if (docstore) {
    if (docstore._docs && typeof docstore._docs.size === 'number') {
      docsMap = docstore._docs;
    } else if (typeof docstore.size === 'number') {
      docsMap = docstore;
    }
  }

  if (docsMap) {
    console.log(`\nTotal documentos no Map: ${docsMap.size}`);
    let count = 0;
    for (const [key, doc] of docsMap) {
      count++;
      console.log(`\n--- Documento ${count} (key: ${key}) ---`);
      console.log('pageContent:', doc.pageContent?.substring(0, 200) + '...');
      console.log('metadata:', JSON.stringify(doc.metadata, null, 2));
      if (count >= 3) break; // Só mostrar primeiros 3
    }
  }
}

debug().catch(console.error);
