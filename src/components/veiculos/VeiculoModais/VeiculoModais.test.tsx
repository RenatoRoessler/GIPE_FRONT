import { renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

// Os modais em si são testados à parte: aqui só interessa quando o host os abre e o que ele faz com o aviso.
vi.mock("../EntradaVeiculoModal", () => ({
  EntradaVeiculoModal: ({ onClose, onSuccess }: { onClose: () => void; onSuccess: (message: string) => void }) => (
    <div role="dialog" aria-label="Modal de entrada">
      <button type="button" onClick={() => onSuccess("Entrada registrada.")}>
        concluir entrada
      </button>
      <button type="button" onClick={onClose}>
        fechar entrada
      </button>
    </div>
  ),
}));
vi.mock("../SaidaVeiculoModal", () => ({
  SaidaVeiculoModal: ({ onClose, onSuccess }: { onClose: () => void; onSuccess: (message: string) => void }) => (
    <div role="dialog" aria-label="Modal de saída">
      <button type="button" onClick={() => onSuccess("Saída realizada com sucesso.")}>
        concluir saída
      </button>
      <button type="button" onClick={onClose}>
        fechar saída
      </button>
    </div>
  ),
}));

import { useVeiculoModais, VeiculoModaisProvider } from ".";

function Gatilhos() {
  const { abrirEntrada, abrirSaida } = useVeiculoModais();
  return (
    <>
      <button type="button" onClick={abrirEntrada}>
        abrir entrada
      </button>
      <button type="button" onClick={abrirSaida}>
        abrir saída
      </button>
    </>
  );
}

function renderHost() {
  return renderWithTheme(
    <VeiculoModaisProvider>
      <Gatilhos />
    </VeiculoModaisProvider>,
  );
}

describe("VeiculoModaisProvider", () => {
  it("não mostra nenhum modal até alguém pedir", () => {
    renderHost();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre e fecha o modal de entrada", async () => {
    const user = userEvent.setup();
    renderHost();

    await user.click(screen.getByRole("button", { name: "abrir entrada" }));
    expect(screen.getByRole("dialog", { name: "Modal de entrada" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Modal de saída" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "fechar entrada" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre e fecha o modal de saída", async () => {
    const user = userEvent.setup();
    renderHost();

    await user.click(screen.getByRole("button", { name: "abrir saída" }));
    expect(screen.getByRole("dialog", { name: "Modal de saída" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Modal de entrada" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "fechar saída" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("permite abrir o outro modal depois de fechar o primeiro", async () => {
    const user = userEvent.setup();
    renderHost();

    await user.click(screen.getByRole("button", { name: "abrir entrada" }));
    await user.click(screen.getByRole("button", { name: "fechar entrada" }));
    await user.click(screen.getByRole("button", { name: "abrir saída" }));
    expect(screen.getByRole("dialog", { name: "Modal de saída" })).toBeInTheDocument();
  });

  it("mostra o aviso de sucesso do modal e ele sobrevive ao fechamento do modal", async () => {
    const user = userEvent.setup();
    renderHost();

    await user.click(screen.getByRole("button", { name: "abrir entrada" }));
    await user.click(screen.getByRole("button", { name: "concluir entrada" }));
    await user.click(screen.getByRole("button", { name: "fechar entrada" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Entrada registrada.")).toBeInTheDocument();
  });

  it("o aviso da saída também aparece", async () => {
    const user = userEvent.setup();
    renderHost();

    await user.click(screen.getByRole("button", { name: "abrir saída" }));
    await user.click(screen.getByRole("button", { name: "concluir saída" }));
    expect(screen.getByText("Saída realizada com sucesso.")).toBeInTheDocument();
  });
});

describe("useVeiculoModais", () => {
  it("lança um erro claro fora do provider", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useVeiculoModais())).toThrow("useVeiculoModais precisa estar dentro de <VeiculoModaisProvider>.");
    erro.mockRestore();
  });
});
