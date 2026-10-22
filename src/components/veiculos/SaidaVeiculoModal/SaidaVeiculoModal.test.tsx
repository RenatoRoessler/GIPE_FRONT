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

const TODOS_OS_MEIOS = { dinheiro: true, pix: true, cartaoCredito: true, cartaoDebito: true };
const empresa = (payments = TODOS_OS_MEIOS) => ({ company: {}, hours: {}, payments });

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
const voltar = () => screen.getByRole("button", { name: "Voltar para a pesquisa" });
const visor = () => screen.queryByRole("button", { name: /Área de leitura do QR Code/ });

function renderModal() {
  return renderWithProviders(<SaidaVeiculoModal {...handlers} />);
}

const lerQr = (texto: string) => act(() => leitor.options!.onTexto(texto));

// Lê o QR e espera a tela passar para a fase de pagamento.
async function lerTicket() {
  lerQr("https://gipe.com.br/comprovante/7K3Q9X");
  await screen.findByText("ONIX · PRATA");
}

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
  handlers.onClose.mockReset();
  handlers.onSuccess.mockReset();
  leitor.options = null;
  api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "BRA2E19" });
  api.consultarSaida.mockResolvedValue(consulta());
  api.registrarSaida.mockResolvedValue(registrada);
  api.getEmpresa.mockResolvedValue(empresa());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SaidaVeiculoModal: fase de pesquisa", () => {
  it("abre só com a leitura de QR e a busca manual", () => {
    renderModal();
    expect(screen.getByRole("heading", { level: 2, name: "Localizar veículo" })).toBeInTheDocument();
    expect(visor()).toBeInTheDocument();
    expect(screen.getByLabelText("Placa")).toBeEnabled();
    expect(screen.getByLabelText("Token")).toBeEnabled();
    expect(screen.getByLabelText("Sequencial")).toBeEnabled();
    expect(leitor.options?.ativo).toBe(true);
  });

  it("não mostra resumo, valor, pagamento nem confirmação", () => {
    renderModal();
    expect(screen.queryByText("Valor a cobrar")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Forma de pagamento" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Confirmar Saída/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Voltar para a pesquisa" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
  });

  it("QR que não é do GIPE avisa e continua na pesquisa", async () => {
    renderModal();
    lerQr("https://outro-site.com/promo");
    expect((await screen.findAllByText("QR Code não é um ticket GIPE")).length).toBeGreaterThan(0);
    expect(api.resolverBuscaPorToken).not.toHaveBeenCalled();
    expect(leitor.options?.ativo).toBe(true);
    expect(screen.getByRole("heading", { level: 2, name: "Localizar veículo" })).toBeInTheDocument();
  });

  it("token sem ticket aberto mostra o aviso, fica na pesquisa e religa a câmera", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(new ApiError("not_found", "Nenhum ticket aberto com este token.", 404));
    renderModal();
    lerQr("https://gipe.com.br/comprovante/ZZZZZZ");
    expect(await screen.findByText("Nenhum ticket aberto com este token.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Localizar veículo" })).toBeInTheDocument();
    await waitFor(() => expect(leitor.options?.ativo).toBe(true));
    expect(visor()).toBeInTheDocument();
  });

  it("não repete a busca do mesmo QR logo depois de falhar", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(new ApiError("not_found", "Nenhum ticket aberto com este token.", 404));
    renderModal();
    lerQr("https://gipe.com.br/comprovante/ZZZZZZ");
    await screen.findByText("Nenhum ticket aberto com este token.");
    lerQr("https://gipe.com.br/comprovante/ZZZZZZ");
    expect(api.resolverBuscaPorToken).toHaveBeenCalledTimes(1);
  });

  it("veículo fora do pátio mostra a mensagem e permite tentar de novo", async () => {
    api.consultarSaida.mockRejectedValueOnce(new ApiError("not_found", "Nenhum veículo no pátio com essa placa.", 404));
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "bra2e19");
    expect(await screen.findByText("Nenhum veículo no pátio com essa placa.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Localizar veículo" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Placa"));
    await user.type(screen.getByLabelText("Placa"), "bra2e19");
    expect(await screen.findByText("ONIX · PRATA")).toBeInTheDocument();
  });

  it("placa inválida mostra a orientação ao confirmar com Enter", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "ABC12{Enter}");
    expect(await screen.findByText(/^Placa inválida/)).toBeInTheDocument();
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });
});

