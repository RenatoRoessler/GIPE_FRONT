import { beforeEach, describe, expect, it, vi } from "vitest";
import { ORIGEM_PAGAMENTO } from "@/types/mensalista";

vi.mock("../client", () => ({ api: { post: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { pagarMensalista } from "./mensalista";
import { fromPagamentoResponse, toPagamentoPayload } from "./mensalista.mapper";

const fallback = {
  cobrancaId: null,
  valor: 280,
  vencimento: null,
  dataPagamento: "2026-10-21T14:32:00.000Z",
  formaPagamento: 2,
  status: 1,
};

describe("toPagamentoPayload", () => {
  it("usa a origem do painel, arredonda a centavos e não leva empresa nem usuário", () => {
    const payload = toPagamentoPayload({ mensalistaId: 5, valorPago: 280.004, formaPagamento: 2 });

    expect(payload).toEqual({
      mensalistaId: 5,
      valorPago: 280,
      formaPagamento: 2,
      origemPagamento: ORIGEM_PAGAMENTO.PainelAdministrativo,
    });
    expect(payload).not.toHaveProperty("empresaId");
    expect(payload).not.toHaveProperty("usuarioId");
  });
});

describe("fromPagamentoResponse", () => {
  it("lê a cobrança paga e a próxima", () => {
    const result = fromPagamentoResponse(
      {
        cobrancaPaga: { cobrancaId: 1, valor: 280, dataVencimento: "2026-10-05", dataPagamento: "2026-10-21T14:32:00", formaPagamento: 2, status: 1 },
        proximaCobranca: { cobrancaId: 2, valor: "300.5", dataVencimento: "2026-11-05", status: 0 },
      },
      fallback,
    );
    expect(result.paga).toMatchObject({ cobrancaId: 1, valor: 280, vencimento: "2026-10-05", formaPagamento: 2 });
    expect(result.proxima).toMatchObject({ cobrancaId: 2, valor: 300.5, vencimento: "2026-11-05", status: 0 });
  });

  it("aceita os apelidos dos campos", () => {
    const result = fromPagamentoResponse({ paga: { id: 1, valor: 10 }, proxima: { id: 2, valor: 11, vencimento: "2026-12-01" } }, fallback);
    expect(result.paga.cobrancaId).toBe(1);
    expect(result.proxima).toMatchObject({ cobrancaId: 2, vencimento: "2026-12-01" });
  });

  it("sem a próxima cobrança, devolve null", () => {
    expect(fromPagamentoResponse({ cobrancaPaga: { valor: 280 } }, fallback).proxima).toBeNull();
  });

  it("sem a cobrança paga, descreve a baixa pelo que foi enviado", () => {
    expect(fromPagamentoResponse({}, fallback).paga).toEqual(fallback);
    expect(fromPagamentoResponse(null, fallback).paga).toEqual(fallback);
  });

  it("completa os campos que faltam na cobrança paga", () => {
    const { paga } = fromPagamentoResponse({ cobrancaPaga: { cobrancaId: 3 } }, fallback);
    expect(paga).toMatchObject({ cobrancaId: 3, valor: 280, formaPagamento: 2, dataPagamento: fallback.dataPagamento });
  });
});

describe("pagarMensalista", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("envia só o pagamento para POST /Mensalista/pagamento (empresa e usuário são os do token)", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { cobrancaPaga: { valor: 280 }, proximaCobranca: { valor: 280, dataVencimento: "2026-11-05" } } });

    const result = await pagarMensalista({ mensalistaId: 5, valorPago: 280, formaPagamento: 2 });

    expect(api.post).toHaveBeenCalledWith("/Mensalista/pagamento", {
      mensalistaId: 5,
      valorPago: 280,
      formaPagamento: 2,
      origemPagamento: 2,
    });
    expect(result.proxima?.vencimento).toBe("2026-11-05");
  });

  it("repassa o erro da API", async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError("validation", "Sem cobrança pendente.", 400));

    await expect(pagarMensalista({ mensalistaId: 5, valorPago: 280, formaPagamento: 1 })).rejects.toThrow("Sem cobrança pendente.");
  });
});
