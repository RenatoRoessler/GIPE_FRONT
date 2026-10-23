import { z } from "zod";
import { formatMoeda } from "@/components/caixa/format";
import { parseMoney } from "@/lib/money";
import type { Conferencia, TurnoFormaPagamento } from "@/types/caixa";

const INVALID_MONEY = "Informe um valor válido, ex.: 15,00";

function moneyField(requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine((value) => !Number.isNaN(parseMoney(value)), INVALID_MONEY);
}

// Campo vazio é aceito (conta como zero na conferência).
const optionalMoneyField = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(parseMoney(value)), INVALID_MONEY);

// Fundo na gaveta: vazio vale "não informado"; preenchido, não pode ser negativo (o parser já recusa o sinal).
const optionalFundoField = optionalMoneyField;

export const fundoCaixaSchema = z.object({
  fundoCaixa: moneyField("Informe o fundo de caixa"),
});

// O limite é conveniência de tela; a regra autoritativa é a do backend.
export function createSangriaSchema(disponivel: number | null) {
  return z.object({
    valor: moneyField("Informe o valor da retirada").refine(
      (value) => parseMoney(value) > 0,
      "O valor deve ser maior que zero",
    ).refine(
      (value) => disponivel === null || parseMoney(value) <= disponivel,
      `O valor passa do que pode ser retirado (${formatMoeda(disponivel ?? 0)}). O fundo de caixa fica na gaveta.`,
    ),
    observacao: z.string().trim().min(1, "Informe o motivo da retirada"),
  });
}

export const conferenciaSchema = z.object({
  conferencias: z.array(optionalMoneyField),
  // Passagem: fundo do novo turno. Fechamento: fundo contado na gaveta.
  fundoCaixa: optionalFundoField,
  observacao: z.string().trim(),
});

// Período do histórico de caixas (yyyy-MM-dd); as duas datas são opcionais.
export const periodoSchema = z
  .object({ dataInicio: z.string().trim(), dataFim: z.string().trim() })
  .refine((value) => value.dataInicio === "" || value.dataFim === "" || value.dataInicio <= value.dataFim, {
    path: ["dataInicio"],
    message: "A data inicial não pode ser depois da final",
  });

export type ConferenciaFormValues = z.infer<typeof conferenciaSchema>;

export function toConferencias(formas: TurnoFormaPagamento[], valores: string[]): Conferencia[] {
  return formas.map((forma, index) => {
    const parsed = parseMoney(valores[index] ?? "");
    return { formaPagamento: forma.formaPagamento, valorInformado: Number.isNaN(parsed) ? 0 : parsed };
  });
}
