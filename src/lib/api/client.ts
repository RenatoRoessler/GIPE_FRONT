import axios from "axios";
import { getToken } from "@/lib/auth";
import { env } from "./env";
import { normalizeError } from "./errors";

export const api = axios.create({
  baseURL: env.API_URL,
  timeout: env.TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// 401 é apenas classificado (kind "unauthorized"); limpar sessão/redirecionar fica a cargo da feature de login.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeError(error)),
);
