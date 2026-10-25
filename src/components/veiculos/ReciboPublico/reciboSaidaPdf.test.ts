import { describe, expect, it } from "vitest";
import type { ReciboCliente } from "@/types/veiculo";
import { criarReciboSaidaPdf } from "./reciboSaidaPdf";

const recibo: ReciboCliente = {
  cnpj: "66326569000150",
  razaoSocial: "Estacionamento Central",
  endereco: "Avenida Sete de Setembro, 123",
  telefone: "54996384949",
  placa: "HZB5188",
  modelo: "Fusion",
  cor: "preto",
  categoriaId: 7,
  categoriaNome: "Carro grande",
  dataEntrada: "2026-10-14T20:01:32.468252",
  dataSaida: "2026-10-22T11:41:32.432745",
  minutosPermanencia: 11019,
  permanencia: "7d 15h 39min",
  valor: 15100,
  formaPagamento: 1,
  descricaoFormaPagamento: "Dinheiro",
  token: "ABCD1234EF",
  notaFiscalSolicitada: false,
};

const LINK = "https://gipe.exemplo.com/recibo/ABCD1234EF";

describe("criarReciboSaidaPdf", () => {
  it("gera um PDF de uma página de 80 mm, com altura ajustada ao conteúdo", async () => {
    const doc = await criarReciboSaidaPdf(recibo, LINK);
    const bytes = new Uint8Array(doc.output("arraybuffer"));
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe("%PDF-");
    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.internal.pageSize.getWidth()).toBe(80);
    expect(doc.internal.pageSize.getHeight()).toBeLessThan(220);
  });

  it("traz a marca Murel no topo, desenhada em vetor, sem imagem nem fonte extra", async () => {
    const conteudo = (await criarReciboSaidaPdf(recibo, LINK)).output();

    expect(conteudo).toContain("(murel) Tj");
    expect(conteudo).not.toContain("/Subtype /Image");
    expect(conteudo.indexOf("(murel) Tj")).toBeLessThan(conteudo.indexOf(`(${recibo.razaoSocial}) Tj`));
  });

  it("aceita campos vazios sem quebrar", async () => {
    const doc = await criarReciboSaidaPdf(
      { ...recibo, telefone: null, endereco: null, modelo: null, cor: null, descricaoFormaPagamento: null },
      LINK,
    );
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it("recibo de mensalista também é gerado, em uma página", async () => {
    const doc = await criarReciboSaidaPdf({ ...recibo, mensalista: true, valor: 0, descricaoFormaPagamento: null }, LINK);
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it("recibo sem cobrança é mais curto que o com cobrança (sem forma de pagamento nem total)", async () => {
    const comCobranca = await criarReciboSaidaPdf(recibo, LINK);
    const semCobranca = await criarReciboSaidaPdf({ ...recibo, valor: 0 }, LINK);
    expect(semCobranca.internal.pageSize.getHeight()).toBeLessThanOrEqual(comCobranca.internal.pageSize.getHeight());
  });
});
