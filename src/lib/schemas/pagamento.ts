import { z } from "zod";
import { parseMoney } from "@/lib/money";
import { FORMA_PAGAMENTO_OPTIONS } from "@/types/caixa";

export const VALOR_PAGO_INVALIDO = "Informe um valor maior que zero, com até 2 casas decimais.";
export const FORMA_PAGAMENTO_OBRIGATORIA = "Escolha a forma de pagamento.";

const FORMAS = new Set(FORMA_PAGAMENTO_OPTIONS.map((option) => String(option.value)));

// Até 2 casas: a diferença para o valor arredondado a centavos tem de ser desprezível.
function temAteDuasCasas(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
}

export const pagamentoSchema = z.object({
  valorPago: z.string().refine((text) => {
    const value = parseMoney(text);
    return !Number.isNaN(value) && value > 0 && temAteDuasCasas(value);
  }, VALOR_PAGO_INVALIDO),
  formaPagamento: z.string().refine((value) => FORMAS.has(value), FORMA_PAGAMENTO_OBRIGATORIA),
});
