import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { PatioVeiculo } from "@/types/patio";
import type { SaidaConsulta, SaidaRegistrada } from "@/types/saida";

const api = vi.hoisted(() => ({
  listPatio: vi.fn(),
  consultarSaida: vi.fn(),
  registrarSaida: vi.fn(),
  resolverBuscaPorToken: vi.fn(),
  getEmpresa: vi.fn(),
}));

vi.mock("@/lib/api/services/patio", () => ({
  listPatio: api.listPatio,
  consultarSaida: api.consultarSaida,
  registrarSaida: api.registrarSaida,
  resolverBuscaPorToken: api.resolverBuscaPorToken,
}));
vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: api.getEmpresa }));
vi.mock("../useVagasPatio", () => ({ useVagasPatio: () => ({ moto: 12, carro: 23 }) }));

import { PATIO_ATUALIZACAO_MS } from "../usePatio";
import { PatioView } from "./PatioView";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

function veiculo(placa: string, minutos: number, extra: Partial<PatioVeiculo> = {}): PatioVeiculo {
  return {
    patioId: minutos,
    placa,
    categoria: 2,
    modelo: "Gol",
    cor: "PRATA",
    codigoTicket: null,
    sequencial: minutos,
    mensalista: false,
    dataHoraEntrada: "2026-10-17T15:30:22",
    minutosPermanencia: minutos,
    permanencia: `${minutos}min`,
    rotatividadeDescricao: "TABELA",
    usuarioEntrada: "operador",
    token: "ABCD1234",
    ...extra,
  };
}

const PRIMEIRO = veiculo("BRA2E19", 300);
const SEGUNDO = veiculo("MNB7880", 200);
const TERCEIRO = veiculo("KVN1F76", 100, { mensalista: true });

const consulta = (placa: string, patioId: number): SaidaConsulta => ({
  patioId,
  placa,
  categoria: 2,
  modelo: "Gol",
  cor: "PRATA",
  codigoTicket: 1,
  sequencial: patioId,
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
});

const registrada = (placa: string, patioId: number): SaidaRegistrada => ({
  patioId,
  placa,
  dataHoraEntrada: "2026-10-17T10:00:00",
  dataHoraSaida: "2026-10-17T12:36:00",
  minutosPermanencia: 156,
  valor: 20,
  formaPagamento: 2,
});

function abrir(lista = [PRIMEIRO, SEGUNDO, TERCEIRO]) {
  api.listPatio.mockResolvedValue(lista);
  return renderWithProviders(<PatioView />);
}

const botaoSaida = (placa: string) => screen.getByRole("button", { name: `Registrar saída de ${placa}` });

