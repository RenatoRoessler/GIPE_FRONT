import { describe, expect, it } from "vitest";
import {
  type AceiteData,
  EMPTY_ADMIN_USER_DATA,
  EMPTY_BUSINESS_HOURS_DATA,
  EMPTY_PAYMENTS_DATA,
  TipoEmpresa,
  type CompanyData,
} from "@/types/adesao";
import { TipoPlanoAdesao } from "@/types/plano";
import { toAdesaoPayload, toPaymentsPayload } from "./adesao.mapper";

const company: CompanyData = {
  cnpj: "11.222.333/0001-81",
  razaoSocial: "Central LTDA",
  nomeFantasia: "Central",
  tipoEmpresa: TipoEmpresa.Estacionamento,
  telefone: "(11) 98765-4321",
  cep: "01310100",
  logradouro: "Av. Paulista",
  numero: "1000",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  estado: "SP",
  quantidadeVagasMoto: "10",
  quantidadeVagasCarro: "50",
};

const aceite: AceiteData = { termos: true, privacidade: true };

const adminUser = {
  ...EMPTY_ADMIN_USER_DATA,
  nome: "Ana Souza",
  cpf: "529.982.247-25",
  email: "ana@central.com",
  celular: "(11) 91234-5678",
  senha: "Senha@123",
  repetirSenha: "Senha@123",
};

describe("toPaymentsPayload", () => {
  it("copia exatamente os quatro meios", () => {
    expect(toPaymentsPayload({ dinheiro: true, pix: false, cartaoCredito: true, cartaoDebito: false })).toEqual({
      dinheiro: true,
      pix: false,
      cartaoCredito: true,
      cartaoDebito: false,
    });
  });
});

describe("toAdesaoPayload: meios de pagamento", () => {
  it("inclui os quatro meios dentro de empresa", () => {
    const payload = toAdesaoPayload({
      plano: TipoPlanoAdesao.Mensal,
      company,
      hours: EMPTY_BUSINESS_HOURS_DATA,
      payments: { dinheiro: true, pix: true, cartaoCredito: false, cartaoDebito: true },
      adminUser,
      aceite,
    });
    expect(payload.empresa).toMatchObject({ dinheiro: true, pix: true, cartaoCredito: false, cartaoDebito: true });
  });

  it("com o padrão da adesão envia só dinheiro ligado", () => {
    const payload = toAdesaoPayload({ plano: TipoPlanoAdesao.Mensal, company, hours: EMPTY_BUSINESS_HOURS_DATA, payments: EMPTY_PAYMENTS_DATA, adminUser, aceite });
    expect(payload.empresa).toMatchObject({ dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: false });
  });

  it("não muda o restante do payload", () => {
    const payload = toAdesaoPayload({ plano: TipoPlanoAdesao.Mensal, company, hours: EMPTY_BUSINESS_HOURS_DATA, payments: EMPTY_PAYMENTS_DATA, adminUser, aceite });
    expect(payload.empresa.cnpj).toBe("11222333000181");
    expect(payload.empresa.quantidadeVagasMoto).toBe(10);
    expect(payload.horarios).toHaveLength(7);
    expect(payload.usuario).toMatchObject({ nome: "Ana Souza", cpf: "52998224725", celular: "11912345678" });
    expect(payload.usuario).not.toHaveProperty("repetirSenha");
  });
});

describe("toAdesaoPayload: plano", () => {
  it.each<[TipoPlanoAdesao, number]>([
    [TipoPlanoAdesao.Mensal, 1],
    [TipoPlanoAdesao.Trimestral, 2],
    [TipoPlanoAdesao.Semestral, 3],
    [TipoPlanoAdesao.Anual, 4],
  ])("envia tipoPlanoAdesao %s como %i", (plano, esperado) => {
    const payload = toAdesaoPayload({ plano, company, hours: EMPTY_BUSINESS_HOURS_DATA, payments: EMPTY_PAYMENTS_DATA, adminUser, aceite });
    expect(payload.tipoPlanoAdesao).toBe(esperado);
  });

  it("envia o teste grátis como tipoPlanoAdesao 0, sem nenhum dado de cobrança", () => {
    const payload = toAdesaoPayload({
      plano: TipoPlanoAdesao.Trial,
      company,
      hours: EMPTY_BUSINESS_HOURS_DATA,
      payments: EMPTY_PAYMENTS_DATA,
      adminUser,
      aceite,
    });
    expect(payload.tipoPlanoAdesao).toBe(0);
    expect(Object.keys(payload).sort()).toEqual(["aceiteTermos", "empresa", "horarios", "tipoPlanoAdesao", "usuario"]);
    expect(JSON.stringify(payload)).not.toMatch(/cobran|assinatura|valor|preco|preço/i);
  });
});

describe("toAdesaoPayload: aceite dos termos", () => {
  const montar = (aceiteDado: AceiteData) =>
    toAdesaoPayload({
      plano: TipoPlanoAdesao.Mensal,
      company,
      hours: EMPTY_BUSINESS_HOURS_DATA,
      payments: EMPTY_PAYMENTS_DATA,
      adminUser,
      aceite: aceiteDado,
    });

  it("envia aceito e a versão vigente quando os dois foram aceitos", () => {
    expect(montar({ termos: true, privacidade: true }).aceiteTermos).toEqual({ aceito: true, versaoTermos: "v1.0" });
  });

  it.each<AceiteData>([
    { termos: true, privacidade: false },
    { termos: false, privacidade: true },
    { termos: false, privacidade: false },
  ])("não marca aceito se faltar um dos dois (%o)", (parcial) => {
    expect(montar(parcial).aceiteTermos.aceito).toBe(false);
  });
});
