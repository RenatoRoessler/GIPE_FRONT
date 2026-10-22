import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { ReciboConteudo, type ReciboData } from "./ReciboConteudo";

const data: ReciboData = {
  empresaNome: "Estacionamento Central",
  emitidoEm: "2026-10-17T12:36:00",
  placa: "BRA2E19",
  modelo: "ONIX",
  cor: "PRATA",
  categoria: 2,
  codigoTicket: 482,
  tabela: "Tabela padrão",
  dataHoraEntrada: "2026-10-17T10:00:00",
  dataHoraSaida: "2026-10-17T12:35:00",
  minutosPermanencia: 155,
  formaPagamento: 1,
  valor: 20,
  recebido: 50,
  troco: 30,
};

const LINK = "https://gipe.exemplo.com/recibo/ABCD1234EF";

describe("ReciboConteudo: QR do recibo", () => {
  it("com link mostra o QR e o endereço curto depois do total", () => {
    renderWithTheme(<ReciboConteudo data={{ ...data, link: LINK }} />);

    expect(screen.getByRole("img", { name: "QR code do recibo de saída" })).toBeInTheDocument();
    expect(screen.getByText("Leve o recibo no celular")).toBeInTheDocument();
    expect(screen.getByText("gipe.exemplo.com/recibo/ABCD1234EF")).toBeInTheDocument();

    const total = screen.getByText("Total pago");
    const qr = screen.getByText("Leve o recibo no celular");
    // O QR vem depois do total na ordem do documento.
    expect(total.compareDocumentPosition(qr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("recibo de mensalista também mostra o QR", () => {
    renderWithTheme(<ReciboConteudo data={{ ...data, mensalista: true, valor: 0, recebido: null, troco: null, link: LINK }} />);
    expect(screen.getByText("Sem cobrança")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "QR code do recibo de saída" })).toBeInTheDocument();
  });

  it.each([null, undefined])("sem link (%s) não mostra QR nem sobra espaço", (link) => {
    renderWithTheme(<ReciboConteudo data={{ ...data, link }} />);
    expect(screen.queryByRole("img", { name: "QR code do recibo de saída" })).not.toBeInTheDocument();
    expect(screen.queryByText("Leve o recibo no celular")).not.toBeInTheDocument();
    expect(screen.queryByText(/erro/i)).not.toBeInTheDocument();
  });
});

describe("ReciboConteudo", () => {
  it("avulso mostra pagamento, valor recebido, troco e total pago", () => {
    renderWithTheme(<ReciboConteudo data={data} />);
    expect(screen.getByText("Pagamento")).toBeInTheDocument();
    expect(screen.getByText("Valor recebido")).toBeInTheDocument();
    expect(screen.getByText("Troco")).toBeInTheDocument();
    expect(screen.getByText("Total pago")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s20,00/)).toBeInTheDocument();
    expect(screen.queryByText("Mensalista")).not.toBeInTheDocument();
    expect(screen.queryByText("Sem cobrança")).not.toBeInTheDocument();
  });

  it("mensalista mostra o tipo e 'Sem cobrança', sem forma de pagamento, recebido nem troco", () => {
    renderWithTheme(<ReciboConteudo data={{ ...data, mensalista: true, valor: 0, recebido: null, troco: null }} />);
    expect(screen.getByText("Mensalista")).toBeInTheDocument();
    expect(screen.getByText("Sem cobrança")).toBeInTheDocument();
    expect(screen.queryByText("Pagamento")).not.toBeInTheDocument();
    expect(screen.queryByText("Valor recebido")).not.toBeInTheDocument();
    expect(screen.queryByText("Troco")).not.toBeInTheDocument();
    expect(screen.queryByText("Total pago")).not.toBeInTheDocument();
  });
});
