import { z } from "zod";
import { isValidCPF } from "@/lib/cpf";

export const recoverPasswordSchema = z.object({
  cpf: z
    .string()
    .trim()
    .min(1, "Informe o CPF")
    .refine(isValidCPF, "CPF inválido"),
});

export type RecoverPasswordValues = z.infer<typeof recoverPasswordSchema>;
