import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";

vi.mock("@/lib/api/services/mensalista", () => ({ reenviarContrato: vi.fn() }));

import { reenviarContrato } from "@/lib/api/services/mensalista";
import { contratoQueryKey } from "./useContratosMensalistas";
import { useReenviarContrato, type UseReenviarContratoOptions } from "./useReenviarContrato";

// O contrato do id 7 já está no cache: se o hook o invalida, `isInvalidated` vira true.
function renderReenviar(options: UseReenviarContratoOptions = {}) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(contratoQueryKey(7), { status: 0 });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const foiInvalidado = () => queryClient.getQueryState(contratoQueryKey(7))?.isInvalidated ?? false;
  return { foiInvalidado, ...renderHook(() => useReenviarContrato(options), { wrapper }) };
}

describe("useReenviarContrato", () => {


  it("expõe o id em andamento e limpa ao terminar", async () => {
    let concluir: (value: { email: string; tokenExpiracao: string | null }) => void = () => {};
    vi.mocked(reenviarContrato).mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    const { result } = renderReenviar();

    expect(result.current.reenviandoId).toBeNull();
    act(() => result.current.reenviar(7));
    await waitFor(() => expect(result.current.reenviandoId).toBe(7));

    concluir({ email: "maria@exemplo.com", tokenExpiracao: null });
    await waitFor(() => expect(result.current.reenviandoId).toBeNull());
  });

  it("no sucesso invalida o contrato do id e entrega o e-mail", async () => {
    vi.mocked(reenviarContrato).mockResolvedValue({ email: "maria@exemplo.com", tokenExpiracao: "2026-10-28T10:00:00" });
    const onSuccess = vi.fn();
    const { result, foiInvalidado } = renderReenviar({ onSuccess });

    act(() => result.current.reenviar(7));
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({ email: "maria@exemplo.com", tokenExpiracao: "2026-10-28T10:00:00" }),
    );
    await waitFor(() => expect(result.current.reenviandoId).toBeNull());
    expect(foiInvalidado()).toBe(true);
  });

  it("no 400 (já aceito) invalida o contrato e avisa o erro", async () => {
    vi.mocked(reenviarContrato).mockImplementation(async () => {
      throw new ApiError("validation", "O mensalista já aceitou o contrato.", 400);
    });
    const onError = vi.fn();
    const { result, foiInvalidado } = renderReenviar({ onError });

    act(() => result.current.reenviar(7));
    await waitFor(() => expect(onError).toHaveBeenCalledWith("O mensalista já aceitou o contrato."));
    await waitFor(() => expect(result.current.reenviandoId).toBeNull());
    expect(foiInvalidado()).toBe(true);
  });

  it("em outros erros só avisa, sem invalidar", async () => {
    vi.mocked(reenviarContrato).mockImplementation(async () => {
      throw new ApiError("server", undefined, 500);
    });
    const onError = vi.fn();
    const { result, foiInvalidado } = renderReenviar({ onError });

    act(() => result.current.reenviar(7));
    await waitFor(() => expect(onError).toHaveBeenCalledWith("Erro no servidor. Tente novamente em instantes."));
    await waitFor(() => expect(result.current.reenviandoId).toBeNull());
    expect(foiInvalidado()).toBe(false);
  });
});
