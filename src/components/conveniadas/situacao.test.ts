import { describe, expect, it } from "vitest";
import { parseSituacao, situacaoUrl } from "./situacao";

describe("parseSituacao", () => {
  it("lê os valores conhecidos", () => {
    expect(parseSituacao("ativos")).toBe("ativos");
    expect(parseSituacao("encerrados")).toBe("encerrados");
    expect(parseSituacao("todos")).toBe("todos");
  });

  it("valor ausente ou desconhecido vira todos", () => {
    expect(parseSituacao(null)).toBe("todos");
    expect(parseSituacao("qualquer")).toBe("todos");
  });
});

describe("situacaoUrl", () => {
  it("todos fica sem parâmetro", () => {
    expect(situacaoUrl("todos")).toBe("/empresas-conveniadas");
    expect(situacaoUrl("ativos")).toBe("/empresas-conveniadas?situacao=ativos");
    expect(situacaoUrl("encerrados")).toBe("/empresas-conveniadas?situacao=encerrados");
  });
});