describe("SaidaVeiculoModal: passagem para o pagamento", () => {
  it("ler o QR leva sozinho à fase de pagamento, sem QR nem busca", async () => {
    renderModal();
    await lerTicket();
    expect(screen.getByRole("heading", { level: 2, name: "Confirmar saída" })).toBeInTheDocument();
    expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "placa", valor: "BRA2E19" });
    expect(visor()).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Placa")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Token")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Sequencial")).not.toBeInTheDocument();
    expect(screen.getByText("Valor a cobrar")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dinheiro" })).toBeChecked();
    expect(confirmar("20,00")).toBeDisabled();
  });

  it.each([
    ["placa", async (user: ReturnType<typeof userEvent.setup>) => user.type(screen.getByLabelText("Placa"), "bra2e19")],
    ["token digitado", async (user: ReturnType<typeof userEvent.setup>) => user.type(screen.getByLabelText("Token"), "7K3Q9X")],
    ["sequencial com Enter", async (user: ReturnType<typeof userEvent.setup>) => user.type(screen.getByLabelText("Sequencial"), "12{Enter}")],
  ])("a busca por %s também leva à fase de pagamento", async (_nome, buscar) => {
    const user = userEvent.setup();
    renderModal();
    await buscar(user);
    expect(await screen.findByText("ONIX · PRATA")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Confirmar saída" })).toBeInTheDocument();
  });

  it("o sequencial não busca sem Enter", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Sequencial"), "12");
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(api.consultarSaida).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 2, name: "Localizar veículo" })).toBeInTheDocument();
  });

  it("leva o foco ao título da nova fase e o anuncia", async () => {
    renderModal();
    await lerTicket();
    const titulo = screen.getByRole("heading", { level: 3, name: "Veículo encontrado. Confirme os dados e o pagamento." });
    expect(titulo).toHaveFocus();
  });

  it("na abertura não rouba o foco do diálogo", () => {
    renderModal();
    expect(screen.getByRole("heading", { level: 3, name: "Pesquisa de veículo." })).not.toHaveFocus();
  });

  it("mostra o aviso quando a atualização do valor falha em segundo plano", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderModal();
    await lerTicket();
    api.consultarSaida.mockRejectedValue(new ApiError("network"));
    await act(async () => void (await vi.advanceTimersByTimeAsync(INTERVALO_SAIDA_MS)));
    expect(await screen.findByText(/Mantida a última consulta/)).toBeInTheDocument();
    expect(screen.getByText("ONIX · PRATA")).toBeInTheDocument();
  });
});

describe("SaidaVeiculoModal: fase de pagamento", () => {
  it("tem Voltar para a pesquisa e Confirmar Saída no rodapé, sem Cancelar", async () => {
    renderModal();
    await lerTicket();
    expect(voltar()).toBeEnabled();
    expect(confirmar("20,00")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });

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

  it("registra a saída, mostra o recibo sem o botão de voltar e conclui com o aviso", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.type(screen.getByLabelText("Valor recebido"), "50");
    await user.click(confirmar("20,00"));

    expect(await screen.findByRole("heading", { level: 2, name: "Saída registrada" })).toBeInTheDocument();
    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 20, formaPagamento: 1 });
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Voltar para a pesquisa" })).not.toBeInTheDocument();
    expect(visor()).not.toBeInTheDocument();

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
    expect(screen.getByRole("heading", { level: 2, name: "Confirmar saída" })).toBeInTheDocument();

    await user.click(confirmar("25,00"));
    expect(await screen.findByRole("heading", { level: 2, name: "Saída registrada" })).toBeInTheDocument();
    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 25, formaPagamento: 2 });
  });

  it("erro de registro mostra o motivo, mantém os dados e deixa voltar", async () => {
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
    expect(voltar()).toBeEnabled();
  });

  it("não deixa voltar nem confirmar de novo durante o envio", async () => {
    let concluir: (value: SaidaRegistrada) => void = () => {};
    api.registrarSaida.mockReturnValue(new Promise<SaidaRegistrada>((resolve) => (concluir = resolve)));
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.click(screen.getByRole("radio", { name: "Pix" }));
    await user.click(confirmar("20,00"));

    const registrando = await screen.findByRole("button", { name: "Registrando…" });
    expect(registrando).toBeDisabled();
    expect(voltar()).toBeDisabled();
    expect(api.registrarSaida).toHaveBeenCalledTimes(1);

    await act(async () => concluir(registrada));
    expect(await screen.findByRole("heading", { level: 2, name: "Saída registrada" })).toBeInTheDocument();
  });

  it("atualiza o valor ao vivo e avisa quando ele muda", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderModal();
    await lerTicket();
    api.consultarSaida.mockResolvedValue(consulta(25));
    await act(async () => void (await vi.advanceTimersByTimeAsync(INTERVALO_SAIDA_MS)));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/mudou de R\$\s20,00 para R\$\s25,00/));
    expect(confirmar("25,00")).toBeInTheDocument();
  });
});

