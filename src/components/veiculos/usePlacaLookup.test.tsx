import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlacaConsulta } from "@/types/veiculo";

vi.mock("@/lib/api/services/veiculo", () => ({ consultarPlaca: vi.fn() }));

import { consultarPlaca } from "@/lib/api/services/veiculo";
import { usePlacaLookup } from "./usePlacaLookup";

const encontrado: PlacaConsulta = {
  placa: "ABC1D23",
  encontrado: true,
  origem: "mensalista",
  modelo: "ONIX",
  cor: "AZUL",
  categoria: 2,
  mensalista: true,
  dadosMensalista: { nome: "Maria" },
};

describe("usePlacaLookup: cadastro", () => {
  beforeEach(() => {
    vi.mocked(consultarPlaca).mockReset();
  });

  it("guarda o cadastro encontrado", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue(encontrado);
    const { result } = renderHook(() => usePlacaLookup());
    await act(() => result.current.lookup("ABC1D23"));
    expect(result.current.cadastro).toEqual(encontrado);
  });

  it("não guarda cadastro quando a placa não é encontrada", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ ...encontrado, encontrado: false });
    const { result } = renderHook(() => usePlacaLookup());
    await act(() => result.current.lookup("ABC1D23"));
    expect(result.current.cadastro).toBeNull();
  });

  it("limpa o cadastro no reset", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue(encontrado);
    const { result } = renderHook(() => usePlacaLookup());
    await act(() => result.current.lookup("ABC1D23"));
    act(() => result.current.reset());
    expect(result.current.cadastro).toBeNull();
  });

  it("limpa o cadastro anterior ao começar outra consulta", async () => {
    vi.mocked(consultarPlaca).mockResolvedValueOnce(encontrado).mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderHook(() => usePlacaLookup());
    await act(() => result.current.lookup("ABC1D23"));
    act(() => {
      void result.current.lookup("XYZ9A87");
    });
    await waitFor(() => expect(result.current.cadastro).toBeNull());
  });

  it("limpa o cadastro quando a nova consulta falha", async () => {
    vi.mocked(consultarPlaca).mockResolvedValueOnce(encontrado).mockRejectedValueOnce(new Error("rede"));
    const { result } = renderHook(() => usePlacaLookup());
    await act(() => result.current.lookup("ABC1D23"));
    await act(() => result.current.lookup("XYZ9A87"));
    expect(result.current.cadastro).toBeNull();
    expect(result.current.status.state).toBe("error");
  });
});
