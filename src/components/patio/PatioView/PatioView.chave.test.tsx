import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { PatioVeiculo } from "@/types/patio";
import type { QuadroChaves } from "@/types/quadroChaves";

const perfil = vi.hoisted(() => ({ atual: 1 }));

vi.mock("@/lib/api/services/patio", () => ({ listPatio: vi.fn() }));
vi.mock("@/lib/api/services/quadroChaves", () => ({ listQuadros: vi.fn(), escolherQuadroChave: vi.fn() }));
vi.mock("@/contexts/CurrentUserContext", () => ({
  useCurrentUser: () => ({ user: { id: "x", name: "Renato", email: "r@e.com", perfil: perfil.atual }, isLoading: false }),
}));
vi.mock("../useVagasPatio", () => ({ useVagasPatio: () => ({ moto: 12, carro: 23 }) }));
vi.mock("@/components/veiculos/VeiculoModais", () => ({ useVeiculoModais: () => ({ abrirEntrada: vi.fn(), abrirSaida: vi.fn() }) }));

import { listPatio } from "@/lib/api/services/patio";
import { escolherQuadroChave, listQuadros } from "@/lib/api/services/quadroChaves";
import { PatioView } from "./PatioView";

const listarPatio = vi.mocked(listPatio);
const listarQuadros = vi.mocked(listQuadros);
const escolher = vi.mocked(escolherQuadroChave);

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

let proximoId = 1;

function veiculo(placa: string, extra: Partial<PatioVeiculo> = {}): PatioVeiculo {
  const id = proximoId++;
  return {
    patioId: id,
    placa,
    categoria: 2,
    modelo: "Gol",
    cor: "PRATA",
    codigoTicket: null,
    sequencial: id,
    mensalista: false,
    dataHoraEntrada: "2026-10-17T15:30:22",
    minutosPermanencia: 60 + id,
    permanencia: "1h 0min",
    rotatividadeDescricao: "TABELA",
    usuarioEntrada: "operador",
    token: "ABCD1234",
    ...extra,
  };
}

const pos = (id: number, coluna: number, disponivel = true) => ({ patioQuadroChaveId: id, coluna, disponivel });

const recepcao: QuadroChaves = {
  patioQuadroId: 1,
  nome: "Recepção",
  linhas: [{ linha: "A", colunas: [pos(1, 1, false), pos(2, 2), pos(3, 3)] }],
};

const COM_CHAVE = () => veiculo("COM1A11", { posicaoChave: "A1", chaveRef: { quadro: null, linha: "A", coluna: 1 } });
const SEM_CHAVE = () => veiculo("SEM2B22");
const OUTRO_SEM_CHAVE = () => veiculo("OUT3C33");

const indicador = () => screen.getByText(/fora do quadro$|Todas as chaves no quadro/);

beforeEach(() => {
  vi.resetAllMocks();
  perfil.atual = 1;
  listarQuadros.mockResolvedValue([recepcao]);
});

