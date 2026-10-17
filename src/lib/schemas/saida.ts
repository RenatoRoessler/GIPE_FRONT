import { z } from "zod";
import { parseMoney } from "@/lib/money";
import { isValidPlaca, normalizePlaca, PLACA_INVALIDA_MESSAGE } from "@/lib/placa";
import type { SaidaBusca } from "@/types/saida";

const INTEGER = /^\d+$/;
const NENHUM_CAMPO = "Informe a placa, o ticket ou o sequencial";

export const saidaBuscaSchema = z
  .object({
    placa: z.string().trim(),
    codigoTicket: z.string().trim(),
    sequencial: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    const preenchidos = [values.placa, values.codigoTicket, values.sequencial].filter((value) => value !== "");
    if (preenchidos.length !== 1) {
      ctx.addIssue({ code: "custom", path: ["placa"], message: NENHUM_CAMPO });
      return;
    }
    if (values.placa !== "" && !isValidPlaca(values.placa)) {
      ctx.addIssue({ code: "custom", path: ["placa"], message: PLACA_INVALIDA_MESSAGE });
    }
    if (values.sequencial !== "" && !INTEGER.test(values.sequencial)) {
      ctx.addIssue({ code: "custom", path: ["sequencial"], message: "Use apenas números" });
    }
  });

export type SaidaBuscaValues = z.infer<typeof saidaBuscaSchema>;

// Só chamar com valores já validados por `saidaBuscaSchema`.
export function toSaidaBusca(values: SaidaBuscaValues): SaidaBusca {
  if (values.placa !== "") {
    return { tipo: "placa", valor: normalizePlaca(values.placa) };
  }
  if (values.codigoTicket !== "") {
    return { tipo: "codigoTicket", valor: values.codigoTicket };
  }
  return { tipo: "sequencial", valor: String(Number(values.sequencial)) };
}

// Valor recebido em dinheiro: obrigatório e não pode ser menor que o valor a cobrar.
export function createRecebidoSchema(valor: number) {
  return z
    .string()
    .trim()
    .min(1, "Informe o valor recebido")
    .refine((value) => !Number.isNaN(parseMoney(value)), "Informe um valor válido, ex.: 20,00")
    .refine((value) => Math.round(parseMoney(value) * 100) >= Math.round(valor * 100), "Valor menor que o valor a cobrar");
}
