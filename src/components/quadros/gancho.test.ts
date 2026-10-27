import { describe, expect, it } from "vitest";
import type { QuadroChaves } from "@/types/quadroChaves";
import {
  contarLivres,
  diffAcrescimo,
  escolherQuadroInicial,
  gerarPayload,
  localizarPosicao,
  linhasDaGrade,
  rotuloGancho,
  rotuloDoGancho,
  rotuloLinha,
  sugerirGancho,
  totalEmUso,
} from "./gancho";

const pos = (id: number, coluna: number, disponivel = true) => ({ patioQuadroChaveId: id, coluna, disponivel });

const quadro: QuadroChaves = {
  patioQuadroId: 1,
  nome: "Recepção",
  linhas: [
    { linha: "A", colunas: [pos(1, 1, false), pos(2, 2)] },
    { linha: "B", colunas: [pos(3, 1)] },
  ],
};

describe("gancho", () => {
  it("rotula linhas e ganchos", () => {
    expect(rotuloLinha(0)).toBe("A");
    expect(rotuloLinha(25)).toBe("Z");
    expect(rotuloGancho("B", 6)).toBe("B6");
  });

  it("gera o payload sem as posições fora de uso", () => {
    expect(gerarPayload({ linhas: 2, colunas: 3, foraDeUso: ["A2"] })).toEqual([
      { linha: "A", colunas: [1, 3] },
      { linha: "B", colunas: [1, 2, 3] },
    ]);
  });

  it("omite a linha que ficou sem nenhuma coluna", () => {
    expect(gerarPayload({ linhas: 2, colunas: 1, foraDeUso: ["B1"] })).toEqual([{ linha: "A", colunas: [1] }]);
  });

  it("conta só os ganchos em uso e ignora fora de uso fora da grade", () => {
    expect(totalEmUso({ linhas: 5, colunas: 6, foraDeUso: ["B6"] })).toBe(29);
    expect(totalEmUso({ linhas: 1, colunas: 2, foraDeUso: ["Z9"] })).toBe(2);
  });

  it("no acréscimo envia só o que ainda não existe", () => {
    expect(diffAcrescimo(quadro, { linhas: 3, colunas: 2, foraDeUso: [] })).toEqual([
      { linha: "B", colunas: [2] },
      { linha: "C", colunas: [1, 2] },
    ]);
  });

  it("sugere o primeiro livre na ordem do quadro", () => {
    expect(sugerirGancho(quadro)).toEqual({ patioQuadroChaveId: 2, linha: "A", coluna: 2 });
  });

  it("não sugere nada com o quadro lotado ou ausente", () => {
    const lotado: QuadroChaves = { ...quadro, linhas: [{ linha: "A", colunas: [pos(1, 1, false)] }] };
    expect(sugerirGancho(lotado)).toBeNull();
    expect(sugerirGancho(undefined)).toBeNull();
  });

  it("escolhe o quadro com mais livres", () => {
    const outro: QuadroChaves = {
      patioQuadroId: 2,
      nome: "Garagem",
      linhas: [{ linha: "A", colunas: [pos(9, 1), pos(10, 2), pos(11, 3)] }],
    };
    expect(contarLivres(quadro)).toBe(2);
    expect(escolherQuadroInicial([quadro, outro])).toBe(outro);
    expect(escolherQuadroInicial([])).toBeUndefined();
  });

  it("monta a grade com o estado de cada gancho", () => {
    const grade = linhasDaGrade(quadro, 3);
    expect(grade.map((linha) => linha.ganchos.map((g) => [g.rotulo, g.estado]))).toEqual([
      [["A1", "ocupado"], ["A2", "livre"]],
      [["B1", "selecionado"]],
    ]);
  });

  it("acha o rótulo de um gancho pelo id", () => {
    expect(rotuloDoGancho(quadro, 3)).toBe("B1");
    expect(rotuloDoGancho(quadro, 99)).toBeNull();
  });

  it("o gancho atual do veículo aparece como ocupado, com a legenda aqui", () => {
    const grade = linhasDaGrade(quadro, null, 1);
    const a1 = grade[0].ganchos[0];
    expect(a1).toMatchObject({ rotulo: "A1", estado: "ocupado", legenda: "aqui" });
    expect(grade[0].ganchos[1]).not.toHaveProperty("legenda");
  });
});

describe("localizarPosicao", () => {
  const garagem: QuadroChaves = { patioQuadroId: 2, nome: "Garagem", linhas: [{ linha: "A", colunas: [pos(20, 1), pos(21, 2)] }] };

  it("acha a posição sem diferenciar caixa da linha", () => {
    expect(localizarPosicao([quadro], { quadro: null, linha: "b", coluna: 1 })).toEqual({ patioQuadroId: 1, patioQuadroChaveId: 3 });
  });

  it("sem nome vale a primeira posição com essa linha e coluna", () => {
    expect(localizarPosicao([quadro, garagem], { quadro: null, linha: "A", coluna: 2 })).toEqual({ patioQuadroId: 1, patioQuadroChaveId: 2 });
  });

  it("com nome exige o mesmo quadro, sem diferenciar caixa", () => {
    expect(localizarPosicao([quadro, garagem], { quadro: "garagem", linha: "A", coluna: 2 })).toEqual({
      patioQuadroId: 2,
      patioQuadroChaveId: 21,
    });
    expect(localizarPosicao([quadro], { quadro: "Garagem", linha: "A", coluna: 2 })).toBeNull();
  });

  it("com os ids do back acha o gancho sem comparar nome nem posição", () => {
    expect(localizarPosicao([quadro, garagem], { quadro: "Nome diferente", linha: "?", coluna: 0, patioQuadroId: 2, patioQuadroChaveId: 21 })).toEqual({
      patioQuadroId: 2,
      patioQuadroChaveId: 21,
    });
  });

  it("devolve null quando não existe ou não há posição", () => {
    expect(localizarPosicao([quadro], { quadro: null, linha: "Z", coluna: 9 })).toBeNull();
    expect(localizarPosicao([quadro], null)).toBeNull();
    expect(localizarPosicao([quadro], undefined)).toBeNull();
  });
});
