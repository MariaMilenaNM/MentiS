import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { psicologosData } from '../scripts/seedData.js';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting seed with 25 psicólogos (shared data)...');

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
    });

    // Create Horários variados
    const horarios = p.horarios || [];
    for (const h of horarios) {
      await prisma.horarioDisponivel.upsert({
        where: {
          psicologoId_diaSemana_horaInicio_horaFim: {
            psicologoId: h.psicologoId || psicologo.id,
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFim: h.horaFim,
          },
        },
        update: {},
        create: {
          psicologoId: psicologo.id,
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFim: h.horaFim,
        },
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
