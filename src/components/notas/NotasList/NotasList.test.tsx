import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { formatDateTime } from "@/components/caixa/format";
import { ApiError } from "@/lib/api/errors";
import { renderWithTheme } from "@/test/render";
import type { NotaFiscal } from "@/types/notaFiscal";
import { NotasList, type NotasListProps } from "./NotasList";

function nota(extra: Partial<NotaFiscal> = {}): NotaFiscal {
  return {
    notaFiscalId: 1,
    valor: 15100,
    dataSolicitacao: "2026-10-22T10:00:00",
    dataLancamento: null,
    documento: "52998224725",
    email: "maria@exemplo.com",
    placa: "HZB5188",
    ...extra,
  };
}

function renderLista(props: Partial<NotasListProps> = {}) {
  const onRetry = vi.fn();
  renderWithTheme(
    <NotasList tipo="pendentes" data={[nota()]} isPending={false} isError={false} error={null} isFetching={false} onRetry={onRetry} {...props} />,
  );
  return { onRetry };
}

describe("NotasList", () => {
  it("carregando mostra o esqueleto anunciado", () => {
    renderLista({ data: undefined, isPending: true });
    expect(screen.getByRole("status", { name: "Carregando notas" })).toBeInTheDocument();
  });

  it("mostra a nota com cliente, documento formatado, placa e valor", () => {
    renderLista();

    expect(screen.getByRole("table", { name: "Notas fiscais pendentes" })).toBeInTheDocument();
    expect(screen.getByText("maria@exemplo.com")).toBeInTheDocument();
    expect(screen.getByText("529.982.247-25")).toBeInTheDocument();
    expect(screen.getByText("HZB-5188")).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s15\.100,00/).length).toBeGreaterThan(0);
    expect(screen.getByText(formatDateTime("2026-10-22T10:00:00"))).toBeInTheDocument();
  });

  it("o resumo traz a quantidade e o total em reais", () => {
    renderLista({ data: [nota({ notaFiscalId: 1, valor: 100 }), nota({ notaFiscalId: 2, valor: 50.5 })] });
    expect(screen.getByRole("status")).toHaveTextContent("2 notas pendentes");
    expect(screen.getByRole("status")).toHaveTextContent(/R\$\s150,50/);
  });

  it("pendentes: as mais antigas primeiro", () => {
    renderLista({
      data: [
        nota({ notaFiscalId: 1, email: "nova@exemplo.com", dataSolicitacao: "2026-10-22T10:00:00" }),
        nota({ notaFiscalId: 2, email: "antiga@exemplo.com", dataSolicitacao: "2026-10-20T10:00:00" }),
      ],
    });
    const linhas = screen.getAllByRole("row").slice(1);
    expect(linhas[0]).toHaveTextContent("antiga@exemplo.com");
    expect(linhas[1]).toHaveTextContent("nova@exemplo.com");
  });

  it("lançadas: mostra a coluna do lançamento e as mais recentes primeiro", () => {
    renderLista({
      tipo: "lancadas",
      data: [
        nota({ notaFiscalId: 1, email: "velha@exemplo.com", dataLancamento: "2026-10-05T10:00:00" }),
        nota({ notaFiscalId: 2, email: "recente@exemplo.com", dataLancamento: "2026-10-20T10:00:00" }),
      ],
    });

    expect(screen.getByRole("table", { name: "Notas fiscais lançadas" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Lançada em" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("recente@exemplo.com");
  });

  it("pendentes não têm a coluna do lançamento", () => {
    renderLista({ data: [nota({ dataLancamento: "2026-10-05T10:00:00" })] });
    expect(screen.queryByRole("columnheader", { name: "Lançada em" })).not.toBeInTheDocument();
  });

  it("só mostra as colunas para as quais há dado, sem escrever null", () => {
    renderLista({ data: [nota({ email: null, documento: null, placa: null, valor: null })] });

    expect(screen.queryByRole("columnheader", { name: "Cliente" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Saída" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Valor" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Solicitada em" })).toBeInTheDocument();
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
  });

  it("campo ausente numa linha vira traço, sem quebrar a tabela", () => {
    renderLista({ data: [nota({ notaFiscalId: 1 }), nota({ notaFiscalId: 2, email: null, documento: null, placa: null, valor: null })] });
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });

  it("vazio nas pendentes", () => {
    renderLista({ data: [] });
    expect(screen.getByText("Nenhuma nota pendente.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("vazio nas lançadas sugere ampliar o período", () => {
    renderLista({ tipo: "lancadas", data: [] });
    expect(screen.getByText("Nenhuma nota lançada neste período.")).toBeInTheDocument();
    expect(screen.getByText("Tente ampliar o período.")).toBeInTheDocument();
  });

  it("erro mostra o motivo e deixa tentar de novo", async () => {
    const { onRetry } = renderLista({ data: undefined, isPending: false, isError: true, error: new ApiError("server", "Falhou.", 500) });

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar as notas pendentes. Falhou.");
    await userEvent.setup().click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("403 mostra só o aviso de permissão, sem nova tentativa", () => {
    renderLista({ data: undefined, isError: true, error: new ApiError("forbidden", undefined, 403) });

    expect(screen.getByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
