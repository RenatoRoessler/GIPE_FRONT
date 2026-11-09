import { z } from "zod";
import { CORES_VEICULO, type CorVeiculo } from "@/types/veiculo";
import type { ConfiguracaoValues } from "@/types/configuracao";
import { prismaCampo } from "./prisma";

const CORES = CORES_VEICULO.map((cor) => cor.value) as [CorVeiculo, ...CorVeiculo[]];

// O que a empresa exige na entrada. O prisma não vale para mensalista, que pode entrar sem ele.
export interface RegrasEntrada extends ConfiguracaoValues {
  mensalista: boolean;
}

export function prismaExigido(regras: RegrasEntrada): boolean {
  return regras.prisma && !regras.mensalista;
}

// Campos de modelo, cor e prisma conforme as regras; os desligados aceitam vazio.
export function camposDaEntrada(regras: RegrasEntrada, modeloMax: number) {
  const modelo = z.string().trim().max(modeloMax, `Use no máximo ${modeloMax} caracteres`);
  return {
    modelo: regras.modelo ? modelo.min(1, "Informe o modelo") : modelo,
    // Sem cor padrão: quem registra escolhe, para não entrar prata sem querer.
    cor: regras.cor ? z.enum(CORES, { message: "Selecione a cor" }) : z.union([z.enum(CORES), z.literal("")]),
    prisma: prismaCampo(prismaExigido(regras)),
  };
}
