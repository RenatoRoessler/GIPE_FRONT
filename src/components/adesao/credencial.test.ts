import { describe, expect, it } from "vitest";
import {
  EMPTY_BUSINESS_HOURS_DATA,
  EMPTY_COMPANY_DATA,
  EMPTY_PAYMENTS_DATA,
  TipoEmpresa,
} from "@/types/adesao";
import { buildCredencial } from "./credencial";

describe("buildCredencial", () => {
  it("deixa os campos vazios como undefined", () => {
    const dados = buildCredencial({
      company: EMPTY_COMPANY_DATA,
      hours: EMPTY_BUSINESS_HOURS_DATA,
      payments: EMPTY_PAYMENTS_DATA,
    });

    expect(dados.nome).toBeUndefined();
    expect(dados.cnpj).toBeUndefined();
    expect(dados.tipo).toBeUndefined();
    expect(dados.vagasCarro).toBeUndefined();
    expect(dados.vagasMoto).toBeUndefined();
  });

  it("traduz os dados preenchidos", () => {
    const dados = buildCredencial({
      company: {
        ...EMPTY_COMPANY_DATA,
        nomeFantasia: " Central ",
        cnpj: "11.222.333/0001-81",
        tipoEmpresa: TipoEmpresa.EstacionamentoLavaRapido,
        quantidadeVagasCarro: "80",
        quantidadeVagasMoto: "0",
      },
      hours: EMPTY_BUSINESS_HOURS_DATA,
      payments: { ...EMPTY_PAYMENTS_DATA, pix: true },
    });

    expect(dados).toMatchObject({
      nome: "Central",
      cnpj: "11.222.333/0001-81",
      tipo: "Estacionamento + Lava-rápido",
      vagasCarro: 80,
      vagasMoto: 0,
      pagamentos: ["Dinheiro", "Pix"],
    });
  });

  it("marca dias abertos, 24 horas e fechados", () => {
    const horarios = EMPTY_BUSINESS_HOURS_DATA.horarios.map((dia) => ({ ...dia }));
    horarios[6] = { aberto: true, aberto24Horas: true, horarioAbertura: "", horarioFechamento: "" };

    const dados = buildCredencial({
      company: EMPTY_COMPANY_DATA,
      hours: { horarios },
      payments: EMPTY_PAYMENTS_DATA,
    });

    expect(dados.dias.map((dia) => dia.estado)).toEqual([
      "fechado",
      "aberto",
      "aberto",
      "aberto",
      "aberto",
      "aberto",
      "24h",
    ]);
    expect(dados.dias).toHaveLength(7);
  });
});
