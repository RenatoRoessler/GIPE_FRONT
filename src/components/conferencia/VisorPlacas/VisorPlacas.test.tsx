import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { leituraConferido, leituraJaConferido, leituraSemEntrada } from "@/lib/api/services/conferenciaPatio.fixture";
import { fromLeituraResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { renderWithTheme } from "@/test/render";
import type { UltimaLeitura } from "../useConferenciaAcoes";

const leitor = vi.hoisted(() => ({
  estado: "lendo" as string,
  contextoSeguro: true,
  iniciar: vi.fn(),
  opcoes: null as null | { ativo: boolean; continuo?: boolean; tempoLimiteMs?: number; onPlaca: (placa: string) => void },
}));

vi.mock("@/components/veiculos/LeitorPlacaModal/useLeitorPlaca", () => ({
  useLeitorPlaca: (opcoes: NonNullable<typeof leitor.opcoes>) => {
    leitor.opcoes = opcoes;
    return { videoRef: { current: null }, estado: leitor.estado, contextoSeguro: leitor.contextoSeguro, iniciar: leitor.iniciar };
  },
}));

import { VisorPlacas, TEMPO_LIMITE_CONFERENCIA_MS, type VisorPlacasProps } from "./VisorPlacas";

function ultima(bruto: Record<string, unknown>): UltimaLeitura {
  const leitura = fromLeituraResponse(bruto);
  return { placa: leitura.placa, leitura };
}

function montar(props: Partial<VisorPlacasProps> = {}) {
  const base: VisorPlacasProps = {
    ativo: true,
    onPlaca: vi.fn(),
    ultimaLeitura: null,
    onRegistrarEntrada: vi.fn(),
    onDigitar: vi.fn(),
  };
  const final = { ...base, ...props };
  renderWithTheme(<VisorPlacas {...final} />);
  return final;
}

function aba(visibilidade: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value: visibilidade, configurable: true });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  leitor.estado = "lendo";
  leitor.contextoSeguro = true;
  leitor.opcoes = null;
  aba("visible");
});

describe("VisorPlacas", () => {
  it("liga a câmera em modo contínuo, com o limite de inatividade da conferência", () => {
    montar();
    expect(leitor.opcoes).toMatchObject({ ativo: true, continuo: true, tempoLimiteMs: TEMPO_LIMITE_CONFERENCIA_MS });
    expect(TEMPO_LIMITE_CONFERENCIA_MS).toBe(120_000);
  });

  it("entrega ao chamador cada placa lida pela câmera", () => {
    const { onPlaca } = montar();
    leitor.opcoes?.onPlaca("ABC1D23");
    expect(onPlaca).toHaveBeenCalledWith("ABC1D23");
  });

  it("desliga a câmera quando a etapa deixa de estar ativa", () => {
    montar({ ativo: false });
    expect(leitor.opcoes?.ativo).toBe(false);
  });

  it("desliga a câmera com a aba escondida e religa ao voltar", () => {
    montar();
    aba("hidden");
    expect(leitor.opcoes?.ativo).toBe(false);
    aba("visible");
    expect(leitor.opcoes?.ativo).toBe(true);
  });

  it("pede para apontar a câmera enquanto lê", () => {
    montar();
    expect(screen.getByText("Aponte a câmera para a placa")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ler placas" })).not.toBeInTheDocument();
  });

  describe("última leitura", () => {
    it("conferido: mostra a placa e o resultado em texto", () => {
      montar({ ultimaLeitura: ultima(leituraConferido) });
      expect(screen.getByText("BBB2B22")).toBeInTheDocument();
      expect(screen.getAllByText("Conferido · Corolla").length).toBeGreaterThan(0);
    });

    it("já conferido", () => {
      montar({ ultimaLeitura: ultima(leituraJaConferido) });
      expect(screen.getAllByText("Já conferido antes").length).toBeGreaterThan(0);
    });

    it("sem entrada: o resultado é um botão que abre o registro da entrada", async () => {
      const { onRegistrarEntrada } = montar({ ultimaLeitura: ultima(leituraSemEntrada) });
      await userEvent.setup().click(screen.getByRole("button", { name: "Sem entrada · Registrar agora" }));
      expect(onRegistrarEntrada).toHaveBeenCalledWith("ZZZ9Z99");
    });

    it("anuncia o resultado com a placa soletrada", () => {
      montar({ ultimaLeitura: ultima(leituraConferido) });
      expect(screen.getByRole("status")).toHaveTextContent("Placa B B B 2 B 2 2. Conferido · Corolla");
    });

    it("sem leitura, o anúncio fica vazio", () => {
      montar();
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });
  });

  describe("quando a câmera falha", () => {
    it.each([
      ["sem-leitura", "A câmera parou por falta de leitura. Toque em Ler placas para continuar."],
      ["negada", "Permita o acesso à câmera nas configurações do navegador, ou digite a placa."],
    ])("%s: explica e oferece religar e digitar", async (estado, mensagem) => {
      leitor.estado = estado;
      const { onDigitar } = montar();
      const user = userEvent.setup();
      expect(screen.getByText(mensagem)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Ler placas" }));
      expect(leitor.iniciar).toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Digitar placa" }));
      expect(onDigitar).toHaveBeenCalled();
    });

    it("indisponível: só oferece digitar, e explica o HTTPS quando é o caso", () => {
      leitor.estado = "indisponivel";
      leitor.contextoSeguro = false;
      montar();
      expect(screen.getByText(/conexão segura \(HTTPS\)/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Ler placas" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Digitar placa" })).toBeInTheDocument();
    });

    it("indisponível em conexão segura: câmera ausente no aparelho", () => {
      leitor.estado = "indisponivel";
      montar();
      expect(screen.getByText(/não está disponível neste aparelho ou navegador/)).toBeInTheDocument();
    });
  });
});
