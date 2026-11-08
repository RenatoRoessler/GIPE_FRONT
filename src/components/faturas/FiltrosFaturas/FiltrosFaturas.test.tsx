import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { Conveniada } from "@/types/conveniada";
import { SITUACAO_FATURA, type FaturaFiltros } from "@/types/fatura";
import { FiltrosFaturas } from "./FiltrosFaturas";

const conveniada = (id: number, nomeFantasia: string, ativo = true): Conveniada => ({
  empresaConvenioId: id,
  empresaConveniadaId: id,
  empresaGuid: `g${id}`,
  razaoSocial: `${nomeFantasia} LTDA`,
  nomeFantasia,
  cnpj: "11222333000181",
  telefone: "11987654321",
  endereco: { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" },
  ativo,
  dataCriacao: "2026-03-12T10:00:00",
});

const CONVENIADAS = [conveniada(53, "Auto Peças"), conveniada(54, "Transportes", false)];
const SEM_FILTROS: FaturaFiltros = { empresaConveniadaId: null, situacao: null, pagina: 1 };

function celular(ativo: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({ matches: ativo, media: query, addEventListener: () => {}, removeEventListener: () => {} })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderizar(filtros: FaturaFiltros = SEM_FILTROS) {
  const onChange = vi.fn();
  renderWithTheme(<FiltrosFaturas filtros={filtros} conveniadas={CONVENIADAS} onChange={onChange} />);
  return onChange;
}

describe("FiltrosFaturas no computador", () => {
  it("mostra o campo Conveniada com Todas e as quatro situações", () => {
    renderizar();
    expect(screen.getByLabelText("Conveniada")).toHaveDisplayValue("Todas");
    expect(screen.getByRole("radio", { name: "Abertas" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Transportes (encerrado)" })).toBeInTheDocument();
  });

  it("não mostra a linha Filtrando nem com filtro ativo", () => {
    renderizar({ ...SEM_FILTROS, situacao: SITUACAO_FATURA.Aberta });
    expect(screen.queryByText(/Filtrando/)).not.toBeInTheDocument();
  });

  it("trocar a situação volta à primeira página", async () => {
    const onChange = renderizar({ ...SEM_FILTROS, pagina: 3 });
    await userEvent.click(screen.getByRole("radio", { name: "Pagas" }));
    expect(onChange).toHaveBeenCalledWith({ empresaConveniadaId: null, situacao: SITUACAO_FATURA.Paga, pagina: 1 });
  });

  it("trocar a conveniada volta à primeira página", async () => {
    const onChange = renderizar({ ...SEM_FILTROS, pagina: 2 });
    await userEvent.selectOptions(screen.getByLabelText("Conveniada"), "53");
    expect(onChange).toHaveBeenCalledWith({ empresaConveniadaId: 53, situacao: null, pagina: 1 });
  });
});

describe("FiltrosFaturas no celular", () => {
  it("a primeira opção diz Todas as conveniadas e o rótulo segue acessível", () => {
    celular(true);
    renderizar();
    expect(screen.getByLabelText("Conveniada")).toHaveDisplayValue("Todas as conveniadas");
  });

  it("sem filtro ativo não mostra Filtrando nem Limpar", () => {
    celular(true);
    renderizar();
    expect(screen.queryByText(/Filtrando/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpar" })).not.toBeInTheDocument();
  });

  it("com filtros ativos diz quais são e Limpar zera tudo", async () => {
    celular(true);
    const onChange = renderizar({ empresaConveniadaId: 53, situacao: SITUACAO_FATURA.Aberta, pagina: 2 });
    expect(screen.getByText("Filtrando: Abertas · Auto Peças")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar" }));
    expect(onChange).toHaveBeenCalledWith(SEM_FILTROS);
  });

  it("com só a situação ativa lista só ela", () => {
    celular(true);
    renderizar({ ...SEM_FILTROS, situacao: SITUACAO_FATURA.Cancelada });
    expect(screen.getByText("Filtrando: Canceladas")).toBeInTheDocument();
  });
});
