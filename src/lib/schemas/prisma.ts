import { z } from "zod";
import { PRISMA_INTERVALO_MESSAGE, PRISMA_OBRIGATORIO_MESSAGE, prismaDoTexto } from "@/lib/prisma";

// Campo de texto do prisma: vazio só passa quando não é exigido; preenchido, precisa ser inteiro de 1 a 999.
export function prismaCampo(exigido: boolean) {
  const preenchidoValido = z
    .string()
    .trim()
    .refine((texto) => texto === "" || prismaDoTexto(texto) !== null, PRISMA_INTERVALO_MESSAGE);
  return exigido ? preenchidoValido.refine((texto) => texto !== "", PRISMA_OBRIGATORIO_MESSAGE) : preenchidoValido;
}

export type PrismaEdicaoValues = { prisma: string };

// Edição do prisma de um veículo no pátio: obrigatório, exceto para mensalista, que pode ficar sem.
export function criarPrismaEdicaoSchema({ mensalista }: { mensalista: boolean }): z.ZodType<PrismaEdicaoValues> {
  return z.object({ prisma: prismaCampo(!mensalista) });
}