// Abre a saída do veículo, paga em Pix e conclui; devolve depois de o modal fechar.
async function pagarSaida(placa: string, patioId: number, listaDepois: PatioVeiculo[]) {
  api.consultarSaida.mockResolvedValue(consulta(placa, patioId));
  api.registrarSaida.mockResolvedValue(registrada(placa, patioId));
  await userEvent.click(botaoSaida(placa));
  await userEvent.click(await screen.findByRole("radio", { name: "Pix" }));
  await waitFor(() => expect(screen.getByRole("button", { name: /^Confirmar Saída · / })).toBeEnabled());
  // Depois da saída o servidor já não lista o veículo.
  api.listPatio.mockResolvedValue(listaDepois);
  await userEvent.click(screen.getByRole("button", { name: /^Confirmar Saída · / }));
  await userEvent.click(await screen.findByRole("button", { name: "Concluir" }));
}

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
  api.getEmpresa.mockResolvedValue({ company: {}, hours: {}, payments: { dinheiro: true, pix: true, cartaoCredito: true, cartaoDebito: true } });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PatioView: registrar a saída", () => {
  it("abre a saída do veículo escolhido, já na confirmação e com a placa consultada", async () => {
    api.consultarSaida.mockResolvedValue(consulta("MNB7880", 200));
    abrir();

    await userEvent.click(await screen.findByRole("button", { name: "Registrar saída de MNB7880" }));

    expect(await screen.findByRole("dialog", { name: "Confirmar saída" })).toBeInTheDocument();
    expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "placa", valor: "MNB7880" });
    expect(screen.queryByLabelText("Placa")).not.toBeInTheDocument();
  });

  it("a lista não se atualiza sozinha enquanto o modal está aberto", async () => {
    abrir();
    await screen.findByRole("button", { name: "Registrar saída de MNB7880" });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    api.consultarSaida.mockResolvedValue(consulta("MNB7880", 200));
    api.listPatio.mockClear();

    await userEvent.click(botaoSaida("MNB7880"));
    await screen.findByRole("dialog", { name: "Confirmar saída" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PATIO_ATUALIZACAO_MS * 3);
    });

    expect(api.listPatio).not.toHaveBeenCalled();
  });

  it("concluída a saída, o veículo some, o toast aparece, o foco vai ao vizinho e o aviso é lido", async () => {
    abrir();
    await screen.findByRole("button", { name: "Registrar saída de BRA2E19" });

    await pagarSaida("BRA2E19", 300, [SEGUNDO, TERCEIRO]);

    await waitFor(() => expect(screen.queryByRole("button", { name: "Registrar saída de BRA2E19" })).not.toBeInTheDocument());
    expect(await screen.findByText("Saída realizada com sucesso.")).toBeInTheDocument();
    await waitFor(() => expect(botaoSaida("MNB7880")).toHaveFocus());
    expect(screen.getByText("BRA2E19 saiu do pátio.")).toBeInTheDocument();
  });

  it("a busca e os filtros continuam como estavam depois da saída", async () => {
    abrir();
    await screen.findByRole("button", { name: "Registrar saída de BRA2E19" });
    await userEvent.click(screen.getByRole("button", { name: /^Avulsos/ }));
    await userEvent.type(screen.getByLabelText("Buscar por placa, modelo ou ticket"), "gol");
    await waitFor(() => expect(screen.queryByRole("button", { name: "Registrar saída de KVN1F76" })).not.toBeInTheDocument());

    await pagarSaida("BRA2E19", 300, [SEGUNDO, TERCEIRO]);

    await waitFor(() => expect(screen.queryByRole("button", { name: "Registrar saída de BRA2E19" })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: /^Avulsos/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Buscar por placa, modelo ou ticket")).toHaveValue("gol");
    expect(botaoSaida("MNB7880")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Registrar saída de KVN1F76" })).not.toBeInTheDocument();
  });

  it("se o último veículo sai, a lista vazia aparece e o aviso e o toast continuam na tela", async () => {
    abrir([PRIMEIRO]);
    await screen.findByRole("button", { name: "Registrar saída de BRA2E19" });

    await pagarSaida("BRA2E19", 300, []);

    expect(await screen.findByText("Nenhum veículo no pátio.")).toBeInTheDocument();
    expect(screen.getByText("Saída realizada com sucesso.")).toBeInTheDocument();
    expect(screen.getByText("BRA2E19 saiu do pátio.")).toBeInTheDocument();
  });

  it("cancelar o modal mantém o veículo, o foco e a lista", async () => {
    abrir();
    api.consultarSaida.mockResolvedValue(consulta("MNB7880", 200));
    const botao = await screen.findByRole("button", { name: "Registrar saída de MNB7880" });
    botao.focus();

    await userEvent.click(botao);
    await screen.findByRole("dialog", { name: "Confirmar saída" });
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    // Com o veículo encontrado, o fluxo de saída pede para confirmar o descarte.
    await userEvent.click(await screen.findByRole("button", { name: "Descartar" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Confirmar saída" })).not.toBeInTheDocument());
    expect(screen.getAllByRole("button", { name: /^Registrar saída de / })).toHaveLength(3);
    expect(screen.queryByText(/saiu do pátio/)).not.toBeInTheDocument();
    expect(screen.queryByText("Saída realizada com sucesso.")).not.toBeInTheDocument();
    expect(api.registrarSaida).not.toHaveBeenCalled();
  });

  it("depois de cancelar, a atualização automática volta", async () => {
    abrir();
    await screen.findByRole("button", { name: "Registrar saída de MNB7880" });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    api.consultarSaida.mockResolvedValue(consulta("MNB7880", 200));

    await userEvent.click(botaoSaida("MNB7880"));
    await screen.findByRole("dialog", { name: "Confirmar saída" });
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    await userEvent.click(await screen.findByRole("button", { name: "Descartar" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Confirmar saída" })).not.toBeInTheDocument());
    api.listPatio.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PATIO_ATUALIZACAO_MS + 100);
    });

    expect(api.listPatio).toHaveBeenCalled();
  });
});
