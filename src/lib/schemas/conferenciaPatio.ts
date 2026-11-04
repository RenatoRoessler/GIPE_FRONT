import { z } from "zod";
import { isValidPlaca, PLACA_INVALIDA_MESSAGE } from "@/lib/placa";
import { CATEGORIA_VEICULO_OPTIONS, CORES_VEICULO, type CorVeiculo } from "@/types/veiculo";
import { MOTIVO_SAIDA, type MotivoSaida } from "@/types/conferenciaPatio";

const INTEGER = /^\d+$/;
const CATEGORIAS = CATEGORIA_VEICULO_OPTIONS.map((option) => String(option.value));
const CORES = CORES_VEICULO.map((cor) => cor.value) as [CorVeiculo, ...CorVeiculo[]];

const MOTIVOS = Object.values(MOTIVO_SAIDA).map(String);

export const DESCRICAO_SAIDA_MAX = 300;
export const OBSERVACAO_MAX = 500;
export const MODELO_MAX = 80;

// Placa digitada à mão na conferência.
export const placaDigitadaSchema = z.object({
  placa: z.string().trim().refine(isValidPlaca, PLACA_INVALIDA_MESSAGE),
});

export type PlacaDigitadaValues = z.infer<typeof placaDigitadaSchema>;

// Dar saída num veículo que não está no pátio: o motivo é sempre exigido; "Outro" pede a descrição.
export const saidaConferenciaSchema = z
  .object({
    motivo: z.string().refine((valor) => MOTIVOS.includes(valor), "Selecione o motivo"),
    descricao: z.string().trim().max(DESCRICAO_SAIDA_MAX, `Use no máximo ${DESCRICAO_SAIDA_MAX} caracteres`),
  })
  .superRefine((values, ctx) => {
    if (values.motivo === String(MOTIVO_SAIDA.Outro) && values.descricao === "") {
      ctx.addIssue({ code: "custom", path: ["descricao"], message: "Descreva o motivo" });
    }
  });

export type SaidaConferenciaValues = z.infer<typeof saidaConferenciaSchema>;

export function toMotivoSaida(values: SaidaConferenciaValues): { motivo: MotivoSaida; descricao?: string } {
  const motivo = Number(values.motivo) as MotivoSaida;
  // A descrição só segue quando é o motivo "Outro": nos demais, o back a ignora.
  return motivo === MOTIVO_SAIDA.Outro ? { motivo, descricao: values.descricao } : { motivo };
}

// Entrada de uma placa lida sem ticket aberto.
export const entradaConferenciaSchema = z.object({
  categoria: z.string().refine((valor) => CATEGORIAS.includes(valor), "Selecione a categoria"),
  modelo: z.string().trim().min(1, "Informe o modelo").max(MODELO_MAX, `Use no máximo ${MODELO_MAX} caracteres`),
  cor: z.enum(CORES, { message: "Selecione a cor" }),
  codigoTicket: z.string().trim().refine((valor) => valor === "" || (INTEGER.test(valor) && valor.length <= 9), "Use apenas números"),
  mensalista: z.boolean(),
});

export type EntradaConferenciaValues = z.infer<typeof entradaConferenciaSchema>;

// Só chamar com valores já validados por `entradaConferenciaSchema`.
export function toEntradaConferenciaPayload(values: EntradaConferenciaValues) {
  return {
    categoria: Number(values.categoria),
    modelo: values.modelo.trim(),
    cor: values.cor,
    ...(values.codigoTicket !== "" ? { codigoTicket: Number(values.codigoTicket) } : {}),
    mensalista: values.mensalista,
  };
}

export const observacaoSchema = z.string().max(OBSERVACAO_MAX, `Use no máximo ${OBSERVACAO_MAX} caracteres`);
