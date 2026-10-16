import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { Tabs } from "./Tabs";

const TABS = [
  { id: "a", label: "Primeira" },
  { id: "b", label: "Segunda" },
  { id: "c", label: "Terceira" },
];

function Controlled({ onChange }: { onChange?: (id: string) => void }) {
  const [value, setValue] = useState("a");
  return (
    <Tabs
      tabs={TABS}
      value={value}
      aria-label="Seções"
      onChange={(id) => {
        setValue(id);
        onChange?.(id);
      }}
    >
      <p>Conteúdo de {value}</p>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("expõe os papéis ARIA e marca a aba ativa", () => {
    renderWithTheme(<Controlled />);
    expect(screen.getByRole("tablist", { name: "Seções" })).toBeInTheDocument();
    const [first, second] = screen.getAllByRole("tab");
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(second).toHaveAttribute("aria-selected", "false");
    expect(first).toHaveAttribute("tabindex", "0");
    expect(second).toHaveAttribute("tabindex", "-1");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", first.id);
    expect(first).toHaveAttribute("aria-controls", panel.id);
  });

  it("chama onChange ao clicar em uma aba e mostra só o painel ativo", async () => {
    const onChange = vi.fn();
    renderWithTheme(<Controlled onChange={onChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "Segunda" }));
    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getByText("Conteúdo de b")).toBeInTheDocument();
  });

  it("navega com setas, Home e End, circulando nas pontas", async () => {
    renderWithTheme(<Controlled />);
    screen.getByRole("tab", { name: "Primeira" }).focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Segunda" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Segunda" })).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Terceira" })).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Primeira" })).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Terceira" })).toHaveFocus();

    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Primeira" })).toHaveFocus();
  });
});
