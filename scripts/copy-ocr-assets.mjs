// Copia o runtime WASM (módulo de apoio e binário) do onnxruntime-web para public/ocr/ort, para que o leitor de placa não dependa de CDN
// de terceiros. O arquivo é gerado (fica fora do git) e roda no postinstall. Os modelos ficam versionados em
// public/ocr/modelos.
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "node_modules", "onnxruntime-web", "dist");
const arquivos = ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"];
const destino = join(root, "public", "ocr", "ort");

if (!existsSync(join(dist, arquivos[1]))) {
  console.log("[ocr] onnxruntime-web não instalado; nada a copiar.");
  process.exit(0);
}

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
for (const arquivo of arquivos) {
  copyFileSync(join(dist, arquivo), join(destino, arquivo));
}
console.log(`[ocr] ${arquivos.length} arquivos do runtime WASM copiados para public/ocr/ort`);
