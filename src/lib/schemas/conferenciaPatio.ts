import { z } from "zod";
import { isValidPlaca, PLACA_INVALIDA_MESSAGE } from "@/lib/placa";
import { CATEGORIA_VEICULO_OPTIONS, type CorVeiculo } from "@/types/veiculo";
import { MOTIVO_SAIDA, type MotivoSaida } from "@/types/conferenciaPatio";
import { prismaDoTexto } from "@/lib/prisma";
import { CONFIGURACAO_PADRAO } from "@/types/configuracao";
import { camposDaEntrada, type RegrasEntrada } from "./regrasEntrada";

const INTEGER = /^\d+$/;
const CATEGORIAS = CATEGORIA_VEICULO_OPTIONS.map((option) => String(option.value));

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

export type EntradaConferenciaValues = {
  categoria: string;
  modelo: string;
  // Vazia só quando a empresa não exige a cor.
  cor: CorVeiculo | "";
  prisma: string;
  codigoTicket: string;
  mensalista: boolean;
};

// Entrada de uma placa lida sem ticket aberto. A empresa decide se modelo, cor e prisma são obrigatórios; o prisma
// também depende de a entrada ser de mensalista (`regras.mensalista`).
export function criarEntradaConferenciaSchema(regras: RegrasEntrada): z.ZodType<EntradaConferenciaValues> {
  return z.object({
    categoria: z.string().refine((valor) => CATEGORIAS.includes(valor), "Selecione a categoria"),
    ...camposDaEntrada(regras, MODELO_MAX),
    codigoTicket: z.string().trim().refine((valor) => valor === "" || (INTEGER.test(valor) && valor.length <= 9), "Use apenas números"),
    mensalista: z.boolean(),
  });
}

// Regras padrão da empresa: modelo e cor obrigatórios, prisma opcional.
export const entradaConferenciaSchema = criarEntradaConferenciaSchema({ ...CONFIGURACAO_PADRAO, mensalista: false });

// Só chamar com valores já validados por `criarEntradaConferenciaSchema`. O que a empresa não exige e ficou vazio não vai.
export function toEntradaConferenciaPayload(values: EntradaConferenciaValues) {
  const modelo = values.modelo.trim();
  const prisma = prismaDoTexto(values.prisma);
  return {
    categoria: Number(values.categoria),
    ...(modelo !== "" ? { modelo } : {}),
    ...(values.cor !== "" ? { cor: values.cor } : {}),
    ...(prisma !== null && !values.mensalista ? { prisma } : {}),
    ...(values.codigoTicket !== "" ? { codigoTicket: Number(values.codigoTicket) } : {}),
    mensalista: values.mensalista,
  };
}

export const observacaoSchema = z.string().max(OBSERVACAO_MAX, `Use no máximo ${OBSERVACAO_MAX} caracteres`);
