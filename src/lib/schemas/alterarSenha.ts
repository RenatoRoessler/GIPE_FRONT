import { z } from "zod";

export const SENHA_NOVA_MIN = 6;

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual"),
    novaSenha: z.string().min(SENHA_NOVA_MIN, `A nova senha precisa ter ao menos ${SENHA_NOVA_MIN} caracteres`),
    confirmacao: z.string().min(1, "Confirme a nova senha"),
  })
  .superRefine((values, ctx) => {
    if (values.novaSenha !== "" && values.novaSenha === values.senhaAtual) {
      ctx.addIssue({ code: "custom", path: ["novaSenha"], message: "A nova senha precisa ser diferente da atual" });
    }
    if (values.confirmacao !== "" && values.confirmacao !== values.novaSenha) {
      ctx.addIssue({ code: "custom", path: ["confirmacao"], message: "A confirmação não confere com a nova senha" });
    }
  });

export type AlterarSenhaValues = z.infer<typeof alterarSenhaSchema>;
