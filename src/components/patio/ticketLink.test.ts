import { describe, expect, it } from "vitest";
import { linkDoTicket } from "./ticketLink";

describe("linkDoTicket", () => {
  it("monta o endereço público do ticket com a origem atual", () => {
    expect(linkDoTicket("abc123")).toBe(`${window.location.origin}/comprovante/abc123`);
  });

  it("codifica caracteres especiais do token", () => {
    expect(linkDoTicket("a/b c+d")).toBe(`${window.location.origin}/comprovante/a%2Fb%20c%2Bd`);
  });
});
