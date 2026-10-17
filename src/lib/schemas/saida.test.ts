import { describe, expect, it } from "vitest";
import { saidaBuscaSchema, TOKEN_INVALIDO_MESSAGE, toSaidaBusca } from "./saida";

const VAZIO = { placa: "", token: "", sequencial: "" };

describe("saidaBuscaSchema: token", () => {
  it.each(["7K3Q9X", "227SUSYV", "aB12cD34"])("aceita o token %s", (token) => {
    const result = saidaBuscaSchema.safeParse({ ...VAZIO, token });
    expect(result.success).toBe(true);
    expect(toSaidaBusca(result.data!)).toEqual({ tipo: "token", valor: token });
  });

  it("remove espaços nas pontas", () => {
    const result = saidaBuscaSchema.parse({ ...VAZIO, token: "  7K3Q9X " });
    expect(toSaidaBusca(result)).toEqual({ tipo: "token", valor: "7K3Q9X" });
  });

  it("aceita o link do cupom colado e extrai o token", () => {
    const result = saidaBuscaSchema.parse({ ...VAZIO, token: "https://gipe.com.br/comprovante/7K3Q9X" });
    expect(toSaidaBusca(result)).toEqual({ tipo: "token", valor: "7K3Q9X" });
  });

  it.each(["AB1", "TK-0482", "token com espaço", "x".repeat(33)])("rejeita %j", (token) => {
    const result = saidaBuscaSchema.safeParse({ ...VAZIO, token });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ["token"], message: TOKEN_INVALIDO_MESSAGE });
  });

  it("continua exigindo exatamente um identificador", () => {
    expect(saidaBuscaSchema.safeParse(VAZIO).success).toBe(false);
    expect(saidaBuscaSchema.safeParse({ ...VAZIO, token: "7K3Q9X", sequencial: "2" }).success).toBe(false);
  });

  it("o sequencial continua só numérico", () => {
    expect(saidaBuscaSchema.safeParse({ ...VAZIO, sequencial: "12a" }).success).toBe(false);
  });
});
