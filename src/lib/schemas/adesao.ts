import { z } from "zod";
import { isValidCEP } from "@/lib/cep";
import { isValidCNPJ } from "@/lib/cnpj";
import { isValidCPF } from "@/lib/cpf";
import { isValidEmail } from "@/lib/email";
import { SIGLAS_ESTADOS } from "@/lib/estados";
import { isValidCelular, isValidPhone } from "@/lib/phone";
import { TipoEmpresa } from "@/types/adesao";

function vagasSchema(requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine((value) => /^\d+$/.test(value), "Informe um número inteiro maior ou igual a zero");
}

export const companySchema = z.object({
  cnpj: z
    .string()
    .trim()
    .min(1, "Informe o CNPJ")
    .refine(isValidCNPJ, "CNPJ inválido"),
  razaoSocial: z.string().trim().min(1, "Informe a razão social"),
  nomeFantasia: z.string().trim().min(1, "Informe o nome fantasia"),
  tipoEmpresa: z
    .union([z.literal(""), z.nativeEnum(TipoEmpresa)])
    .refine((value) => value !== "", { message: "Selecione o tipo de empresa" }),
  telefone: z
    .string()
    .trim()
    .min(1, "Informe o telefone")
    .refine(isValidPhone, "Telefone inválido"),
  cep: z.string().trim().min(1, "Informe o CEP").refine(isValidCEP, "CEP inválido"),
  logradouro: z.string().trim().min(1, "Informe o logradouro"),
  numero: z.string().trim().min(1, "Informe o número"),
  bairro: z.string().trim().min(1, "Informe o bairro"),
  cidade: z.string().trim().min(1, "Informe a cidade"),
  estado: z
    .string()
    .min(1, "Selecione o estado")
    .refine((value) => SIGLAS_ESTADOS.includes(value), "Estado inválido"),
  quantidadeVagasMoto: vagasSchema("Informe as vagas de moto"),
  quantidadeVagasCarro: vagasSchema("Informe as vagas de carro"),
});

export type CompanyValues = z.infer<typeof companySchema>;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const dayHoursSchema = z.object({
  aberto: z.boolean(),
  aberto24Horas: z.boolean(),
  horarioAbertura: z.string(),
  horarioFechamento: z.string(),
});

export const businessHoursSchema = z
  .object({
    horarios: z.array(dayHoursSchema).length(7),
  })
  .superRefine((data, ctx) => {
    data.horarios.forEach((day, index) => {
      if (!day.aberto || day.aberto24Horas) {
        return;
      }

      const hasOpening = TIME_PATTERN.test(day.horarioAbertura);
      const hasClosing = TIME_PATTERN.test(day.horarioFechamento);

      if (!hasOpening) {
        ctx.addIssue({
          code: "custom",
          path: ["horarios", index, "horarioAbertura"],
          message: "Informe a abertura",
        });
      }
      if (!hasClosing) {
        ctx.addIssue({
          code: "custom",
          path: ["horarios", index, "horarioFechamento"],
          message: "Informe o fechamento",
        });
      }
      if (
        hasOpening &&
        hasClosing &&
        toMinutes(day.horarioFechamento) <= toMinutes(day.horarioAbertura)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["horarios", index, "horarioFechamento"],
          message: "O fechamento deve ser depois da abertura",
        });
      }
    });
  });

export type BusinessHoursValues = z.infer<typeof businessHoursSchema>;

export const adminUserSchema = z
  .object({
    nome: z.string().trim().min(1, "Informe o nome completo"),
    email: z
      .string()
      .trim()
      .min(1, "Informe o e-mail")
      .refine(isValidEmail, "E-mail inválido"),
    cpf: z
      .string()
      .trim()
      .min(1, "Informe o CPF")
      .refine(isValidCPF, "CPF inválido"),
    celular: z
      .string()
      .trim()
      .min(1, "Informe o celular")
      .refine(isValidCelular, "Celular inválido"),
    senha: z
      .string()
      .min(1, "Informe a senha")
      .min(6, "A senha precisa ter ao menos 6 caracteres"),
    repetirSenha: z.string().min(1, "Confirme a senha"),
  })
  .superRefine((data, ctx) => {
    if (data.repetirSenha && data.repetirSenha !== data.senha) {
      ctx.addIssue({
        code: "custom",
        path: ["repetirSenha"],
        message: "As senhas não coincidem",
      });
    }
  });

export type AdminUserValues = z.infer<typeof adminUserSchema>;
