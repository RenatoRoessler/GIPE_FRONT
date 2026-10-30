import { z } from "zod";
import { parseMoney } from "@/lib/money";
import { FORMA_PAGAMENTO, FORMA_PAGAMENTO_OPTIONS } from "@/types/caixa";
import { TIPO_LANCAMENTO } from "@/types/financeiro";

// [A CONFIRMAR] O contrato não informa os tamanhos máximos; limites de tela.
const DESCRICAO_MAX = 200;
const CATEGORIA_NOME_MAX = 100;

export const VALOR_LANCAMENTO_INVALIDO = "Informe um valor maior que zero, com até 2 casas decimais.";
export const DATA_FUTURA = "Só é possível lançar o que já foi pago.";
export const PELO_CAIXA_SO_DINHEIRO_HOJE = "Só para pagamentos em dinheiro, com a data de hoje.";

const FORMAS = new Set(FORMA_PAGAMENTO_OPTIONS.map((option) => String(option.value)));
const TIPOS = [String(TIPO_LANCAMENTO.Entrada), String(TIPO_LANCAMENTO.Saida)] as const;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

function temAteDuasCasas(valor: number): boolean {
  return Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6;
}

export type LancamentoSchemaOptions = {
  // Hoje no formato AAAA-MM-DD (fuso local): a data do pagamento não passa dele.
  hoje: string;
};

// A data máxima depende do dia: por isso o schema é montado pelo modal.
export function createLancamentoSchema({ hoje }: LancamentoSchemaOptions) {
  return z
    .object({
      tipo: z.enum(TIPOS),
      financeiroCategoriaId: z.string().min(1, "Selecione a categoria"),
      descricao: z.string().trim().min(1, "Informe a descrição").max(DESCRICAO_MAX, `Use no máximo ${DESCRICAO_MAX} caracteres`),
      valor: z.string().refine((texto) => {
        const valor = parseMoney(texto);
        return !Number.isNaN(valor) && valor > 0 && temAteDuasCasas(valor);
      }, VALOR_LANCAMENTO_INVALIDO),
      dataPagamento: z
        .string()
        .refine((data) => DATA.test(data), "Informe a data do pagamento")
        // Datas AAAA-MM-DD se comparam como texto.
        .refine((data) => !DATA.test(data) || data <= hoje, DATA_FUTURA),
      formaPagamento: z.string().refine((forma) => FORMAS.has(forma), "Escolha a forma de pagamento"),
      favorecido: z.string().trim(),
      documento: z.string().trim(),
      observacao: z.string().trim(),
      peloCaixa: z.boolean(),
    })
    .superRefine((valores, contexto) => {
      if (valores.peloCaixa && (valores.formaPagamento !== String(FORMA_PAGAMENTO.Dinheiro) || valores.dataPagamento !== hoje)) {
        contexto.addIssue({ code: "custom", path: ["peloCaixa"], message: PELO_CAIXA_SO_DINHEIRO_HOJE });
      }
    });
}

export const categoriaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome").max(CATEGORIA_NOME_MAX, `Use no máximo ${CATEGORIA_NOME_MAX} caracteres`),
  tipo: z.enum(TIPOS),
  financeiroCategoriaPaiId: z.string(),
  ativo: z.boolean(),
});
