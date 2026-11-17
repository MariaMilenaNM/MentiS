#!/usr/bin/env node
/**
 * Script para popular o banco com 25 psicólogos de teste para desenvolvimento/RAG.
 * Usa dados compartilhados de scripts/seedData.js (mesmo do prisma/seed.js).
 * Uso: node scripts/seedPsychologists.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { psicologosData } from './seedData.js';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Converter dados compartilhados para formato do script (usuario + psicologo + horarios)
const testPsychologists = psicologosData.map((p) => ({
  usuario: {
    email: p.email,
    senha: p.senha,
    role: 'PSICOLOGO',
  },
  psicologo: {
    crp: p.crp,
    nome: p.nome,
    telefone: p.telefone,
    contato: p.contato,
    link: p.link,
    bio: p.bio,
    especialidades: p.especialidades,
    abordagem: p.abordagem,
    preco: p.preco,
    modalidade: p.modalidade,
    validado: p.validado,
    fotoUrl: p.fotoUrl,
    cidade: p.cidade,
    estado: p.estado,
  },
  horarios: p.horarios || [],
}));

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function seed() {
  console.log('🌱 Iniciando seed de 25 psicólogos de teste (dados compartilhados)...\n');

  try {
    let created = 0;
    let skipped = 0;

    for (const testData of testPsychologists) {
      const { usuario, psicologo, horarios } = testData;

      // Verifica se o usuário já existe
      const existingUser = await prisma.usuario.findUnique({
        where: { email: usuario.email },
      });

      if (existingUser) {
        console.log(`⏭️  Usuário já existe: ${usuario.email}`);
        skipped++;
        continue;
      }

      // Verifica se o CRP já existe
      const existingCRP = await prisma.psicologo.findUnique({
        where: { crp: psicologo.crp },
      });

      if (existingCRP) {
        console.log(`⏭️  CRP já existe: ${psicologo.crp}`);
        skipped++;
        continue;
      }

      // Cria o usuário
      const hashedSenha = await hashPassword(usuario.senha);
      const newUser = await prisma.usuario.create({
        data: {
          email: usuario.email,
          senha: hashedSenha,
          role: usuario.role,
        },
      });

      // Cria o psicólogo
      const newPsicologo = await prisma.psicologo.create({
        data: {
          ...psicologo,
          usuarioId: newUser.id,
        },
      });

      // Cria os horários
      if (horarios && horarios.length > 0) {
        await prisma.horarioDisponivel.createMany({
          data: horarios.map((h) => ({
            ...h,
            psicologoId: newPsicologo.id,
          })),
        });
      }

      console.log(
        `✅ [${created + 1}/25] Criado: ${psicologo.nome} (${psicologo.crp}) | ${psicologo.abordagem} | ${psicologo.modalidade} | R$ ${psicologo.preco.toFixed(2)}/sessão`
      );
      created++;
    }

    console.log('\n📊 Resumo:');
    console.log(`   Criados: ${created}`);
    console.log(`   Pulados (já existiam): ${skipped}`);
    console.log(`   Total: ${testPsychologists.length}`);

    if (created > 0) {
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

      console.log('\n📈 Estatísticas:');
      console.log(`   Total psicólogos: ${total}`);
      console.log(
        `   Preço: Mín R$ ${precoStats._min.preco?.toFixed(2)} | Máx R$ ${precoStats._max.preco?.toFixed(2)} | Méd R$ ${precoStats._avg.preco?.toFixed(2)}`
      );
      console.log('   Por abordagem:');
      porAbordagem.forEach((a) => console.log(`     ${a.abordagem}: ${a._count}`));
      console.log('   Por modalidade:');
      porModalidade.forEach((m) => console.log(`     ${m.modalidade}: ${m._count}`));

      console.log('\n🎉 Seed concluído com sucesso!');
      console.log('💡 Agora rode: npm run rag:ingest  (para indexar no RAG)');
      console.log('💡 E depois:  npm run rag:evaluate (para testar a busca)');
    } else {
      console.log('\nℹ️  Nenhum novo psicólogo criado (todos já existiam).');
    }
  } catch (error) {
    console.error('\n❌ Erro no seed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
