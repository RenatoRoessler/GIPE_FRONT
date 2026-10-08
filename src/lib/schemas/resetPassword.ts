import { z } from "zod";
import { getMissingPasswordRules } from "@/lib/password";

export const resetPasswordSchema = z
  .object({
    senha: z.string().min(1, "Informe a nova senha"),
    confirmarSenha: z.string().min(1, "Confirme a senha"),
  })
  .superRefine((data, ctx) => {
    const missing = data.senha ? getMissingPasswordRules(data.senha) : [];
    if (missing.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["senha"],
        message: `Falta: ${missing.join(", ")}`,
      });
    }

    if (data.confirmarSenha && data.senha !== data.confirmarSenha) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmarSenha"],
        message: "As senhas não coincidem",
      });
    }
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
