import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { QR_INVALIDO_MESSAGE } from "../LeitorQrSaida";
import { FORMA_DINHEIRO, FORMAS_SAIDA } from "../saida";
import { BUSCA_DEBOUNCE_MS, INTERVALO_SAIDA_MS, REPETICAO_TOKEN_MS, useSaidaFlow } from "./useSaidaFlow";
import type { SaidaConsulta, SaidaRegistrada } from "@/types/saida";

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

const forma = (label: string) => FORMAS_SAIDA.find((item) => item.label === label)!.value;

function renderFlow() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useSaidaFlow(), { wrapper });
}

const avancar = (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));

// Identifica um veículo pelo QR e espera o resumo aparecer.
async function identificarPorQr(flow: ReturnType<typeof renderFlow>) {
  api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "BRA2E19" });
  act(() => flow.result.current.handleToken("7K3Q9X"));
  await waitFor(() => expect(flow.result.current.consulta).not.toBeNull());
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  Object.values(api).forEach((mock) => mock.mockReset());
  api.consultarSaida.mockResolvedValue(consulta());
  api.registrarSaida.mockResolvedValue(registrada);
  api.getEmpresa.mockResolvedValue(empresa());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSaidaFlow: estado inicial", () => {
  it("começa vazio, em Dinheiro e sem progresso", async () => {
    const { result } = renderFlow();
    await waitFor(() => expect(result.current.meios.status).toBe("pronto"));
    expect(result.current).toMatchObject({
      fase: "pesquisa",
      consulta: null,
      forma: FORMA_DINHEIRO,
      recebido: "",
      hasProgress: false,
      isBusy: false,
    });
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });
});

describe("useSaidaFlow: leitura por QR", () => {
  it("resolve o token, consulta pela placa e vai ao pagamento", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    expect(api.resolverBuscaPorToken).toHaveBeenCalledWith("7K3Q9X", expect.anything());
    expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "placa", valor: "BRA2E19" });
    expect(flow.result.current).toMatchObject({ fase: "pagamento", hasProgress: true });
  });

  it("token sem ticket aberto mostra o aviso e continua na pesquisa", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(new ApiError("not_found", "Nenhum ticket aberto com este token.", 404));
    const flow = renderFlow();
    act(() => flow.result.current.handleToken("ZZZZZZ"));
    await waitFor(() => expect(flow.result.current.aviso).toBe("Nenhum ticket aberto com este token."));
    expect(flow.result.current).toMatchObject({ fase: "pesquisa", consulta: null });
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });

  it("veículo que já saiu mostra o aviso da consulta", async () => {
    api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "BRA2E19" });
    api.consultarSaida.mockRejectedValue(new ApiError("not_found", "Nenhum veículo no pátio com essa placa.", 404));
    const flow = renderFlow();
    act(() => flow.result.current.handleToken("7K3Q9X"));
    await waitFor(() => expect(flow.result.current.aviso).toBe("Nenhum veículo no pátio com essa placa."));
  });

  it("QR inválido avisa, e o aviso some ao ler um token", async () => {
    const flow = renderFlow();
    act(() => flow.result.current.handleQrInvalido());
    expect(flow.result.current.aviso).toBe(QR_INVALIDO_MESSAGE);
    await identificarPorQr(flow);
    expect(flow.result.current.aviso).toBeUndefined();
  });
});

