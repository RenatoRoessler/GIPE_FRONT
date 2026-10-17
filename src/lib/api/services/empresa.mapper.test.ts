import { describe, expect, it } from "vitest";
import { EMPTY_BUSINESS_HOURS_DATA, EMPTY_PAYMENTS_DATA, TipoEmpresa, type CompanyData } from "@/types/adesao";
import { toHorariosPayload } from "./adesao.mapper";
import { type EmpresaDto, fromEmpresaResponse, toEmpresaPayload } from "./empresa.mapper";

const company: CompanyData = {
  cnpj: "11.222.333/0001-81",
  razaoSocial: " Estacionamento Central LTDA ",
  nomeFantasia: "Central",
  tipoEmpresa: TipoEmpresa.Estacionamento,
  telefone: "(11) 98765-4321",
  cep: "01310-100",
  logradouro: "Av. Paulista",
  numero: "1000",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  estado: "SP",
  quantidadeVagasMoto: "10",
  quantidadeVagasCarro: "50",
};

const dto: EmpresaDto = {
  razaoSocial: "Estacionamento Central LTDA",
  nomeFantasia: "Central",
  cnpj: "11222333000181",
  tipoEmpresa: TipoEmpresa.Estacionamento,
  telefone: "11987654321",
  endereco: { logradouro: "Av. Paulista", bairro: "Bela Vista", numero: "1000", cidade: "São Paulo", estado: "SP", cep: "01310-100" },
  quantidadeVagasMoto: 10,
  quantidadeVagasCarro: 50,
  horarios: toHorariosPayload(EMPTY_BUSINESS_HOURS_DATA, (time) => `${time}:00`),
  dinheiro: true,
  pix: false,
  cartaoCredito: true,
  cartaoDebito: false,
};

describe("fromEmpresaResponse: meios de pagamento", () => {
  it("lê os quatro campos do servidor", () => {
    expect(fromEmpresaResponse(dto).payments).toEqual({
      dinheiro: true,
      pix: false,
      cartaoCredito: true,
      cartaoDebito: false,
    });
  });

  it("respeita um false explícito, inclusive em todos os meios", () => {
    const todosDesligados = { ...dto, dinheiro: false, pix: false, cartaoCredito: false, cartaoDebito: false };
    expect(fromEmpresaResponse(todosDesligados).payments).toEqual({
      dinheiro: false,
      pix: false,
      cartaoCredito: false,
      cartaoDebito: false,
    });
  });

  it("empresa antiga sem os campos aceita todos os meios", () => {
    const semPagamentos: Partial<EmpresaDto> = { ...dto };
    delete semPagamentos.dinheiro;
    delete semPagamentos.pix;
    delete semPagamentos.cartaoCredito;
    delete semPagamentos.cartaoDebito;
    expect(fromEmpresaResponse(semPagamentos).payments).toEqual({
      dinheiro: true,
      pix: true,
      cartaoCredito: true,
      cartaoDebito: true,
    });
  });

  it("trata null como ausente e só desliga com false", () => {
    const parcial = { ...dto, dinheiro: null, pix: false, cartaoCredito: undefined } as unknown as Partial<EmpresaDto>;
    expect(fromEmpresaResponse(parcial).payments).toEqual({
      dinheiro: true,
      pix: false,
      cartaoCredito: true,
      cartaoDebito: false,
    });
  });

  it("resposta vazia também aceita todos os meios", () => {
    expect(fromEmpresaResponse({}).payments).toEqual({ dinheiro: true, pix: true, cartaoCredito: true, cartaoDebito: true });
  });

  it("mantém o restante do mapeamento", () => {
    const values = fromEmpresaResponse(dto);
    expect(values.company.cnpj).toBe("11.222.333/0001-81");
    expect(values.company.quantidadeVagasCarro).toBe("50");
  });
});

describe("toEmpresaPayload: meios de pagamento", () => {
  it("envia os quatro campos no corpo plano", () => {
    const payload = toEmpresaPayload({
      company,
      hours: EMPTY_BUSINESS_HOURS_DATA,
      payments: { dinheiro: true, pix: true, cartaoCredito: false, cartaoDebito: false },
    });
    expect(payload).toMatchObject({ dinheiro: true, pix: true, cartaoCredito: false, cartaoDebito: false });
    expect(payload.razaoSocial).toBe("Estacionamento Central LTDA");
    expect(payload.cnpj).toBe("11222333000181");
  });

  it("ida e volta preserva a configuração", () => {
    const payments = { dinheiro: false, pix: true, cartaoCredito: true, cartaoDebito: false };
    const payload = toEmpresaPayload({ company, hours: EMPTY_BUSINESS_HOURS_DATA, payments });
    expect(fromEmpresaResponse(payload).payments).toEqual(payments);
  });

  it("o padrão da adesão envia só dinheiro", () => {
    const payload = toEmpresaPayload({ company, hours: EMPTY_BUSINESS_HOURS_DATA, payments: EMPTY_PAYMENTS_DATA });
    expect(payload).toMatchObject({ dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: false });
  });
});
