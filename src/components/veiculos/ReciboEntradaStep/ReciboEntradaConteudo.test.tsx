import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { ReciboEntradaConteudo, type ReciboEntradaData } from "./ReciboEntradaConteudo";

const data: ReciboEntradaData = {
  empresaNome: "Estacionamento Central",
  placa: "ABC1D23",
  modelo: "ONIX",
  cor: "AZUL",
  categoria: 2,
  sequencial: 7,
  tabela: "Tabela padrão",
  operador: "Maria",
  dataHoraEntrada: "2026-10-17T10:06:06.2094",
  link: "https://gipe.exemplo.com/comprovante/227SUSYV",
};

describe("ReciboEntradaConteudo", () => {
  it("mostra os dados da entrada, o QR e o link curto", () => {
    renderWithTheme(<ReciboEntradaConteudo data={data} />);
    expect(screen.getByText("Estacionamento Central")).toBeInTheDocument();
    expect(screen.getByText("ABC1D23")).toBeInTheDocument();
    expect(screen.getByText("ONIX · AZUL")).toBeInTheDocument();
    expect(screen.getByText("Tarifa: Tabela padrão")).toBeInTheDocument();
    expect(screen.getByText("Operador: Maria")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "QR code do comprovante de entrada" })).toBeInTheDocument();
    expect(screen.getByText("gipe.exemplo.com/comprovante/227SUSYV")).toBeInTheDocument();
  });

  it("identifica a entrada de mensalista, em texto que também sai na impressão", () => {
    renderWithTheme(<ReciboEntradaConteudo data={{ ...data, mensalista: true }} />);
    expect(screen.getByText("Mensalista")).toBeInTheDocument();
  });

  it("não mostra o tipo quando a entrada é de avulso", () => {
    renderWithTheme(<ReciboEntradaConteudo data={{ ...data, mensalista: false }} />);
    expect(screen.queryByText("Mensalista")).not.toBeInTheDocument();
    expect(screen.queryByText("Tipo")).not.toBeInTheDocument();
  });

  it("sai sem QR quando a entrada não tem token", () => {
    renderWithTheme(<ReciboEntradaConteudo data={{ ...data, link: null }} />);
    expect(screen.queryByRole("img", { name: "QR code do comprovante de entrada" })).not.toBeInTheDocument();
    expect(screen.getByText("ABC1D23")).toBeInTheDocument();
  });
});
