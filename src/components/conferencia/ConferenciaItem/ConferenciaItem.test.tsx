import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { itemConferido, itemNaoEncontrado, itemPendente } from "@/lib/api/services/conferenciaPatio.fixture";
import { fromItemResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { renderWithTheme } from "@/test/render";
import { SITUACAO_ITEM, type ItemConferencia } from "@/types/conferenciaPatio";
import { ConferenciaItem } from "./ConferenciaItem";

function item(bruto: Record<string, unknown>): ItemConferencia {
  return fromItemResponse(bruto) as ItemConferencia;
}

function montar(bruto: Record<string, unknown>, ocupado = false) {
  const onMarcar = vi.fn();
  renderWithTheme(
    <ul>
      <ConferenciaItem item={item(bruto)} ocupado={ocupado} onMarcar={onMarcar} />
    </ul>,
  );
  return onMarcar;
}

describe("ConferenciaItem", () => {
  it("mostra a placa, o modelo e a cor, a chave e o tipo em texto", () => {
    montar(itemPendente);
    expect(screen.getByText("AAA1A11")).toBeInTheDocument();
    expect(screen.getByText("Gol · Prata")).toBeInTheDocument();
    expect(screen.getByText(/Chave A1 · Avulso · desde/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Avulso" })).toBeInTheDocument();
  });

  it("sem chave diz 'Sem chave'; mensalista e conveniado aparecem por extenso", () => {
    montar({ ...itemPendente, chave: null, mensalista: true });
    expect(screen.getByText(/Sem chave · Mensal · desde/)).toBeInTheDocument();
  });

  it("conveniado vale mais que mensalista", () => {
    montar({ ...itemPendente, mensalista: true, conveniado: true });
    expect(screen.getByRole("img", { name: "Conveniado" })).toBeInTheDocument();
  });

  it("modelo e cor ausentes viram traço, sem quebrar", () => {
    montar({ ...itemPendente, modelo: null, cor: null });
    expect(screen.getByText("— · —")).toBeInTheDocument();
  });

  describe("pendente", () => {
    it("oferece 'Está no pátio' e 'Não achei' com a placa no nome", async () => {
      const onMarcar = montar(itemPendente);
      const user = userEvent.setup();

      await user.click(screen.getByRole("button", { name: "Está no pátio: AAA1A11" }));
      expect(onMarcar).toHaveBeenLastCalledWith(expect.objectContaining({ patioConferenciaItemId: 1 }), SITUACAO_ITEM.Conferido);

      await user.click(screen.getByRole("button", { name: "Não achei: AAA1A11" }));
      expect(onMarcar).toHaveBeenLastCalledWith(expect.objectContaining({ patioConferenciaItemId: 1 }), SITUACAO_ITEM.NaoEncontrado);
    });

    it("trava os botões enquanto uma marcação está em andamento", () => {
      montar(itemPendente, true);
      expect(screen.getByRole("button", { name: "Está no pátio: AAA1A11" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Não achei: AAA1A11" })).toBeDisabled();
    });
  });

  describe("conferido", () => {
    it("mostra a hora e a origem e permite desfazer", async () => {
      const onMarcar = montar(itemConferido);
      expect(screen.getByText(/Conferido .*· manual/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Está no pátio/ })).not.toBeInTheDocument();

      await userEvent.setup().click(screen.getByRole("button", { name: "Desfazer: BBB2B22" }));
      expect(onMarcar).toHaveBeenCalledWith(expect.objectContaining({ placa: "BBB2B22" }), SITUACAO_ITEM.Pendente);
    });

    it("origem câmera", () => {
      montar({ ...itemConferido, origem: 1 });
      expect(screen.getByText(/· câmera/)).toBeInTheDocument();
    });
  });

  describe("não encontrado", () => {
    it("diz em texto e permite procurar de novo", async () => {
      const onMarcar = montar(itemNaoEncontrado);
      expect(screen.getByText("Não encontrado")).toBeInTheDocument();

      await userEvent.setup().click(screen.getByRole("button", { name: "Procurar de novo: CCC3C33" }));
      expect(onMarcar).toHaveBeenCalledWith(expect.objectContaining({ placa: "CCC3C33" }), SITUACAO_ITEM.Pendente);
    });
  });

  it("baixado e saiu não têm ação", () => {
    montar({ ...itemPendente, situacao: SITUACAO_ITEM.Baixado });
    expect(screen.getByText("Saída registrada pela conferência")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
