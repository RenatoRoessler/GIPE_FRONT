import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn(), put: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { getOnboarding, marcarOnboardingVisualizado } from "./onboarding";

describe("serviço de onboarding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getOnboarding lê GET /Onboarding de quem ainda não viu", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { onboardingId: null, visualizado: false, dataVisualizacao: null } });
    await expect(getOnboarding()).resolves.toEqual({ visualizado: false, dataVisualizacao: null });
    expect(api.get).toHaveBeenCalledWith("/Onboarding");
  });

  it("getOnboarding devolve a data de quem já viu", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { onboardingId: 7, visualizado: true, dataVisualizacao: "2026-11-11T10:00:00" } });
    await expect(getOnboarding()).resolves.toEqual({ visualizado: true, dataVisualizacao: "2026-11-11T10:00:00" });
  });

  it.each([[null], [{}], [{ visualizado: "true" }], [{ visualizado: 1, dataVisualizacao: 5 }]])(
    "resposta incompleta ou fora do formato (%j) conta como não visto",
    async (data) => {
      vi.mocked(api.get).mockResolvedValue({ data });
      await expect(getOnboarding()).resolves.toEqual({ visualizado: false, dataVisualizacao: null });
    },
  );

  it("getOnboarding propaga o ApiError", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("network"));
    await expect(getOnboarding()).rejects.toBeInstanceOf(ApiError);
  });

  it("marcarOnboardingVisualizado envia { visualizado: true } no PUT", async () => {
    vi.mocked(api.put).mockResolvedValue({});
    await marcarOnboardingVisualizado();
    expect(api.put).toHaveBeenCalledWith("/Onboarding", { visualizado: true });
  });

  it("marcarOnboardingVisualizado propaga o ApiError", async () => {
    vi.mocked(api.put).mockRejectedValue(new ApiError("server"));
    await expect(marcarOnboardingVisualizado()).rejects.toBeInstanceOf(ApiError);
  });
});
