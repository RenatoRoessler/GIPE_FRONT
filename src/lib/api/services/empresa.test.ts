import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_ADMIN_USER_DATA,
  EMPTY_BUSINESS_HOURS_DATA,
  EMPTY_COMPANY_DATA,
  EMPTY_PAYMENTS_DATA,
} from "@/types/adesao";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

import { api } from "../client";
import { saveAdesao } from "./adesao";
import { getEmpresa, updateEmpresa } from "./empresa";

describe("serviços de empresa e adesão: meios de pagamento", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getEmpresa devolve os meios do servidor", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: true } });
    const empresa = await getEmpresa();
    expect(api.get).toHaveBeenCalledWith("/Empresa");
    expect(empresa.payments).toEqual({ dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: true });
  });

  it("getEmpresa trata empresa antiga como todos ligados", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: {} });
    expect((await getEmpresa()).payments).toEqual({ dinheiro: true, pix: true, cartaoCredito: true, cartaoDebito: true });
  });

  it("updateEmpresa envia os quatro campos no PUT", async () => {
    vi.mocked(api.put).mockResolvedValue({});
    const payments = { dinheiro: true, pix: true, cartaoCredito: false, cartaoDebito: false };
    await updateEmpresa({ company: EMPTY_COMPANY_DATA, hours: EMPTY_BUSINESS_HOURS_DATA, payments });
    expect(api.put).toHaveBeenCalledWith("/Empresa", expect.objectContaining(payments));
  });

  it("saveAdesao envia os quatro campos dentro de empresa", async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await saveAdesao({
      company: EMPTY_COMPANY_DATA,
      hours: EMPTY_BUSINESS_HOURS_DATA,
      payments: EMPTY_PAYMENTS_DATA,
      adminUser: EMPTY_ADMIN_USER_DATA,
    });
    const [url, body] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/Adesao");
    expect((body as { empresa: object }).empresa).toMatchObject({
      dinheiro: true,
      pix: false,
      cartaoCredito: false,
      cartaoDebito: false,
    });
  });
});
