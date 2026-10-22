import { z } from "zod";
import { isValidPlaca, PLACA_INVALIDA_MESSAGE } from "@/lib/placa";
import { CATEGORIA_VEICULO_OPTIONS, CORES_VEICULO, type CorVeiculo } from "@/types/veiculo";

const CORES = CORES_VEICULO.map((cor) => cor.value) as [CorVeiculo, ...CorVeiculo[]];
const CATEGORIAS = CATEGORIA_VEICULO_OPTIONS.map((option) => String(option.value));

export const entradaVeiculoSchema = z.object({
  placa: z.string().trim().min(1, "Informe a placa").refine(isValidPlaca, PLACA_INVALIDA_MESSAGE),
  categoria: z.string().refine((value) => CATEGORIAS.includes(value), "Selecione a categoria"),
  modelo: z.string().trim().max(60, "Use no máximo 60 caracteres"),
  cor: z.enum(CORES, { message: "Selecione a cor" }),
});

export type EntradaVeiculoValues = z.infer<typeof entradaVeiculoSchema>;