describe("SaidaVeiculoModal: mensalista", () => {
  beforeEach(() => {
    api.consultarSaida.mockResolvedValue({ ...consulta(), mensalista: true, mensalistaNome: "Maria" });
  });

  it("mostra o card, nada a cobrar e esconde o pagamento", async () => {
    renderModal();
    await lerTicket();

    expect(screen.getByText("Mensalista")).toBeInTheDocument();
    expect(screen.getByText("Saída sem cobrança.")).toBeInTheDocument();
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("Nada a cobrar")).toBeInTheDocument();
    expect(screen.getByText("Sem pagamento nesta saída.")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: "Forma de pagamento" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
    // O botão não repete valor.
    expect(confirmar()).toBeEnabled();
  });

  it("confirma sem pagamento e registra a saída com valor 0", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.click(confirmar());

    expect(await screen.findByRole("heading", { level: 2, name: "Saída registrada" })).toBeInTheDocument();
    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 0, formaPagamento: 1 });
  });

  it("não depende dos meios de pagamento da empresa", async () => {
    api.getEmpresa.mockRejectedValue(new ApiError("network"));
    renderModal();
    await lerTicket();
    expect(confirmar()).toBeEnabled();
    expect(screen.queryByText(/Carregando meios de pagamento/)).not.toBeInTheDocument();
  });

  it("avulso não mostra o card e continua exigindo pagamento", async () => {
    api.consultarSaida.mockResolvedValue(consulta());
    renderModal();
    await lerTicket();
    expect(screen.queryByText("Saída sem cobrança.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Valor recebido")).toBeInTheDocument();
    expect(confirmar("20,00")).toBeDisabled();
  });
});

describe("SaidaVeiculoModal: voltar para a pesquisa", () => {
  it("volta com a busca vazia, a câmera ativa e o pagamento descartado", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.click(screen.getByRole("radio", { name: "Pix" }));
    await user.click(voltar());

    expect(screen.getByRole("heading", { level: 2, name: "Localizar veículo" })).toBeInTheDocument();
    expect(visor()).toBeInTheDocument();
    expect(leitor.options?.ativo).toBe(true);
    expect(screen.getByLabelText("Placa")).toHaveValue("");
    expect(screen.getByLabelText("Token")).toHaveValue("");
    expect(screen.getByLabelText("Sequencial")).toHaveValue("");
    expect(screen.queryByText("ONIX · PRATA")).not.toBeInTheDocument();
    expect(screen.queryByText("Valor a cobrar")).not.toBeInTheDocument();
  });

  it("leva o foco ao título da pesquisa", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.click(voltar());
    expect(screen.getByRole("heading", { level: 3, name: "Pesquisa de veículo." })).toHaveFocus();
  });

  it("depois de voltar, o pagamento recomeça em Dinheiro e sem valor recebido", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.type(screen.getByLabelText("Valor recebido"), "50");
    await user.click(screen.getByRole("radio", { name: "Pix" }));
    await user.click(voltar());

    api.consultarSaida.mockResolvedValue({ ...consulta(), placa: "ABC1234", modelo: "HB20", valor: 12 });
    api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "ABC1234" });
    lerQr("https://gipe.com.br/comprovante/P4M8TQ");
    expect(await screen.findByText("HB20 · PRATA")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dinheiro" })).toBeChecked();
    expect(screen.getByLabelText("Valor recebido")).toHaveValue("");
    expect(confirmar("12,00")).toBeDisabled();
  });
});

