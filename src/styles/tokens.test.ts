import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "..");

function arquivos(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = path.join(pasta, nome);
    if (statSync(caminho).isDirectory()) return nome === "generated" ? [] : arquivos(caminho);
    return /\.(ts|tsx)$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

const linhas = arquivos(SRC).flatMap((arquivo) =>
  readFileSync(arquivo, "utf-8")
    .split("\n")
    .map((texto, indice) => ({ arquivo: path.relative(SRC, arquivo), numero: indice + 1, texto })),
);

describe("tokens da identidade Murel", () => {
  it("nenhum código usa os tokens de vidro, brilho ou sinalização, que saíram do tema", () => {
    const usos = linhas.filter(({ texto }) => /colors\.(glass|glassBorder|onSign|signEdge)\b|shadows\.glow\b/.test(texto));
    expect(usos).toEqual([]);
  });

  it("`primary` é só preenchimento: nunca cor de texto, de borda ou de contorno (para isso há `accent` e `focus`)", () => {
    const usos = linhas.filter(
      ({ texto }) => /colors\.primary(?![A-Za-z])/.test(texto) && /(^|[\s;{])(color|border[a-z-]*|outline[a-z-]*|text-decoration-color|caret-color)\s*:|stroke=/.test(texto),
    );
    expect(usos).toEqual([]);
  });

  it("o foco usa o token `focus`, nunca `primary` nem `warn`", () => {
    const usos = linhas.filter(({ texto }) => /outline[a-z-]*\s*:.*colors\.(primary|warn)\b/.test(texto));
    expect(usos).toEqual([]);
  });
});
