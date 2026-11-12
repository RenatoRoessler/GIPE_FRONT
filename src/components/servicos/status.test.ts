import { describe, expect, it } from "vitest";
import { STATUS_SERVICO } from "@/types/servico";
import { acaoDeStatus, avisoDeStatus, podeCancelar, STATUS_DA_FILA, STATUS_ROTULO, STATUS_TOM } from "./status";

describe("status do serviço", () => {
  it("todo status tem rótulo e tom", () => {
    for (const status of Object.values(STATUS_SERVICO)) {
      expect(STATUS_ROTULO[status]).toBeTruthy();
      expect(STATUS_TOM[status]).toBeTruthy();
    }
    expect(STATUS_ROTULO[STATUS_SERVICO.EmExecucao]).toBe("Em execução");
  });

  it("a fila tem três colunas, sem o cancelado", () => {
    expect(STATUS_DA_FILA).toEqual([1, 2, 3]);
  });

  it("a ação principal avança o serviço e Pronto só volta para em execução", () => {
    expect(acaoDeStatus(STATUS_SERVICO.Aguardando)).toEqual({ rotulo: "Iniciar", destino: 2, correcao: false });
    expect(acaoDeStatus(STATUS_SERVICO.EmExecucao)).toEqual({ rotulo: "Marcar como pronto", destino: 3, correcao: false });
    expect(acaoDeStatus(STATUS_SERVICO.Pronto)).toEqual({ rotulo: "Voltar para em execução", destino: 2, correcao: true });
  });

  it("serviço cancelado não tem ação", () => {
    expect(acaoDeStatus(STATUS_SERVICO.Cancelado)).toBeNull();
  });

  it("só o serviço Aguardando pode ser cancelado", () => {
    expect(podeCancelar(STATUS_SERVICO.Aguardando)).toBe(true);
    expect(podeCancelar(STATUS_SERVICO.EmExecucao)).toBe(false);
    expect(podeCancelar(STATUS_SERVICO.Pronto)).toBe(false);
    expect(podeCancelar(STATUS_SERVICO.Cancelado)).toBe(false);
  });

  it("cada destino tem um aviso", () => {
    expect(avisoDeStatus(2)).toBe("Serviço em execução.");
    expect(avisoDeStatus(3)).toBe("Serviço pronto.");
    expect(avisoDeStatus(1)).toBe("Serviço voltou para aguardando.");
  });
});
