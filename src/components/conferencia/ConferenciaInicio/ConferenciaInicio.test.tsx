import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { conferenciaAberta, resumoComUltima, resumoSemConferencia } from "@/lib/api/services/conferenciaPatio.fixture";
import { fromConferenciaResponse, fromResumoResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { renderWithProviders } from "@/test/render";
import type { InicioProps } from "../tipos";

vi.mock("@/lib/api/services/conferenciaPatio", () => ({ obterResumo: vi.fn() }));

import { obterResumo } from "@/lib/api/services/conferenciaPatio";
import { ConferenciaInicio } from "./ConferenciaInicio";

const conferencia = fromConferenciaResponse(conferenciaAberta);

function montar(props: Partial<InicioProps> = {}, iniciar = vi.fn().mockResolvedValue(conferencia)) {
  const onIr = vi.fn();
  const acoes = { iniciar, iniciando: false } as unknown as InicioProps["acoes"];
  renderWithProviders(<ConferenciaInicio conferencia={null} acoes={acoes} onIr={onIr} onMensagem={vi.fn()} {...props} />);
  return { onIr, iniciar };
}

function comCamera(existe: boolean) {
  Object.defineProperty(navigator, "mediaDevices", { value: existe ? { getUserMedia: vi.fn() } : undefined, configurable: true });
}

beforeEach(() => {
  vi.clearAllMocks();
  comCamera(true);
  vi.mocked(obterResumo).mockResolvedValue(fromResumoResponse(resumoSemConferencia));
});

afterEach(() => comCamera(false));

describe("ConferenciaInicio", () => {
  it("mostra o carregamento enquanto busca o pátio", () => {
    vi.mocked(obterResumo).mockReturnValue(new Promise(() => {}));
    montar();
    expect(screen.getByRole("status", { name: "Carregando o pátio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar conferência" })).toBeDisabled();
  });

  it("mostra o total e a divisão por tipo, em texto", async () => {
    montar();
    const regiao = await screen.findByRole("region", { name: "Pátio agora" });
    expect(within(regiao).getByText("24")).toBeInTheDocument();
    expect(within(regiao).getByText("veículos no pátio")).toBeInTheDocument();
    const tipos = within(regiao).getByRole("list", { name: "Veículos por tipo de cliente" });
    expect(tipos).toHaveTextContent("21 avulsos");
    expect(tipos).toHaveTextContent("1 mensal");
    expect(tipos).toHaveTextContent("2 conveniados");
  });

  it("sem conferência anterior diz 'nenhuma ainda'", async () => {
    montar();
    expect(await screen.findByText("nenhuma ainda")).toBeInTheDocument();
  });

  it("mostra a última conferência com o operador e, se for o caso, 'incompleta'", async () => {
    vi.mocked(obterResumo).mockResolvedValue(
      fromResumoResponse({ ...resumoComUltima, ultimaConferencia: { ...resumoComUltima.ultimaConferencia, situacao: 3, dataFim: "2020-01-05T09:12:00" } }),
    );
    montar();
    expect(await screen.findByText("05/01 09:12 · Operador Teste · incompleta")).toBeInTheDocument();
  });

  it("câmera vem escolhida e inicia pelo método câmera, indo para a conferência", async () => {
    const user = userEvent.setup();
    const { iniciar, onIr } = montar();
    await screen.findByRole("region", { name: "Pátio agora" });

    expect(screen.getByRole("radio", { name: /Ler placas com a câmera/ })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Iniciar conferência" }));

    expect(iniciar).toHaveBeenCalledWith(1);
    await waitFor(() => expect(onIr).toHaveBeenCalledWith("conferindo"));
  });

  it("a lista inicia pelo método lista", async () => {
    const user = userEvent.setup();
    const { iniciar } = montar();
    await screen.findByRole("region", { name: "Pátio agora" });

    await user.click(screen.getByRole("radio", { name: /Marcar pela lista/ }));
    await user.click(screen.getByRole("button", { name: "Iniciar conferência" }));

    expect(iniciar).toHaveBeenCalledWith(2);
  });

  it("sem câmera, só oferece a lista e explica", async () => {
    comCamera(false);
    const user = userEvent.setup();
    const { iniciar } = montar();
    await screen.findByRole("region", { name: "Pátio agora" });

    expect(screen.queryByRole("radio", { name: /câmera/ })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Marcar pela lista/ })).toBeChecked();
    expect(screen.getByText("Câmera indisponível neste aparelho ou navegador.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Iniciar conferência" }));
    expect(iniciar).toHaveBeenCalledWith(2);
  });

  it("sem caixa aberto não deixa iniciar e leva ao caixa", async () => {
    vi.mocked(obterResumo).mockResolvedValue(fromResumoResponse({ ...resumoSemConferencia, caixaIdAberto: null }));
    montar();

    expect(await screen.findByText(/Abra o caixa para iniciar a conferência/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir caixa" })).toHaveAttribute("href", "/caixa");
    expect(screen.getByRole("button", { name: "Iniciar conferência" })).toBeDisabled();
  });

  it("mostra a mensagem do back quando não consegue iniciar e não sai da tela", async () => {
    const user = userEvent.setup();
    const iniciar = vi.fn().mockRejectedValue(new ApiError("validation", "Já existe uma conferência aberta.", 400));
    const { onIr } = montar({}, iniciar);
    await screen.findByRole("region", { name: "Pátio agora" });

    await user.click(screen.getByRole("button", { name: "Iniciar conferência" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe uma conferência aberta.");
    expect(onIr).not.toHaveBeenCalled();
  });

  it("com conferência em andamento mostra quem iniciou, o progresso e 'Continuar conferência'", async () => {
    const user = userEvent.setup();
    const { onIr } = montar({ conferencia });
    await screen.findByRole("region", { name: "Pátio agora" });

    const aviso = screen.getByRole("status", { name: "" });
    expect(aviso).toHaveTextContent("Há uma conferência em andamento");
    expect(aviso).toHaveTextContent("por Operador Teste: 1 de 3 conferidos.");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Iniciar conferência" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continuar conferência" }));
    expect(onIr).toHaveBeenCalledWith("conferindo");
  });

  it("mostra o erro do resumo e permite tentar de novo", async () => {
    vi.mocked(obterResumo).mockRejectedValue(new ApiError("server", "Falha no servidor.", 500));
    montar();
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha no servidor.");

    vi.mocked(obterResumo).mockResolvedValue(fromResumoResponse(resumoSemConferencia));
    await userEvent.setup().click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("region", { name: "Pátio agora" })).toBeInTheDocument();
  });
});