describe("useSaidaFlow: token repetido depois de falha", () => {
  const naoEncontrado = new ApiError("not_found", "Nenhum ticket aberto com este token.", 404);

  async function falharCom(flow: ReturnType<typeof renderFlow>, token: string) {
    act(() => flow.result.current.handleToken(token));
    await waitFor(() => expect(flow.result.current.aviso).toBe("Nenhum ticket aberto com este token."));
  }

  it("ignora o mesmo token dentro da janela, sem nova chamada nem mudar o aviso", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(naoEncontrado);
    const flow = renderFlow();
    await falharCom(flow, "ZZZZZZ");
    act(() => flow.result.current.handleToken("ZZZZZZ"));
    await avancar(REPETICAO_TOKEN_MS - 100);
    act(() => flow.result.current.handleToken("ZZZZZZ"));
    expect(api.resolverBuscaPorToken).toHaveBeenCalledTimes(1);
    expect(flow.result.current.aviso).toBe("Nenhum ticket aberto com este token.");
  });

  it("aceita o mesmo token depois da janela", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(naoEncontrado);
    const flow = renderFlow();
    await falharCom(flow, "ZZZZZZ");
    await avancar(REPETICAO_TOKEN_MS + 100);
    act(() => flow.result.current.handleToken("ZZZZZZ"));
    await waitFor(() => expect(api.resolverBuscaPorToken).toHaveBeenCalledTimes(2));
  });

  it("nunca ignora um token diferente", async () => {
    api.resolverBuscaPorToken.mockRejectedValueOnce(naoEncontrado);
    const flow = renderFlow();
    await falharCom(flow, "ZZZZZZ");
    api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "BRA2E19" });
    act(() => flow.result.current.handleToken("7K3Q9X"));
    await waitFor(() => expect(flow.result.current.consulta).not.toBeNull());
    expect(api.resolverBuscaPorToken).toHaveBeenCalledTimes(2);
  });

  it("também vale quando o token existe mas o veículo já saiu", async () => {
    api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "BRA2E19" });
    api.consultarSaida.mockRejectedValue(new ApiError("not_found", "Nenhum veículo no pátio com essa placa.", 404));
    const flow = renderFlow();
    act(() => flow.result.current.handleToken("7K3Q9X"));
    await waitFor(() => expect(flow.result.current.aviso).toBe("Nenhum veículo no pátio com essa placa."));
    act(() => flow.result.current.handleToken("7K3Q9X"));
    expect(api.resolverBuscaPorToken).toHaveBeenCalledTimes(1);
  });

  it("digitar na busca manual libera o token", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(naoEncontrado);
    const flow = renderFlow();
    await falharCom(flow, "ZZZZZZ");
    act(() => flow.result.current.handleBuscaChange("placa", "B"));
    act(() => flow.result.current.handleToken("ZZZZZZ"));
    await waitFor(() => expect(api.resolverBuscaPorToken).toHaveBeenCalledTimes(2));
  });

  it("reiniciar o fluxo libera o token", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(naoEncontrado);
    const flow = renderFlow();
    await falharCom(flow, "ZZZZZZ");
    act(() => flow.result.current.voltar());
    act(() => flow.result.current.handleToken("ZZZZZZ"));
    await waitFor(() => expect(api.resolverBuscaPorToken).toHaveBeenCalledTimes(2));
  });

  it("uma busca bem-sucedida limpa a falha anterior", async () => {
    api.resolverBuscaPorToken.mockRejectedValueOnce(naoEncontrado);
    const flow = renderFlow();
    await falharCom(flow, "ZZZZZZ");
    api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "BRA2E19" });
    act(() => flow.result.current.handleToken("7K3Q9X"));
    await waitFor(() => expect(flow.result.current.consulta).not.toBeNull());
    act(() => flow.result.current.voltar());
    act(() => flow.result.current.handleToken("ZZZZZZ"));
    await waitFor(() => expect(api.resolverBuscaPorToken).toHaveBeenCalledTimes(3));
  });

  it("falha de um token digitado também segura o mesmo QR por um tempo", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(naoEncontrado);
    const flow = renderFlow();
    act(() => flow.result.current.handleBuscaChange("token", "ZZZZZZ"));
    act(() => flow.result.current.handleBuscaEnter());
    await waitFor(() => expect(flow.result.current.aviso).toBe("Nenhum ticket aberto com este token."));
    act(() => flow.result.current.handleToken("ZZZZZZ"));
    expect(api.resolverBuscaPorToken).toHaveBeenCalledTimes(1);
  });
});

