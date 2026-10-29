import { z } from "zod";
import { isValidCEP } from "@/lib/cep";
import { isValidCNPJ } from "@/lib/cnpj";
import { isValidCPF } from "@/lib/cpf";
import { isValidEmail } from "@/lib/email";
import { SIGLAS_ESTADOS } from "@/lib/estados";
import { isValidCelular, isValidPhone } from "@/lib/phone";
import { USUARIO_EMAIL_MAX, USUARIO_NOME_MAX } from "./usuario";

export const conveniadaSchema = z.object({
  cnpj: z.string().trim().min(1, "Informe o CNPJ").refine(isValidCNPJ, "CNPJ inválido"),
  razaoSocial: z.string().trim().min(1, "Informe a razão social"),
  nomeFantasia: z.string().trim(),
  telefone: z.string().trim().min(1, "Informe o telefone").refine(isValidPhone, "Telefone inválido"),
  cep: z.string().trim().min(1, "Informe o CEP").refine(isValidCEP, "CEP inválido"),
  logradouro: z.string().trim().min(1, "Informe o logradouro"),
  numero: z.string().trim().min(1, "Informe o número"),
  bairro: z.string().trim().min(1, "Informe o bairro"),
  cidade: z.string().trim().min(1, "Informe a cidade"),
  estado: z
    .string()
    .min(1, "Selecione o estado")
    .refine((value) => SIGLAS_ESTADOS.includes(value), "Estado inválido"),
  usuarioNome: z
    .string()
    .trim()
    .min(1, "Informe o nome")
    .max(USUARIO_NOME_MAX, `Use no máximo ${USUARIO_NOME_MAX} caracteres`),
  usuarioCpf: z.string().trim().min(1, "Informe o CPF").refine(isValidCPF, "CPF inválido"),
  usuarioEmail: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .max(USUARIO_EMAIL_MAX, `Use no máximo ${USUARIO_EMAIL_MAX} caracteres`)
    .refine(isValidEmail, "E-mail inválido"),
  usuarioCelular: z
    .string()
    .trim()
    .min(1, "Informe o celular")
    .refine(isValidCelular, "Celular inválido. Use DDD + 9 dígitos"),
});

export type ConveniadaSchemaValues = z.infer<typeof conveniadaSchema>;
