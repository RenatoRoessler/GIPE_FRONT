import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPRESA_QUERY_KEY } from "@/components/empresa/MinhaEmpresa/EmpresaForm";
import { ApiError } from "@/lib/api/errors";
import type { PaymentsData } from "@/types/adesao";
import type { EmpresaFormValues } from "@/types/empresa";

vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn(), updateEmpresa: vi.fn() }));

import { getEmpresa } from "@/lib/api/services/empresa";
import { useMeiosPagamento } from "./useMeiosPagamento";

const empresa = (payments: PaymentsData) => ({ payments }) as EmpresaFormValues;
const TODOS: PaymentsData = { dinheiro: true, pix: true, cartaoCredito: true, cartaoDebito: true };
const NENHUM: PaymentsData = { dinheiro: false, pix: false, cartaoCredito: false, cartaoDebito: false };

function renderMeios(queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useMeiosPagamento(), { wrapper }) };
}

const labels = (opcoes: { label: string }[]) => opcoes.map((opcao) => opcao.label);

beforeEach(() => {
  vi.mocked(getEmpresa).mockReset();
});

describe("useMeiosPagamento", () => {
  it("começa carregando", async () => {
    let concluir: (value: EmpresaFormValues) => void = () => {};
    vi.mocked(getEmpresa).mockReturnValue(new Promise<EmpresaFormValues>((resolve) => (concluir = resolve)));
    const { result } = renderMeios();
    expect(result.current).toEqual({ status: "carregando" });
    concluir(empresa(TODOS));
    await waitFor(() => expect(result.current.status).toBe("pronto"));
  });

  it("devolve as quatro formas, na ordem da saída, quando a empresa aceita tudo", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(empresa(TODOS));
    const { result } = renderMeios();
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    if (result.current.status === "pronto") {
      expect(labels(result.current.opcoes)).toEqual(["Dinheiro", "Crédito", "Débito", "Pix"]);
    }
  });

  it("filtra só os meios aceitos", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(
      empresa({ dinheiro: false, pix: true, cartaoCredito: false, cartaoDebito: true }),
    );
    const { result } = renderMeios();
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    if (result.current.status === "pronto") {
      expect(labels(result.current.opcoes)).toEqual(["Débito", "Pix"]);
    }
  });

  it("com um único meio devolve uma opção", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(
      empresa({ dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: false }),
    );
    const { result } = renderMeios();
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    if (result.current.status === "pronto") {
      expect(result.current.opcoes).toHaveLength(1);
      expect(result.current.opcoes[0].label).toBe("Dinheiro");
    }
  });

  it("empresa antiga (todos ligados pelo mapeamento) oferece as quatro formas", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(empresa(TODOS));
    const { result } = renderMeios();
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    if (result.current.status === "pronto") {
      expect(result.current.opcoes).toHaveLength(4);
    }
  });

  it("todos desligados é um estado vazio", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(empresa(NENHUM));
    const { result } = renderMeios();
    await waitFor(() => expect(result.current.status).toBe("vazio"));
  });

  it("falha sem dados em cache devolve o erro e permite tentar de novo", async () => {
    vi.mocked(getEmpresa).mockRejectedValueOnce(new ApiError("network"));
    const { result } = renderMeios();
    await waitFor(() => expect(result.current.status).toBe("erro"));
    if (result.current.status === "erro") {
      expect(result.current.mensagem).toBe("Não foi possível conectar ao servidor.");
    }

    vi.mocked(getEmpresa).mockResolvedValue(empresa(TODOS));
    if (result.current.status === "erro") {
      result.current.refetch();
    }
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    expect(getEmpresa).toHaveBeenCalledTimes(2);
  });

  it("usa na hora o que já está em cache e revalida em seguida", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(EMPRESA_QUERY_KEY, empresa({ ...NENHUM, dinheiro: true }));
    vi.mocked(getEmpresa).mockResolvedValue(empresa({ ...NENHUM, pix: true }));

    const { result } = renderMeios(queryClient);
    expect(result.current.status).toBe("pronto");
    if (result.current.status === "pronto") {
      expect(labels(result.current.opcoes)).toEqual(["Dinheiro"]);
    }

    await waitFor(() => {
      expect(getEmpresa).toHaveBeenCalledTimes(1);
      if (result.current.status === "pronto") {
        expect(labels(result.current.opcoes)).toEqual(["Pix"]);
      }
    });
  });

  it("uma falha ao revalidar mantém a última configuração conhecida", async () => {
    vi.mocked(getEmpresa).mockResolvedValueOnce(empresa(TODOS));
    const { result, queryClient } = renderMeios();
    await waitFor(() => expect(result.current.status).toBe("pronto"));

    vi.mocked(getEmpresa).mockRejectedValueOnce(new ApiError("server"));
    await queryClient.invalidateQueries({ queryKey: EMPRESA_QUERY_KEY });
    await waitFor(() => expect(queryClient.getQueryState(EMPRESA_QUERY_KEY)?.status).toBe("error"));
    expect(result.current.status).toBe("pronto");
    if (result.current.status === "pronto") {
      expect(result.current.opcoes).toHaveLength(4);
    }
  });
});
