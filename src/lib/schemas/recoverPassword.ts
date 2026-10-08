import { z } from "zod";
import { isValidEmail } from "@/lib/email";

export const recoverPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .refine(isValidEmail, "E-mail inválido"),
});

export type RecoverPasswordValues = z.infer<typeof recoverPasswordSchema>;
