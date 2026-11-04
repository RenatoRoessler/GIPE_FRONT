import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { VeiculoConveniada } from "@/types/patioConveniada";
import { VeiculoConveniadaCard } from "./VeiculoConveniadaCard";

const veiculo: VeiculoConveniada = {
  patioConvenioId: 12,
  empresaId: 37,
  estacionamento: "teste 2",
  placa: "OLG7Z94",
  modelo: "HB20S",
  cor: "PRATA",
  categoria: 3,
  dataEntrada: "2026-10-29T18:44:03.865522",
  dataValidacao: "2026-10-29T18:44:24.638665",
  usuarioIdConveniada: 37,
  usuarioConveniada: "teste login",
  rotatividadeId: 17,
  rotatividade: "convenio mercado 1",
  minutosPermanencia: 8571,
  permanencia: "5d 22h 51min",
};

describe("VeiculoConveniadaCard", () => {
  it("mostra placa, permanência, veículo, estacionamento, entrada, carimbo, quem carimbou e a tabela", () => {
    renderWithProviders(<VeiculoConveniadaCard veiculo={veiculo} />);
    expect(screen.getByText("OLG7Z94")).toBeInTheDocument();
    expect(screen.getByText("5d 22h 51min")).toBeInTheDocument();
    expect(screen.getByText(/HB20S · PRATA · Carro médio/)).toBeInTheDocument();
    expect(screen.getByText("teste 2")).toBeInTheDocument();
    expect(screen.getByText("Convênio")).toBeInTheDocument();
    expect(screen.getByText(/^Entrada 29\/10\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/^Carimbo 29\/10\/2026.*por teste login$/)).toBeInTheDocument();
    expect(screen.getByText("Tabela convenio mercado 1")).toBeInTheDocument();
  });

  it("o leitor de tela ouve uma frase só", () => {
    renderWithProviders(<VeiculoConveniadaCard veiculo={veiculo} />);
    expect(
      screen.getByLabelText("OLG7Z94, HB20S prata, Carro médio, em teste 2, 5d 22h 51min no pátio, mais de 3 dias"),
    ).toBeInTheDocument();
  });

  it("permanência de 3 dias ou mais ganha o selo com texto", () => {
    renderWithProviders(<VeiculoConveniadaCard veiculo={veiculo} />);
    expect(screen.getByText("Mais de 3 dias")).toBeInTheDocument();
  });

  it("permanência curta não tem o selo", () => {
    renderWithProviders(<VeiculoConveniadaCard veiculo={{ ...veiculo, minutosPermanencia: 30, permanencia: "0h 30min" }} />);
    expect(screen.queryByText("Mais de 3 dias")).not.toBeInTheDocument();
  });

  it("não é link nem botão", () => {
    renderWithProviders(<VeiculoConveniadaCard veiculo={veiculo} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("tolera dados ausentes", () => {
    renderWithProviders(
      <VeiculoConveniadaCard
        veiculo={{ ...veiculo, modelo: "", cor: "", estacionamento: "", usuarioConveniada: "", rotatividade: "", permanencia: "", dataEntrada: "" }}
      />,
    );
    expect(screen.queryByText(/^Tabela/)).not.toBeInTheDocument();
    expect(screen.getByText("Entrada —")).toBeInTheDocument();
    expect(screen.getByText(/^Carimbo 29\/10\/2026[^·]*$/)).toBeInTheDocument();
  });
});
