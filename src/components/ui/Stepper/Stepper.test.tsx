import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { Stepper } from "./Stepper";

const STEPS = ["Empresa", "Horários", "Titular"];

describe("Stepper", () => {
  it("sem onStepClick não renderiza botões e marca a etapa atual", () => {
    renderWithTheme(<Stepper steps={STEPS} currentStep={2} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Progresso do cadastro" })).toBeInTheDocument();
    expect(screen.getByText("Horários").closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("com onStepClick só as etapas concluídas viram botões", async () => {
    const onStepClick = vi.fn();
    renderWithTheme(<Stepper steps={STEPS} currentStep={3} onStepClick={onStepClick} />);

    expect(screen.getAllByRole("button")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Voltar para Empresa" }));
    expect(onStepClick).toHaveBeenCalledWith(1);
  });

  it("não torna a etapa atual nem as futuras interativas", () => {
    renderWithTheme(<Stepper steps={STEPS} currentStep={1} onStepClick={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
