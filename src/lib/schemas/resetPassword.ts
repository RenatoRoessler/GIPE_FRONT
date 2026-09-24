import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    senha: z.string().min(1, "Informe a nova senha"),
    confirmarSenha: z.string().min(1, "Confirme a senha"),
  })
  .superRefine((data, ctx) => {
    if (data.confirmarSenha && data.senha !== data.confirmarSenha) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmarSenha"],
        message: "As senhas não coincidem",
      });
    }
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
