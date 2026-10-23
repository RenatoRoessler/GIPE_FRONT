import type { jsPDF } from "jspdf";
import { formatCNPJ } from "@/lib/cnpj";
import { toLatin1 } from "@/components/veiculos/ComprovantePublico/pdfCupom";
import type { Contexto, EmpresaPdf } from "./modelos";

// Folha A4 em retrato, em milímetros.
export const PAGINA = { largura: 210, altura: 297, margem: 15 } as const;
export const CONTEUDO = PAGINA.largura - PAGINA.margem * 2;

export async function novaFolha(): Promise<jsPDF> {
  const { jsPDF: JsPdf } = await import("jspdf");
  const doc = new JsPdf({ unit: "mm", format: "a4" });
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  return doc;
}

export function texto(doc: jsPDF, valor: string, x: number, y: number, opcoes?: { align?: "left" | "right" | "center"; maxLargura?: number }): number {
  const linhas: string[] = opcoes?.maxLargura ? doc.splitTextToSize(toLatin1(valor), opcoes.maxLargura) : [toLatin1(valor)];
  doc.text(linhas, x, y, { align: opcoes?.align });
  return linhas.length;
}

// Empresa, título do documento e linha divisória; devolve o próximo y livre.
export function cabecalho(doc: jsPDF, empresa: EmpresaPdf, titulo: string): number {
  let y = PAGINA.margem + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  texto(doc, empresa?.razaoSocial ?? "Estacionamento", PAGINA.margem, y);
  if (empresa?.cnpj) {
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    texto(doc, `CNPJ ${formatCNPJ(empresa.cnpj)}`, PAGINA.margem, y);
  }
  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  texto(doc, titulo, PAGINA.margem, y);
  y += 4;
  doc.setLineWidth(0.4);
  doc.line(PAGINA.margem, y, PAGINA.largura - PAGINA.margem, y);
  return y + 6;
}

export function blocoContexto(doc: jsPDF, contexto: Contexto[], yInicial: number): number {
  let y = yInicial;
  doc.setFontSize(10);
  for (const item of contexto) {
    doc.setFont("helvetica", "normal");
    texto(doc, item.rotulo, PAGINA.margem, y);
    doc.setFont("helvetica", "bold");
    texto(doc, item.valor, PAGINA.margem + 55, y, { maxLargura: CONTEUDO - 55 });
    y += 5.5;
  }
  return y + 5;
}

export type ColunaTabela = { titulo: string; largura: number; alinhar?: "left" | "right" };

// Tabela simples com quebra de página; repete o cabeçalho da tabela nas páginas seguintes. Devolve o próximo y livre.
export function tabela(doc: jsPDF, colunas: ColunaTabela[], linhas: string[][], yInicial: number, opcoes?: { negritoUltima?: boolean }): number {
  const limite = PAGINA.altura - PAGINA.margem - 10;
  let y = yInicial;

  const posicaoX = (indice: number) => PAGINA.margem + colunas.slice(0, indice).reduce((soma, coluna) => soma + coluna.largura, 0);
  const desenharTitulos = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    colunas.forEach((coluna, indice) => {
      const x = coluna.alinhar === "right" ? posicaoX(indice) + coluna.largura - 1 : posicaoX(indice) + 1;
      texto(doc, coluna.titulo, x, y, { align: coluna.alinhar === "right" ? "right" : "left" });
    });
    y += 2;
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margem, y, PAGINA.largura - PAGINA.margem, y);
    y += 4.5;
  };

  desenharTitulos();
  linhas.forEach((linha, indiceLinha) => {
    const ultima = indiceLinha === linhas.length - 1 && opcoes?.negritoUltima;
    doc.setFont("helvetica", ultima ? "bold" : "normal");
    doc.setFontSize(9);
    const quebradas = linha.map((celula, indice) => doc.splitTextToSize(toLatin1(celula), colunas[indice].largura - 2) as string[]);
    const altura = Math.max(1, ...quebradas.map((parte) => parte.length)) * 4.2 + 1.8;
    if (y + altura > limite) {
      doc.addPage();
      y = PAGINA.margem + 4;
      desenharTitulos();
      doc.setFont("helvetica", ultima ? "bold" : "normal");
      doc.setFontSize(9);
    }
    quebradas.forEach((partes, indice) => {
      const direita = colunas[indice].alinhar === "right";
      const x = direita ? posicaoX(indice) + colunas[indice].largura - 1 : posicaoX(indice) + 1;
      doc.text(partes, x, y, { align: direita ? "right" : "left" });
    });
    y += altura;
    doc.setLineWidth(0.1);
    doc.line(PAGINA.margem, y - 3, PAGINA.largura - PAGINA.margem, y - 3);
  });
  return y + 2;
}

export function rodape(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  const geradoEm = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
  for (let pagina = 1; pagina <= total; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    texto(doc, `Gerado em ${geradoEm}`, PAGINA.margem, PAGINA.altura - 8);
    texto(doc, `Página ${pagina} de ${total}`, PAGINA.largura - PAGINA.margem, PAGINA.altura - 8, { align: "right" });
  }
}

// Linhas de assinatura lado a lado, no fim do conteúdo (ou numa página nova se não couber).
export function assinaturas(doc: jsPDF, nomes: string[], yInicial: number): number {
  let y = yInicial + 18;
  if (y > PAGINA.altura - PAGINA.margem - 20) {
    doc.addPage();
    y = PAGINA.margem + 25;
  }
  const largura = (CONTEUDO - 10 * (nomes.length - 1)) / nomes.length;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  nomes.forEach((nome, indice) => {
    const x = PAGINA.margem + indice * (largura + 10);
    doc.setLineWidth(0.2);
    doc.line(x, y, x + largura, y);
    texto(doc, nome, x + largura / 2, y + 4.5, { align: "center" });
  });
  return y + 8;
}
