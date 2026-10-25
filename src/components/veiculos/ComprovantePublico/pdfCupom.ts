import type { jsPDF } from "jspdf";

// Cupom em coluna estreita (80 mm), comum ao comprovante da entrada e ao recibo da saída.
export const WIDTH = 80;
export const MARGIN = 6;
export const CONTENT = WIDTH - MARGIN * 2;

// Largura do símbolo da marca no cupom, em mm (proporção 3:2 do guia de marca).
const MARCA_LARGURA = 13;

// Marca Murel em vetor, em preto e centralizada: as três vagas em M, o carro na vaga do meio e a palavra "murel".
// Sem imagem nem fonte embutida, para o PDF continuar pequeno e nítido na impressão térmica. Devolve o y logo abaixo dela.
export function drawMarca(doc: jsPDF, y: number): number {
  const s = MARCA_LARGURA / 240;
  const altura = 160 * s;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  const palavra = "murel";
  const larguraPalavra = doc.getTextWidth(palavra);
  const espaco = 2.4;
  const x = (WIDTH - (MARCA_LARGURA + espaco + larguraPalavra)) / 2;

  // Vagas: um traço arredondado de 18 unidades do desenho.
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(18 * s);
  doc.setLineCap("round");
  doc.setLineJoin("round");
  doc.lines([[0, -116 * s], [200 * s, 0], [0, 116 * s]], x + 20 * s, y + 140 * s, [1, 1], "S", false);
  doc.line(x + 82 * s, y + 24 * s, x + 82 * s, y + 140 * s);
  doc.line(x + 158 * s, y + 24 * s, x + 158 * s, y + 140 * s);

  // Carro e vidros (os vidros são "furos": pintados da cor do papel).
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(x + 102 * s, y + 62 * s, 36 * s, 66 * s, 12 * s, 12 * s, "F");
  doc.setFillColor(255, 255, 255);
  const vidro = (pontos: [number, number][]) => {
    const [primeiro, ...resto] = pontos;
    doc.lines(
      resto.map(([px, py], i) => [(px - (i === 0 ? primeiro[0] : resto[i - 1][0])) * s, (py - (i === 0 ? primeiro[1] : resto[i - 1][1])) * s]),
      x + primeiro[0] * s,
      y + primeiro[1] * s,
      [1, 1],
      "F",
      true,
    );
  };
  vidro([[108, 87], [132, 87], [129.5, 76], [120, 74], [110.5, 76]]);
  vidro([[110, 112], [130, 112], [128, 119], [120, 120.5], [112, 119]]);

  // A mesma espessura e ponta de antes: o resto do cupom desenha linhas finas e tracejadas.
  doc.setLineCap("butt");
  doc.setLineJoin("miter");
  doc.setLineWidth(0.2);

  doc.setTextColor(0, 0, 0);
  doc.text(palavra, x + MARCA_LARGURA + espaco, y + altura * 0.72);
  return y + altura + 4;
}

export function formatPlaca(placa: string): string {
  return /^[A-Z]{3}[0-9]{4}$/.test(placa) ? `${placa.slice(0, 3)}-${placa.slice(3)}` : placa;
}

// jsPDF só desenha texto Latin-1: troca os caracteres fora dessa faixa por equivalentes.
export function toLatin1(text: string): string {
  return text.replace(/[—–]/g, "-").replace(/[^\u0000-ÿ]/g, "");
}

export async function drawQr(doc: jsPDF, text: string, x: number, y: number, size: number) {
  const QRCode = (await import("qrcode")).default;
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const count = modules.size;
  const cell = size / count;
  doc.setFillColor(0, 0, 0);
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (modules.get(row, col)) {
        // Pequena sobreposição evita frestas brancas entre módulos em alguns leitores de PDF.
        doc.rect(x + col * cell, y + row * cell, cell + 0.05, cell + 0.05, "F");
      }
    }
  }
}
