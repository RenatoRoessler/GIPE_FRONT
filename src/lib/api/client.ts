import axios from "axios";
import { getToken } from "@/lib/auth";
import { env, DEV_API_PROXY_PATH } from "./env";
import { normalizeError } from "./errors";

// Em desenvolvimento o navegador fala com o proxy do Next (rewrites do next.config.ts), que repassa à API de produção
// sem depender do CORS dela liberar localhost.
const baseURL = env.APP_ENV === "dev" && typeof window !== "undefined" ? DEV_API_PROXY_PATH : env.API_URL;

export const api = axios.create({
  baseURL,
  timeout: env.TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  // Um Authorization já definido na chamada (ex.: o token do primeiro acesso) vale mais que o da sessão.
  if (token && !config.headers.has("Authorization")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// 401 é apenas classificado (kind "unauthorized"); limpar sessão/redirecionar fica a cargo da feature de login.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeError(error)),
);
