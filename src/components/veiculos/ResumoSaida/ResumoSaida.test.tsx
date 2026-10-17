import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatDateTime } from "@/components/caixa/format";
import { formatMinutos } from "@/components/precos/format";
import { renderWithTheme } from "@/test/render";
import { CATEGORIA_VEICULO } from "@/types/veiculo";
import type { SaidaConsulta } from "@/types/saida";
import { ResumoSaida } from "./ResumoSaida";

const consulta: SaidaConsulta = {
  patioId: 1,
  placa: "BRA2E19",
  categoria: CATEGORIA_VEICULO.CarroMedio,
  modelo: "ONIX",
  cor: "PRATA",
  codigoTicket: 482,
  sequencial: 12,
  mensalista: false,
  dataHoraEntrada: "2026-10-17T10:00:00",
  dataHoraSaida: "2026-10-17T12:35:00",
  minutosPermanencia: 155,
  rotatividadeId: 1,
  rotatividadeDescricao: "Rotativo",
  regra: 1,
  faixaMinutosLimite: null,
  horasAdicionais: null,
  valor: 20,
};

describe("ResumoSaida", () => {
  it("sem veículo mostra traços e nenhum valor", () => {
    renderWithTheme(<ResumoSaida consulta={null} />);
    expect(screen.getByText("Valor a cobrar")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it("mostra veículo, categoria, entrada, permanência e valor", () => {
    renderWithTheme(<ResumoSaida consulta={consulta} />);
    expect(screen.getByText("BRA2E19")).toBeInTheDocument();
    expect(screen.getByText("ONIX · PRATA")).toBeInTheDocument();
    expect(screen.getByText("Carro médio")).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(consulta.dataHoraEntrada))).toBeInTheDocument();
    expect(screen.getByText(formatMinutos(consulta.minutosPermanencia))).toBeInTheDocument();
    expect(screen.getByText(/R\$\s20,00/)).toBeInTheDocument();
  });

  it("omite modelo e cor ausentes sem escrever null", () => {
    renderWithTheme(<ResumoSaida consulta={{ ...consulta, modelo: null, cor: "AZUL" }} />);
    expect(screen.getByText("AZUL")).toBeInTheDocument();
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
  });

  it("identifica mensalista", () => {
    renderWithTheme(<ResumoSaida consulta={{ ...consulta, mensalista: true }} />);
    expect(screen.getByText("Mensalista")).toBeInTheDocument();
  });

  it("mostra 'Nada a cobrar' quando o valor é zero", () => {
    renderWithTheme(<ResumoSaida consulta={{ ...consulta, valor: 0 }} />);
    expect(screen.getByText("Nada a cobrar")).toBeInTheDocument();
  });

  it("enquanto busca mostra o carregamento anunciado e esconde os dados", () => {
    renderWithTheme(<ResumoSaida consulta={consulta} carregando />);
    expect(screen.getByRole("status", { name: "Buscando veículo" })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("ONIX · PRATA")).not.toBeInTheDocument();
  });

  it("quando o valor mudou, avisa e mostra o valor antigo riscado", () => {
    renderWithTheme(<ResumoSaida consulta={{ ...consulta, valor: 25 }} valorAnterior={20} />);
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent(/mudou de R\$\s20,00 para R\$\s25,00/);
    expect(alerta).toHaveTextContent("confirme novamente");
    expect(screen.getByText(/era R\$\s20,00, agora/)).toBeInTheDocument();
  });

  it("sem mudança de valor não mostra o aviso", () => {
    renderWithTheme(<ResumoSaida consulta={consulta} valorAnterior={null} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
