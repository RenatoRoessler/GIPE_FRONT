import { z } from "zod";
import { isValidDocumento } from "@/lib/documento";
import { isValidEmail } from "@/lib/email";
import { parseMoney } from "@/lib/money";
import { isValidCelular } from "@/lib/phone";
import { TIPO_CATEGORIA_OPTIONS } from "@/types/preco";
import { TIPO_PESSOA, type TipoPessoa } from "@/types/mensalista";

const CATEGORIAS = TIPO_CATEGORIA_OPTIONS.map((option) => String(option.value));
const HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

// [A CONFIRMAR] O contrato não informa o tamanho máximo do nome/e-mail; limites de tela.
const NOME_MAX = 150;
const EMAIL_MAX = 150;
const TIPO_NOME_MAX = 100;

export const mensalistaSchema = z
  .object({
    mensalistaTipoId: z.string().min(1, "Selecione o tipo de mensalidade"),
    tipoPessoa: z.enum([String(TIPO_PESSOA.Fisica), String(TIPO_PESSOA.Juridica)]),
    documento: z.string().trim().min(1, "Informe o documento"),
    nome: z.string().trim().min(1, "Informe o nome").max(NOME_MAX, `Use no máximo ${NOME_MAX} caracteres`),
    email: z
      .string()
      .trim()
      .min(1, "Informe o e-mail")
      .max(EMAIL_MAX, `Use no máximo ${EMAIL_MAX} caracteres`)
      .refine(isValidEmail, "E-mail inválido"),
    celular: z
      .string()
      .trim()
      .min(1, "Informe o celular")
      .refine(isValidCelular, "Celular inválido. Use DDD + 9 dígitos"),
    diaVencimento: z
      .string()
      .trim()
      .min(1, "Informe o dia de vencimento")
      .refine((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 31, "Informe um dia de 1 a 31"),
    ativo: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.documento.trim() === "") {
      return;
    }
    const pessoa = Number(values.tipoPessoa) as TipoPessoa;
    if (!isValidDocumento(values.documento, pessoa)) {
      ctx.addIssue({
        code: "custom",
        path: ["documento"],
        message: pessoa === TIPO_PESSOA.Fisica ? "CPF inválido" : "CNPJ inválido",
      });
    }
  });

export const tipoSchema = z
  .object({
    tipoMensal: z
      .string()
      .trim()
      .min(1, "Informe o nome do tipo")
      .max(TIPO_NOME_MAX, `Use no máximo ${TIPO_NOME_MAX} caracteres`),
    categoria: z.string().refine((value) => CATEGORIAS.includes(value), "Selecione a categoria"),
    valorMensalidade: z
      .string()
      .trim()
      .min(1, "Informe o valor da mensalidade")
      .refine((value) => !Number.isNaN(parseMoney(value)), "Informe um valor válido, ex.: 280,00")
      .refine((value) => Number.isNaN(parseMoney(value)) || parseMoney(value) > 0, "O valor deve ser maior que zero"),
    horarioEntrada: z.string().trim().refine((value) => value === "" || HORARIO.test(value), "Horário inválido"),
    horarioSaida: z.string().trim().refine((value) => value === "" || HORARIO.test(value), "Horário inválido"),
    ativo: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const entrada = values.horarioEntrada.trim();
    const saida = values.horarioSaida.trim();
    // Saída menor que a entrada é permitido (turno que vira a noite); só exige os dois juntos.
    if (entrada !== "" && saida === "") {
      ctx.addIssue({ code: "custom", path: ["horarioSaida"], message: "Informe o horário de saída" });
    }
    if (saida !== "" && entrada === "") {
      ctx.addIssue({ code: "custom", path: ["horarioEntrada"], message: "Informe o horário de entrada" });
    }
  });
