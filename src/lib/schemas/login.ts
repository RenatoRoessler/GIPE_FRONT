import { z } from "zod";
import { isValidCPF } from "@/lib/cpf";

export const loginSchema = z.object({
  cpf: z.string().trim().min(1, "Informe o CPF").refine(isValidCPF, "CPF inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export type LoginValues = z.infer<typeof loginSchema>;