describe("useSaidaFlow: busca manual", () => {
  it("consulta a placa completa depois do debounce", async () => {
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("placa", "BRA2E19"));
    expect(api.consultarSaida).not.toHaveBeenCalled();
    await avancar(BUSCA_DEBOUNCE_MS);
    await waitFor(() => expect(result.current.consulta).not.toBeNull());
    expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "placa", valor: "BRA2E19" });
  });

  it("não consulta nem reclama enquanto a placa está incompleta", async () => {
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("placa", "BRA2"));
    await avancar(BUSCA_DEBOUNCE_MS * 2);
    expect(api.consultarSaida).not.toHaveBeenCalled();
    expect(result.current.buscaErrors).toEqual({});
  });

  it("consulta só a última digitação (debounce)", async () => {
    api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "BRA2E19" });
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("token", "7K3Q"));
    await avancar(100);
    act(() => result.current.handleBuscaChange("token", "7K3Q9"));
    await avancar(100);
    act(() => result.current.handleBuscaChange("token", "7K3Q9X"));
    await avancar(BUSCA_DEBOUNCE_MS);
    await waitFor(() => expect(result.current.consulta).not.toBeNull());
    expect(api.resolverBuscaPorToken).toHaveBeenCalledTimes(1);
    expect(api.resolverBuscaPorToken).toHaveBeenCalledWith("7K3Q9X", expect.anything());
    expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "placa", valor: "BRA2E19" });
  });

  it("token digitado: não mostra erro enquanto está incompleto", async () => {
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("token", "7K"));
    await avancar(BUSCA_DEBOUNCE_MS * 2);
    expect(api.resolverBuscaPorToken).not.toHaveBeenCalled();
    expect(result.current.buscaErrors).toEqual({});
  });

  it("token digitado inexistente mostra o aviso e some ao editar", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(new ApiError("not_found", "Nenhum ticket aberto com este token.", 404));
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("token", "ZZZZZZ"));
    await avancar(BUSCA_DEBOUNCE_MS);
    await waitFor(() => expect(result.current.aviso).toBe("Nenhum ticket aberto com este token."));
    act(() => result.current.handleBuscaChange("token", "ZZZZZ"));
    expect(result.current.aviso).toBeUndefined();
  });

  it("Enter com token curto mostra o erro de token inválido", () => {
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("token", "AB1"));
    act(() => result.current.handleBuscaEnter());
    expect(result.current.buscaErrors.token).toMatch(/^Token inválido/);
    expect(api.resolverBuscaPorToken).not.toHaveBeenCalled();
  });

  it("o sequencial não consulta sozinho, nem parcial nem completo", async () => {
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("sequencial", "1"));
    act(() => result.current.handleBuscaChange("sequencial", "12"));
    await avancar(BUSCA_DEBOUNCE_MS * 5);
    expect(api.consultarSaida).not.toHaveBeenCalled();
    expect(result.current.consulta).toBeNull();
  });

  it("o sequencial consulta com Enter", async () => {
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("sequencial", "12"));
    act(() => result.current.handleBuscaEnter());
    await waitFor(() => expect(result.current.consulta).not.toBeNull());
    expect(api.consultarSaida).toHaveBeenCalledTimes(1);
    expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "sequencial", valor: "12" });
  });

  it("editar o sequencial depois de achar um veículo descarta o resultado anterior", async () => {
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("sequencial", "12"));
    act(() => result.current.handleBuscaEnter());
    await waitFor(() => expect(result.current.consulta).not.toBeNull());
    act(() => result.current.handleBuscaChange("sequencial", "1"));
    await waitFor(() => expect(result.current.consulta).toBeNull());
  });

  it("Enter consulta na hora e mostra o erro de uma placa inválida", () => {
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("placa", "ABC12"));
    act(() => result.current.handleBuscaEnter());
    expect(result.current.buscaErrors.placa).toMatch(/^Placa inválida/);
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });

  it("Enter consulta sem esperar o debounce", async () => {
    api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "BRA2E19" });
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("token", "7K3Q9X"));
    act(() => result.current.handleBuscaEnter());
    await waitFor(() => expect(result.current.consulta).not.toBeNull());
    await avancar(BUSCA_DEBOUNCE_MS * 2);
    expect(api.consultarSaida).toHaveBeenCalledTimes(1);
  });

  it("veículo fora do pátio mostra o aviso da consulta", async () => {
    api.consultarSaida.mockRejectedValue(new ApiError("not_found", "Nenhum veículo no pátio com essa placa.", 404));
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("placa", "BRA2E19"));
    await avancar(BUSCA_DEBOUNCE_MS);
    await waitFor(() => expect(result.current.aviso).toBe("Nenhum veículo no pátio com essa placa."));
    expect(result.current.consulta).toBeNull();
  });

  it("apagar o campo descarta o veículo", async () => {
    api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "BRA2E19" });
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("token", "7K3Q9X"));
    await avancar(BUSCA_DEBOUNCE_MS);
    await waitFor(() => expect(result.current.consulta).not.toBeNull());
    act(() => result.current.handleBuscaChange("token", ""));
    await avancar(BUSCA_DEBOUNCE_MS);
    await waitFor(() => expect(result.current.consulta).toBeNull());
  });
});

