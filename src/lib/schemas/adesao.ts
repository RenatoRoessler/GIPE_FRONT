import { z } from "zod";
import { isValidCNPJ } from "@/lib/cnpj";
import { isValidCPF } from "@/lib/cpf";
import { isValidEmail } from "@/lib/email";
import { TipoEmpresa } from "@/types/adesao";

export const companySchema = z.object({
  cnpj: z
    .string()
    .trim()
    .min(1, "Informe o CNPJ")
    .refine(isValidCNPJ, "CNPJ inválido"),
  razaoSocial: z.string().trim().min(1, "Informe a razão social"),
  nomeFantasia: z.string().trim().min(1, "Informe o nome fantasia"),
  endereco: z.string().trim().min(1, "Informe o endereço"),
  telefone: z.string().trim().min(1, "Informe o telefone"),
  tipoEmpresa: z
    .union([z.literal(""), z.nativeEnum(TipoEmpresa)])
    .refine((value) => value !== "", { message: "Selecione o tipo de empresa" }),
});

export type CompanyValues = z.infer<typeof companySchema>;

export const adminUserSchema = z
  .object({
    nome: z.string().trim().min(1, "Informe o nome"),
    sobrenome: z.string().trim().min(1, "Informe o sobrenome"),
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
