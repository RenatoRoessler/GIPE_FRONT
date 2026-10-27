import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { QUADROS_QUERY_KEY } from "@/components/quadros/quadrosKeys";
import { renderWithProviders } from "@/test/render";
import type { SaidaConsulta, SaidaRegistrada } from "@/types/saida";
import type { UseLeitorQrOptions } from "../LeitorQrSaida/useLeitorQr";

const api = vi.hoisted(() => ({
  consultarSaida: vi.fn(),
  registrarSaida: vi.fn(),
  resolverBuscaPorToken: vi.fn(),
  getEmpresa: vi.fn(),
}));

vi.mock("@/lib/api/services/patio", () => ({
  consultarSaida: api.consultarSaida,
  registrarSaida: api.registrarSaida,
  resolverBuscaPorToken: api.resolverBuscaPorToken,
}));
vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: api.getEmpresa }));

// O leitor de QR liga a câmera: contar as montagens mostra se ele chegou a ser usado.
const leitor = vi.hoisted(() => ({ montagens: 0, options: null as UseLeitorQrOptions | null }));
vi.mock("../LeitorQrSaida/useLeitorQr", async () => {
  const { createRef } = await import("react");
  return {
    useLeitorQr: (options: UseLeitorQrOptions) => {
      leitor.montagens += 1;
      leitor.options = options;
      return { videoRef: createRef(), estado: "lendo", iniciar: vi.fn() };
    },
  };
});

import { SaidaVeiculoModal } from "./SaidaVeiculoModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const handlers = { onClose: vi.fn(), onSuccess: vi.fn() };

const consulta: SaidaConsulta = {
  patioId: 7,
  placa: "BRA2E19",
  categoria: 2,
  modelo: "ONIX",
  cor: "PRATA",
  codigoTicket: 482,
  sequencial: 12,
  mensalista: false,
  dataHoraEntrada: "2026-10-17T10:00:00",
  dataHoraSaida: "2026-10-17T12:35:00",
  minutosPermanencia: 155,
  rotatividadeId: 1,
  rotatividadeDescricao: "Tabela padrão",
  regra: null,
  faixaMinutosLimite: null,
  horasAdicionais: null,
  valor: 20,
};

const registrada: SaidaRegistrada = {
  patioId: 7,
  placa: "BRA2E19",
  dataHoraEntrada: "2026-10-17T10:00:00",
  dataHoraSaida: "2026-10-17T12:36:00",
  minutosPermanencia: 156,
  valor: 20,
  formaPagamento: 1,
};

const BUSCA = { tipo: "placa", valor: "BRA2E19" } as const;
const visor = () => screen.queryByRole("button", { name: /Área de leitura do QR Code/ });

function abrirDireto() {
  return renderWithProviders(<SaidaVeiculoModal {...handlers} buscaInicial={BUSCA} />);
}

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
  handlers.onClose.mockReset();
  handlers.onSuccess.mockReset();
  leitor.montagens = 0;
  leitor.options = null;
  api.consultarSaida.mockResolvedValue(consulta);
  api.registrarSaida.mockResolvedValue(registrada);
  api.getEmpresa.mockResolvedValue({ company: {}, hours: {}, payments: { dinheiro: true, pix: true, cartaoCredito: true, cartaoDebito: true } });
});

describe("SaidaVeiculoModal: aberta a partir da lista do pátio", () => {
  it("abre já em Confirmar saída, sem pesquisa e sem montar o leitor de QR", async () => {
    api.consultarSaida.mockReturnValue(new Promise(() => {}));
    abrirDireto();

    expect(screen.getByRole("dialog", { name: "Confirmar saída" })).toBeInTheDocument();
    expect(screen.getByText("Procurando o veículo no pátio.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Placa")).not.toBeInTheDocument();
    expect(visor()).not.toBeInTheDocument();
    // A câmera nunca foi pedida.
    expect(leitor.montagens).toBe(0);
    expect(screen.getByRole("button", { name: /^Confirmar Saída$/ })).toBeDisabled();
  });

  it("consulta a placa escolhida uma única vez e mostra o veículo", async () => {
    abrirDireto();

    expect(await screen.findByText("ONIX · PRATA")).toBeInTheDocument();
    expect(api.consultarSaida).toHaveBeenCalledTimes(1);
    expect(api.consultarSaida).toHaveBeenCalledWith(BUSCA);
    expect(leitor.montagens).toBe(0);
    expect(screen.getByRole("dialog", { name: "Confirmar saída" })).toBeInTheDocument();
  });

  it("mensalista escolhido na lista abre com o card e sem pagamento", async () => {
    api.consultarSaida.mockResolvedValue({ ...consulta, mensalista: true, mensalistaNome: "Maria" });
    abrirDireto();

    expect(await screen.findByText("Saída sem cobrança.")).toBeInTheDocument();
    expect(screen.getByText("Sem pagamento nesta saída.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Confirmar Saída$/ })).toBeEnabled();
  });

  it("dá para desistir enquanto o veículo ainda carrega, sem pedir confirmação (a placa veio da lista)", async () => {
    api.consultarSaida.mockReturnValue(new Promise(() => {}));
    abrirDireto();

    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(handlers.onClose).toHaveBeenCalled();
    expect(screen.queryByText(/Descartar/i)).not.toBeInTheDocument();
  });

  it("se o veículo já saiu, cai na pesquisa com o aviso e a placa preenchida", async () => {
    api.consultarSaida.mockRejectedValue(new ApiError("not_found", "Nenhum veículo no pátio com essa placa.", 404));
    abrirDireto();

    expect(await screen.findByRole("dialog", { name: "Localizar veículo" })).toBeInTheDocument();
    expect((await screen.findAllByText("Nenhum veículo no pátio com essa placa.")).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Placa")).toHaveValue("BRA2E19");
  });

  it("Voltar para a pesquisa volta de verdade, sem reabrir a confirmação", async () => {
    abrirDireto();
    await screen.findByText("ONIX · PRATA");

    await userEvent.click(screen.getByRole("button", { name: "Voltar para a pesquisa" }));

    expect(await screen.findByRole("dialog", { name: "Localizar veículo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Placa")).toHaveValue("");
    expect(visor()).toBeInTheDocument();
  });

  it("registrar a saída invalida a lista do pátio e os quadros de chaves", async () => {
    const tela = abrirDireto();
    const invalidar = vi.spyOn(tela.queryClient, "invalidateQueries");
    await screen.findByText("ONIX · PRATA");
    // Em Pix não há valor recebido a informar.
    await userEvent.click(await screen.findByRole("radio", { name: "Pix" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Confirmar Saída · / })).toBeEnabled());

    await userEvent.click(screen.getByRole("button", { name: /^Confirmar Saída · / }));

    await waitFor(() => expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 20, formaPagamento: 2 }));
    await waitFor(() => expect(invalidar).toHaveBeenCalledWith({ queryKey: PATIO_QUERY_KEY }));
    expect(invalidar).toHaveBeenCalledWith({ queryKey: QUADROS_QUERY_KEY });
  });
});

describe("SaidaVeiculoModal: sem veículo escolhido", () => {
  it("continua abrindo na pesquisa, com o leitor de QR", () => {
    renderWithProviders(<SaidaVeiculoModal {...handlers} />);

    expect(screen.getByRole("dialog", { name: "Localizar veículo" })).toBeInTheDocument();
    expect(visor()).toBeInTheDocument();
    expect(leitor.montagens).toBeGreaterThan(0);
    expect(screen.getByLabelText("Placa")).toHaveValue("");
  });
});
