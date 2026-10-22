import type { jsPDF } from "jspdf";
import { formatDateTime } from "@/components/caixa/format";
import { formatCNPJ } from "@/lib/cnpj";
import { formatBRL } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import type { ReciboCliente } from "@/types/veiculo";
import { formatPermanencia } from "../ComprovantePublico/format";
import { CONTENT, drawQr, formatPlaca, MARGIN, toLatin1, WIDTH } from "../ComprovantePublico/pdfCupom";
import { valorDoRecibo } from "./format";

const LINK_QR_SIZE = 32;

type Row = { label: string; value: string };

function buildRows(recibo: ReciboCliente): Row[] {
  const veiculo = [recibo.modelo, recibo.cor].filter(Boolean).join(" · ");
  const valor = valorDoRecibo(recibo.valor);
  const mensalista = recibo.mensalista === true;
  const semCobranca = mensalista || valor === 0;

  const rows: Row[] = [
    { label: "Entrada", value: formatDateTime(recibo.dataEntrada) },
    { label: "Saída", value: formatDateTime(recibo.dataSaida) },
    { label: "Veículo", value: veiculo || "-" },
    { label: "Categoria", value: recibo.categoriaNome || "-" },
    { label: "Permanência", value: formatPermanencia(recibo.minutosPermanencia) },
  ];
  if (mensalista) {
    rows.push({ label: "Tipo", value: "Mensalista" });
  }
  if (semCobranca) {
    rows.push({ label: "Valor", value: "Sem cobrança" });
  } else {
    if (recibo.descricaoFormaPagamento) {
      rows.push({ label: "Pagamento", value: recibo.descricaoFormaPagamento });
    }
    rows.push({ label: "Total pago", value: formatBRL(valor) });
  }
  return rows;
}

// Desenha o recibo e devolve a altura usada.
async function render(doc: jsPDF, recibo: ReciboCliente, link: string): Promise<number> {
  const rows = buildRows(recibo);
  doc.setTextColor(0, 0, 0);

  const header: string[] = doc.splitTextToSize(toLatin1(recibo.razaoSocial), CONTENT);
  const address = [recibo.cnpj ? `CNPJ ${formatCNPJ(recibo.cnpj)}` : null, recibo.endereco, recibo.telefone ? formatPhone(recibo.telefone) : null]
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
  doc.text("Recibo de saida - Estacionamento", WIDTH / 2, y, { align: "center" });
  y += 4;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(MARGIN, y, WIDTH - MARGIN, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(formatPlaca(recibo.placa), WIDTH / 2, y, { align: "center" });

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
  // QR da página: abre este recibo no celular.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Recibo online", WIDTH / 2, y, { align: "center" });
  y += 3;
  await drawQr(doc, link, (WIDTH - LINK_QR_SIZE) / 2, y, LINK_QR_SIZE);
  y += LINK_QR_SIZE + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Escaneie para ver o recibo", WIDTH / 2, y, { align: "center" });
  return y + MARGIN;
}

// Monta o recibo da saída (empresa, veículo, tempo e valor, e o QR da página).
// A altura depende do conteúdo: mede numa página alta e refaz numa do tamanho exato.
export async function criarReciboSaidaPdf(recibo: ReciboCliente, link: string): Promise<jsPDF> {
  const { jsPDF: JsPdf } = await import("jspdf");
  const height = await render(new JsPdf({ unit: "mm", format: [WIDTH, 400] }), recibo, link);
  const doc = new JsPdf({ unit: "mm", format: [WIDTH, height] });
  await render(doc, recibo, link);
  return doc;
}

export async function baixarReciboSaidaPdf(recibo: ReciboCliente, link: string): Promise<void> {
  const doc = await criarReciboSaidaPdf(recibo, link);
  doc.save(`recibo-${recibo.placa}.pdf`);
}
