// Copia worker, núcleo e dados do idioma do OCR (tesseract.js) para public/ocr, para que o leitor de placa
// não dependa de CDN de terceiros. Os arquivos são gerados (ficam fora do git) e rodam no postinstall.
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nodeModules = join(root, "node_modules");
const destino = join(root, "public", "ocr");

const arquivos = [
  ["tesseract.js/dist/worker.min.js", "worker.min.js"],
  // Núcleos só LSTM (o motor usado); o worker escolhe a variante conforme o suporte a SIMD do aparelho.
  ["tesseract.js-core/tesseract-core-lstm.wasm.js", "core/tesseract-core-lstm.wasm.js"],
  ["tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "core/tesseract-core-simd-lstm.wasm.js"],
  ["tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js", "core/tesseract-core-relaxedsimd-lstm.wasm.js"],
  ["@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "lang/eng.traineddata.gz"],
];

if (!existsSync(join(nodeModules, "tesseract.js"))) {
  console.log("[ocr] tesseract.js não instalado; nada a copiar.");
  process.exit(0);
}

rmSync(destino, { recursive: true, force: true });
for (const [origem, saida] of arquivos) {
  const alvo = join(destino, saida);
  mkdirSync(dirname(alvo), { recursive: true });
  copyFileSync(join(nodeModules, origem), alvo);
}
console.log(`[ocr] ${arquivos.length} arquivos copiados para public/ocr`);
