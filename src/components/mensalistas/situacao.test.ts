import { describe, expect, it } from "vitest";
import {
  CONTRATO_STATUS,
  SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  type ContratoMensalista,
} from "@/types/mensalista";
import { derivarSituacao, precisaDoContrato, type ContratoConsulta } from "./situacao";

const agora = new Date(2026, 9, 21, 12, 0, 0);
const aguardando = { ativo: false, situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO };

function contrato(extra: Partial<ContratoMensalista>): ContratoConsulta {
  return {
    isPending: false,
    isError: false,
    data: {
      status: CONTRATO_STATUS.Pendente,
      versao: "1",
      titulo: "Contrato",
      dataGeracao: null,
      tokenExpiracao: null,
      dataAceite: null,
      ...extra,
    },
  };
}

describe("precisaDoContrato", () => {
  it("só para inativo aguardando o primeiro pagamento", () => {
    expect(precisaDoContrato(aguardando)).toBe(true);
    expect(precisaDoContrato({ ativo: true, situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO })).toBe(false);
    expect(precisaDoContrato({ ativo: false, situacao: "Pagamento Atrasado" })).toBe(false);
    expect(precisaDoContrato({ ativo: false, situacao: null })).toBe(false);
  });
});

describe("derivarSituacao", () => {
  it("ativo não depende do contrato", () => {
    expect(derivarSituacao({ ativo: true, situacao: "Em Dia" }, undefined, agora)).toEqual({ kind: "ativo" });
  });

  it("inativo que já pagou antes (ou sem situação) é só inativo", () => {
    expect(derivarSituacao({ ativo: false, situacao: "Pagamento Atrasado" }, undefined, agora)).toEqual({ kind: "inativo" });
    expect(derivarSituacao({ ativo: false, situacao: null }, undefined, agora)).toEqual({ kind: "inativo" });
  });

  it("consulta em andamento", () => {
    expect(derivarSituacao(aguardando, { isPending: true, isError: false, data: undefined }, agora)).toEqual({
      kind: "carregando",
    });
  });

  it("erro na consulta cai em desconhecida", () => {
    expect(derivarSituacao(aguardando, { isPending: false, isError: true, data: undefined }, agora)).toEqual({
      kind: "desconhecida",
    });
  });

  it("sem consulta disponível também cai em desconhecida", () => {
    expect(derivarSituacao(aguardando, undefined, agora)).toEqual({ kind: "desconhecida" });
  });

  it("sem contrato (404) ou cancelado permite enviar um novo", () => {
    expect(derivarSituacao(aguardando, { isPending: false, isError: false, data: null }, agora)).toEqual({
      kind: "sem-contrato",
    });
    expect(derivarSituacao(aguardando, contrato({ status: CONTRATO_STATUS.Cancelado }), agora)).toEqual({
      kind: "sem-contrato",
    });
  });

  it("aceito aguarda o primeiro pagamento, com a data do aceite", () => {
    expect(
      derivarSituacao(aguardando, contrato({ status: CONTRATO_STATUS.Aceito, dataAceite: "2026-10-20T14:32:00" }), agora),
    ).toEqual({ kind: "aguardando-pagamento", aceitoEm: "2026-10-20T14:32:00" });
  });

  it("pendente com link válido", () => {
    expect(derivarSituacao(aguardando, contrato({ tokenExpiracao: "2026-10-27T18:00:00" }), agora)).toEqual({
      kind: "aguardando-aceite",
      expiraEm: "2026-10-27T18:00:00",
    });
  });

  it("pendente sem validade informada segue como aguardando aceite", () => {
    expect(derivarSituacao(aguardando, contrato({ tokenExpiracao: null }), agora)).toEqual({
      kind: "aguardando-aceite",
      expiraEm: null,
    });
  });

  it("pendente com link no passado está vencido", () => {
    expect(derivarSituacao(aguardando, contrato({ tokenExpiracao: "2026-10-20T11:59:59" }), agora)).toEqual({
      kind: "link-vencido",
    });
  });

  it("no instante exato da validade já venceu; um segundo antes ainda vale", () => {
    expect(derivarSituacao(aguardando, contrato({ tokenExpiracao: "2026-10-21T12:00:00" }), agora).kind).toBe("link-vencido");
    expect(derivarSituacao(aguardando, contrato({ tokenExpiracao: "2026-10-21T12:00:01" }), agora).kind).toBe(
      "aguardando-aceite",
    );
  });
});
