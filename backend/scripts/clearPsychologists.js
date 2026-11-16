#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clear() {
  try {
    // Delete in order due to foreign keys
    await prisma.horarioDisponivel.deleteMany({
      where: { psicologo: { usuario: { role: 'PSICOLOGO' } } },
    });
    await prisma.psicologo.deleteMany({
      where: { usuario: { role: 'PSICOLOGO' } },
    });
    await prisma.usuario.deleteMany({
      where: { role: 'PSICOLOGO' },
    });
    console.log('✅ Psicólogos e usuários PSICOLOGO removidos');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clear();
