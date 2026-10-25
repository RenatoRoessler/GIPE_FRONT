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
});