describe("PatioView: botão da chave", () => {
  it("guarda a chave de um carro sem gancho e atualiza o card e o indicador", async () => {
    const com = COM_CHAVE();
    const sem = SEM_CHAVE();
    const outro = OUTRO_SEM_CHAVE();
    listarPatio.mockResolvedValue([com, sem, outro]);
    escolher.mockResolvedValue({ patioId: sem.patioId, placa: sem.placa, patioQuadroId: 1, quadro: "Recepção", patioQuadroChaveId: 2, linha: "A", coluna: 2 });
    renderWithProviders(<PatioView />);

    expect(await screen.findByText("2 fora do quadro")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Guardar a chave de SEM2B22 no quadro" }));
    expect(await screen.findByRole("dialog", { name: "Guardar chave" })).toBeInTheDocument();
    expect(await screen.findByText("Gancho sugerido")).toBeInTheDocument();

    // Depois de guardar, o back já devolve o carro com a posição.
    listarPatio.mockResolvedValue([com, { ...sem, posicaoChave: "A2", chaveRef: { quadro: null, linha: "A", coluna: 2 } }, outro]);
    await userEvent.click(screen.getByRole("button", { name: "Guardar no gancho A2" }));

    expect(escolher).toHaveBeenCalledWith(sem.patioId, 2);
    expect(await screen.findByText("Chave guardada no A2.")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Trocar a chave de SEM2B22, hoje no gancho A2" })).toHaveTextContent("A2");
    expect(await screen.findByText("1 fora do quadro")).toBeInTheDocument();
  });

  it("troca de gancho: abre na chave de hoje, sem sugestão, e guarda o gancho livre escolhido", async () => {
    const com = COM_CHAVE();
    listarPatio.mockResolvedValue([com]);
    escolher.mockResolvedValue({ patioId: com.patioId, placa: com.placa, patioQuadroId: 1, quadro: "Recepção", patioQuadroChaveId: 3, linha: "A", coluna: 3 });
    renderWithProviders(<PatioView />);

    await userEvent.click(await screen.findByRole("button", { name: /hoje no gancho A1/ }));
    expect(await screen.findByText("Chave hoje no A1")).toBeInTheDocument();
    expect(screen.queryByText("Gancho sugerido")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "A3, livre" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar no gancho A3" }));

    expect(escolher).toHaveBeenCalledWith(com.patioId, 3);
    expect(await screen.findByText("Chave guardada no A3.")).toBeInTheDocument();
  });

  it("conflito mostra a placa que ocupa o gancho e o modal continua aberto", async () => {
    const sem = SEM_CHAVE();
    listarPatio.mockResolvedValue([sem]);
    escolher.mockRejectedValue(new ApiError("validation", "A2 já está com a chave do veículo ABC1D23.", 400));
    renderWithProviders(<PatioView />);

    await userEvent.click(await screen.findByRole("button", { name: /Guardar a chave de SEM2B22/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Guardar no gancho A2" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("ABC1D23");
    expect(screen.getByRole("dialog", { name: "Guardar chave" })).toBeInTheDocument();
  });

  it("cancelar fecha o modal sem guardar", async () => {
    listarPatio.mockResolvedValue([SEM_CHAVE()]);
    renderWithProviders(<PatioView />);

    await userEvent.click(await screen.findByRole("button", { name: /Guardar a chave de SEM2B22/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Guardar chave" })).not.toBeInTheDocument());
    expect(escolher).not.toHaveBeenCalled();
  });
});

describe("PatioView: indicador de chaves fora do quadro", () => {
  it("usa o singular com um carro fora do quadro", async () => {
    listarPatio.mockResolvedValue([COM_CHAVE(), SEM_CHAVE()]);
    renderWithProviders(<PatioView />);
    expect(await screen.findByText("1 fora do quadro")).toBeInTheDocument();
  });

  it("com todas as chaves no quadro diz isso, sem selo de alerta", async () => {
    listarPatio.mockResolvedValue([COM_CHAVE()]);
    renderWithProviders(<PatioView />);
    expect(await screen.findByText("Todas as chaves no quadro")).toBeInTheDocument();
    expect(screen.queryByText(/fora do quadro$/)).not.toBeInTheDocument();
  });

  it("conta o pátio inteiro, com mais de 100 veículos e ignorando a busca", async () => {
    const lista = Array.from({ length: 120 }, (_, i) => veiculo(`LOT${String(i).padStart(4, "0")}`.slice(0, 7)));
    listarPatio.mockResolvedValue(lista);
    renderWithProviders(<PatioView />);

    expect(await screen.findByText("120 fora do quadro")).toBeInTheDocument();
    // Só 100 linhas são exibidas, mas o número é do pátio todo.
    expect(screen.getAllByRole("button", { name: /Guardar a chave de/ })).toHaveLength(100);

    await userEvent.type(screen.getByLabelText("Buscar por placa, modelo ou ticket"), lista[0].placa);
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Guardar a chave de/ })).toHaveLength(1));
    expect(indicador()).toHaveTextContent("120 fora do quadro");
  });
});

describe("PatioView: empresa sem quadro de chaves", () => {
  beforeEach(() => {
    listarQuadros.mockResolvedValue([]);
    listarPatio.mockResolvedValue([COM_CHAVE(), SEM_CHAVE()]);
  });

  it("não mostra botão nem indicador e oferece configurar a quem gerencia quadros", async () => {
    renderWithProviders(<PatioView />);

    expect(await screen.findByRole("link", { name: "Configurar quadro de chaves" })).toHaveAttribute("href", "/quadros-chaves");
    expect(screen.queryByRole("button", { name: /a chave de/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/fora do quadro/)).not.toBeInTheDocument();
    expect(screen.queryByText("Todas as chaves no quadro")).not.toBeInTheDocument();
  });

  it("quem não gerencia quadros não vê nem o atalho", async () => {
    perfil.atual = 3;
    renderWithProviders(<PatioView />);

    await screen.findByText("COM1A11");
    await waitFor(() => expect(listarQuadros).toHaveBeenCalled());
    expect(screen.queryByRole("link", { name: "Configurar quadro de chaves" })).not.toBeInTheDocument();
  });
});

describe("PatioView: falha ao carregar os quadros", () => {
  it("o Pátio segue funcionando, só sem o botão e o indicador", async () => {
    listarQuadros.mockRejectedValue(new ApiError("network"));
    listarPatio.mockResolvedValue([SEM_CHAVE()]);
    renderWithProviders(<PatioView />);

    const linha = (await screen.findByText("SEM2B22")).closest("tr") as HTMLElement;
    expect(within(linha).getByRole("button", { name: /Registrar saída/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /a chave de/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/fora do quadro/)).not.toBeInTheDocument();
  });
});