describe("useSaidaFlow: atualização ao vivo", () => {
  it("reconsulta a cada ciclo e avisa quando o valor muda", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    expect(api.consultarSaida).toHaveBeenCalledTimes(1);

    api.consultarSaida.mockResolvedValue(consulta(25));
    await avancar(INTERVALO_SAIDA_MS);
    await waitFor(() => expect(flow.result.current.consulta?.valor).toBe(25));
    expect(flow.result.current.valorAnterior).toBe(20);
  });

  it("não avisa quando o valor se mantém", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    await avancar(INTERVALO_SAIDA_MS);
    await waitFor(() => expect(api.consultarSaida).toHaveBeenCalledTimes(2));
    expect(flow.result.current.valorAnterior).toBeNull();
  });

  it("falha em segundo plano mantém o último resumo e avisa de forma discreta", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    api.consultarSaida.mockRejectedValue(new ApiError("network"));
    await avancar(INTERVALO_SAIDA_MS);
    await waitFor(() => expect(flow.result.current.aviso).toMatch(/Mantida a última consulta/));
    expect(flow.result.current.consulta?.valor).toBe(20);
  });
});

describe("useSaidaFlow: confirmar", () => {
  it("não confirma sem veículo", () => {
    const { result } = renderFlow();
    act(() => result.current.confirmar());
    expect(api.consultarSaida).not.toHaveBeenCalled();
    expect(api.registrarSaida).not.toHaveBeenCalled();
  });

  it("em Dinheiro só confirma com valor recebido suficiente", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    api.consultarSaida.mockClear();
    act(() => flow.result.current.confirmar());
    expect(api.consultarSaida).not.toHaveBeenCalled();

    act(() => flow.result.current.setRecebido("10,00"));
    act(() => flow.result.current.confirmar());
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });

  it("valor igual: registra a saída, calcula o troco e passa ao recibo", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => flow.result.current.setRecebido("50,00"));
    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.fase).toBe("recibo"));

    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 20, formaPagamento: Number(FORMA_DINHEIRO) });
    expect(flow.result.current.resultado).toMatchObject({ recebido: 50, troco: 30 });
    expect(flow.result.current.consultaRecibo?.placa).toBe("BRA2E19");
  });

  it("em Pix registra sem valor recebido nem troco", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => flow.result.current.setForma(forma("Pix")));
    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.fase).toBe("recibo"));
    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 20, formaPagamento: Number(forma("Pix")) });
    expect(flow.result.current.resultado).toMatchObject({ recebido: null, troco: null });
  });

  it("valor mudou: não registra, mostra o novo valor e o antigo", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    api.consultarSaida.mockResolvedValue(consulta(25));
    act(() => flow.result.current.setForma(forma("Pix")));
    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.valorAnterior).toBe(20));

    expect(api.registrarSaida).not.toHaveBeenCalled();
    expect(flow.result.current.consulta?.valor).toBe(25);
    expect(flow.result.current.fase).toBe("pagamento");

    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.fase).toBe("recibo"));
    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 25, formaPagamento: Number(forma("Pix")) });
  });

  it("registra uma só vez mesmo com cliques repetidos", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => flow.result.current.setForma(forma("Pix")));
    act(() => {
      flow.result.current.confirmar();
      flow.result.current.confirmar();
      flow.result.current.confirmar();
    });
    await waitFor(() => expect(flow.result.current.fase).toBe("recibo"));
    expect(api.registrarSaida).toHaveBeenCalledTimes(1);
  });

  it("falha no registro mantém os dados informados e mostra o motivo", async () => {
    api.registrarSaida.mockRejectedValue(new ApiError("validation", "Não há caixa aberto.", 400));
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => flow.result.current.setRecebido("50,00"));
    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.erroRegistro).toBe("Não há caixa aberto."));
    expect(flow.result.current).toMatchObject({ fase: "pagamento", recebido: "50,00", forma: FORMA_DINHEIRO });
    expect(flow.result.current.consulta).not.toBeNull();

    api.registrarSaida.mockResolvedValue(registrada);
    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.fase).toBe("recibo"));
  });

  it("não reconsulta em segundo plano enquanto está no recibo", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => flow.result.current.setForma(forma("Pix")));
    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.fase).toBe("recibo"));
    api.consultarSaida.mockClear();
    await avancar(INTERVALO_SAIDA_MS * 2);
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });
});

