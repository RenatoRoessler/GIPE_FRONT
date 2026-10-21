import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { SituacaoMensalista } from "@/types/mensalista";
import {
  classificarErroPagamento,
  explicarVencimento,
  MENSAGENS_ERRO_PAGAMENTO,
  podeRegistrarPagamento,
  rotuloAtivacao,
  rotuloConfirmar,
} from "./pagamento";

describe("podeRegistrarPagamento", () => {
  it.each<[SituacaoMensalista, unknown]>([
    [{ kind: "ativo" }, { pode: true, primeiroPagamento: false }],
    [{ kind: "inativo" }, { pode: true, primeiroPagamento: false }],
    [{ kind: "aguardando-pagamento", aceitoEm: null }, { pode: true, primeiroPagamento: true }],
    [{ kind: "desconhecida" }, { pode: true, primeiroPagamento: true }],
    [{ kind: "aguardando-aceite", expiraEm: null }, { pode: false, motivo: "contrato-nao-aceito" }],
    [{ kind: "link-vencido" }, { pode: false, motivo: "contrato-nao-aceito" }],
    [{ kind: "sem-contrato" }, { pode: false, motivo: "contrato-nao-aceito" }],
    [{ kind: "carregando" }, { pode: false, motivo: "carregando" }],
  ])("%o", (situacao, esperado) => {
    expect(podeRegistrarPagamento(situacao)).toEqual(esperado);
  });
});

describe("rotuloAtivacao", () => {
  it("avisa da ativação só no primeiro pagamento", () => {
    expect(rotuloAtivacao(true)).toContain("será ativado");
    expect(rotuloAtivacao(false)).not.toContain("ativado");
  });
});

describe("rotuloConfirmar", () => {
  it("leva o valor e a forma escolhida", () => {
    expect(rotuloConfirmar("280,00", "2")).toBe("Confirmar R$ 280,00 em Pix");
    expect(rotuloConfirmar("1.280,00", "6")).toBe("Confirmar R$ 1.280,00 em Transferência bancária");
  });

  it("cai para o texto genérico com valor inválido", () => {
    expect(rotuloConfirmar("", "2")).toBe("Confirmar pagamento");
    expect(rotuloConfirmar("0", "2")).toBe("Confirmar pagamento");
    expect(rotuloConfirmar("10,555", "2")).toBe("Confirmar pagamento");
  });

  it("omite a forma quando nenhuma foi escolhida", () => {
    expect(rotuloConfirmar("10", "")).toBe("Confirmar R$ 10,00");
  });
});

describe("explicarVencimento", () => {
  it("explica o dia 31 atravessando novembro", () => {
    expect(explicarVencimento(31, "2026-12-01")).toBe(
      "Dia 31 do cadastro; novembro não tem dia 31, então vence em 01/12.",
    );
  });

  it("explica fevereiro comum e bissexto", () => {
    expect(explicarVencimento(30, "2027-03-01")).toContain("fevereiro não tem dia 30");
    expect(explicarVencimento(29, "2027-03-01")).toContain("fevereiro não tem dia 29");
    expect(explicarVencimento(30, "2028-03-01")).toContain("fevereiro não tem dia 30");
  });

  it("explica o dia 31 em meses de 30 dias (abril, junho, setembro)", () => {
    expect(explicarVencimento(31, "2027-05-01")).toContain("abril não tem dia 31");
  });

  it("não explica quando o vencimento cai no dia do cadastro", () => {
    expect(explicarVencimento(31, "2026-12-31")).toBeNull();
    expect(explicarVencimento(5, "2026-11-05")).toBeNull();
    expect(explicarVencimento(29, "2028-02-29")).toBeNull();
  });

  it("não explica quando o mês anterior tinha o dia do cadastro", () => {
    expect(explicarVencimento(30, "2026-12-01")).toBeNull();
    expect(explicarVencimento(5, "2026-12-01")).toBeNull();
  });

  it("aceita data com horário e vira o ano", () => {
    expect(explicarVencimento(31, "2027-01-01T00:00:00")).toBeNull();
    expect(explicarVencimento(31, "2026-12-01T00:00:00")).toContain("novembro");
  });

  it("não explica sem data ou com data inválida", () => {
    expect(explicarVencimento(31, null)).toBeNull();
    expect(explicarVencimento(31, "01/12/2026")).toBeNull();
  });
});

describe("classificarErroPagamento", () => {
  it.each([
    [new ApiError("network"), "rede"],
    [new ApiError("timeout"), "rede"],
    [new ApiError("unauthorized", "Sessão expirada. Faça login novamente.", 401), "sessao"],
    [new ApiError("validation", "O contrato ainda não foi aceito.", 400), "contrato-nao-aceito"],
    [new ApiError("validation", "Aceite do contrato pendente.", 400), "contrato-nao-aceito"],
    [new ApiError("validation", "Mensalista sem cobrança pendente.", 400), "sem-cobranca"],
    [new ApiError("not_found", "Nenhuma cobrança encontrada.", 404), "sem-cobranca"],
    [new ApiError("validation", "Valor inválido.", 400), "generico"],
    [new ApiError("not_found", "Mensalista não encontrado.", 404), "generico"],
    [new ApiError("forbidden", "Você não tem permissão para realizar esta ação.", 403), "generico"],
    [new ApiError("server", undefined, 500), "generico"],
    [new Error("boom"), "generico"],
  ])("%o -> %s", (error, kind) => {
    expect(classificarErroPagamento(error).kind).toBe(kind);
  });

  it("usa o texto próprio nos casos conhecidos e o do back nos demais", () => {
    expect(classificarErroPagamento(new ApiError("network")).message).toBe(MENSAGENS_ERRO_PAGAMENTO.rede);
    expect(classificarErroPagamento(new ApiError("validation", "Valor inválido.", 400)).message).toBe("Valor inválido.");
    expect(classificarErroPagamento(new ApiError("forbidden", "Sem permissão.", 403)).message).toBe("Sem permissão.");
  });

  it("não vaza detalhes de erros que não são da API", () => {
    expect(classificarErroPagamento(new Error("stack interna")).message).not.toContain("stack");
  });
});
