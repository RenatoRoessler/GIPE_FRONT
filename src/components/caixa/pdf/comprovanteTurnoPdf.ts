import type { jsPDF } from "jspdf";
import { assinaturas, blocoContexto, cabecalho, CONTEUDO, novaFolha, PAGINA, rodape, tabela, texto } from "./desenho";
import { montarComprovanteTurno, type ComprovanteTurnoEntrada, type ComprovanteTurnoModelo } from "./modelos";

function desenhar(doc: jsPDF, modelo: ComprovanteTurnoModelo): void {
  let y = cabecalho(doc, modelo.empresa, modelo.titulo);
  y = blocoContexto(doc, modelo.contexto, y);

  const larguraForma = CONTEUDO - 3 * 40;
  y = tabela(
    doc,
    [
      { titulo: "Forma de pagamento", largura: larguraForma },
      { titulo: "Esperado", largura: 40, alinhar: "right" },
      { titulo: "Informado", largura: 40, alinhar: "right" },
      { titulo: "Diferença", largura: 40, alinhar: "right" },
    ],
    [
      ...modelo.formas.map((forma) => [forma.forma, forma.esperado, forma.informado, forma.diferenca]),
      ["Total", modelo.total.esperado, modelo.total.informado, modelo.total.diferenca],
    ],
    y,
    { negritoUltima: true },
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  y += 1;
  texto(doc, "No dinheiro, os valores não incluem o fundo de caixa.", PAGINA.margem, y);
  y += 6;

  if (modelo.observacao) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    texto(doc, "Observação", PAGINA.margem, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    y += texto(doc, modelo.observacao, PAGINA.margem, y, { maxLargura: CONTEUDO }) * 4.5;
  }

  assinaturas(doc, modelo.assinaturas, y);
  rodape(doc);
}

// Comprovante em A4 do fechamento do caixa ou da passagem de turno.
export async function criarComprovanteTurnoPdf(entrada: ComprovanteTurnoEntrada): Promise<jsPDF> {
  const doc = await novaFolha();
  desenhar(doc, montarComprovanteTurno(entrada));
  return doc;
}

export async function baixarComprovanteTurnoPdf(entrada: ComprovanteTurnoEntrada): Promise<void> {
  const doc = await criarComprovanteTurnoPdf(entrada);
  const prefixo = entrada.tipo === "fechamento" ? "fechamento-caixa" : "passagem-turno";
  const id = entrada.tipo === "fechamento" ? entrada.turno.caixaId : entrada.turno.turnoId;
  doc.save(`${prefixo}-${id}.pdf`);
}
