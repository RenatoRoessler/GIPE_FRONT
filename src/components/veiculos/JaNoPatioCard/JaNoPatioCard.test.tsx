import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatDateTime } from "@/components/caixa/format";
import { renderWithTheme } from "@/test/render";
import { CATEGORIA_VEICULO } from "@/types/veiculo";
import { JaNoPatioCard, type JaNoPatioCardProps } from "./JaNoPatioCard";

const veiculo: JaNoPatioCardProps["veiculo"] = {
  categoria: CATEGORIA_VEICULO.Caminhonete,
  modelo: "ONIX",
  cor: "Vermelho",
  dataHoraEntrada: "2026-11-14T12:20:00",
  permanencia: "1d 11h 22min",
};

describe("JaNoPatioCard", () => {
  it("mostra o aviso, o veículo, a entrada e a permanência", () => {
    renderWithTheme(<JaNoPatioCard veiculo={veiculo} valor={{ status: "pronto", valor: 220 }} />);

    expect(screen.getByRole("heading", { name: "Este veículo já está no pátio" })).toBeInTheDocument();
    expect(screen.getByText("ONIX · Vermelho · Caminhonete")).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(veiculo.dataHoraEntrada))).toBeInTheDocument();
    expect(screen.getByText("1d 11h 22min")).toBeInTheDocument();
  });

  it("mostra o valor em destaque quando já foi calculado", () => {
    renderWithTheme(<JaNoPatioCard veiculo={veiculo} valor={{ status: "pronto", valor: 220 }} />);
    expect(screen.getByText(/^R\$\s220,00$/)).toBeInTheDocument();
  });

  it("enquanto calcula o valor, mostra o esqueleto anunciado", () => {
    renderWithTheme(<JaNoPatioCard veiculo={veiculo} valor={{ status: "carregando" }} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Calculando o valor…")).toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it("se o valor falhar, omite o valor e mantém entrada e permanência", () => {
    renderWithTheme(<JaNoPatioCard veiculo={veiculo} valor={{ status: "erro" }} />);
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("1d 11h 22min")).toBeInTheDocument();
  });

  it("omite modelo e cor ausentes sem escrever null", () => {
    renderWithTheme(<JaNoPatioCard veiculo={{ ...veiculo, modelo: null, cor: null }} valor={{ status: "erro" }} />);
    expect(screen.getByText("Caminhonete")).toBeInTheDocument();
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
  });
});
