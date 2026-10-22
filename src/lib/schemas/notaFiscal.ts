import { z } from "zod";
import { isValidCPF } from "@/lib/cpf";
import { isValidCnpjAlfanumerico } from "@/lib/documento";
import { isValidEmail } from "@/lib/email";

export const NOTA_EMAIL_MAX = 150;

// O valor não faz parte do formulário: vem do recibo e o back exige que seja igual a ele.
export const solicitarNotaSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Informe o e-mail")
      .max(NOTA_EMAIL_MAX, `Use no máximo ${NOTA_EMAIL_MAX} caracteres`)
      .refine(isValidEmail, "Informe um e-mail válido"),
    // Desmarcado é pessoa física; marcado, pessoa jurídica.
    pessoaJuridica: z.boolean(),
    documento: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    const { documento, pessoaJuridica } = values;
    if (pessoaJuridica) {
      // Empresa: o CNPJ é obrigatório e precisa ser válido.
      if (documento === "") {
        ctx.addIssue({ code: "custom", path: ["documento"], message: "Informe o CNPJ" });
      } else if (!isValidCnpjAlfanumerico(documento)) {
        ctx.addIssue({ code: "custom", path: ["documento"], message: "CNPJ inválido" });
      }
      return;
    }
    // Pessoa física: o CPF é opcional, mas se informado precisa ser válido.
    if (documento !== "" && !isValidCPF(documento)) {
      ctx.addIssue({ code: "custom", path: ["documento"], message: "CPF inválido" });
    }
  });

export type SolicitarNotaValues = z.infer<typeof solicitarNotaSchema>;
