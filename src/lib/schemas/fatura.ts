import { z } from "zod";
import { parseMaskedMoney } from "@/lib/money";
import { FORMA_PAGAMENTO_OPTIONS } from "@/types/caixa";

export const OBSERVACAO_FATURA_MAX = 500;

export const CONVENIADA_OBRIGATORIA = "Escolha a conveniada.";
export const VENCIMENTO_OBRIGATORIO = "Informe o vencimento.";
export const VENCIMENTO_PASSADO = "O vencimento não pode ser antes de hoje.";
export const OBSERVACAO_LONGA = `Máximo de ${OBSERVACAO_FATURA_MAX} caracteres.`;
export const FORMA_OBRIGATORIA = "Escolha a forma de pagamento.";
export const VALOR_PAGO_INVALIDO = "O valor pago precisa ser maior que zero.";
export const DATA_PAGAMENTO_FUTURA = "A data não pode ser depois de hoje.";

const FORMAS = new Set(FORMA_PAGAMENTO_OPTIONS.map((option) => String(option.value)));
const DATA = /^\d{4}-\d{2}-\d{2}$/;

function temAteDuasCasas(valor: number): boolean {
  return Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6;
}

export type FaturaSchemaOptions = {
  // Hoje no formato AAAA-MM-DD (fuso local): o vencimento não é anterior a ele e o pagamento não passa dele.
  hoje: string;
};

// A data limite depende do dia: por isso o schema é montado pelo modal.
export function createEmitirFaturaSchema({ hoje }: FaturaSchemaOptions) {
  return z.object({
    empresaConveniadaId: z.string().min(1, CONVENIADA_OBRIGATORIA),
    vencimento: z
      .string()
      .refine((data) => DATA.test(data), VENCIMENTO_OBRIGATORIO)
      // Datas AAAA-MM-DD se comparam como texto.
      .refine((data) => !DATA.test(data) || data >= hoje, VENCIMENTO_PASSADO),
    observacao: z.string().trim().max(OBSERVACAO_FATURA_MAX, OBSERVACAO_LONGA),
  });
}

export function createPagarFaturaSchema({ hoje }: FaturaSchemaOptions) {
  return z.object({
    formaPagamento: z.string().refine((forma) => FORMAS.has(forma), FORMA_OBRIGATORIA),
    // Vazio vale o valor total da fatura.
    valorPago: z.string().refine((texto) => {
      if (!texto.trim()) {
        return true;
      }
      const valor = parseMaskedMoney(texto);
      return !Number.isNaN(valor) && valor > 0 && temAteDuasCasas(valor);
    }, VALOR_PAGO_INVALIDO),
    // Vazia vale agora.
    dataPagamento: z.string().refine((data) => data === "" || (DATA.test(data) && data <= hoje), DATA_PAGAMENTO_FUTURA),
  });
}