describe("useSaidaFlow: mensalista", () => {
  const mensalista = (valor = 20) => ({ ...consulta(valor), mensalista: true });

  it("confirma sem forma de pagamento nem valor recebido e envia valor 0", async () => {
    api.consultarSaida.mockResolvedValue(mensalista());
    const flow = renderFlow();
    await identificarPorQr(flow);
    expect(flow.result.current.semCobranca).toBe(true);
    expect(flow.result.current.pagamento).toEqual({ canConfirm: true, motivo: undefined });

    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.fase).toBe("recibo"));
    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 0, formaPagamento: Number(FORMA_DINHEIRO) });
    expect(flow.result.current.resultado).toMatchObject({ recebido: null, troco: null });
  });

  it.each([
    ["carregando", () => api.getEmpresa.mockReturnValue(new Promise(() => {}))],
    ["com erro", () => api.getEmpresa.mockRejectedValue(new ApiError("network"))],
    ["vazios", () => api.getEmpresa.mockResolvedValue(empresa({ dinheiro: false, pix: false, cartaoCredito: false, cartaoDebito: false }))],
  ])("confirma mesmo com os meios de pagamento %s", async (_nome, configurar) => {
    configurar();
    api.consultarSaida.mockResolvedValue(mensalista());
    const flow = renderFlow();
    await identificarPorQr(flow);
    expect(flow.result.current.pagamento?.canConfirm).toBe(true);

    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.fase).toBe("recibo"));
    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 0, formaPagamento: Number(FORMA_DINHEIRO) });
  });

  it("o valor calculado mudar na reconsulta não gera aviso, pois nada é cobrado", async () => {
    api.consultarSaida.mockResolvedValue(mensalista(20));
    const flow = renderFlow();
    await identificarPorQr(flow);
    api.consultarSaida.mockResolvedValue(mensalista(35));
    await avancar(INTERVALO_SAIDA_MS);
    await waitFor(() => expect(api.consultarSaida).toHaveBeenCalledTimes(2));
    expect(flow.result.current.valorAnterior).toBeNull();
  });

  it("deixou de ser mensalista na reconsulta: não registra e pede nova confirmação", async () => {
    api.consultarSaida.mockResolvedValue(mensalista());
    const flow = renderFlow();
    await identificarPorQr(flow);
    api.consultarSaida.mockResolvedValue(consulta(20));
    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.valorAnterior).toBe(0));

    expect(api.registrarSaida).not.toHaveBeenCalled();
    expect(flow.result.current.semCobranca).toBe(false);
    expect(flow.result.current.consulta?.valor).toBe(20);
    expect(flow.result.current.pagamento?.canConfirm).toBe(false);
  });

  it("avulso continua sem semCobranca e exigindo pagamento", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    expect(flow.result.current.semCobranca).toBe(false);
    expect(flow.result.current.pagamento?.canConfirm).toBe(false);
  });
});

