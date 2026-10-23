import type { jsPDF } from "jspdf";
import { blocoContexto, cabecalho, novaFolha, PAGINA, rodape, tabela, texto } from "./desenho";
import { montarExtrato, type ExtratoEntrada, type ExtratoModelo } from "./modelos";

function desenhar(doc: jsPDF, modelo: ExtratoModelo): void {
  let y = cabecalho(doc, modelo.empresa, modelo.titulo);
  y = blocoContexto(doc, modelo.contexto, y);

  if (modelo.filtro) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    y += texto(doc, `Lista filtrada: ${modelo.filtro}`, PAGINA.margem, y) * 4.5 + 2;
  }

  y = tabela(
    doc,
    [
      { titulo: modelo.colunas[0], largura: 30 },
      { titulo: modelo.colunas[1], largura: 20 },
      { titulo: modelo.colunas[2], largura: 28 },
      { titulo: modelo.colunas[3], largura: 28 },
      { titulo: modelo.colunas[4], largura: 36 },
      { titulo: modelo.colunas[5], largura: 38, alinhar: "right" },
    ],
    modelo.linhas,
    y,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const sufixo = modelo.filtro ? " (da lista filtrada)" : "";
  texto(doc, `Entradas${sufixo}: ${modelo.totais.entradas}`, PAGINA.margem, y + 3);
  texto(doc, `Saídas e retiradas${sufixo}: ${modelo.totais.saidas}`, PAGINA.margem, y + 9);
  rodape(doc);
}

// Extrato do caixa em A4, com quebra de página e cabeçalho da tabela repetido.
export async function criarExtratoPdf(entrada: ExtratoEntrada): Promise<jsPDF> {
  const doc = await novaFolha();
  desenhar(doc, montarExtrato(entrada));
  return doc;
}

export async function baixarExtratoPdf(entrada: ExtratoEntrada): Promise<void> {
  const doc = await criarExtratoPdf(entrada);
  doc.save(`extrato-caixa-${entrada.caixa.caixaId}.pdf`);
}
