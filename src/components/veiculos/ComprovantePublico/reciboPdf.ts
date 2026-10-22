import type { jsPDF } from "jspdf";
import { formatDateTime } from "@/components/caixa/format";
import { formatBRL } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import type { ComprovanteCliente } from "@/types/veiculo";
import { formatPermanencia } from "./format";
import { CONTENT, drawQr, formatPlaca, MARGIN, toLatin1, WIDTH } from "./pdfCupom";

const QR_SIZE = 44;
const LINK_QR_SIZE = 28;

type Row = { label: string; value: string };

function buildRows(comprovante: ComprovanteCliente): Row[] {
  const veiculo = [comprovante.modelo, comprovante.cor].filter(Boolean).join(" · ");
  return [
    { label: "Entrada", value: formatDateTime(comprovante.dataHoraEntrada) },
    { label: "Veículo", value: veiculo || "-" },
    { label: "Categoria", value: comprovante.categoriaDescricao || "-" },
    { label: "Permanência", value: formatPermanencia(comprovante.minutosPermanencia) },
    { label: "Valor até agora", value: formatBRL(comprovante.valorAtual) },
  ];
}

// Desenha o recibo e devolve a altura usada.
async function render(doc: jsPDF, comprovante: ComprovanteCliente, link: string): Promise<number> {
  const rows = buildRows(comprovante);
  doc.setTextColor(0, 0, 0);

  const header: string[] = [];
  header.push(...doc.splitTextToSize(toLatin1(comprovante.razaoSocial), CONTENT));
  const address = [comprovante.endereco, comprovante.telefone ? formatPhone(comprovante.telefone) : null]
    .filter(Boolean)
    .join(" · ");

  let y = MARGIN + 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(header, WIDTH / 2, y, { align: "center" });
  y += header.length * 5.5;

  if (address) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const lines: string[] = doc.splitTextToSize(toLatin1(address), CONTENT);
    doc.text(lines, WIDTH / 2, y, { align: "center" });
    y += lines.length * 3.6;
  }

  y += 2;
  doc.setFontSize(9);
  doc.text("Comprovante de entrada - Estacionamento", WIDTH / 2, y, { align: "center" });
  y += 4;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(MARGIN, y, WIDTH - MARGIN, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(formatPlaca(comprovante.placa), WIDTH / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Ticket Nº ${comprovante.sequencial}`, WIDTH / 2, y, { align: "center" });

  y += 8;
  doc.setFontSize(9);
  for (const row of rows) {
    doc.setFont("helvetica", "normal");
    doc.text(toLatin1(row.label), MARGIN, y);
    doc.setFont("helvetica", "bold");
    const lines: string[] = doc.splitTextToSize(toLatin1(row.value), CONTENT * 0.62);
    doc.text(lines, WIDTH - MARGIN, y, { align: "right" });
    y += Math.max(1, lines.length) * 4.4 + 1;
  }

  doc.setLineDashPattern([1, 1], 0);
  doc.line(MARGIN, y, WIDTH - MARGIN, y);

  y += 5;
  // QR de saída: o conteúdo é o token da entrada.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Saída do veículo", WIDTH / 2, y, { align: "center" });
  y += 3;
  await drawQr(doc, comprovante.token, (WIDTH - QR_SIZE) / 2, y, QR_SIZE);
  y += QR_SIZE + 5;
  doc.setFontSize(11);
  doc.text(toLatin1(comprovante.token), WIDTH / 2, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Apresente este QR code ao operador na saída", WIDTH / 2, y, { align: "center" });
  y += 8;

  // QR da página: abre este comprovante com os valores atualizados.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Comprovante online", WIDTH / 2, y, { align: "center" });
  y += 3;
  await drawQr(doc, link, (WIDTH - LINK_QR_SIZE) / 2, y, LINK_QR_SIZE);
  y += LINK_QR_SIZE + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Escaneie para ver o comprovante atualizado", WIDTH / 2, y, { align: "center" });
  y += 4;
  doc.text(toLatin1(`Valor calculado em ${formatDateTime(comprovante.dataHoraConsulta)}`), WIDTH / 2, y, { align: "center" });
  return y + MARGIN;
}

// Monta o recibo do comprovante (dados do estacionamento, do veículo, tempo e valor, e o QR da página).
// A altura depende do conteúdo: mede numa página alta e refaz numa do tamanho exato.
export async function criarReciboPdf(comprovante: ComprovanteCliente, link: string): Promise<jsPDF> {
  const { jsPDF: JsPdf } = await import("jspdf");
  const height = await render(new JsPdf({ unit: "mm", format: [WIDTH, 400] }), comprovante, link);
  const doc = new JsPdf({ unit: "mm", format: [WIDTH, height] });
  await render(doc, comprovante, link);
  return doc;
}

export async function baixarReciboPdf(comprovante: ComprovanteCliente, link: string): Promise<void> {
  const doc = await criarReciboPdf(comprovante, link);
  doc.save(`comprovante-${comprovante.placa}.pdf`);
}
