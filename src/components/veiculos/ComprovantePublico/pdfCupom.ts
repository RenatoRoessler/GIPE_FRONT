import type { jsPDF } from "jspdf";

// Cupom em coluna estreita (80 mm), comum ao comprovante da entrada e ao recibo da saída.
export const WIDTH = 80;
export const MARGIN = 6;
export const CONTENT = WIDTH - MARGIN * 2;

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
