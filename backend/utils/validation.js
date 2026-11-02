import { z } from 'zod';

// ============================================
// PACIENTE SCHEMAS
// ============================================

export const pacienteCadastroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  dataNasc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido').max(15),
  cidade: z.string().min(2, 'Cidade inválida').max(100),
  estado: z.string().length(2, 'Estado deve ter 2 letras (ex: SP)'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
  aceiteLGPD: z
    .boolean()
    .default(false)
    .refine((val) => val === true, {
      message: 'É necessário aceitar os termos da LGPD',
    }),
});

export const pacienteLoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

export const pacienteAtualizacaoSchema = z
  .object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100).optional(),
    telefone: z.string().min(10, 'Telefone inválido').max(15).optional(),
    cidade: z.string().min(2, 'Cidade inválida').max(100).optional(),
    estado: z.string().length(2, 'Estado deve ter 2 letras (ex: SP)').optional(),
    email: z.string().email('E-mail inválido').optional(),
    senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser fornecido para atualização',
  });

// ============================================
// PSICOLOGO SCHEMAS
// ============================================

export const psicologoCadastroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  crp: z.string().min(4, 'CRP inválido').max(20),
  bio: z.string().max(2000).optional(),
  especialidades: z.array(z.string()).min(1, 'Pelo menos uma especialidade é obrigatória'),
  abordagem: z
    .enum(
      [
        'PSICANALITICA',
        'COGNITIVO_COMPORTAMENTAL',
        'HUMANISTA',
        'SISTEMICA',
        'GESTALT',
        'JUNGUIANA',
        'OUTRA',
      ],
      { errorMap: () => ({ message: 'Abordagem inválida' }) }
    )
    .default('OUTRA'),
  preco: z.number().positive('Preço deve ser positivo'),
  modalidade: z
    .enum(['ONLINE', 'PRESENCIAL', 'HIBRIDO'], {
      errorMap: () => ({ message: 'Modalidade deve ser: ONLINE, PRESENCIAL ou HIBRIDO' }),
    })
    .default('ONLINE'),
  fotoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

export const psicologoAtualizacaoSchema = z
  .object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100).optional(),
    crp: z.string().min(4, 'CRP inválido').max(20).optional(),
    bio: z.string().max(2000).optional(),
    especialidades: z.array(z.string()).optional(),
    abordagem: z
      .enum([
        'PSICANALITICA',
        'COGNITIVO_COMPORTAMENTAL',
        'HUMANISTA',
        'SISTEMICA',
        'GESTALT',
        'JUNGUIANA',
        'OUTRA',
      ])
      .optional(),
    preco: z.number().positive('Preço deve ser positivo').optional(),
    modalidade: z.enum(['ONLINE', 'PRESENCIAL', 'HIBRIDO']).optional(),
    validado: z.boolean().optional(),
    fotoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser fornecido para atualização',
  });

// ============================================
// HORARIO SCHEMAS
// ============================================

export const horarioCadastroSchema = z
  .object({
    psicologoId: z.number().int().positive('ID do psicólogo inválido'),
    diaSemana: z
      .number()
      .int()
      .min(0, 'Dia da semana inválido (0-6)')
      .max(6, 'Dia da semana inválido (0-6)'),
    horaInicio: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora início deve estar no formato HH:mm'),
    horaFim: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora fim deve estar no formato HH:mm'),
  })
  .refine((data) => data.horaInicio < data.horaFim, {
    message: 'Hora início deve ser anterior à hora fim',
    path: ['horaFim'],
  });

export const horarioAtualizacaoSchema = z
  .object({
    diaSemana: z
      .number()
      .int()
      .min(0, 'Dia da semana inválido (0-6)')
      .max(6, 'Dia da semana inválido (0-6)')
      .optional(),
    horaInicio: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora início deve estar no formato HH:mm')
      .optional(),
    horaFim: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora fim deve estar no formato HH:mm')
      .optional(),
    ativo: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.horaInicio && data.horaFim) {
        return data.horaInicio < data.horaFim;
      }
      return true;
    },
    {
      message: 'Hora início deve ser anterior à hora fim',
      path: ['horaFim'],
    }
  );

// ============================================
// AGENDAMENTO SCHEMAS
// ============================================

export const agendamentoCadastroSchema = z.object({
  pacienteId: z.number().int().positive('ID do paciente inválido').optional(),
  psicologoId: z.number().int().positive('ID do psicólogo inválido'),
  horarioId: z.number().int().positive('ID do horário inválido').optional(),
  dataHora: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
  duracaoMin: z.number().int().positive().default(50),
  observacoes: z.string().max(500).optional(),
});

export const agendamentoAtualizacaoSchema = z
  .object({
    dataHora: z
      .string()
      .datetime({ offset: true })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))
      .optional(),
    duracaoMin: z.number().int().positive().optional(),
    status: z
      .enum([
        'AGENDADO',
        'CONFIRMADO',
        'CANCELADO_PACIENTE',
        'CANCELADO_PSICOLOGO',
        'REALIZADO',
        'FALTOU',
      ])
      .optional(),
    observacoes: z.string().max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser fornecido para atualização',
  });

// ============================================
// CONVERSA SCHEMAS
// ============================================

export const conversaCadastroSchema = z.object({
  pacienteId: z.number().int().positive('ID do paciente inválido'),
  psicologoId: z.number().int().positive('ID do psicólogo inválido'),
});

export const mensagemCadastroSchema = z.object({
  conversaId: z.number().int().positive('ID da conversa inválido').optional(),
  remetenteId: z.number().int().positive('ID do remetente inválido').optional(),
  conteudo: z.string().min(1, 'Conteúdo da mensagem é obrigatório').max(5000),
});

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = (error.issues || []).map((e) => ({
          campo: e.path.join('.'),
          mensagem: e.message,
        }));
        return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors });
      }
      return res.status(400).json({ erro: 'Erro de validação' });
    }
  };
}
