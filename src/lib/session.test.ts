import { describe, expect, it } from "vitest";
import { parseSession } from "./session";

function tokenWith(payload: object) {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.assinatura`;
}

const EMAIL = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const NAME = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
const ROLE = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

describe("parseSession", () => {
  it("lê e-mail, nome e perfil das claims", () => {
    const session = parseSession(tokenWith({ [EMAIL]: "maria@exemplo.com", [NAME]: "maria@exemplo.com", [ROLE]: "Administrador" }));
    expect(session).toEqual({ name: "maria@exemplo.com", email: "maria@exemplo.com", perfil: 1 });
  });

  it("role desconhecida resulta em perfil nulo", () => {
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co", [ROLE]: "Auditor" }))?.perfil).toBeNull();
  });

  it("reconhece a role numérica, em texto ou número", () => {
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co", [ROLE]: "1" }))?.perfil).toBe(1);
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co", [ROLE]: 4 }))?.perfil).toBe(4);
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co", [ROLE]: "8" }))?.perfil).toBe(8);
  });

  it("reconhece os perfis de conveniada, por número e por nome", () => {
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co", [ROLE]: "5" }))?.perfil).toBe(5);
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co", [ROLE]: "GerenteConveniada" }))?.perfil).toBe(6);
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co", [ROLE]: "UsuarioConveniada" }))?.perfil).toBe(7);
  });

  it("com várias roles usa a primeira reconhecida", () => {
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co", [ROLE]: ["Auditor", "3", "1"] }))?.perfil).toBe(3);
  });

  it("role numérica fora do enum, vazia ou ausente resulta em perfil nulo", () => {
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co", [ROLE]: "99" }))?.perfil).toBeNull();
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co", [ROLE]: "" }))?.perfil).toBeNull();
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co", [ROLE]: [] }))?.perfil).toBeNull();
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co" }))?.perfil).toBeNull();
  });

  it("sem claim de nome usa o e-mail", () => {
    expect(parseSession(tokenWith({ [EMAIL]: "a@b.co" }))?.name).toBe("a@b.co");
  });

  it("token ausente, malformado ou sem identidade vira nulo sem lançar erro", () => {
    expect(parseSession(null)).toBeNull();
    expect(parseSession("abc")).toBeNull();
    expect(parseSession("a.%%%.c")).toBeNull();
    expect(parseSession(tokenWith({ outra: "coisa" }))).toBeNull();
  });
});