describe("useSaidaFlow: reinício", () => {
  it("volta ao estado inicial e libera nova leitura", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => {
      flow.result.current.setForma(forma("Pix"));
      flow.result.current.setRecebido("10");
    });
    act(() => flow.result.current.voltar());

    expect(flow.result.current).toMatchObject({
      consulta: null,
      valorAnterior: null,
      forma: FORMA_DINHEIRO,
      recebido: "",
      hasProgress: false,
    });
    expect(flow.result.current.buscaValues).toEqual({ placa: "", token: "", sequencial: "" });
  });

  it("cancela uma busca manual pendente", async () => {
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("token", "7K3Q9X"));
    act(() => result.current.voltar());
    await avancar(BUSCA_DEBOUNCE_MS * 2);
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });
});

describe("useSaidaFlow: fases", () => {
  it("começa na pesquisa e não muda enquanto a busca falha", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(new ApiError("not_found", "Nenhum ticket aberto com este token.", 404));
    const flow = renderFlow();
    expect(flow.result.current.fase).toBe("pesquisa");
    act(() => flow.result.current.handleToken("ZZZZZZ"));
    await waitFor(() => expect(flow.result.current.aviso).toBeDefined());
    expect(flow.result.current.fase).toBe("pesquisa");
  });

  it.each([
    ["QR", async (flow: ReturnType<typeof renderFlow>) => act(() => flow.result.current.handleToken("7K3Q9X"))],
    [
      "placa",
      async (flow: ReturnType<typeof renderFlow>) => {
        act(() => flow.result.current.handleBuscaChange("placa", "BRA2E19"));
        await avancar(BUSCA_DEBOUNCE_MS);
      },
    ],
    [
      "token digitado",
      async (flow: ReturnType<typeof renderFlow>) => {
        act(() => flow.result.current.handleBuscaChange("token", "7K3Q9X"));
        await avancar(BUSCA_DEBOUNCE_MS);
      },
    ],
    [
      "sequencial",
      async (flow: ReturnType<typeof renderFlow>) => {
        act(() => flow.result.current.handleBuscaChange("sequencial", "12"));
        act(() => flow.result.current.handleBuscaEnter());
      },
    ],
  ])("vai sozinho para o pagamento ao achar o veículo por %s", async (_nome, localizar) => {
    api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "BRA2E19" });
    const flow = renderFlow();
    await localizar(flow);
    await waitFor(() => expect(flow.result.current.fase).toBe("pagamento"));
  });

  it("vai ao recibo depois de registrar", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => flow.result.current.setForma(forma("Pix")));
    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.fase).toBe("recibo"));
  });

  it("a atualização periódica continua na fase de pagamento", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    expect(flow.result.current.fase).toBe("pagamento");
    api.consultarSaida.mockClear();
    await avancar(INTERVALO_SAIDA_MS);
    await waitFor(() => expect(api.consultarSaida).toHaveBeenCalledTimes(1));
    expect(flow.result.current.fase).toBe("pagamento");
  });

  it("hasProgress: falso na pesquisa vazia, verdadeiro com campo preenchido e na fase de pagamento", async () => {
    const flow = renderFlow();
    expect(flow.result.current.hasProgress).toBe(false);
    act(() => flow.result.current.handleBuscaChange("sequencial", "1"));
    expect(flow.result.current.hasProgress).toBe(true);
    act(() => flow.result.current.voltar());
    expect(flow.result.current.hasProgress).toBe(false);
    await identificarPorQr(flow);
    expect(flow.result.current.hasProgress).toBe(true);
  });
});

