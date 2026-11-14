import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { MOTIVOS_RAPIDOS, MotivosRapidos } from "./MotivosRapidos";

describe("MotivosRapidos", () => {
  it("mostra os quatro motivos mais comuns, nenhum marcado de início", () => {
    renderWithProviders(<MotivosRapidos valor="" onEscolher={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Motivos mais comuns" })).toBeInTheDocument();
    expect(MOTIVOS_RAPIDOS).toEqual(["Cliente desistiu", "Cliente com pressa", "Sem horário hoje", "Lançado por engano"]);
    for (const motivo of MOTIVOS_RAPIDOS) {
      expect(screen.getByRole("button", { name: motivo })).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("escolher um motivo o entrega a quem chama", async () => {
    const onEscolher = vi.fn();
    renderWithProviders(<MotivosRapidos valor="" onEscolher={onEscolher} />);

    await userEvent.click(screen.getByRole("button", { name: "Sem horário hoje" }));

    expect(onEscolher).toHaveBeenCalledWith("Sem horário hoje");
  });

  it("marca o chip igual ao motivo que está no campo, e só ele", () => {
    renderWithProviders(<MotivosRapidos valor="Cliente desistiu" onEscolher={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Cliente desistiu" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Cliente com pressa" })).toHaveAttribute("aria-pressed", "false");
  });

  it("um motivo escrito à mão não marca chip nenhum", () => {
    renderWithProviders(<MotivosRapidos valor="Quebrou a máquina" onEscolher={vi.fn()} />);

    for (const motivo of MOTIVOS_RAPIDOS) {
      expect(screen.getByRole("button", { name: motivo })).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("desabilitado (durante o envio), os chips não respondem", async () => {
    const onEscolher = vi.fn();
    renderWithProviders(<MotivosRapidos valor="" onEscolher={onEscolher} desabilitado />);

    await userEvent.click(screen.getByRole("button", { name: "Cliente desistiu" }));

    expect(screen.getByRole("button", { name: "Cliente desistiu" })).toBeDisabled();
    expect(onEscolher).not.toHaveBeenCalled();
  });
});
