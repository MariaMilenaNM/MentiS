import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting seed...');

  // Seed Psicólogos (migrated from old Profissional data)
  const psicologosData = [
    {
      email: 'dr@teste.com',
      senha: 'senha123',
      nome: 'Dr. Teste',
      crp: '12345',
      bio: 'Psicólogo clínico com experiência em terapia cognitivo-comportamental.',
      especialidades: JSON.stringify(['TCC', 'Ansiedade', 'Depressão']),
      abordagem: 'COGNITIVO_COMPORTAMENTAL',
      preco: 150.00,
      modalidade: 'PRESENCIAL',
      validado: true,
      fotoUrl: null,
    },
    {
      email: 'dr2@teste.com',
      senha: 'senha123',
      nome: 'Dr. Teste 2',
      crp: '54321',
      bio: 'Especialista em psicologia humanista e terapia de casal.',
      especialidades: JSON.stringify(['Humanista', 'Terapia de Casal', 'Autoestima']),
      abordagem: 'HUMANISTA',
      preco: 180.00,
      modalidade: 'PRESENCIAL',
      validado: true,
      fotoUrl: null,
    },
    {
      email: 'valid@test.com',
      senha: 'senha123',
      nome: 'Dr. Validação',
      crp: '99999',
      bio: 'Psicólogo com foco em terapia online e atendimento remoto.',
      especialidades: JSON.stringify(['Online', 'Estresse', 'Burnout']),
      abordagem: 'SISTEMICA',
      preco: 120.00,
      modalidade: 'ONLINE',
      validado: true,
      fotoUrl: null,
    },
    {
      email: 'drfinal@teste.com',
      senha: 'senha123',
      nome: 'Dr. Final',
      crp: '11111',
      bio: 'Atendimento híbrido (presencial e online) com abordagem integrativa.',
      especialidades: JSON.stringify(['Integrativa', 'Trauma', 'EMDR']),
      abordagem: 'OUTRA',
      preco: 200.00,
      modalidade: 'HIBRIDO',
      validado: true,
      fotoUrl: null,
    },
  ];

  for (const p of psicologosData) {
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
    await prisma.psicologo.upsert({
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

    console.log(`✅ Created psicólogo: ${p.nome} (CRP: ${p.crp})`);
  }

  // Add some sample horários for the psicólogos
  const psicologos = await prisma.psicologo.findMany();

  for (const psicologo of psicologos) {
    const horarios = [
      // Segunda-feira (1) - Manhã
      { psicologoId: psicologo.id, diaSemana: 1, horaInicio: '08:00', horaFim: '12:00' },
      // Terça-feira (2) - Tarde
      { psicologoId: psicologo.id, diaSemana: 2, horaInicio: '13:00', horaFim: '17:00' },
      // Quarta-feira (3) - Manhã
      { psicologoId: psicologo.id, diaSemana: 3, horaInicio: '08:00', horaFim: '12:00' },
      // Quinta-feira (4) - Tarde
      { psicologoId: psicologo.id, diaSemana: 4, horaInicio: '13:00', horaFim: '17:00' },
      // Sexta-feira (5) - Manhã
      { psicologoId: psicologo.id, diaSemana: 5, horaInicio: '08:00', horaFim: '12:00' },
    ];

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
    console.log(`✅ Created horários for psicólogo ID ${psicologo.id}`);
  }

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });