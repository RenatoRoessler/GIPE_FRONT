// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { proxy } from "./proxy";

const EMAIL = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const ROLE = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function tokenWith(payload: object) {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.assinatura`;
}

function tokenDoPerfil(role: string | number | undefined) {
  return tokenWith({ [EMAIL]: "a@b.co", ...(role === undefined ? {} : { [ROLE]: role }) });
}

function chamar(caminho: string, comSessao: boolean | string = false) {
  const token = comSessao === true ? "token" : comSessao;
  const headers = token ? { cookie: `${AUTH_COOKIE_NAME}=${token}` } : undefined;
  return proxy(new NextRequest(`http://localhost${caminho}`, { headers }));
}

describe("proxy: rotas públicas", () => {
  it.each([
    "/contrato?t=ABCDE12345",
    "/contrato",
    "/comprovante/ABC123",
    "/recibo/ABC123",
    "/login",
    "/adesao",
    "/recuperar-senha",
    "/alterar-senha",
    "/primeiro-acesso",
  ])("%s abre sem sessão", (caminho) => {
    const resposta = chamar(caminho);
    expect(resposta.headers.get("location")).toBeNull();
  });

  it.each(["/mensalistas", "/", "/contrato-secreto", "/contratos", "/recibos", "/recibo-secreto"])("%s sem sessão vai para o login", (caminho) => {
    const resposta = chamar(caminho);
    expect(resposta.status).toBe(307);
    expect(resposta.headers.get("location")).toBe("http://localhost/login");
  });

  it("com sessão as rotas públicas continuam abrindo", () => {
    expect(chamar("/login", tokenDoPerfil("1")).headers.get("location")).toBeNull();
  });
});

const ADMINISTRADOR = 1;
const GERENTE = 2;
const MANOBRISTA = 3;
const CAIXA = 4;
const ADMIN_CONVENIADA = 5;
const FINANCEIRO = 8;

describe("proxy: permissão por perfil", () => {
  it.each([
    [MANOBRISTA, "/precos"],
    [MANOBRISTA, "/precos/novo"],
    [MANOBRISTA, "/usuarios"],
    [MANOBRISTA, "/minha-empresa"],
    [MANOBRISTA, "/notas-fiscais"],
    [CAIXA, "/usuarios"],
    [CAIXA, "/precos"],
    [GERENTE, "/minha-empresa"],
    [GERENTE, "/minha-empresa/nova"],
    [CAIXA, "/minha-empresa/nova"],
    [MANOBRISTA, "/minha-empresa/nova"],
    [FINANCEIRO, "/minha-empresa/nova"],
    [GERENTE, "/usuarios"],
    [FINANCEIRO, "/patio"],
    [FINANCEIRO, "/caixa"],
    [FINANCEIRO, "/precos"],
    [ADMIN_CONVENIADA, "/patio"],
  ])("perfil %i em %s vai para o acesso negado", (perfil, caminho) => {
    const resposta = chamar(caminho, tokenDoPerfil(String(perfil)));
    expect(resposta.status).toBe(307);
    expect(resposta.headers.get("location")).toBe("http://localhost/acesso-negado");
  });

  it.each([
    [ADMINISTRADOR, "/precos"],
    [ADMINISTRADOR, "/usuarios"],
    [ADMINISTRADOR, "/minha-empresa"],
    [ADMINISTRADOR, "/minha-empresa/nova"],
    [GERENTE, "/precos/novo"],
    [GERENTE, "/notas-fiscais"],
    [CAIXA, "/caixa"],
    [CAIXA, "/patio"],
    [MANOBRISTA, "/patio"],
    [MANOBRISTA, "/caixa"],
    [FINANCEIRO, "/notas-fiscais"],
    [ADMIN_CONVENIADA, "/usuarios"],
  ])("perfil %i em %s passa", (perfil, caminho) => {
    expect(chamar(caminho, tokenDoPerfil(String(perfil))).headers.get("location")).toBeNull();
  });

  it.each([
    [MANOBRISTA, "/caixa/historico"],
    [MANOBRISTA, "/caixa/historico/12"],
    [CAIXA, "/caixa/historico"],
    [CAIXA, "/caixa/historico/12"],
    [FINANCEIRO, "/caixa/historico"],
  ])("perfil %i em %s não chega ao histórico de caixas", (perfil, caminho) => {
    const resposta = chamar(caminho, tokenDoPerfil(String(perfil)));
    expect(resposta.headers.get("location")).toBe("http://localhost/acesso-negado");
  });

  it.each([
    [ADMINISTRADOR, "/caixa/historico"],
    [ADMINISTRADOR, "/caixa/historico/12"],
    [GERENTE, "/caixa/historico"],
    [GERENTE, "/caixa/historico/12"],
    [CAIXA, "/caixa"],
    [MANOBRISTA, "/caixa"],
  ])("perfil %i em %s passa", (perfil, caminho) => {
    expect(chamar(caminho, tokenDoPerfil(String(perfil))).headers.get("location")).toBeNull();
  });

  it("a role pelo nome também vale", () => {
    expect(chamar("/precos", tokenDoPerfil("Gerente")).headers.get("location")).toBeNull();
    expect(chamar("/precos", tokenDoPerfil("Caixa")).headers.get("location")).toBe("http://localhost/acesso-negado");
  });

  it.each(["/acesso-negado", "/usuario/editar", "/atualizacoes", "/dashboard"])("%s abre para qualquer perfil", (caminho) => {
    for (const perfil of [ADMINISTRADOR, MANOBRISTA, FINANCEIRO]) {
      expect(chamar(caminho, tokenDoPerfil(String(perfil))).headers.get("location")).toBeNull();
    }
  });

  it("token ilegível ou sem role conhecida só acessa o início", () => {
    for (const token of ["token", tokenDoPerfil(undefined), tokenDoPerfil("99"), tokenDoPerfil("Auditor")]) {
      expect(chamar("/precos", token).headers.get("location")).toBe("http://localhost/acesso-negado");
      expect(chamar("/patio", token).headers.get("location")).toBe("http://localhost/acesso-negado");
      expect(chamar("/dashboard", token).headers.get("location")).toBeNull();
      expect(chamar("/acesso-negado", token).headers.get("location")).toBeNull();
    }
  });

  it("a requisição de navegação do cliente (RSC) também é barrada", () => {
    const request = new NextRequest("http://localhost/precos?_rsc=abc", {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${tokenDoPerfil("3")}`, rsc: "1" },
    });
    expect(proxy(request).headers.get("location")).toBe("http://localhost/acesso-negado");
  });
});
