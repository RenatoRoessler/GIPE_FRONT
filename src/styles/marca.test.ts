import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = path.resolve(__dirname, "../..");

function arquivos(pasta: string, extensoes: RegExp): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = path.join(pasta, nome);
    if (statSync(caminho).isDirectory()) return nome === "generated" || nome === "ocr" ? [] : arquivos(caminho, extensoes);
    return extensoes.test(nome) && !/\.test\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

// Fora desta lista, o nome antigo não pode aparecer em nada que o usuário vê.
const PERMITIDOS = [path.join("src", "lib", "qr.ts")];

describe("marca Murel", () => {
  it("o nome antigo não aparece em textos, metadados, manifest nem páginas estáticas", () => {
    const candidatos = [...arquivos(path.join(RAIZ, "src"), /\.(ts|tsx|css)$/), ...arquivos(path.join(RAIZ, "public"), /\.(html|js|json|webmanifest)$/)];
    const usos = candidatos
      .filter((arquivo) => !PERMITIDOS.includes(path.relative(RAIZ, arquivo)))
      .flatMap((arquivo) =>
        readFileSync(arquivo, "utf-8")
          .split("\n")
          .map((texto, indice) => ({ arquivo: path.relative(RAIZ, arquivo), linha: indice + 1, texto: texto.trim() }))
          // O nome antigo em maiúsculas é o que aparecia na tela; chaves e domínios em minúsculas são identificadores mantidos.
          .filter(({ texto }) => /\bGIPE\b|Gestão Inteligente/.test(texto)),
      );

    expect(usos).toEqual([]);
  });

  it("a service worker usa um nome de cache novo, para a página offline antiga sair", () => {
    const sw = readFileSync(path.join(RAIZ, "public", "sw.js"), "utf-8");
    expect(sw).toContain('"murel-offline-v1"');
    expect(sw).not.toContain("gipe-offline");
  });
});
