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
import { ApiError } from "../errors";
import { addEmpresa, getEmpresa, updateEmpresa } from "./empresa";

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

describe("addEmpresa", () => {
  beforeEach(() => vi.clearAllMocks());

  const valores = {
    company: {
      ...EMPTY_COMPANY_DATA,
      cnpj: "11.222.333/0001-81",
      razaoSocial: " Nova Empresa LTDA ",
      nomeFantasia: "Nova",
      tipoEmpresa: 1 as const,
      telefone: "(11) 98765-4321",
      cep: "01310-100",
      logradouro: "Av. Paulista",
      numero: "1000",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      quantidadeVagasMoto: "10",
      quantidadeVagasCarro: "50",
    },
    hours: EMPTY_BUSINESS_HOURS_DATA,
    payments: { dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: false },
  };

  it("faz POST em /Empresa/adicionar com o corpo plano da empresa (CNPJ e telefone sem máscara)", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { empresaGuid: "5be38c77-bcd2-462f-a2f3-92d7a77dd48c" } });
    await addEmpresa(valores);

    expect(api.post).toHaveBeenCalledTimes(1);
    const [rota, corpo] = vi.mocked(api.post).mock.calls[0];
    expect(rota).toBe("/Empresa/adicionar");
    expect(corpo).toMatchObject({
      razaoSocial: "Nova Empresa LTDA",
      nomeFantasia: "Nova",
      cnpj: "11222333000181",
      tipoEmpresa: 1,
      telefone: "11987654321",
      endereco: { logradouro: "Av. Paulista", numero: "1000", bairro: "Bela Vista", cidade: "São Paulo", estado: "SP", cep: "01310-100" },
      quantidadeVagasMoto: 10,
      quantidadeVagasCarro: 50,
      dinheiro: true,
      pix: false,
      cartaoCredito: false,
      cartaoDebito: false,
    });
    expect(Array.isArray((corpo as { horarios: unknown }).horarios)).toBe(true);
  });

  it("não envia o troco padrão (ausente, a API usa zero)", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { empresaGuid: "g" } });
    await addEmpresa(valores);

    expect(vi.mocked(api.post).mock.calls[0][1]).not.toHaveProperty("valorTrocoPadrao");
  });

  it("devolve o guid da empresa criada", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { empresaGuid: "  guid-123 " } });
    await expect(addEmpresa(valores)).resolves.toEqual({ empresaGuid: "guid-123" });
  });

  it.each([
    ["sem corpo", undefined],
    ["corpo vazio", {}],
    ["guid vazio", { empresaGuid: "  " }],
    ["guid que não é texto", { empresaGuid: 42 }],
  ])("resposta %s é inválida", async (_nome, data) => {
    vi.mocked(api.post).mockResolvedValue({ data });
    await expect(addEmpresa(valores)).rejects.toMatchObject({ kind: "unknown" });
  });

  it("erro de regra de negócio sobe com a mensagem da API", async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError("validation", "CNPJ já cadastrado.", 400));
    await expect(addEmpresa(valores)).rejects.toMatchObject({ kind: "validation", message: "CNPJ já cadastrado." });
  });

  it("sem permissão sobe como forbidden", async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    await expect(addEmpresa(valores)).rejects.toMatchObject({ kind: "forbidden" });
  });
});
