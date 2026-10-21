// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { proxy } from "./proxy";

function chamar(caminho: string, comSessao = false) {
  const headers = comSessao ? { cookie: `${AUTH_COOKIE_NAME}=token` } : undefined;
  return proxy(new NextRequest(`http://localhost${caminho}`, { headers }));
}

describe("proxy: rotas públicas", () => {
  it.each([
    "/contrato?t=ABCDE12345",
    "/contrato",
    "/comprovante/ABC123",
    "/login",
    "/adesao",
    "/recuperar-senha",
    "/alterar-senha",
  ])("%s abre sem sessão", (caminho) => {
    const resposta = chamar(caminho);
    expect(resposta.headers.get("location")).toBeNull();
  });

  it.each(["/mensalistas", "/", "/contrato-secreto", "/contratos"])("%s sem sessão vai para o login", (caminho) => {
    const resposta = chamar(caminho);
    expect(resposta.status).toBe(307);
    expect(resposta.headers.get("location")).toBe("http://localhost/login");
  });

  it("com sessão qualquer rota passa", () => {
    expect(chamar("/mensalistas", true).headers.get("location")).toBeNull();
  });
});
