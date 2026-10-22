import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { SaidaConsulta } from "@/types/saida";
import { ReciboSaidaStep, type SaidaResultado } from "./ReciboSaidaStep";

vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn().mockRejectedValue(new Error("sem empresa")) }));

const consulta = {
  patioId: 7,
  placa: "BRA2E19",
  categoria: 2,
  modelo: "ONIX",
  cor: "PRATA",
  codigoTicket: 482,
  sequencial: 12,
  mensalista: true,
  dataHoraEntrada: "2026-10-17T10:00:00",
  dataHoraSaida: "2026-10-17T12:35:00",
  minutosPermanencia: 155,
  rotatividadeDescricao: null,
  valor: 20,
} as SaidaConsulta;

const resultado: SaidaResultado = {
  saida: {
    patioId: 7,
    placa: "BRA2E19",
    dataHoraEntrada: "2026-10-17T10:00:00",
    dataHoraSaida: "2026-10-17T12:36:00",
    minutosPermanencia: 156,
    valor: 0,
    formaPagamento: 1,
  },
  recebido: null,
  troco: null,
  emitidoEm: "2026-10-17T12:36:00",
};

function renderStep(c: SaidaConsulta) {
  return renderWithProviders(<ReciboSaidaStep consulta={c} resultado={resultado} onConcluir={() => {}} />);
}

describe("ReciboSaidaStep: QR do recibo", () => {
  const comCodigo: SaidaResultado = { ...resultado, saida: { ...resultado.saida, tokenRecibo: "ABCD1234EF" } };

  it("monta o link da página pública a partir do código do recibo, na tela e na impressão", () => {
    renderWithProviders(<ReciboSaidaStep consulta={consulta} resultado={comCodigo} onConcluir={() => {}} />);

    // O recibo aparece duas vezes: na tela e no nó usado só na impressão.
    expect(screen.getAllByRole("img", { name: "QR code do recibo de saída" })).toHaveLength(2);
    expect(screen.getAllByText(`${window.location.host}/recibo/ABCD1234EF`)).toHaveLength(2);
  });

  it("codifica o código do recibo no endereço", () => {
    const estranho: SaidaResultado = { ...resultado, saida: { ...resultado.saida, tokenRecibo: "AB CD/12" } };
    renderWithProviders(<ReciboSaidaStep consulta={consulta} resultado={estranho} onConcluir={() => {}} />);
    expect(screen.getAllByText(`${window.location.host}/recibo/AB%20CD%2F12`).length).toBeGreaterThan(0);
  });

  it.each([null, undefined, ""])("sem código do recibo (%s) não mostra QR e o recibo continua normal", (tokenRecibo) => {
    renderWithProviders(
      <ReciboSaidaStep consulta={consulta} resultado={{ ...resultado, saida: { ...resultado.saida, tokenRecibo } }} onConcluir={() => {}} />,
    );

    expect(screen.queryByRole("img", { name: "QR code do recibo de saída" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Saída registrada");
    expect(screen.getAllByText("Sem cobrança").length).toBeGreaterThan(0);
  });

  it("recibo de avulso com código também mostra o QR, e os dados de pagamento continuam", () => {
    renderWithProviders(
      <ReciboSaidaStep consulta={{ ...consulta, mensalista: false }} resultado={comCodigo} onConcluir={() => {}} />,
    );
    expect(screen.getAllByRole("img", { name: "QR code do recibo de saída" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pagamento").length).toBeGreaterThan(0);
  });
});

describe("ReciboSaidaStep", () => {
  it("repassa a condição de mensalista ao recibo", () => {
    renderStep(consulta);
    expect(screen.getAllByText("Sem cobrança").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pagamento")).not.toBeInTheDocument();
  });

  it("avulso mantém o recibo com forma de pagamento", () => {
    renderStep({ ...consulta, mensalista: false });
    expect(screen.getAllByText("Pagamento").length).toBeGreaterThan(0);
    expect(screen.queryByText("Sem cobrança")).not.toBeInTheDocument();
  });
});
