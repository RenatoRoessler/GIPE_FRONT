import { z } from "zod";

export const loginSchema = z.object({
  cpf: z.string().trim().min(1, "Informe o CPF"),
  senha: z.string().min(1, "Informe a senha"),
});

export type LoginValues = z.infer<typeof loginSchema>;
