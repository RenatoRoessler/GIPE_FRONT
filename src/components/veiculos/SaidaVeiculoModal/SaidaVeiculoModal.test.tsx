import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { SaidaConsulta, SaidaRegistrada } from "@/types/saida";
import type { UseLeitorQrOptions } from "../LeitorQrSaida/useLeitorQr";
import { INTERVALO_SAIDA_MS } from "./useSaidaFlow";

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

const leitor = vi.hoisted(() => ({ options: null as UseLeitorQrOptions | null }));
vi.mock("../LeitorQrSaida/useLeitorQr", async () => {
  const { createRef } = await import("react");
  return {
    useLeitorQr: (options: UseLeitorQrOptions) => {
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

const consulta = (valor = 20): SaidaConsulta =>
  ({
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
    rotatividadeDescricao: "Tabela padrão",
    valor,
  }) as SaidaConsulta;

const registrada: SaidaRegistrada = {
  patioId: 7,
  placa: "BRA2E19",
  dataHoraEntrada: "2026-10-17T10:00:00",
  dataHoraSaida: "2026-10-17T12:36:00",
  minutosPermanencia: 156,
  valor: 20,
  formaPagamento: 1,
};

const confirmar = (valor?: string) =>
  screen.getByRole("button", { name: valor ? new RegExp(`Confirmar (Saída|novo valor) · R\\$\\s${valor}`) : /^Confirmar Saída$/ });

function renderModal() {
  return renderWithProviders(<SaidaVeiculoModal {...handlers} />);
}

const lerQr = (texto: string) => act(() => leitor.options!.onTexto(texto));

async function lerTicket() {
  lerQr("https://gipe.com.br/comprovante/7K3Q9X");
  await screen.findByText("ONIX · PRATA");
}

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
  handlers.onClose.mockReset();
  handlers.onSuccess.mockReset();
  api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "BRA2E19" });
  api.consultarSaida.mockResolvedValue(consulta());
  api.registrarSaida.mockResolvedValue(registrada);
  api.getEmpresa.mockRejectedValue(new Error("sem empresa"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SaidaVeiculoModal: tela única", () => {
  it("abre com leitura, busca manual, resumo e pagamento, sem etapas", () => {
    renderModal();
    expect(screen.getByRole("heading", { name: "Registrar saída" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Área de leitura do QR Code/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Placa")).toBeEnabled();
    expect(screen.getByText("Valor a cobrar")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dinheiro" })).toBeChecked();
    expect(screen.queryByText(/Etapa \d de/)).not.toBeInTheDocument();
    expect(confirmar()).toBeDisabled();
    expect(leitor.options?.ativo).toBe(true);
  });
});

describe("SaidaVeiculoModal: leitura por QR", () => {
  it("lê o QR, mostra o veículo, desliga a câmera e mostra o valor no botão", async () => {
    renderModal();
    await lerTicket();
    expect(screen.getByLabelText("Token")).toHaveValue("7K3Q9X");
    expect(screen.getByLabelText("Placa")).toBeDisabled();
    expect(screen.getByLabelText("Placa")).toHaveValue("BRA2E19");
    expect(leitor.options?.ativo).toBe(false);
    expect(confirmar("20,00")).toBeDisabled();
  });

  it("QR que não é do GIPE avisa e continua lendo", async () => {
    renderModal();
    lerQr("https://outro-site.com/promo");
    expect((await screen.findAllByText("QR Code não é um ticket GIPE")).length).toBeGreaterThan(0);
    expect(api.resolverBuscaPorToken).not.toHaveBeenCalled();
    expect(leitor.options?.ativo).toBe(true);
  });

  it("token sem ticket aberto mostra o aviso e mantém o botão desabilitado", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(new ApiError("not_found", "Nenhum ticket aberto com este token.", 404));
    renderModal();
    lerQr("https://gipe.com.br/comprovante/ZZZZZZ");
    expect(await screen.findByText("Nenhum ticket aberto com este token.")).toBeInTheDocument();
    expect(confirmar()).toBeDisabled();
  });

  it("Limpar libera a busca manual e religa a câmera", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.click(screen.getByRole("button", { name: "Limpar e ler novamente" }));
    expect(screen.getByLabelText("Placa")).toBeEnabled();
    expect(screen.getByLabelText("Token")).toHaveValue("");
    expect(screen.queryByText("ONIX · PRATA")).not.toBeInTheDocument();
    expect(leitor.options?.ativo).toBe(true);
  });
});

describe("SaidaVeiculoModal: busca manual", () => {
  it("consulta por placa", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "bra2e19");
    expect(await screen.findByText("ONIX · PRATA")).toBeInTheDocument();
    expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "placa", valor: "BRA2E19" });
    expect(screen.getByLabelText("Código do ticket")).toBeDisabled();
  });

  it("consulta por código do ticket", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Código do ticket"), "482");
    expect(await screen.findByText("ONIX · PRATA")).toBeInTheDocument();
    expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "codigoTicket", valor: "482" });
  });

  it("consulta por sequencial", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Sequencial"), "12");
    expect(await screen.findByText("ONIX · PRATA")).toBeInTheDocument();
    expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "sequencial", valor: "12" });
  });

  it("placa inválida mostra a orientação ao confirmar com Enter", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "ABC12{Enter}");
    expect(await screen.findByText(/^Placa inválida/)).toBeInTheDocument();
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });

  it("veículo fora do pátio mostra a mensagem e permite tentar de novo", async () => {
    api.consultarSaida.mockRejectedValueOnce(new ApiError("not_found", "Nenhum veículo no pátio com essa placa.", 404));
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "bra2e19");
    expect(await screen.findByText("Nenhum veículo no pátio com essa placa.")).toBeInTheDocument();
    expect(confirmar()).toBeDisabled();

    await user.clear(screen.getByLabelText("Placa"));
    api.consultarSaida.mockResolvedValue(consulta());
    await user.type(screen.getByLabelText("Placa"), "bra2e19");
    expect(await screen.findByText("ONIX · PRATA")).toBeInTheDocument();
  });
});

