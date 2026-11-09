import { z } from "zod";
import { isValidPlaca, PLACA_INVALIDA_MESSAGE } from "@/lib/placa";
import { CONFIGURACAO_PADRAO } from "@/types/configuracao";
import { CATEGORIA_VEICULO_OPTIONS, type CorVeiculo } from "@/types/veiculo";
import { camposDaEntrada, type RegrasEntrada } from "./regrasEntrada";

const CATEGORIAS = CATEGORIA_VEICULO_OPTIONS.map((option) => String(option.value));

export type EntradaVeiculoValues = {
  placa: string;
  categoria: string;
  modelo: string;
  // Vazia só quando a empresa não exige a cor.
  cor: CorVeiculo | "";
  prisma: string;
};

const REGRAS_PADRAO: RegrasEntrada = { ...CONFIGURACAO_PADRAO, mensalista: false };

// A empresa decide se modelo, cor e prisma são obrigatórios (ver `useConfiguracao`).
export function criarEntradaVeiculoSchema(regras: RegrasEntrada): z.ZodType<EntradaVeiculoValues> {
  return z.object({
    placa: z.string().trim().min(1, "Informe a placa").refine(isValidPlaca, PLACA_INVALIDA_MESSAGE),
    categoria: z.string().refine((value) => CATEGORIAS.includes(value), "Selecione a categoria"),
    ...camposDaEntrada(regras, 60),
  });
}

// Regras padrão da empresa: modelo e cor obrigatórios, prisma opcional.
export const entradaVeiculoSchema = criarEntradaVeiculoSchema(REGRAS_PADRAO);
