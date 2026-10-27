import { z } from "zod";
import { MAX_COLUNAS, MAX_LINHAS, MAX_POSICOES, totalEmUso } from "@/components/quadros/gancho";

export const QUADRO_SEM_GANCHO_MESSAGE = "Mantenha ao menos um gancho em uso";

export const quadroFormSchema = z
  .object({
    nome: z.string().trim().min(1, "Informe o nome do quadro").max(100, "Use no máximo 100 caracteres"),
    linhas: z.number().int().min(1, "Use ao menos 1 linha").max(MAX_LINHAS, `Use no máximo ${MAX_LINHAS} linhas`),
    colunas: z
      .number()
      .int()
      .min(1, "Use ao menos 1 coluna")
      .max(MAX_COLUNAS, `Use no máximo ${MAX_COLUNAS} colunas`),
    foraDeUso: z.array(z.string()),
  })
  .superRefine((valores, ctx) => {
    if (valores.linhas * valores.colunas > MAX_POSICOES) {
      ctx.addIssue({
        code: "custom",
        path: ["colunas"],
        message: `O quadro pode ter no máximo ${MAX_POSICOES} ganchos`,
      });
      return;
    }
    if (totalEmUso(valores) <= 0) {
      ctx.addIssue({ code: "custom", path: ["foraDeUso"], message: QUADRO_SEM_GANCHO_MESSAGE });
    }
  });
