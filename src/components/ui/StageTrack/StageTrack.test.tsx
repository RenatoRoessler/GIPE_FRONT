import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { StageTrack, type StageTrackProps } from "./StageTrack";

const stages: StageTrackProps["stages"] = [
  { label: "Cadastro", state: "done" },
  { label: "Contrato", state: "current" },
  { label: "Pagamento", state: "todo" },
];

describe("StageTrack", () => {
  it("é uma lista com nome acessível e uma etapa por item", () => {
    renderWithTheme(<StageTrack stages={stages} label="Situação de Maria" />);
    const list = screen.getByRole("list", { name: "Situação de Maria" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("marca só a etapa atual com aria-current=step", () => {
    renderWithTheme(<StageTrack stages={stages} label="Situação" />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[2]).not.toHaveAttribute("aria-current");
  });

  it("diz o estado de cada etapa em texto", () => {
    renderWithTheme(
      <StageTrack
        stages={[
          { label: "Cadastro", state: "done" },
          { label: "Contrato", state: "attention" },
          { label: "Pagamento", state: "todo" },
        ]}
        label="Situação"
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Cadastro: concluída");
    expect(items[1]).toHaveTextContent("Contrato: requer atenção");
    expect(items[2]).toHaveTextContent("Pagamento: pendente");
  });

  it("no tamanho sm os rótulos continuam no DOM para o leitor de tela", () => {
    renderWithTheme(<StageTrack stages={stages} size="sm" label="Situação" />);
    expect(screen.getByText("Contrato")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[1]).toHaveTextContent("Contrato: atual");
  });

  it("desenha o alerta só na etapa que requer atenção", () => {
    const { container } = renderWithTheme(
      <StageTrack stages={[{ label: "Contrato", state: "attention" }, { label: "Pagamento", state: "todo" }]} label="S" />,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });
});
