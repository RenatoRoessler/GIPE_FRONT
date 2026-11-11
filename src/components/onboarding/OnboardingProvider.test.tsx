import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { ONBOARDING_QUERY_KEY } from "./useOnboarding";

const servico = vi.hoisted(() => ({ getOnboarding: vi.fn(), marcarOnboardingVisualizado: vi.fn() }));
vi.mock("@/lib/api/services/onboarding", () => servico);

const usuario = vi.hoisted(() => ({ atual: { user: { id: "u1", name: "Maria", perfil: 1 } as { id: string; name: string; perfil: number } | null, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => usuario.atual }));

import { OnboardingProvider, useOnboardingTour } from "./OnboardingProvider";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

function Repetir() {
  const { abrirTour } = useOnboardingTour();
  return (
    <button type="button" onClick={abrirTour}>
      Repetir tour
    </button>
  );
}

function abrir() {
  return renderWithProviders(
    <OnboardingProvider>
      <p>Tela</p>
      <Repetir />
    </OnboardingProvider>,
  );
}

const NAO_VISTO = { visualizado: false, dataVisualizacao: null };
const VISTO = { visualizado: true, dataVisualizacao: "2026-11-11T10:00:00" };

describe("OnboardingProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    usuario.atual = { user: { id: "u1", name: "Maria", perfil: 1 }, isLoading: false };
  });

  it("abre sozinho para quem ainda não viu o tour", async () => {
    servico.getOnboarding.mockResolvedValue(NAO_VISTO);
    abrir();

    expect(await screen.findByRole("dialog", { name: "Tour de boas-vindas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Não mostrar mais" })).toBeInTheDocument();
  });

  it("não abre para quem já viu", async () => {
    servico.getOnboarding.mockResolvedValue(VISTO);
    abrir();

    await waitFor(() => expect(servico.getOnboarding).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("não abre se a consulta falhar, e a tela segue utilizável", async () => {
    servico.getOnboarding.mockRejectedValue(new ApiError("network"));
    abrir();

    await waitFor(() => expect(servico.getOnboarding).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Tela")).toBeInTheDocument();
  });

  it("não consulta nem abre sem usuário conhecido", () => {
    usuario.atual = { user: null, isLoading: true };
    abrir();

    expect(servico.getOnboarding).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Sair fecha sem registrar, grava a marca da sessão e não reabre", async () => {
    servico.getOnboarding.mockResolvedValue(NAO_VISTO);
    const user = userEvent.setup();
    const { unmount } = abrir();
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(servico.marcarOnboardingVisualizado).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("onboarding:dispensado:u1")).toBe("1");

    // Recarregar na mesma sessão do navegador: o back segue dizendo "não visto", mas a marca impede a reabertura.
    unmount();
    abrir();
    await waitFor(() => expect(servico.getOnboarding).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("numa sessão nova (sem a marca) o tour volta a ser oferecido", async () => {
    servico.getOnboarding.mockResolvedValue(NAO_VISTO);
    abrir();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("Não mostrar mais registra no back, fecha e atualiza o cache", async () => {
    servico.getOnboarding.mockResolvedValue(NAO_VISTO);
    servico.marcarOnboardingVisualizado.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { queryClient } = abrir();
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Não mostrar mais" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(servico.marcarOnboardingVisualizado).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(ONBOARDING_QUERY_KEY)).toMatchObject({ visualizado: true });
  });

  it("Concluir no último passo registra a visualização", async () => {
    servico.getOnboarding.mockResolvedValue(NAO_VISTO);
    servico.marcarOnboardingVisualizado.mockResolvedValue(undefined);
    const user = userEvent.setup();
    abrir();
    await screen.findByRole("dialog");

    while (screen.queryByRole("button", { name: "Concluir" }) === null) {
      await user.click(screen.getByRole("button", { name: "Avançar" }));
    }
    await user.click(screen.getByRole("button", { name: "Concluir" }));

    await waitFor(() => expect(servico.marcarOnboardingVisualizado).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("enquanto registra, o botão fica ocupado", async () => {
    servico.getOnboarding.mockResolvedValue(NAO_VISTO);
    servico.marcarOnboardingVisualizado.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    abrir();
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Não mostrar mais" }));

    expect(await screen.findByRole("button", { name: "Salvando..." })).toBeDisabled();
  });

  it("se o registro falhar, fecha, avisa e não reabre nesta sessão", async () => {
    servico.getOnboarding.mockResolvedValue(NAO_VISTO);
    servico.marcarOnboardingVisualizado.mockRejectedValue(new ApiError("server"));
    const user = userEvent.setup();
    abrir();
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Não mostrar mais" }));

    expect(await screen.findByText("Não foi possível salvar. O tour pode aparecer de novo no próximo acesso.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("onboarding:dispensado:u1")).toBe("1");
  });

  it("Repetir tour abre o tour completo mesmo já visto, sem Não mostrar mais e sem registrar", async () => {
    servico.getOnboarding.mockResolvedValue(VISTO);
    const user = userEvent.setup();
    abrir();
    await waitFor(() => expect(servico.getOnboarding).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Repetir tour" }));

    expect(await screen.findByRole("dialog", { name: "Tour de boas-vindas" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Não mostrar mais" })).not.toBeInTheDocument();

    while (screen.queryByRole("button", { name: "Concluir" }) === null) {
      await user.click(screen.getByRole("button", { name: "Avançar" }));
    }
    await user.click(screen.getByRole("button", { name: "Concluir" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(servico.marcarOnboardingVisualizado).not.toHaveBeenCalled();
  });

  it("Sair de uma repetição não grava a marca nem registra", async () => {
    servico.getOnboarding.mockResolvedValue(VISTO);
    const user = userEvent.setup();
    abrir();
    await waitFor(() => expect(servico.getOnboarding).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Repetir tour" }));

    await user.click(await screen.findByRole("button", { name: "Sair" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem("onboarding:dispensado:u1")).toBeNull();
    expect(servico.marcarOnboardingVisualizado).not.toHaveBeenCalled();
  });

  it("sem armazenamento da sessão, Sair ainda fecha o tour", async () => {
    servico.getOnboarding.mockResolvedValue(NAO_VISTO);
    const user = userEvent.setup();
    abrir();
    await screen.findByRole("dialog");
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Sair" }));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    setItem.mockRestore();
  });

  it("useOnboardingTour fora do provider avisa o erro de uso", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderWithProviders(<Repetir />)).toThrow("useOnboardingTour deve ser usado dentro de OnboardingProvider");
    erro.mockRestore();
  });
});
