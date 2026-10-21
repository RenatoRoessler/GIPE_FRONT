import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getToken: vi.fn() }));

import { getToken } from "@/lib/auth";
import { getSessaoIds } from "./session";

// JWT fictício: só o payload importa, a assinatura nunca é lida.
function jwt(payload: Record<string, unknown>) {
  const base64url = (value: string) => btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${base64url(JSON.stringify({ alg: "none" }))}.${base64url(JSON.stringify(payload))}.assinatura`;
}

describe("getSessaoIds", () => {
  beforeEach(() => {
    vi.mocked(getToken).mockReset();
  });

  it("lê empresa e usuário de claims numéricas", () => {
    vi.mocked(getToken).mockReturnValue(jwt({ empresa_id: 7, usuario_id: 42 }));
    expect(getSessaoIds()).toEqual({ empresaId: 7, usuarioId: 42 });
  });

  it("aceita ids em texto com dígitos e usa a primeira claim candidata válida", () => {
    vi.mocked(getToken).mockReturnValue(jwt({ empresa_id: "abc", empresaId: "9", nameid: "guid-x", usuarioId: "3" }));
    expect(getSessaoIds()).toEqual({ empresaId: 9, usuarioId: 3 });
  });

  it("lê o usuário da claim nameidentifier do .NET, mas sem a empresa não há sessão completa", () => {
    const nameidentifier = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
    vi.mocked(getToken).mockReturnValue(jwt({ [nameidentifier]: "42", empresa_guid: "9f1c0a52-0000-4000-8000-000000000000" }));
    expect(getSessaoIds()).toBeNull();

    vi.mocked(getToken).mockReturnValue(jwt({ [nameidentifier]: "42", empresa_id: 7 }));
    expect(getSessaoIds()).toEqual({ empresaId: 7, usuarioId: 42 });
  });

  it("decodifica base64url com acentos no payload", () => {
    const payload = JSON.stringify({ nome: "João ç", empresa_id: 1, usuario_id: 2 });
    const bytes = new TextEncoder().encode(payload);
    const base64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    vi.mocked(getToken).mockReturnValue(`x.${base64}.y`);
    expect(getSessaoIds()).toEqual({ empresaId: 1, usuarioId: 2 });
  });

  it.each([
    ["sem token", null],
    ["token malformado", "abc"],
    ["payload que não é JSON", "a.%%%.c"],
    ["sem a claim da empresa", jwt({ usuario_id: 2 })],
    ["sem a claim do usuário", jwt({ empresa_id: 2 })],
    ["claims zero ou negativas", jwt({ empresa_id: 0, usuario_id: -1 })],
    ["claims não inteiras", jwt({ empresa_id: 1.5, usuario_id: "x" })],
  ])("devolve null: %s", (_nome, token) => {
    vi.mocked(getToken).mockReturnValue(token);
    expect(getSessaoIds()).toBeNull();
  });
});
