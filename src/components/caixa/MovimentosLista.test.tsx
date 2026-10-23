import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithTheme } from "@/test/render";
import type { Movimento, Turno } from "@/types/caixa";
import { MovimentosLista } from "./MovimentosLista";

let seq = 1;
function mov(extra: Partial<Movimento> = {}): Movimento {
  return {
    movimentoId: seq++,
    dataHora: "2026-10-23T09:00:00",
    tipo: "entrada",
    valor: 10,
    formaPagamento: 1,
    turnoId: 1,
    usuario: "Ana",
    motivo: null,
    ...extra,
  };
}

function turno(turnoId: number, usuario: string): Turno {
  return {
    turnoId,
    caixaId: 1,
    usuarioId: turnoId,
    usuario,
    usuarioIdFechamento: null,
    dataHoraInicio: "2026-10-23T08:00:00",
    dataHoraFim: null,
    valorFundoCaixa: 100,
    status: 1,
    saldoCaixa: 0,
    totalEntradas: null,
    totalSaidas: null,
    totalSaida: null,
    saldoCaixaInformado: null,
    totalDiferenca: null,
    observacao: null,
    disponivelSangria: null,
    formasPagamento: [],
  };
}

const linhas = () => screen.getAllByRole("row").slice(1);

describe("MovimentosLista", () => {
  const lista = [
    mov({ tipo: "entrada", valor: 25, formaPagamento: 2, usuario: "Ana", turnoId: 1 }),
    mov({ tipo: "saida", valor: 5, usuario: "Beto", turnoId: 2 }),
    mov({ tipo: "sangria", valor: 80, motivo: "Cofre", usuario: "Beto", turnoId: 2 }),
  ];

  it("mostra data, tipo, forma, usuário, motivo e valor com sinal", () => {
    renderWithTheme(<MovimentosLista movimentos={lista} turnos={[turno(1, "Ana"), turno(2, "Beto")]} />);

    expect(linhas()).toHaveLength(3);
    expect(linhas()[0]).toHaveTextContent("Entrada");
    expect(linhas()[0]).toHaveTextContent("Pix");
    expect(linhas()[0]).toHaveTextContent("+ R$ 25,00");
    expect(linhas()[0]).toHaveTextContent("Turno de Ana");
    expect(linhas()[1]).toHaveTextContent("Saída");
    expect(linhas()[1]).toHaveTextContent("− R$ 5,00");
    expect(linhas()[2]).toHaveTextContent("Sangria");
    expect(linhas()[2]).toHaveTextContent("Cofre");
  });

  it("os botões de tipo mostram a contagem e filtram, com aria-pressed", async () => {
    const user = userEvent.setup();
    renderWithTheme(<MovimentosLista movimentos={lista} />);

    const todos = screen.getByRole("button", { name: /Todos/ });
    expect(todos).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Sangrias/ })).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: /Sangrias/ }));

    expect(screen.getByRole("button", { name: /Sangrias/ })).toHaveAttribute("aria-pressed", "true");
    expect(todos).toHaveAttribute("aria-pressed", "false");
    expect(linhas()).toHaveLength(1);
    expect(linhas()[0]).toHaveTextContent("Cofre");
    expect(screen.getByRole("status")).toHaveTextContent("1 movimento");
  });

  it("filtra por turno e combina com o tipo", async () => {
    const user = userEvent.setup();
    renderWithTheme(<MovimentosLista movimentos={lista} turnos={[turno(1, "Ana"), turno(2, "Beto")]} />);

    await user.selectOptions(screen.getByLabelText("Turno"), "2");
    expect(linhas()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /Saídas/ }));
    expect(linhas()).toHaveLength(1);
    expect(linhas()[0]).toHaveTextContent("Saída");
  });

  it("sem turnos não mostra o filtro por turno", () => {
    renderWithTheme(<MovimentosLista movimentos={lista} />);

    expect(screen.queryByLabelText("Turno")).not.toBeInTheDocument();
  });

  it("filtro sem resultado oferece limpar", async () => {
    const user = userEvent.setup();
    renderWithTheme(<MovimentosLista movimentos={[mov({ tipo: "entrada" })]} />);

    await user.click(screen.getByRole("button", { name: /Sangrias/ }));
    expect(screen.getByText("Nenhum movimento com esses filtros.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(linhas()).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Todos/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("pagina de 20 em 20", async () => {
    const user = userEvent.setup();
    const muitos = Array.from({ length: 45 }, (_, i) => mov({ valor: i + 1 }));
    renderWithTheme(<MovimentosLista movimentos={muitos} />);

    expect(linhas()).toHaveLength(20);
    expect(screen.getByText(/Mostrando 1–20 de 45/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(screen.getByText(/Mostrando 21–40 de 45/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Sangrias/ }));
    expect(screen.getByText("Nenhum movimento com esses filtros.")).toBeInTheDocument();
  });

  it("mudar o filtro volta para a primeira página", async () => {
    const user = userEvent.setup();
    const muitos = Array.from({ length: 45 }, (_, i) => mov({ valor: i + 1 }));
    renderWithTheme(<MovimentosLista movimentos={muitos} />);
    await user.click(screen.getByRole("button", { name: "Próxima" }));

    await user.click(screen.getByRole("button", { name: /Entradas/ }));

    expect(screen.getByText(/Mostrando 1–20 de 45/)).toBeInTheDocument();
  });

  it("entrega à área de ações o que está filtrado", async () => {
    const user = userEvent.setup();
    const renderAcoes = vi.fn(() => <span>acoes</span>);
    renderWithTheme(<MovimentosLista movimentos={lista} renderAcoes={renderAcoes} />);
    expect(renderAcoes).toHaveBeenLastCalledWith(lista, false);

    await user.click(screen.getByRole("button", { name: /Saídas/ }));

    const [filtrados, filtrado] = renderAcoes.mock.calls[renderAcoes.mock.calls.length - 1] as unknown as [Movimento[], boolean];
    expect(filtrados).toHaveLength(1);
    expect(filtrado).toBe(true);
    expect(screen.getByText("acoes")).toBeInTheDocument();
  });

  it("vazio mostra a mensagem recebida", () => {
    renderWithTheme(<MovimentosLista movimentos={[]} vazio="Nada por aqui." />);

    expect(screen.getByText("Nada por aqui.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("carregando mostra esqueleto com texto para leitor de tela", () => {
    renderWithTheme(<MovimentosLista movimentos={undefined} />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando movimentos");
  });

  it("erro mostra a mensagem e tenta de novo", async () => {
    const onRetry = vi.fn();
    renderWithTheme(<MovimentosLista movimentos={undefined} isError error={new ApiError("server")} onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Erro no servidor");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("403 mostra o aviso de permissão, sem nova tentativa", () => {
    renderWithTheme(<MovimentosLista movimentos={undefined} isError error={new ApiError("forbidden")} onRetry={vi.fn()} />);

    expect(within(screen.getByRole("alert")).getByText("Você não tem permissão para acessar esta página.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o início" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});
