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
