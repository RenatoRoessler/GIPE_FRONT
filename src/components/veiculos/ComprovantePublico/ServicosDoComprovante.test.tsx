import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { STATUS_SERVICO, type ServicoDoComprovante } from "@/types/servico";
import { ServicosDoComprovante } from "./ServicosDoComprovante";

const servico = (nome: string, status: ServicoDoComprovante["status"], extra: Partial<ServicoDoComprovante> = {}): ServicoDoComprovante => ({
  nome,
  valorCentavos: 3000,
  status,
  previsaoEm: null,
  prontoEm: null,
  ...extra,
});

describe("ServicosDoComprovante", () => {
  it.each([[undefined], [[]]])("sem serviços (%j) não mostra nada", (servicos) => {
    const { container } = renderWithProviders(<ServicosDoComprovante servicos={servicos} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("mostra o progresso, o status em texto, os horários e o valor de cada serviço", () => {
    renderWithProviders(
      <ServicosDoComprovante
        servicos={[
          servico("Lavagem simples", STATUS_SERVICO.EmExecucao, { previsaoEm: "2026-11-11T22:20:00" }),
          servico("Aspiração interna", STATUS_SERVICO.Pronto, { valorCentavos: 2000, prontoEm: "2026-11-11T21:40:00" }),
        ]}
      />,
    );

    const secao = screen.getByRole("region", { name: "Seus serviços" });
    expect(within(secao).getByRole("heading", { name: "Seus serviços" })).toBeInTheDocument();
    expect(within(secao).getByText("1 de 2 prontos")).toBeInTheDocument();
    expect(within(secao).getByRole("progressbar", { name: "Serviços prontos" })).toHaveAttribute("aria-valuenow", "1");
    expect(within(secao).getByRole("progressbar")).toHaveAttribute("aria-valuemax", "2");
    expect(within(secao).getByText("Em andamento · previsão 22:20")).toBeInTheDocument();
    expect(within(secao).getByText("Pronto às 21:40")).toBeInTheDocument();
    expect(within(secao).getByText("R$ 30,00")).toBeInTheDocument();
    expect(within(secao).getByText("R$ 20,00")).toBeInTheDocument();
  });

  it("com todos prontos, a barra fecha e a contagem acompanha", () => {
    renderWithProviders(<ServicosDoComprovante servicos={[servico("A", STATUS_SERVICO.Pronto), servico("B", STATUS_SERVICO.Pronto)]} />);

    expect(screen.getByText("2 de 2 prontos")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  });

  it("nenhum pronto ainda: a barra fica vazia", () => {
    renderWithProviders(<ServicosDoComprovante servicos={[servico("A", STATUS_SERVICO.Aguardando)]} />);

    expect(screen.getByText("0 de 1 prontos")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("sem horário do back, mostra só o status, sem inventar", () => {
    renderWithProviders(<ServicosDoComprovante servicos={[servico("Lavagem", STATUS_SERVICO.EmExecucao), servico("Cera", STATUS_SERVICO.Pronto), servico("Polimento", STATUS_SERVICO.Aguardando)]} />);

    expect(screen.getByText("Em andamento")).toBeInTheDocument();
    expect(screen.getByText("Pronto")).toBeInTheDocument();
    expect(screen.getByText("Na fila")).toBeInTheDocument();
    expect(screen.queryByText(/previsão|às \d/)).not.toBeInTheDocument();
  });

  it("a lista anuncia as mudanças com aria-live", () => {
    renderWithProviders(<ServicosDoComprovante servicos={[servico("A", STATUS_SERVICO.Aguardando)]} />);

    expect(screen.getByRole("list")).toHaveAttribute("aria-live", "polite");
  });
});
