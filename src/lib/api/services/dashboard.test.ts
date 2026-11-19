import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { dashboardDto } from "./dashboard.fixture";
import { getDashboard } from "./dashboard";

const get = vi.mocked(api.get);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("dashboard service", () => {
  it("consulta GET /Dashboard só com o período quando não há data e devolve a resposta já mapeada", async () => {
    get.mockResolvedValue({ data: dashboardDto });

    const dashboard = await getDashboard({ periodo: 1 });

    expect(get).toHaveBeenCalledWith("/Dashboard", { params: { periodo: 1 } });
    expect(dashboard.mes.faturado).toBe(1403.5);
    expect(dashboard.movimentoPorHora?.horas).toHaveLength(24);
  });

  it("manda a data (AAAA-MM-DD) quando informada", async () => {
    get.mockResolvedValue({ data: dashboardDto });

    await getDashboard({ periodo: 3, data: "2026-10-15" });

    expect(get).toHaveBeenCalledWith("/Dashboard", { params: { periodo: 3, data: "2026-10-15" } });
  });

  it("resposta vazia não derruba a tela: vira um dashboard sem dados", async () => {
    get.mockResolvedValue({ data: undefined });

    const dashboard = await getDashboard({ periodo: 2 });

    expect(dashboard.periodo.faturamento).toBe(0);
    expect(dashboard.inicioUso).toBeNull();
  });

  it.each([
    ["validation", 400],
    ["forbidden", 403],
  ] as const)("o erro %s da API sobe como ApiError", async (kind, status) => {
    get.mockRejectedValue(new ApiError(kind, undefined, status));

    await expect(getDashboard({ periodo: 1, data: "2099-01-01" })).rejects.toMatchObject({ kind, status });
  });
});