describe("useSaidaFlow: voltar", () => {
  it("descarta busca, campos, pagamento e avisos e devolve a pesquisa", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => {
      flow.result.current.setForma(forma("Pix"));
      flow.result.current.setRecebido("10");
    });
    act(() => flow.result.current.voltar());

    expect(flow.result.current).toMatchObject({
      fase: "pesquisa",
      consulta: null,
      valorAnterior: null,
      forma: FORMA_DINHEIRO,
      recebido: "",
      aviso: undefined,
      erroRegistro: undefined,
      hasProgress: false,
    });
    expect(flow.result.current.buscaValues).toEqual({ placa: "", token: "", sequencial: "" });
    expect(flow.result.current.buscaErrors).toEqual({});
  });

  it("descarta o aviso de valor mudou e o erro de registro", async () => {
    api.registrarSaida.mockRejectedValue(new ApiError("validation", "Não há caixa aberto.", 400));
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => flow.result.current.setForma(forma("Pix")));
    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.erroRegistro).toBe("Não há caixa aberto."));
    act(() => flow.result.current.voltar());
    expect(flow.result.current.erroRegistro).toBeUndefined();
    expect(flow.result.current.fase).toBe("pesquisa");
  });

  it("permite localizar outro veículo depois de voltar", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => flow.result.current.voltar());
    api.consultarSaida.mockResolvedValue({ ...consulta(), placa: "ABC1234", valor: 12 });
    api.resolverBuscaPorToken.mockResolvedValue({ tipo: "placa", valor: "ABC1234" });
    act(() => flow.result.current.handleToken("P4M8TQ"));
    await waitFor(() => expect(flow.result.current.consulta?.placa).toBe("ABC1234"));
    expect(flow.result.current.fase).toBe("pagamento");
  });

  it("não faz nada enquanto a saída está sendo registrada", async () => {
    let concluir: (value: SaidaRegistrada) => void = () => {};
    api.registrarSaida.mockReturnValue(new Promise<SaidaRegistrada>((resolve) => (concluir = resolve)));
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => flow.result.current.setForma(forma("Pix")));
    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.enviando).toBe(true));

    act(() => flow.result.current.voltar());
    expect(flow.result.current.fase).toBe("pagamento");
    expect(flow.result.current.consulta).not.toBeNull();

    await act(async () => concluir(registrada));
    await waitFor(() => expect(flow.result.current.fase).toBe("recibo"));
  });
});

