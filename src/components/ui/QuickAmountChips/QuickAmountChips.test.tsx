import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { QuickAmountChips } from "./QuickAmountChips";

const OPCOES = [
  { value: "exato", label: "Exato" },
  { value: "250", label: "R$ 250" },
  { value: "outro", label: "Outro" },
];

describe("QuickAmountChips", () => {
  it("é um grupo de rádios com a legenda como nome", () => {
    renderWithTheme(<QuickAmountChips legend="Cliente pagou com" options={OPCOES} value={null} onChange={() => {}} />);
    expect(screen.getByRole("group", { name: "Cliente pagou com" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "R$ 250" })).not.toBeChecked();
  });

  it("marca só a opção escolhida", () => {
    renderWithTheme(<QuickAmountChips legend="Cliente pagou com" options={OPCOES} value="exato" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "Exato" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Outro" })).not.toBeChecked();
  });

  it("avisa a opção tocada", async () => {
    const onChange = vi.fn();
    renderWithTheme(<QuickAmountChips legend="Cliente pagou com" options={OPCOES} value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "R$ 250" }));
    expect(onChange).toHaveBeenCalledWith("250");
  });

  it("não deixa escolher desabilitado", async () => {
    const onChange = vi.fn();
    renderWithTheme(<QuickAmountChips legend="Cliente pagou com" options={OPCOES} value={null} onChange={onChange} disabled />);
    await userEvent.click(screen.getByText("Exato"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
