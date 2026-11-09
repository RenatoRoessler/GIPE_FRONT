import { z } from "zod";

export const configuracaoSchema = z.object({
  modelo: z.boolean(),
  cor: z.boolean(),
  prisma: z.boolean(),
});

export type ConfiguracaoFormValues = z.infer<typeof configuracaoSchema>;
