import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { put: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { carimbarTicket } from "./carimbo";

const put = vi.mocked(api.put);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("carimbarTicket", () => {
  it("envia o token em PUT /Convenio/carimbar e devolve o carimbo", async () => {
    put.mockResolvedValue({
      data: { estacionamento: "teste 2", placa: "TEP6I32", categoria: 2, rotatividade: "convenio mercado 1" },
    });

    const carimbo = await carimbarTicket("58BMTFRW");

    expect(put).toHaveBeenCalledWith("/Convenio/carimbar", { token: "58BMTFRW" });
    expect(carimbo).toMatchObject({ estacionamento: "teste 2", placa: "TEP6I32", categoria: 2, rotatividade: "convenio mercado 1" });
  });

  it("propaga o ApiError sem alterar a mensagem do back", async () => {
    put.mockRejectedValue(new ApiError("validation", "Este veículo já foi carimbado.", 400));

    await expect(carimbarTicket("58BMTFRW")).rejects.toMatchObject({
      kind: "validation",
      message: "Este veículo já foi carimbado.",
    });
  });
});
