import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { PrecoEtapasNav, type EtapaNav } from "./PrecoEtapasNav";

const ETAPAS: EtapaNav[] = [
  { titulo: "O básico", apoio: "Nome, tipo, vigência, categorias", estado: "completa" },
  { titulo: "Quando vale", apoio: "Dias e horários de cobrança", estado: "pendencia" },
  { titulo: "Quanto cobra", apoio: "Degraus, diária e tolerâncias", estado: "neutra" },
];

describe("PrecoEtapasNav", () => {
  it("marca só a etapa atual com aria-current", () => {
    renderWithTheme(<PrecoEtapasNav etapas={ETAPAS} atual={2} onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: /^Etapa 2/ })).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: /^Etapa 1/ })).not.toHaveAttribute("aria-current");
  });

  it("diz o estado de cada etapa no nome acessível", () => {
    renderWithTheme(<PrecoEtapasNav etapas={ETAPAS} atual={1} onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: "Etapa 1: O básico, completa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Etapa 2: Quando vale, com pendência" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Etapa 3: Quanto cobra, não preenchida" })).toBeInTheDocument();
  });

  it("chama onSelect com o número da etapa clicada", () => {
    const onSelect = vi.fn();
    renderWithTheme(<PrecoEtapasNav etapas={ETAPAS} atual={1} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /^Etapa 3/ }));
    expect(onSelect).toHaveBeenCalledWith(3);
  });
});
