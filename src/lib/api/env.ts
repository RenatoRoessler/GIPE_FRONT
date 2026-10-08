import { z } from "zod";

const envSchema = z.object({
  APP_ENV: z.enum(["dev", "hml", "azl", "prod"]),
  API_URL: z
    .url({ error: "NEXT_PUBLIC_API_URL ausente ou inválida" })
    .transform((url) => (url.endsWith("/") ? url.slice(0, -1) : url)),
  TIMEOUT_MS: z.coerce
    .number({ error: "NEXT_PUBLIC_API_TIMEOUT_MS inválida" })
    .positive("NEXT_PUBLIC_API_TIMEOUT_MS deve ser positiva"),
});

export type AppEnv = z.infer<typeof envSchema>["APP_ENV"];

function readEnv() {
  // Referências literais: o Next só embute no bundle `process.env.NEXT_PUBLIC_*` acessado diretamente.
  const rawAppEnv = process.env.NEXT_PUBLIC_APP_ENV;
  if (!rawAppEnv) {
    console.warn("NEXT_PUBLIC_APP_ENV não definida; assumindo ambiente 'dev'.");
  }

  const result = envSchema.safeParse({
    APP_ENV: rawAppEnv || "dev",
    API_URL: process.env.NEXT_PUBLIC_API_URL,
    TIMEOUT_MS: process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 30000,
  });

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuração de ambiente inválida (${details})`);
  }

  return result.data;
}

export const env = readEnv();
