import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { Carimbo } from "@/types/carimbo";
import { TicketCarimbado } from "./TicketCarimbado";

const CARIMBO: Carimbo = {
  estacionamento: "teste 2",
  placa: "TEP6I32",
  modelo: "Fusca",
  cor: "PRATA",
  categoria: 2,
  dataHoraEntrada: "2026-10-29T18:15:32.60593",
  rotatividadeId: 17,
  rotatividade: "convenio mercado 1",
  dataHoraConveniada: "2026-10-29T18:15:51.1460216",
};

describe("TicketCarimbado", () => {
  it("mostra o veículo, a tabela aplicada e o selo do convênio", () => {
    renderWithTheme(<TicketCarimbado carimbo={CARIMBO} onOutro={vi.fn()} />);

    expect(screen.getByRole("status", { name: "Resultado do carimbo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Ticket carimbado" })).toBeInTheDocument();
    expect(screen.getByText("Convênio")).toBeInTheDocument();
    expect(screen.getByText("TEP6I32")).toBeInTheDocument();
    expect(screen.getByText("Fusca · Prata")).toBeInTheDocument();
    expect(screen.getByText("teste 2")).toBeInTheDocument();
    expect(screen.getByText("Carro pequeno")).toBeInTheDocument();
    expect(screen.getByText("convenio mercado 1")).toBeInTheDocument();
    expect(screen.getByText("Entrada").nextElementSibling).toHaveTextContent(/29\/10\/(20)?26.*18:15/);
    expect(screen.getByText("Carimbado às").nextElementSibling).toHaveTextContent(/29\/10\/(20)?26.*18:15/);
  });

  it("leva o foco ao título para o resultado ser anunciado", () => {
    renderWithTheme(<TicketCarimbado carimbo={CARIMBO} onOutro={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Ticket carimbado" })).toHaveFocus();
  });

  it("campos que o back não mandou aparecem como traço", () => {
    renderWithTheme(
      <TicketCarimbado carimbo={{ ...CARIMBO, estacionamento: "", rotatividade: "", categoria: 0, dataHoraEntrada: "" }} onOutro={vi.fn()} />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });

  it("Carimbar outro ticket chama o retorno ao leitor", async () => {
    const onOutro = vi.fn();
    renderWithTheme(<TicketCarimbado carimbo={CARIMBO} onOutro={onOutro} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Carimbar outro ticket" }));

    expect(onOutro).toHaveBeenCalledTimes(1);
  });
});