describe("SaidaVeiculoModal: pagamento e confirmação", () => {
  it("em Dinheiro só habilita com valor recebido suficiente e mostra o troco", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    const botao = confirmar("20,00");
    expect(botao).toBeDisabled();

    await user.type(screen.getByLabelText("Valor recebido"), "10");
    expect(await screen.findByText(/^Faltam R\$\s10,00\.$/)).toBeInTheDocument();
    expect(botao).toBeDisabled();

    await user.clear(screen.getByLabelText("Valor recebido"));
    await user.type(screen.getByLabelText("Valor recebido"), "50");
    expect(await screen.findByText(/^Troco: R\$\s30,00$/)).toBeInTheDocument();
    expect(botao).toBeEnabled();
  });

  it("em Pix não há valor recebido e a saída pode ser confirmada direto", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.click(screen.getByRole("radio", { name: "Pix" }));
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
    expect(confirmar("20,00")).toBeEnabled();
  });

  it("registra a saída, mostra o recibo e conclui com o aviso", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.type(screen.getByLabelText("Valor recebido"), "50");
    await user.click(confirmar("20,00"));

    expect(await screen.findByRole("heading", { name: "Saída registrada" })).toBeInTheDocument();
    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 20, formaPagamento: 1 });
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Área de leitura/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Concluir" }));
    expect(handlers.onSuccess).toHaveBeenCalledWith("Saída realizada com sucesso.");
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("quando o valor mudou, não registra e pede nova confirmação", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.click(screen.getByRole("radio", { name: "Pix" }));
    api.consultarSaida.mockResolvedValue(consulta(25));
    await user.click(confirmar("20,00"));

    expect(await screen.findByRole("alert")).toHaveTextContent(/mudou de R\$\s20,00 para R\$\s25,00/);
    expect(api.registrarSaida).not.toHaveBeenCalled();

    await user.click(confirmar("25,00"));
    expect(await screen.findByRole("heading", { name: "Saída registrada" })).toBeInTheDocument();
    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 25, formaPagamento: 2 });
  });

  it("erro de registro mostra o motivo e mantém os dados", async () => {
    api.registrarSaida.mockRejectedValue(new ApiError("validation", "Não há caixa aberto.", 400));
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.type(screen.getByLabelText("Valor recebido"), "50");
    await user.click(confirmar("20,00"));

    expect(await screen.findByText("Não há caixa aberto.")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor recebido")).toHaveValue("50");
    expect(screen.getByText("ONIX · PRATA")).toBeInTheDocument();
    expect(confirmar("20,00")).toBeEnabled();
  });

  it("não deixa fechar nem confirmar de novo durante o envio", async () => {
    let concluir: (value: SaidaRegistrada) => void = () => {};
    api.registrarSaida.mockReturnValue(new Promise<SaidaRegistrada>((resolve) => (concluir = resolve)));
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.click(screen.getByRole("radio", { name: "Pix" }));
    await user.click(confirmar("20,00"));

    const registrando = await screen.findByRole("button", { name: "Registrando…" });
    expect(registrando).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(api.registrarSaida).toHaveBeenCalledTimes(1);

    await act(async () => concluir(registrada));
    expect(await screen.findByRole("heading", { name: "Saída registrada" })).toBeInTheDocument();
  });
});

describe("SaidaVeiculoModal: atualização ao vivo", () => {
  it("reconsulta a cada ciclo e avisa quando o valor muda", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderModal();
    await lerTicket();
    api.consultarSaida.mockResolvedValue(consulta(25));
    await act(async () => void (await vi.advanceTimersByTimeAsync(INTERVALO_SAIDA_MS)));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/mudou de R\$\s20,00 para R\$\s25,00/));
    expect(confirmar("25,00")).toBeInTheDocument();
  });
});

describe("SaidaVeiculoModal: fechar", () => {
  it("fecha direto quando não há nada em andamento", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("com leitura em andamento pede confirmação antes de descartar", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handlers.onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Cancelar a saída?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continuar saída" }));
    expect(handlers.onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
    expect(api.registrarSaida).not.toHaveBeenCalled();
  });
});
