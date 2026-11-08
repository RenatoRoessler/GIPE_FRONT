import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { SITUACAO_FATURA } from "@/types/fatura";
import { fatura, item } from "../fixtures";
import { ItensFatura } from "./ItensFatura";

describe("ItensFatura", () => {
  it("lista as saídas na ordem recebida, com permanência, regra e os três valores", () => {
    renderWithTheme(<ItensFatura fatura={fatura()} itens={[item(), item({ patioConvenioId: 18, placa: "ABC1D23", modelo: null, categoria: 2, percentualConveniada: null, valorFixoConveniada: 12, valorConveniada: 12, valorTotal: 40, valorCliente: 28, minutosPermanencia: 45 })]} />);

    const linhas = screen.getAllByRole("row");
    // O primeiro é o cabeçalho.
    expect(linhas).toHaveLength(3);
    const primeira = within(linhas[1]);
    expect(primeira.getByText("YCC3U07")).toBeInTheDocument();
    expect(primeira.getByText("FUSION · Carro médio")).toBeInTheDocument();
    expect(primeira.getByText("07/11/2026, 08:10")).toBeInTheDocument();
    expect(primeira.getByText("até 07/11/2026, 17:40")).toBeInTheDocument();
    expect(primeira.getByText("9h 30min")).toBeInTheDocument();
    expect(primeira.getByText("50%")).toBeInTheDocument();
    expect(primeira.getByText("Tabela convênio")).toBeInTheDocument();
    expect(primeira.getByText("R$ 30,00")).toBeInTheDocument();
    expect(primeira.getAllByText("R$ 15,00")).toHaveLength(2);

    const segunda = within(linhas[2]);
    expect(segunda.getByText("ABC1D23")).toBeInTheDocument();
    expect(segunda.getByText("Carro pequeno")).toBeInTheDocument();
    expect(segunda.getByText("R$ 12,00 fixo")).toBeInTheDocument();
    expect(segunda.getByText("45min")).toBeInTheDocument();
  });

  it("o rodapé mostra a quantidade e o total da fatura", () => {
    renderWithTheme(<ItensFatura fatura={fatura({ quantidadeSaidas: 14, valorTotal: 1250 })} itens={[item()]} />);

    expect(screen.getByText("14 saídas")).toBeInTheDocument();
    expect(screen.getByText("Total da fatura R$ 1.250,00")).toBeInTheDocument();
  });

  it("a coluna da conveniada tem cabeçalho próprio", () => {
    renderWithTheme(<ItensFatura fatura={fatura()} itens={[item()]} />);

    expect(screen.getByRole("columnheader", { name: "Conveniada" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Total" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Cliente" })).toBeInTheDocument();
  });

  it("fatura cancelada troca a tabela pelo aviso de saídas em aberto", () => {
    renderWithTheme(<ItensFatura fatura={fatura({ situacao: SITUACAO_FATURA.Cancelada })} itens={[]} />);

    expect(screen.getByText("As saídas desta fatura voltaram a ficar em aberto e entram na próxima fatura.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("sem saídas numa fatura que não é cancelada, avisa em vez de mostrar tabela vazia", () => {
    renderWithTheme(<ItensFatura fatura={fatura()} itens={[]} />);

    expect(screen.getByText("Esta fatura não tem saídas listadas.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("ItensFatura no celular", () => {
  function celular() {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({ matches: true, media: query, addEventListener: () => {}, removeEventListener: () => {} })),
    );
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("troca a tabela por cartões, com resumo no topo e o total no fim", () => {
    celular();
    renderWithTheme(<ItensFatura fatura={fatura({ quantidadeSaidas: 2, valorTotal: 1250 })} itens={[item(), item({ patioConvenioId: 18, placa: "ABC1D23", modelo: null, valorConveniada: 1235 })]} />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("YCC3U07")).toBeInTheDocument();
    expect(screen.getByText("ABC1D23")).toBeInTheDocument();
    expect(screen.getByText("2 saídas · R$ 1.250,00")).toBeInTheDocument();
    expect(screen.getByText("Total da fatura R$ 1.250,00")).toBeInTheDocument();
  });

  it("fatura cancelada mantém o aviso, sem cartões", () => {
    celular();
    renderWithTheme(<ItensFatura fatura={fatura({ situacao: SITUACAO_FATURA.Cancelada })} itens={[]} />);

    expect(screen.getByText("As saídas desta fatura voltaram a ficar em aberto e entram na próxima fatura.")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("sem saídas listadas mantém o aviso", () => {
    celular();
    renderWithTheme(<ItensFatura fatura={fatura()} itens={[]} />);

    expect(screen.getByText("Esta fatura não tem saídas listadas.")).toBeInTheDocument();
  });
});
