import { z } from "zod";

export const pacienteCadastroSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(10, "Telefone inválido").max(15),
  cidade: z.string().min(2, "Cidade inválida").max(100),
  estado: z.string().length(2, "Estado deve ter 2 letras (ex: SP)"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100)
});

export const pacienteLoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória")
});

export const pacienteAtualizacaoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100).optional(),
  telefone: z.string().min(10, "Telefone inválido").max(15).optional(),
  cidade: z.string().min(2, "Cidade inválida").max(100).optional(),
  estado: z.string().length(2, "Estado deve ter 2 letras (ex: SP)").optional(),
  email: z.string().email("E-mail inválido").optional(),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Pelo menos um campo deve ser fornecido para atualização"
});

export const profissionalSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  crp: z.number().int().positive("CRP deve ser um número positivo"),
  modalidade: z.enum(["Presencial", "Remota", "Presencial e Remota"], {
    errorMap: () => ({ message: "Modalidade deve ser: Presencial, Remota ou Presencial e Remota" })
  }),
  // URL válida OU string vazia OU undefined (opcional)
  link: z.union([z.string().url("Link deve ser uma URL válida"), z.literal("")]).optional(),
  numero: z.string().min(10, "Número inválido").max(15),
  contato: z.string().email("E-mail de contato inválido")
});

export const profissionalAtualizacaoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100).optional(),
  crp: z.number().int().positive("CRP deve ser um número positivo").optional(),
  modalidade: z.enum(["Presencial", "Remota", "Presencial e Remota"]).optional(),
  // URL válida OU string vazia OU undefined (opcional)
  link: z.union([z.string().url("Link deve ser uma URL válida"), z.literal("")]).optional(),
  numero: z.string().min(10, "Número inválido").max(15).optional(),
  contato: z.string().email("E-mail de contato inválido").optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Pelo menos um campo deve ser fornecido para atualização"
});

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = (error.issues || []).map(e => ({
          campo: e.path.join("."),
          mensagem: e.message
        }));
        return res.status(400).json({ erro: "Dados inválidos", detalhes: errors });
      }
      return res.status(400).json({ erro: "Erro de validação" });
    }
  };
}