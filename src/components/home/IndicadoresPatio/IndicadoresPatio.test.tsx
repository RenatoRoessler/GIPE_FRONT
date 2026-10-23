import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { PatioVeiculo } from "@/types/patio";

vi.mock("@/lib/api/services/patio", () => ({ listPatio: vi.fn() }));
const vagas = vi.hoisted(() => ({ atual: { moto: 12, carro: 23 } as { moto: number; carro: number } | null }));
vi.mock("@/components/patio/useVagasPatio", () => ({ useVagasPatio: () => vagas.atual }));
const sessao = vi.hoisted(() => ({ atual: { user: { name: "Maria", perfil: 1 } as { name: string; perfil: number | null } | null, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

import { listPatio } from "@/lib/api/services/patio";
import { IndicadoresPatio } from "./IndicadoresPatio";

let proximoId = 1;

function veiculo(extra: Partial<PatioVeiculo> = {}): PatioVeiculo {
  return {
    patioId: proximoId++,
    placa: "ABC1D23",
    categoria: 2,
    modelo: "Gol",
    cor: "PRATA",
    codigoTicket: null,
    sequencial: 1000 + proximoId,
    mensalista: false,
    dataHoraEntrada: "2026-10-17T15:30:22",
    minutosPermanencia: 60,
    permanencia: "1h 0min",
    rotatividadeDescricao: "TABELA",
    usuarioEntrada: "ana",
    token: "ABCD1234",
    ...extra,
  };
}

beforeEach(() => {
  proximoId = 1;
  vagas.atual = { moto: 12, carro: 23 };
  sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
  vi.mocked(listPatio).mockReset();
});

describe("IndicadoresPatio", () => {
  it("mostra os quatro indicadores e os gráficos do pátio", async () => {
    vi.mocked(listPatio).mockResolvedValue([
      veiculo({ placa: "AAA1A11", mensalista: true, minutosPermanencia: 60 }),
      veiculo({ placa: "BBB1B11", minutosPermanencia: 120 }),
      veiculo({ placa: "CCC1C11", minutosPermanencia: 5000, permanencia: "3d 11h 20min", usuarioEntrada: "bia" }),
      veiculo({ placa: "DDD1D11", minutosPermanencia: 180 }),
    ]);

    renderWithProviders(<IndicadoresPatio />);

    expect(await screen.findByRole("heading", { name: "Pátio agora" })).toBeInTheDocument();
    expect(screen.getByText("veículos no pátio").nextSibling).toHaveTextContent("4");
    expect(screen.getByText(/de mensalistas/).nextSibling).toHaveTextContent("25%");
    expect(screen.getByText("permanência média").nextSibling).toHaveTextContent("22h 20min");
    expect(screen.getByText("Mais antigo: CCC1C11, 3d 11h 20min")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Mensalistas e avulsos" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Por operador de entrada" })).getByText("bia")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver o pátio" })).toHaveAttribute("href", "/patio");
  });

  it("mostra a ocupação das vagas, e a destaca quando passa de 90%", async () => {
    vi.mocked(listPatio).mockResolvedValue([veiculo({ categoria: 1 }), veiculo(), veiculo()]);

    const { unmount } = renderWithProviders(<IndicadoresPatio />);

    const rotulo = await screen.findByText(/das vagas ocupadas/);
    expect(rotulo.nextSibling).toHaveTextContent("9%");
    expect(screen.getByText("Carros 2 de 23 · Motos 1 de 12")).toBeInTheDocument();
    unmount();

    vagas.atual = { moto: 1, carro: 2 };
    renderWithProviders(<IndicadoresPatio />);
    expect((await screen.findByText(/das vagas ocupadas/)).nextSibling).toHaveTextContent("100%");
  });

  it("sem vagas cadastradas a ocupação não aparece", async () => {
    vagas.atual = null;
    vi.mocked(listPatio).mockResolvedValue([veiculo()]);

    renderWithProviders(<IndicadoresPatio />);

    expect(await screen.findByRole("heading", { name: "Pátio agora" })).toBeInTheDocument();
    expect(screen.queryByText(/das vagas ocupadas/)).not.toBeInTheDocument();
  });

  it("pátio vazio mostra os números zerados e nenhum gráfico", async () => {
    vi.mocked(listPatio).mockResolvedValue([]);

    renderWithProviders(<IndicadoresPatio />);

    expect(await screen.findByRole("heading", { name: "Pátio agora" })).toBeInTheDocument();
    expect(screen.getByText("veículos no pátio").nextSibling).toHaveTextContent("0");
    expect(screen.queryByRole("region", { name: "Por categoria" })).not.toBeInTheDocument();
  });

  it("erro permite tentar de novo", async () => {
    vi.mocked(listPatio).mockRejectedValue(new ApiError("server"));

    renderWithProviders(<IndicadoresPatio />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os indicadores do pátio.");
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("sem permissão a seção some, sem mostrar erro", async () => {
    vi.mocked(listPatio).mockRejectedValue(new ApiError("forbidden"));

    const { container } = renderWithProviders(<IndicadoresPatio />);

    await vi.waitFor(() => expect(listPatio).toHaveBeenCalled());
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("IndicadoresPatio: chegadas por hora", () => {
  it("mostra o gráfico com o resumo de hoje", async () => {
    const hoje = new Date();
    hoje.setHours(9, 15, 0, 0);
    const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}T09:15:00`;
    vi.mocked(listPatio).mockResolvedValue([veiculo({ dataHoraEntrada: iso }), veiculo({ dataHoraEntrada: iso })]);

    renderWithProviders(<IndicadoresPatio />);

    const grafico = await screen.findByRole("region", { name: "Chegada de quem está no pátio" });
    expect(within(grafico).getAllByText("Hoje: 2 chegadas ainda no pátio, pico às 9h com 2.").length).toBeGreaterThan(0);
  });
});

describe("IndicadoresPatio: permissão por perfil", () => {
  it.each([
    ["Financeiro", 8],
    ["perfil desconhecido", null],
  ])("%s não vê a seção e não consulta o pátio", async (_nome, perfil) => {
    sessao.atual = { user: { name: "Ana", perfil }, isLoading: false };
    const { container } = renderWithProviders(<IndicadoresPatio />);

    expect(container).toBeEmptyDOMElement();
    await Promise.resolve();
    expect(listPatio).not.toHaveBeenCalled();
  });

  it("não consulta o pátio enquanto o perfil carrega", () => {
    sessao.atual = { user: null, isLoading: true };
    const { container } = renderWithProviders(<IndicadoresPatio />);

    expect(container).toBeEmptyDOMElement();
    expect(listPatio).not.toHaveBeenCalled();
  });

  it("o Manobrista consulta o pátio", async () => {
    sessao.atual = { user: { name: "Joao", perfil: 3 }, isLoading: false };
    vi.mocked(listPatio).mockResolvedValue([veiculo()]);
    renderWithProviders(<IndicadoresPatio />);

    expect(await screen.findByText("veículo no pátio")).toBeInTheDocument();
    expect(listPatio).toHaveBeenCalled();
  });
});
