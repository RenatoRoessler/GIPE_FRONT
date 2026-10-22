import { z } from "zod";
import { isValidCPF } from "@/lib/cpf";
import { isValidEmail } from "@/lib/email";
import { isValidCelular } from "@/lib/phone";
import { PERFIS_ESTACIONAMENTO } from "@/types/usuario";

// [A CONFIRMAR] O contrato não informa o tamanho máximo do nome/e-mail; limites de tela, como em Mensalistas.
export const USUARIO_NOME_MAX = 150;
export const USUARIO_EMAIL_MAX = 150;

// Só os perfis que uma empresa de estacionamento pode atribuir.
const PERFIS = PERFIS_ESTACIONAMENTO.map(String);

export const cpfSchema = z.object({
  cpf: z.string().trim().min(1, "Informe o CPF").refine(isValidCPF, "CPF inválido"),
});

export const novoUsuarioSchema = z.object({
  cpf: z.string().trim().min(1, "Informe o CPF").refine(isValidCPF, "CPF inválido"),
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome")
    .max(USUARIO_NOME_MAX, `Use no máximo ${USUARIO_NOME_MAX} caracteres`),
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .max(USUARIO_EMAIL_MAX, `Use no máximo ${USUARIO_EMAIL_MAX} caracteres`)
    .refine((value) => value === "" || isValidEmail(value), "E-mail inválido"),
  celular: z
    .string()
    .trim()
    .min(1, "Informe o celular")
    .refine((value) => value === "" || isValidCelular(value), "Celular inválido. Use DDD + 9 dígitos"),
  perfil: z.string().refine((value) => PERFIS.includes(value), "Selecione o perfil"),
});

// Pessoa já cadastrada no GIPE: só o perfil é escolhido; o resto é da pessoa.
export const perfilSchema = z.object({
  perfil: z.string().refine((value) => PERFIS.includes(value), "Selecione o perfil"),
});

export type NovoUsuarioSchemaValues = z.infer<typeof novoUsuarioSchema>;
