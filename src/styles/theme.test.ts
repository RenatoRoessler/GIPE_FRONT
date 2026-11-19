import { describe, expect, it } from "vitest";
import { darkTheme, lightTheme } from "./theme";

type Folha = string | number | { [chave: string]: Folha };

function valoresVazios(objeto: Record<string, Folha>, caminho = ""): string[] {
  return Object.entries(objeto).flatMap(([chave, valor]) => {
    const atual = `${caminho}${chave}`;
    if (valor === undefined || valor === null || valor === "") return [atual];
    return typeof valor === "object" ? valoresVazios(valor as Record<string, Folha>, `${atual}.`) : [];
  });
}

describe("temas Murel", () => {
  it.each([
    ["claro", lightTheme],
    ["escuro", darkTheme],
  ])("o tema %s define todos os tokens, sem valor vazio", (_nome, tema) => {
    expect(valoresVazios(tema.colors as unknown as Record<string, Folha>)).toEqual([]);
    expect(tema.fontFamilies.sans).toContain("--font-plus-jakarta");
    expect(tema.fontFamilies.mono).toContain("--font-jetbrains");
    expect(tema.layout.contentMaxWidth).toBe("1120px");
    expect(tema.typography.displayTransform).toBe("none");
  });

  it("usa o amarelo faixa como preenchimento nos dois temas e o texto de destaque muda por tema", () => {
    expect(lightTheme.colors.primary).toBe("#FFC20E");
    expect(darkTheme.colors.primary).toBe("#FFC20E");
    expect(lightTheme.colors.accent).toBe("#0E1729");
    expect(darkTheme.colors.accent).toBe("#FFC20E");
    expect(lightTheme.colors.onPrimary).toBe("#0E1729");
  });

  it("compartilha as cores de tipo de cliente e de forma de pagamento", () => {
    expect(lightTheme.colors.cliente).toEqual(darkTheme.colors.cliente);
    expect(lightTheme.colors.pagamento).toEqual(darkTheme.colors.pagamento);
  });

  describe("cores de severidade do dashboard", () => {
    type Rgba = [number, number, number, number];

    function rgba(cor: string): Rgba {
      if (cor.startsWith("#")) {
        const n = parseInt(cor.slice(1), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
      }
      const [r, g, b, a] = cor.match(/[\d.]+/g)!.map(Number);
      return [r, g, b, a];
    }

    // Cor translúcida sobre um fundo opaco.
    function sobre(frente: Rgba, fundo: Rgba): Rgba {
      const [r, g, b, a] = frente;
      return [r * a + fundo[0] * (1 - a), g * a + fundo[1] * (1 - a), b * a + fundo[2] * (1 - a), 1];
    }

    function luminancia([r, g, b]: Rgba): number {
      const [R, G, B] = [r, g, b].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    function contraste(a: Rgba, b: Rgba): number {
      const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
      return (claro + 0.05) / (escuro + 0.05);
    }

    it.each([
      ["claro", lightTheme],
      ["escuro", darkTheme],
    ])("no tema %s, ícone e contagem de atenção e informativo têm 3:1 sobre o painel e sobre o fundo suave", (_nome, tema) => {
      const { surface, success, caution, info, successSoft, cautionSoft, infoSoft } = tema.colors;
      const painel = rgba(surface);
      for (const [cor, suave] of [
        [success, successSoft],
        [caution, cautionSoft],
        [info, infoSoft],
      ]) {
        expect(contraste(rgba(cor), painel)).toBeGreaterThanOrEqual(3);
        expect(contraste(rgba(cor), sobre(rgba(suave), painel))).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
