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
