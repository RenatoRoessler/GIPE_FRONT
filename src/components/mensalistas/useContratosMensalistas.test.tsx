import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO, type Mensalista } from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({ getContratoMensalista: vi.fn() }));

import { getContratoMensalista } from "@/lib/api/services/mensalista";
import { useContratosMensalistas } from "./useContratosMensalistas";

const base = { ativo: false, situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO } as Mensalista;
const aguardando1 = { ...base, mensalistaId: 1 };
const aguardando2 = { ...base, mensalistaId: 2 };
const ativo = { ...base, mensalistaId: 3, ativo: true, situacao: "Em Dia" };
const desativado = { ...base, mensalistaId: 4, situacao: "Pagamento Atrasado" };

function renderContratos(items: Mensalista[]) {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useContratosMensalistas(items), { wrapper });
}

describe("useContratosMensalistas", () => {
  beforeEach(() => vi.mocked(getContratoMensalista).mockReset());

  it("consulta só os inativos aguardando o primeiro pagamento", async () => {
    vi.mocked(getContratoMensalista).mockResolvedValue(null);
    const { result } = renderContratos([aguardando1, ativo, desativado, aguardando2]);

    await waitFor(() => expect([...result.current.values()].every((query) => !query.isPending)).toBe(true));
    expect([...result.current.keys()]).toEqual([1, 2]);
    expect(getContratoMensalista).toHaveBeenCalledTimes(2);
    expect(getContratoMensalista).toHaveBeenCalledWith(1);
    expect(getContratoMensalista).toHaveBeenCalledWith(2);
  });

  it("não consulta nada quando nenhuma linha depende do contrato", () => {
    const { result } = renderContratos([ativo, desativado]);
    expect(result.current.size).toBe(0);
    expect(getContratoMensalista).not.toHaveBeenCalled();
  });

  it("uma falha não derruba as demais e não tenta de novo", async () => {
    vi.mocked(getContratoMensalista).mockImplementation(async (id) => {
      if (id === 1) throw new Error("falhou");
      return null;
    });
    const { result } = renderContratos([aguardando1, aguardando2]);

    await waitFor(() => expect(result.current.get(1)?.isError).toBe(true));
    await waitFor(() => expect(result.current.get(2)?.isSuccess).toBe(true));
    expect(getContratoMensalista).toHaveBeenCalledTimes(2);
  });
});
