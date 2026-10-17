import { describe, expect, it } from "vitest";
import { saidaBuscaSchema, toSaidaBusca } from "./saida";

const VAZIO = { placa: "", codigoTicket: "", sequencial: "" };

describe("saidaBuscaSchema: código do ticket", () => {
  it.each(["482", "A4B82", "TK-0482", "00482"])("aceita %s como texto", (codigo) => {
    const result = saidaBuscaSchema.safeParse({ ...VAZIO, codigoTicket: codigo });
    expect(result.success).toBe(true);
    expect(toSaidaBusca(result.data!)).toEqual({ tipo: "codigoTicket", valor: codigo });
  });

  it("remove espaços nas pontas e mantém zeros à esquerda", () => {
    const result = saidaBuscaSchema.parse({ ...VAZIO, codigoTicket: "  00482 " });
    expect(toSaidaBusca(result)).toEqual({ tipo: "codigoTicket", valor: "00482" });
  });

  it("continua exigindo exatamente um identificador", () => {
    expect(saidaBuscaSchema.safeParse(VAZIO).success).toBe(false);
    expect(saidaBuscaSchema.safeParse({ ...VAZIO, codigoTicket: "A1", sequencial: "2" }).success).toBe(false);
  });

  it("o sequencial continua só numérico", () => {
    expect(saidaBuscaSchema.safeParse({ ...VAZIO, sequencial: "12a" }).success).toBe(false);
  });
});
