import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMPRESA_QUERY_KEY } from "@/components/empresa/MinhaEmpresa/queryKeys";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { EmpresaFormValues } from "@/types/empresa";

vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn() }));
// O desenho do QR é da biblioteca: aqui só interessa o endereço que o cartaz manda codificar.
vi.mock("@/components/ui/QrCode", () => ({
  QrCode: ({ value, label }: { value: string; label: string }) => <div role="img" aria-label={label} data-value={value} />,
}));

import { getEmpresa } from "@/lib/api/services/empresa";
import { GerarCartazButton } from "./GerarCartazButton";

const GUID = "3f2b8c1e-0000-4000-8000-000000000001";
const MENSAGEM = "Não foi possível gerar o cartaz agora. Tente novamente em instantes.";

const empresa = (empresaGuid: string | null) => ({ empresaGuid }) as EmpresaFormValues;
const botao = () => screen.getByRole("button", { name: "Gerar Cartaz do Ticket" });
const cartaz = () => document.getElementById("cartaz-print-root");

describe("GerarCartazButton", () => {
  const print = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("print", print);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("não consulta a empresa nem monta o cartaz antes do clique", () => {
    renderWithProviders(<GerarCartazButton />);

    expect(botao()).toBeEnabled();
    expect(getEmpresa).not.toHaveBeenCalled();
    expect(cartaz()).not.toBeInTheDocument();
  });

  it("busca o guid da empresa, monta o cartaz com o link da consulta e abre a impressão", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(empresa(GUID));
    renderWithProviders(<GerarCartazButton />);

    await userEvent.click(botao());

    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    expect(cartaz()).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "QR code para consultar o ticket", hidden: true })).toBeInTheDocument();
    expect(getEmpresa).toHaveBeenCalledTimes(1);
  });

  it("o QR aponta para a consulta pública da empresa", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(empresa(GUID));
    renderWithProviders(<GerarCartazButton />);

    await userEvent.click(botao());
    await waitFor(() => expect(print).toHaveBeenCalled());

    const qr = screen.getByRole("img", { name: "QR code para consultar o ticket", hidden: true });
    expect(qr).toHaveAttribute("data-value", `${window.location.origin}/ticket/${GUID}`);
  });

  it("usa o guid do cache, sem consultar de novo", async () => {
    const { queryClient } = renderWithProviders(<GerarCartazButton />);
    queryClient.setQueryData(EMPRESA_QUERY_KEY, empresa(GUID));

    await userEvent.click(botao());

    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    expect(getEmpresa).not.toHaveBeenCalled();
  });

  it("cache sem guid (salvo pelo formulário, por exemplo) consulta de novo em vez de falhar", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(empresa(GUID));
    const { queryClient } = renderWithProviders(<GerarCartazButton />);
    queryClient.setQueryData(EMPRESA_QUERY_KEY, empresa(null));

    await userEvent.click(botao());

    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    expect(getEmpresa).toHaveBeenCalledTimes(1);
  });

  it("remove o cartaz da tela quando a impressão termina", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(empresa(GUID));
    renderWithProviders(<GerarCartazButton />);
    await userEvent.click(botao());
    await waitFor(() => expect(print).toHaveBeenCalled());
    expect(cartaz()).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("afterprint"));
    });

    await waitFor(() => expect(cartaz()).not.toBeInTheDocument());
    expect(botao()).toBeEnabled();
  });

  it("fica desabilitado enquanto busca e enquanto o cartaz está montado (sem duplo clique)", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(empresa(GUID));
    renderWithProviders(<GerarCartazButton />);
    const user = userEvent.setup();

    await user.click(botao());
    expect(botao()).toBeDisabled();
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    expect(botao()).toBeDisabled();

    await user.click(botao());
    expect(getEmpresa).toHaveBeenCalledTimes(1);
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("empresa sem guid avisa e não imprime", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(empresa(null));
    renderWithProviders(<GerarCartazButton />);

    await userEvent.click(botao());

    expect(await screen.findByText(MENSAGEM)).toBeInTheDocument();
    expect(print).not.toHaveBeenCalled();
    expect(cartaz()).not.toBeInTheDocument();
    expect(botao()).toBeEnabled();
  });

  it("erro da API (como 403) avisa e não imprime", async () => {
    vi.mocked(getEmpresa).mockRejectedValue(new ApiError("forbidden"));
    renderWithProviders(<GerarCartazButton />);

    await userEvent.click(botao());

    expect(await screen.findByText(MENSAGEM)).toBeInTheDocument();
    expect(print).not.toHaveBeenCalled();
    expect(cartaz()).not.toBeInTheDocument();
  });
});
