import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useAppForm } from "@/components/form";
import { renderWithTheme } from "@/test/render";
import type { PrecoHorarioValues } from "@/types/preco";
import { GradeHorarios } from "./GradeHorarios";
import { FaixaRapida } from "./FaixaRapida";

function Harness({ inicial = [] }: { inicial?: PrecoHorarioValues[] }) {
  const form = useAppForm({ defaultValues: { horarios: inicial } });
  return (
    <>
      <GradeHorarios form={form} />
      <form.Subscribe selector={(state) => state.values.horarios}>
        {(horarios) => (
          <output aria-label="gravado">
            {horarios.map((h) => `${h.diaSemana}:${h.horaInicio}-${h.horaFim}${h.ativo ? "" : "!"}`).join("|")}
          </output>
        )}
      </form.Subscribe>
    </>
  );
}

async function escolherDias(...nomes: string[]) {
  for (const nome of nomes) {
    await userEvent.click(screen.getByRole("button", { name: nome }));
  }
}

async function digitar(rotulo: string, valor: string) {
  const campo = screen.getByLabelText(rotulo);
  await userEvent.clear(campo);
  await userEvent.type(campo, valor);
}

describe("FaixaRapida", () => {
  it("sem dia escolhido o botão Aplicar fica desabilitado", async () => {
    renderWithTheme(<FaixaRapida onAplicar={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeDisabled();
    await escolherDias("Segunda-feira");
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeEnabled();
    await escolherDias("Segunda-feira");
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeDisabled();
  });

  it("desabilita Aplicar com hora inválida ou intervalo vazio", async () => {
    renderWithTheme(<FaixaRapida onAplicar={vi.fn()} />);
    await escolherDias("Segunda-feira");
    await digitar("Até (hora)", "25");
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeDisabled();
    expect(screen.getByText("Use de 0 a 24")).toBeInTheDocument();
    await digitar("Até (hora)", "8");
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeDisabled();
  });

  it("chama onAplicar com os dias escolhidos e o intervalo", async () => {
    const onAplicar = vi.fn();
    renderWithTheme(<FaixaRapida onAplicar={onAplicar} />);
    await escolherDias("Segunda-feira", "Domingo");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(onAplicar).toHaveBeenCalledWith([2, 1], 8, 18);
  });
});

describe("GradeHorarios com faixa rápida", () => {
  it("aplica Seg–Sex 8–18 e grava um horário por dia", async () => {
    renderWithTheme(<Harness />);
    await escolherDias("Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(screen.getByLabelText("gravado")).toHaveTextContent("2:08:00-18:00|3:08:00-18:00|4:08:00-18:00|5:08:00-18:00|6:08:00-18:00");
    expect(screen.getByRole("button", { name: "Segunda-feira, 08h" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Segunda-feira, 18h" })).toHaveAttribute("aria-pressed", "false");
  });

  it("intervalo que cruza a meia-noite liga 22–23 e 0–5 no mesmo dia", async () => {
    renderWithTheme(<Harness />);
    await escolherDias("Sábado");
    await digitar("De (hora)", "22");
    await digitar("Até (hora)", "6");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(screen.getByLabelText("gravado")).toHaveTextContent("7:00:00-06:00|7:22:00-23:59");
  });

  it("preserva horários que a grade não desenha e os dias não escolhidos", async () => {
    const fora: PrecoHorarioValues = { diaSemana: "4", horaInicio: "08:30", horaFim: "12:00", dataInicio: "", dataFim: "", ativo: true };
    const sexta: PrecoHorarioValues = { diaSemana: "6", horaInicio: "09:00", horaFim: "10:00", dataInicio: "", dataFim: "", ativo: true };
    renderWithTheme(<Harness inicial={[fora, sexta]} />);
    await escolherDias("Segunda-feira");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    const gravado = within(screen.getByLabelText("gravado"));
    expect(gravado.getByText(/2:08:00-18:00/)).toBeInTheDocument();
    expect(gravado.getByText(/6:09:00-10:00/)).toBeInTheDocument();
    expect(gravado.getByText(/4:08:30-12:00/)).toBeInTheDocument();
  });
});
