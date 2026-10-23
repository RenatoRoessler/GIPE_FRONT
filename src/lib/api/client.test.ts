import type { InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getToken: vi.fn() }));

import { getToken } from "@/lib/auth";
import { api } from "./client";

// Devolve os cabeçalhos que a chamada levaria, sem tocar na rede.
async function cabecalhos(headers?: Record<string, string>) {
  let enviado: InternalAxiosRequestConfig | undefined;
  await api.post("/x", {}, {
    headers,
    adapter: async (config) => {
      enviado = config;
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    },
  });
  return enviado!.headers;
}

beforeEach(() => {
  vi.mocked(getToken).mockReset();
});

describe("interceptor de autenticação", () => {
  it("envia o token da sessão quando a chamada não define o seu", async () => {
    vi.mocked(getToken).mockReturnValue("sessao");
    expect((await cabecalhos()).get("Authorization")).toBe("Bearer sessao");
  });

  it("não envia Authorization sem sessão", async () => {
    vi.mocked(getToken).mockReturnValue(null);
    expect((await cabecalhos()).has("Authorization")).toBe(false);
  });

  it("um Authorization definido na chamada vale mais que o da sessão", async () => {
    vi.mocked(getToken).mockReturnValue("sessao-antiga");
    expect((await cabecalhos({ Authorization: "Bearer troca" })).get("Authorization")).toBe("Bearer troca");
  });

  it("sem sessão, o Authorization da chamada segue", async () => {
    vi.mocked(getToken).mockReturnValue(null);
    expect((await cabecalhos({ Authorization: "Bearer troca" })).get("Authorization")).toBe("Bearer troca");
  });
});
