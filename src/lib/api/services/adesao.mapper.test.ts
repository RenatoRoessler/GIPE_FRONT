import { describe, expect, it } from "vitest";
import {
  EMPTY_ADMIN_USER_DATA,
  EMPTY_BUSINESS_HOURS_DATA,
  EMPTY_PAYMENTS_DATA,
  TipoEmpresa,
  type CompanyData,
} from "@/types/adesao";
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
      company,
      hours: EMPTY_BUSINESS_HOURS_DATA,
      payments: { dinheiro: true, pix: true, cartaoCredito: false, cartaoDebito: true },
      adminUser,
    });
    expect(payload.empresa).toMatchObject({ dinheiro: true, pix: true, cartaoCredito: false, cartaoDebito: true });
  });

  it("com o padrão da adesão envia só dinheiro ligado", () => {
    const payload = toAdesaoPayload({ company, hours: EMPTY_BUSINESS_HOURS_DATA, payments: EMPTY_PAYMENTS_DATA, adminUser });
    expect(payload.empresa).toMatchObject({ dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: false });
  });

  it("não muda o restante do payload", () => {
    const payload = toAdesaoPayload({ company, hours: EMPTY_BUSINESS_HOURS_DATA, payments: EMPTY_PAYMENTS_DATA, adminUser });
    expect(payload.empresa.cnpj).toBe("11222333000181");
    expect(payload.empresa.quantidadeVagasMoto).toBe(10);
    expect(payload.horarios).toHaveLength(7);
    expect(payload.usuario).toMatchObject({ nome: "Ana Souza", cpf: "52998224725", celular: "11912345678" });
    expect(payload.usuario).not.toHaveProperty("repetirSenha");
  });
});
