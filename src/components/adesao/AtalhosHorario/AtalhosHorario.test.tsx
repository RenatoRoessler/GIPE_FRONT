import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { EMPTY_BUSINESS_HOURS_DATA } from "@/types/adesao";
import { aplicar24Horas, aplicarTodosOsDias } from "../horarios";
import { AtalhosHorario } from "./AtalhosHorario";

describe("AtalhosHorario", () => {
  it("marca como pressionado o atalho que corresponde aos horários atuais", () => {
    renderWithTheme(<AtalhosHorario hours={EMPTY_BUSINESS_HOURS_DATA} onAplicar={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Seg–Sex 08–18" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Todos os dias" })).toHaveAttribute("aria-pressed", "false");
  });

  it("aplica o atalho escolhido", async () => {
    const onAplicar = vi.fn();
    renderWithTheme(<AtalhosHorario hours={EMPTY_BUSINESS_HOURS_DATA} onAplicar={onAplicar} />);

    await userEvent.click(screen.getByRole("button", { name: "Todos os dias" }));
    expect(onAplicar).toHaveBeenLastCalledWith(aplicarTodosOsDias());

    await userEvent.click(screen.getByRole("button", { name: "24 horas" }));
    expect(onAplicar).toHaveBeenLastCalledWith(aplicar24Horas());
  });

  it("copia a segunda para os outros dias", async () => {
    const onAplicar = vi.fn();
    renderWithTheme(<AtalhosHorario hours={EMPTY_BUSINESS_HOURS_DATA} onAplicar={onAplicar} />);

    await userEvent.click(screen.getByRole("button", { name: "Copiar segunda para os outros dias" }));
    const { horarios } = onAplicar.mock.calls[0][0];
    expect(horarios).toHaveLength(7);
    expect(horarios.every((dia: { horarioAbertura: string }) => dia.horarioAbertura === "08:00")).toBe(true);
  });

  it("desabilita todos os atalhos", () => {
    renderWithTheme(<AtalhosHorario hours={EMPTY_BUSINESS_HOURS_DATA} onAplicar={vi.fn()} disabled />);
    for (const botao of screen.getAllByRole("button")) expect(botao).toBeDisabled();
  });
});
