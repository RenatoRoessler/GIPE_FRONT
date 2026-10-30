import { describe, expect, it } from "vitest";
import { PELO_CAIXA_SO_DINHEIRO_HOJE } from "@/lib/schemas/financeiro";
import type { Turno } from "@/types/caixa";
import { TIPO_LANCAMENTO } from "@/types/financeiro";
import {
  CAIXA_CONFERE_AO_SALVAR,
  SEM_TURNO_ABERTO,
  VERIFICANDO_CAIXA,
  estadoPelaGaveta,
  excedeDisponivel,
  type EntradaPelaGaveta,
} from "./pelaGaveta";

const HOJE = "2026-10-30";

function turno(parcial: Partial<Turno> = {}): Turno {
  return {
    turnoId: 1,
    caixaId: 1,
    usuarioId: 1,
    usuario: "Ana",
    usuarioIdFechamento: null,
    dataHoraInicio: "2026-10-30T07:00:00",
    dataHoraFim: null,
    valorFundoCaixa: 100,
    status: 1,
    saldoCaixa: 0,
    totalEntradas: null,
    totalSaidas: null,
    totalSaida: null,
    saldoCaixaInformado: null,
    totalDiferenca: null,
    observacao: null,
    disponivelSangria: null,
    formasPagamento: [{ formaPagamento: 1, valorEsperado: 214 } as Turno["formasPagamento"][number]],
    ...parcial,
  };
}

const base: EntradaPelaGaveta = {
  formaPagamento: "1",
  dataPagamento: HOJE,
  hoje: HOJE,
  turno: turno(),
  turnoCarregando: false,
  turnoSemPermissao: false,
};

describe("estadoPelaGaveta", () => {
  it("em dinheiro, hoje e com turno aberto: habilitado, com o disponível (fundo mais dinheiro)", () => {
    expect(estadoPelaGaveta(base)).toEqual({ habilitado: true, motivo: null, disponivel: 314, aviso: null });
  });

  it("com Pix, desabilita pelo motivo da forma e da data", () => {
    expect(estadoPelaGaveta({ ...base, formaPagamento: "2" })).toMatchObject({ habilitado: false, motivo: PELO_CAIXA_SO_DINHEIRO_HOJE });
  });

  it("com data diferente de hoje, desabilita", () => {
    expect(estadoPelaGaveta({ ...base, dataPagamento: "2026-10-22" })).toMatchObject({ habilitado: false, motivo: PELO_CAIXA_SO_DINHEIRO_HOJE });
  });

  it("a forma e a data valem mais que o turno: sem turno e com Pix, o motivo é o da forma", () => {
    expect(estadoPelaGaveta({ ...base, formaPagamento: "2", turno: null })).toMatchObject({ motivo: PELO_CAIXA_SO_DINHEIRO_HOJE });
  });

  it("sem turno, ou com o turno fechado, pede para abrir o caixa", () => {
    expect(estadoPelaGaveta({ ...base, turno: null })).toMatchObject({ habilitado: false, motivo: SEM_TURNO_ABERTO });
    expect(estadoPelaGaveta({ ...base, turno: undefined })).toMatchObject({ habilitado: false, motivo: SEM_TURNO_ABERTO });
    expect(estadoPelaGaveta({ ...base, turno: turno({ dataHoraFim: "2026-10-30T12:00:00" }) })).toMatchObject({ habilitado: false, motivo: SEM_TURNO_ABERTO });
  });

  it("enquanto o turno carrega, espera", () => {
    expect(estadoPelaGaveta({ ...base, turno: undefined, turnoCarregando: true })).toMatchObject({ habilitado: false, motivo: VERIFICANDO_CAIXA });
  });

  it("sem permissão para ver o turno (403), fica habilitado, sem disponível e com o aviso", () => {
    expect(estadoPelaGaveta({ ...base, turno: undefined, turnoSemPermissao: true })).toEqual({
      habilitado: true,
      motivo: null,
      disponivel: null,
      aviso: CAIXA_CONFERE_AO_SALVAR,
    });
  });

  it("turno sem a forma dinheiro: habilitado, mas sem disponível (traço, nunca NaN)", () => {
    expect(estadoPelaGaveta({ ...base, turno: turno({ formasPagamento: [] }) })).toMatchObject({ habilitado: true, disponivel: null });
  });
});

describe("excedeDisponivel", () => {
  const { Saida, Entrada } = TIPO_LANCAMENTO;

  it("saída acima do disponível excede; igual ou abaixo, não", () => {
    expect(excedeDisponivel({ tipo: Saida, valor: 314.01, disponivel: 314 })).toBe(true);
    expect(excedeDisponivel({ tipo: Saida, valor: 314, disponivel: 314 })).toBe(false);
    expect(excedeDisponivel({ tipo: Saida, valor: 10, disponivel: 314 })).toBe(false);
  });

  it("entrada nunca excede", () => {
    expect(excedeDisponivel({ tipo: Entrada, valor: 99999, disponivel: 314 })).toBe(false);
  });

  it("sem disponível conhecido, quem decide é o back", () => {
    expect(excedeDisponivel({ tipo: Saida, valor: 99999, disponivel: null })).toBe(false);
  });

  it("valor inválido não excede", () => {
    expect(excedeDisponivel({ tipo: Saida, valor: Number.NaN, disponivel: 314 })).toBe(false);
  });
});