describe("SaidaVeiculoModal: fechar", () => {
  it("fecha direto na pesquisa quando não há nada em andamento", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("na pesquisa, com algo digitado, pede confirmação", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "BRA");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handlers.onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Cancelar a saída?")).toBeInTheDocument();
  });

  it("na fase de pagamento sempre pede confirmação antes de descartar", async () => {
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(handlers.onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Cancelar a saída?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continuar saída" }));
    expect(handlers.onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
    expect(api.registrarSaida).not.toHaveBeenCalled();
  });
});

describe("SaidaVeiculoModal: meios de pagamento da empresa", () => {
  const apenas = (...ligados: Array<keyof typeof TODOS_OS_MEIOS>) =>
    empresa({
      dinheiro: false,
      pix: false,
      cartaoCredito: false,
      cartaoDebito: false,
      ...Object.fromEntries(ligados.map((meio) => [meio, true])),
    });

  it("lê a configuração da empresa já na abertura do modal", async () => {
    renderModal();
    await waitFor(() => expect(api.getEmpresa).toHaveBeenCalledTimes(1));
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });

  it("oferece só os meios aceitos, com a primeira forma aceita marcada", async () => {
    api.getEmpresa.mockResolvedValue(apenas("pix", "cartaoCredito"));
    renderModal();
    await lerTicket();
    await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(2));
    expect(screen.getAllByRole("radio").map((radio) => radio.closest("label")?.textContent)).toEqual(["Crédito", "Pix"]);
    expect(screen.getByRole("radio", { name: "Crédito" })).toBeChecked();
    expect(screen.queryByRole("radio", { name: "Dinheiro" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
    expect(confirmar("20,00")).toBeEnabled();
  });

  it("com um único meio mostra o texto de apoio e já deixa confirmar", async () => {
    api.getEmpresa.mockResolvedValue(apenas("pix"));
    renderModal();
    await lerTicket();
    expect(await screen.findByText("Único meio de pagamento aceito pela empresa.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Pix" })).toBeChecked();
    expect(confirmar("20,00")).toBeEnabled();
  });

  it("registra a saída com o meio aceito, sem o operador escolher", async () => {
    api.getEmpresa.mockResolvedValue(apenas("cartaoDebito"));
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await user.click(await screen.findByRole("button", { name: /Confirmar Saída · R\$\s20,00/ }));
    expect(await screen.findByRole("heading", { level: 2, name: "Saída registrada" })).toBeInTheDocument();
    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 20, formaPagamento: 3 });
  });

  it("enquanto a configuração carrega, mostra o aviso e não deixa confirmar", async () => {
    let concluir: (value: ReturnType<typeof empresa>) => void = () => {};
    api.getEmpresa.mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    renderModal();
    await lerTicket();
    expect(screen.getByRole("status", { name: "Carregando meios de pagamento" })).toBeInTheDocument();
    expect(screen.getAllByText("Carregando meios de pagamento…").length).toBeGreaterThan(0);
    expect(confirmar("20,00")).toBeDisabled();

    concluir(empresa());
    expect(await screen.findByRole("radio", { name: "Dinheiro" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Carregando meios de pagamento" })).not.toBeInTheDocument();
  });

  it("se a configuração falha, mostra o erro, bloqueia a saída e Tentar novamente refaz", async () => {
    api.getEmpresa.mockRejectedValueOnce(new ApiError("network"));
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    expect(await screen.findByText("Não foi possível conectar ao servidor.")).toBeInTheDocument();
    expect(confirmar("20,00")).toBeDisabled();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("radio", { name: "Dinheiro" })).toBeChecked();
    expect(api.getEmpresa).toHaveBeenCalledTimes(2);
  });

  it("com todos os meios desligados orienta a revisar em Minha Empresa", async () => {
    api.getEmpresa.mockResolvedValue(apenas());
    renderModal();
    await lerTicket();
    expect(await screen.findByText(/Nenhum meio de pagamento configurado\. Peça ao administrador/)).toBeInTheDocument();
    expect(confirmar("20,00")).toBeDisabled();
  });

  it("voltar para a pesquisa e achar outro veículo mantém os meios aceitos", async () => {
    api.getEmpresa.mockResolvedValue(apenas("pix", "cartaoDebito"));
    const user = userEvent.setup();
    renderModal();
    await lerTicket();
    await screen.findByRole("radio", { name: "Débito" });
    await user.click(screen.getByRole("radio", { name: "Pix" }));
    await user.click(voltar());

    api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "ABC1234" });
    api.consultarSaida.mockResolvedValue({ ...consulta(), placa: "ABC1234", modelo: "HB20" });
    lerQr("https://gipe.com.br/comprovante/P4M8TQ");
    expect(await screen.findByText("HB20 · PRATA")).toBeInTheDocument();
    expect(await screen.findByRole("radio", { name: "Débito" })).toBeChecked();
    expect(api.getEmpresa).toHaveBeenCalledTimes(1);
  });
});

