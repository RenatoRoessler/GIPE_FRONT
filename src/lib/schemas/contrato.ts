import { z } from "zod";
import { isValidDocumentoAuto } from "@/lib/documento";

export const aceiteSchema = z.object({
  aceito: z.boolean().refine((value) => value, "Marque que leu e concorda com os termos"),
  documento: z
    .string()
    .trim()
    .min(1, "Informe o seu CPF ou CNPJ")
    .refine((value) => value === "" || isValidDocumentoAuto(value), "Documento inválido. Confira os números"),
});

export type AceiteFormValues = z.infer<typeof aceiteSchema>;
