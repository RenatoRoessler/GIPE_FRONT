import { describe, expect, it } from "vitest";
import { fromChaveEscolhidaResponse, fromQuadroResponse, fromQuadrosResponse } from "./quadroChaves.mapper";

describe("quadroChaves mapper", () => {
  it("lê um quadro completo", () => {
    const quadro = fromQuadroResponse({
      patioQuadroId: 3,
      nome: "Recepção",
      linhas: [{ linha: "A", colunas: [{ patioQuadroChaveId: 15, coluna: 1, disponivel: false }] }],
    });
    expect(quadro?.linhas[0].colunas[0]).toEqual({ patioQuadroChaveId: 15, coluna: 1, disponivel: false });
  });

  it("tolera campos ausentes: quadro sem linhas e posição sem disponivel livre", () => {
    expect(fromQuadroResponse({ patioQuadroId: 1, nome: "X" })).toEqual({ patioQuadroId: 1, nome: "X", linhas: [] });
    const quadro = fromQuadroResponse({
      patioQuadroId: 1,
      linhas: [{ linha: "A", colunas: [{ patioQuadroChaveId: 2, coluna: 1 }, { coluna: 3 }, "lixo"] }],
    });
    expect(quadro?.nome).toBe("");
    expect(quadro?.linhas[0].colunas).toEqual([{ patioQuadroChaveId: 2, coluna: 1, disponivel: true }]);
  });

  it("descarta quadro sem id e itens que não são objetos", () => {
    expect(fromQuadrosResponse([{ nome: "sem id" }, null, { patioQuadroId: "7", nome: "Ok" }])).toEqual([
      { patioQuadroId: 7, nome: "Ok", linhas: [] },
    ]);
    expect(fromQuadrosResponse("x")).toEqual([]);
  });

  it("lê a chave escolhida com padrões seguros", () => {
    expect(fromChaveEscolhidaResponse(null)).toEqual({
      patioId: 0, placa: "", patioQuadroId: 0, quadro: "", patioQuadroChaveId: 0, linha: "", coluna: 0,
    });
  });
});
