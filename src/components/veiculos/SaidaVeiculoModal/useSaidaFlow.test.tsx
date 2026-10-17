import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { QR_INVALIDO_MESSAGE } from "../LeitorQrSaida";
import { FORMA_DINHEIRO, FORMAS_SAIDA } from "../saida";
import { BUSCA_DEBOUNCE_MS, INTERVALO_SAIDA_MS, useSaidaFlow } from "./useSaidaFlow";
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
  api.getEmpresa.mockResolvedValue({ company: {} });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSaidaFlow: estado inicial", () => {
  it("começa vazio, em Dinheiro e sem progresso", () => {
    const { result } = renderFlow();
    expect(result.current).toMatchObject({
      fase: "identificar",
      consulta: null,
      lido: false,
      forma: FORMA_DINHEIRO,
      recebido: "",
      hasProgress: false,
      isBusy: false,
    });
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });
});

describe("useSaidaFlow: leitura por QR", () => {
  it("resolve o token, consulta pela placa e mostra o veículo nos campos de busca", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    expect(api.resolverBuscaPorToken).toHaveBeenCalledWith("7K3Q9X", expect.anything());
    expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "placa", valor: "BRA2E19" });
    expect(flow.result.current).toMatchObject({
      origem: "qr",
      lido: true,
      token: "7K3Q9X",
      mensagemLido: "Ticket encontrado",
      hasProgress: true,
    });
    expect(flow.result.current.buscaValues).toEqual({ placa: "BRA2E19", token: "7K3Q9X", sequencial: "" });
  });

  it("token sem ticket aberto mostra o aviso e fica como 'Token lido'", async () => {
    api.resolverBuscaPorToken.mockRejectedValue(new ApiError("not_found", "Nenhum ticket aberto com este token.", 404));
    const flow = renderFlow();
    act(() => flow.result.current.handleToken("ZZZZZZ"));
    await waitFor(() => expect(flow.result.current.aviso).toBe("Nenhum ticket aberto com este token."));
    expect(flow.result.current).toMatchObject({ lido: true, mensagemLido: "Token lido", consulta: null });
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

describe("useSaidaFlow: busca manual", () => {
  it("consulta a placa completa depois do debounce", async () => {
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("placa", "BRA2E19"));
    expect(api.consultarSaida).not.toHaveBeenCalled();
    await avancar(BUSCA_DEBOUNCE_MS);
    await waitFor(() => expect(result.current.consulta).not.toBeNull());
    expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "placa", valor: "BRA2E19" });
    expect(result.current.origem).toBe("manual");
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
    expect(result.current.origem).toBe("manual");
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

  it("consulta o sequencial", async () => {
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("sequencial", "12"));
    await avancar(BUSCA_DEBOUNCE_MS);
    await waitFor(() => expect(api.consultarSaida).toHaveBeenCalledWith({ tipo: "sequencial", valor: "12" }));
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
    const { result } = renderFlow();
    act(() => result.current.handleBuscaChange("sequencial", "12"));
    await avancar(BUSCA_DEBOUNCE_MS);
    await waitFor(() => expect(result.current.consulta).not.toBeNull());
    act(() => result.current.handleBuscaChange("sequencial", ""));
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
    expect(flow.result.current.fase).toBe("identificar");

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
    expect(flow.result.current).toMatchObject({ fase: "identificar", recebido: "50,00", forma: FORMA_DINHEIRO });
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

describe("useSaidaFlow: limpar", () => {
  it("volta ao estado inicial e libera nova leitura", async () => {
    const flow = renderFlow();
    await identificarPorQr(flow);
    act(() => {
      flow.result.current.setForma(forma("Pix"));
      flow.result.current.setRecebido("10");
    });
    act(() => flow.result.current.limpar());

    expect(flow.result.current).toMatchObject({
      origem: null,
      lido: false,
      token: "",
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
    act(() => result.current.limpar());
    await avancar(BUSCA_DEBOUNCE_MS * 2);
    expect(api.consultarSaida).not.toHaveBeenCalled();
  });
});
