import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";

const PUBLIC = path.resolve(__dirname, "../../public");

function dimensoesPng(arquivo: string) {
  const dados = readFileSync(arquivo);
  // Cabeçalho do PNG: assinatura de 8 bytes, depois o bloco IHDR com largura e altura (4 bytes cada).
  return { largura: dados.readUInt32BE(16), altura: dados.readUInt32BE(20) };
}

describe("manifest do app", () => {
  const dados = manifest();

  it("chama o app de Murel, com as cores de asfalto da marca", () => {
    expect(dados.name).toBe("Murel");
    expect(dados.short_name).toBe("Murel");
    expect(dados.background_color).toBe("#0E1729");
    expect(dados.theme_color).toBe("#0E1729");
    expect(dados.description).toContain("estacionamentos");
  });

  it("tem os ícones de 192, 512 e o maskable, e os arquivos existem com o tamanho declarado", () => {
    const icones = dados.icons ?? [];
    expect(icones.map((icone) => `${icone.sizes}:${icone.purpose}`)).toEqual(["192x192:any", "512x512:any", "512x512:maskable"]);

    for (const icone of icones) {
      const arquivo = path.join(PUBLIC, icone.src);
      expect(existsSync(arquivo)).toBe(true);
      const [largura, altura] = (icone.sizes ?? "").split("x").map(Number);
      expect(dimensoesPng(arquivo)).toEqual({ largura, altura });
    }
  });

  it("o ícone da tela inicial do iOS existe com 180x180", () => {
    expect(dimensoesPng(path.join(PUBLIC, "icons/apple-touch-icon.png"))).toEqual({ largura: 180, altura: 180 });
  });
});