describe("useSaidaFlow: meios de pagamento da empresa", () => {
  const apenas = (...ligados: Array<keyof typeof TODOS_OS_MEIOS>) =>
    empresa({ dinheiro: false, pix: false, cartaoCredito: false, cartaoDebito: false, ...Object.fromEntries(ligados.map((meio) => [meio, true])) });

  it("carrega a configuração na abertura, sem esperar um veículo", async () => {
    const { result } = renderFlow();
    expect(result.current.meios.status).toBe("carregando");
    await waitFor(() => expect(result.current.meios.status).toBe("pronto"));
    expect(api.getEmpresa).toHaveBeenCalledTimes(1);
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });

  it("oferece só os meios aceitos", async () => {
    api.getEmpresa.mockResolvedValue(apenas("pix", "cartaoDebito"));
    const { result } = renderFlow();
    await waitFor(() => expect(result.current.meios.status).toBe("pronto"));
    if (result.current.meios.status === "pronto") {
      expect(result.current.meios.opcoes.map((opcao) => opcao.label)).toEqual(["Débito", "Pix"]);
    }
  });

  it("com Dinheiro desligado, a primeira forma aceita vem marcada", async () => {
    api.getEmpresa.mockResolvedValue(apenas("pix", "cartaoCredito"));
    const { result } = renderFlow();
    await waitFor(() => expect(result.current.meios.status).toBe("pronto"));
    expect(result.current.forma).toBe(forma("Crédito"));
  });

  it("com um único meio, ele já vem marcado", async () => {
    api.getEmpresa.mockResolvedValue(apenas("pix"));
    const { result } = renderFlow();
    await waitFor(() => expect(result.current.meios.status).toBe("pronto"));
    expect(result.current.forma).toBe(forma("Pix"));
  });

  it("respeita a escolha do operador entre os meios aceitos", async () => {
    const { result } = renderFlow();
    await waitFor(() => expect(result.current.meios.status).toBe("pronto"));
    act(() => result.current.setForma(forma("Débito")));
    expect(result.current.forma).toBe(forma("Débito"));
  });

  it("uma escolha que não é mais aceita cai na primeira aceita", async () => {
    api.getEmpresa.mockResolvedValue(apenas("pix", "cartaoCredito"));
    const { result } = renderFlow();
    await waitFor(() => expect(result.current.meios.status).toBe("pronto"));
    act(() => result.current.setForma(forma("Dinheiro")));
    expect(result.current.forma).toBe(forma("Crédito"));
  });

  it("registra a saída com a forma efetiva quando Dinheiro não é aceito", async () => {
    api.getEmpresa.mockResolvedValue(apenas("cartaoCredito", "pix"));
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => flow.result.current.confirmar());
    await waitFor(() => expect(flow.result.current.fase).toBe("recibo"));
    expect(api.registrarSaida).toHaveBeenCalledWith(7, { valor: 20, formaPagamento: Number(forma("Crédito")) });
    expect(flow.result.current.resultado).toMatchObject({ recebido: null, troco: null });
  });

  it("voltar devolve a escolha à primeira forma aceita", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => flow.result.current.setForma(forma("Pix")));
    act(() => flow.result.current.voltar());
    expect(flow.result.current.forma).toBe(FORMA_DINHEIRO);
  });

  it("enquanto a configuração carrega, não deixa confirmar e explica o motivo", async () => {
    let concluir: (value: ReturnType<typeof empresa>) => void = () => {};
    api.getEmpresa.mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    const flow = renderFlow();
    await identificarPorQr(flow);
    expect(flow.result.current.meios.status).toBe("carregando");
    expect(flow.result.current.pagamento).toEqual({ canConfirm: false, motivo: "Carregando meios de pagamento…" });

    act(() => flow.result.current.confirmar());
    expect(api.consultarSaida).toHaveBeenCalledTimes(1);
    expect(api.registrarSaida).not.toHaveBeenCalled();

    concluir(empresa());
    await waitFor(() => expect(flow.result.current.meios.status).toBe("pronto"));
    expect(flow.result.current.pagamento?.canConfirm).toBe(false);
    act(() => flow.result.current.setRecebido("50"));
    expect(flow.result.current.pagamento?.canConfirm).toBe(true);
  });

  it("se a configuração falha, não deixa confirmar e permite tentar de novo", async () => {
    api.getEmpresa.mockRejectedValueOnce(new ApiError("network"));
    const flow = renderFlow();
    await identificarPorQr(flow);
    await waitFor(() => expect(flow.result.current.meios.status).toBe("erro"));
    expect(flow.result.current.pagamento).toMatchObject({ canConfirm: false });

    act(() => flow.result.current.confirmar());
    expect(api.registrarSaida).not.toHaveBeenCalled();

    api.getEmpresa.mockResolvedValue(empresa());
    const meios = flow.result.current.meios;
    act(() => {
      if (meios.status === "erro") meios.refetch();
    });
    await waitFor(() => expect(flow.result.current.meios.status).toBe("pronto"));
  });

  it("com todos os meios desligados, não deixa confirmar", async () => {
    api.getEmpresa.mockResolvedValue(apenas());
    const flow = renderFlow();
    await identificarPorQr(flow);
    await waitFor(() => expect(flow.result.current.meios.status).toBe("vazio"));
    expect(flow.result.current.pagamento).toEqual({ canConfirm: false, motivo: "Nenhum meio de pagamento configurado." });
  });
});

