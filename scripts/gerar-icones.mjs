// Gera os ícones do app (PNG) e o favicon a partir do símbolo da marca Murel.
// Uso: node scripts/gerar-icones.mjs
// Os arquivos gerados são versionados; o script não roda no build.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ASFALTO = "#0E1729";
const AMARELO = "#FFC20E";

// Símbolo do guia de marca (viewBox 240×160): três vagas em M e o carro na vaga do meio, com os vidros vazados.
function simbolo(x, y, largura) {
  const escala = largura / 240;
  return `
  <g transform="translate(${x} ${y}) scale(${escala})">
    <defs>
      <mask id="vidros" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="160">
        <rect width="240" height="160" fill="#fff"/>
        <path d="M108 87H132L129.5 76Q120 72.5 110.5 76Z" fill="#000" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
        <path d="M110 112H130L128 119Q120 121 112 119Z" fill="#000" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
      </mask>
    </defs>
    <path d="M20 140V24H220V140M82 24V140M158 24V140" fill="none" stroke="${AMARELO}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="102" y="62" width="36" height="66" rx="12" fill="${AMARELO}" mask="url(#vidros)"/>
  </g>`;
}

// Ícone quadrado: fundo asfalto e o símbolo centralizado. `proporcao` é a largura do símbolo sobre a do ícone.
function icone({ tamanho, proporcao, raio = 0 }) {
  const largura = tamanho * proporcao;
  const x = (tamanho - largura) / 2;
  const y = (tamanho - largura * (160 / 240)) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 ${tamanho} ${tamanho}">
  <rect width="${tamanho}" height="${tamanho}" rx="${raio}" fill="${ASFALTO}"/>${simbolo(x, y, largura)}
</svg>`;
}

async function png(svg, tamanho, destino) {
  const arquivo = path.join(RAIZ, destino);
  await mkdir(path.dirname(arquivo), { recursive: true });
  await sharp(Buffer.from(svg)).resize(tamanho, tamanho).png().toFile(arquivo);
  console.log(`${destino} (${tamanho}x${tamanho})`);
}

// "any": cantos arredondados como no guia (22% do lado). Maskable: sem cantos e com o símbolo dentro da zona
// segura (60% da largura, pois o sistema recorta até um círculo de 80% do lado). Apple: sem cantos, o iOS arredonda.
await png(icone({ tamanho: 512, proporcao: 0.69, raio: 112 }), 192, "public/icons/icon-192.png");
await png(icone({ tamanho: 512, proporcao: 0.69, raio: 112 }), 512, "public/icons/icon-512.png");
await png(icone({ tamanho: 512, proporcao: 0.6 }), 512, "public/icons/maskable-512.png");
await png(icone({ tamanho: 512, proporcao: 0.69 }), 180, "public/icons/apple-touch-icon.png");
await png(icone({ tamanho: 512, proporcao: 0.69, raio: 112 }), 64, "src/app/icon.png");

// Favicon vetorial: símbolo sobre fundo asfalto.
await writeFile(path.join(RAIZ, "src/app/icon.svg"), `${icone({ tamanho: 64, proporcao: 0.8, raio: 14 })}\n`);
console.log("src/app/icon.svg");
