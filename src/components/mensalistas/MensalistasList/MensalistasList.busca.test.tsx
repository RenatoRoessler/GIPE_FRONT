import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { Mensalista, MensalistaTipo } from "@/types/mensalista";

const replace = vi.fn();
let pagina: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: (key: string) => (key === "pagina" ? pagina : null) }),
}));

vi.mock("@/lib/api/services/mensalista", () => ({
  listMensalistas: vi.fn(),
  listAllMensalistas: vi.fn(),
  listTiposMensalidade: vi.fn(),
  getContratoMensalista: vi.fn(),
  reenviarContrato: vi.fn(),
}));

import {
  getContratoMensalista,
  listAllMensalistas,
  listMensalistas,
  listTiposMensalidade,
} from "@/lib/api/services/mensalista";
import { MensalistasList } from "./MensalistasList";

let proximoId = 1;

function mensalista(nome: string, extra: Partial<Mensalista> = {}): Mensalista {
  return {
    mensalistaId: proximoId++,
    mensalistaTipoId: 3,
    tipoMensal: "Diurno",
    categoria: 99,
    valorMensalidade: 280,
    tipoPessoa: 1,
    documento: "52998224725",
    nome,
    email: "a@exemplo.com",
    celular: "11912345678",
    diaVencimento: 5,
    ativo: true,
    veiculos: [],
    situacao: "Em Dia",
    dataProximoVencimento: null,
    diasAteProximoVencimento: null,
    ...extra,
  };
}

const tipoAtivo: MensalistaTipo = {
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  horarioEntrada: null,
  horarioSaida: null,
  ativo: true,
};

const handlers = {
  onNovo: vi.fn(),
  onEditar: vi.fn(),
  onVerFicha: vi.fn(),
  onReceberPagamento: vi.fn(),
  onToast: vi.fn(),
  onCriarTipo: vi.fn(),
};

const veiculo = (placa: string) => ({ placa, modelo: "Gol", cor: "PRATA", categoria: 2 as const, condutores: [] });
const campo = () => screen.getByLabelText("Buscar por nome, placa, CPF ou CNPJ");

function todos(items: Mensalista[]) {
  vi.mocked(listAllMensalistas).mockResolvedValue({ items, totalRecords: items.length, truncado: false });
}

beforeEach(() => {
  replace.mockReset();
  pagina = null;
  vi.mocked(listMensalistas)
    .mockReset()
    .mockResolvedValue({ items: [mensalista("Maria Souza")], page: 1, pageSize: 20, totalRecords: 1, totalPages: 1 });
  vi.mocked(listAllMensalistas).mockReset();
  vi.mocked(listTiposMensalidade).mockReset().mockResolvedValue([tipoAtivo]);
  vi.mocked(getContratoMensalista).mockReset().mockResolvedValue(null);
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

describe("MensalistasList: busca por nome e placa", () => {
  it("o campo anuncia que aceita nome, placa e documento", async () => {
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    expect(campo()).toHaveAttribute("placeholder", "Nome, placa ou início do documento");
  });

  it("documento continua sendo buscado no servidor, com máscara, sem carregar o conjunto completo", async () => {
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    await userEvent.type(campo(), "529982");

    await waitFor(() =>
      expect(listMensalistas).toHaveBeenLastCalledWith({ pagina: 1, tamanhoPagina: 20, documento: "529982" }),
    );
    expect(campo()).toHaveValue("529.982");
    expect(listAllMensalistas).not.toHaveBeenCalled();
  });

  it("nome usa o conjunto completo, filtra sem acento e deixa o texto como digitado", async () => {
    todos([mensalista("José da Conceição"), mensalista("Maria Souza")]);
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    await userEvent.type(campo(), "jose");

    expect(campo()).toHaveValue("jose");
    await waitFor(() => expect(screen.queryByText("Maria Souza")).not.toBeInTheDocument());
    expect(screen.getByText("José da Conceição")).toBeInTheDocument();
    expect(listAllMensalistas).toHaveBeenCalledTimes(1);
    // A busca por texto não pede páginas da listagem com o termo.
    expect(listMensalistas).not.toHaveBeenCalledWith(expect.objectContaining({ documento: "JOSE" }));
  });

  it("placa acha o dono, com ou sem hífen", async () => {
    todos([mensalista("Com carro", { veiculos: [veiculo("ABC1D23")] }), mensalista("Sem carro")]);
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    await userEvent.type(campo(), "abc-1d23");

    expect(await screen.findByText("Com carro")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Sem carro")).not.toBeInTheDocument());
  });

  it("sem resultado diz que nome ou placa não foram achados e deixa limpar a busca", async () => {
    todos([mensalista("Maria Souza")]);
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    await userEvent.type(campo(), "zzzz");

    expect(await screen.findByText("Nenhum mensalista com esse nome ou placa.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    await waitFor(() => expect(campo()).toHaveValue(""));
    expect(await screen.findByText("Maria Souza")).toBeInTheDocument();
  });

  it("pagina localmente, 20 por vez", async () => {
    todos(Array.from({ length: 45 }, (_, i) => mensalista(`Silva ${String(i + 1).padStart(2, "0")}`)));
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    await userEvent.type(campo(), "silva");

    expect(await screen.findByText("Silva 01")).toBeInTheDocument();
    expect(screen.getByText("Silva 20")).toBeInTheDocument();
    expect(screen.queryByText("Silva 21")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /próxima/i }));
    expect(replace).toHaveBeenCalledWith("/mensalistas?aba=lista&pagina=2", { scroll: false });
  });

  it("mostra a segunda página dos resultados quando a URL pede", async () => {
    pagina = "2";
    todos(Array.from({ length: 45 }, (_, i) => mensalista(`Silva ${String(i + 1).padStart(2, "0")}`)));
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    await userEvent.type(campo(), "silva");

    expect(await screen.findByText("Silva 21")).toBeInTheDocument();
    expect(screen.getByText("Silva 40")).toBeInTheDocument();
    expect(screen.queryByText("Silva 20")).not.toBeInTheDocument();
  });

  it("trocar do modo texto para documento volta a usar o servidor", async () => {
    todos([mensalista("José da Conceição")]);
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    await userEvent.type(campo(), "jose");
    await screen.findByText("José da Conceição");
    await userEvent.clear(campo());
    await userEvent.type(campo(), "529");

    await waitFor(() =>
      expect(listMensalistas).toHaveBeenLastCalledWith({ pagina: 1, tamanhoPagina: 20, documento: "529" }),
    );
    expect(await screen.findByText("Maria Souza")).toBeInTheDocument();
  });

  it("erro ao carregar o conjunto completo mostra a mensagem e deixa tentar de novo", async () => {
    vi.mocked(listAllMensalistas).mockRejectedValue(new Error("Falha ao carregar"));
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    await userEvent.type(campo(), "maria");

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao carregar");
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});

describe("MensalistasList: ficha pelo nome", () => {
  it("o nome da linha é um botão que abre a ficha (alvo de toque principal no celular)", async () => {
    renderWithProviders(<MensalistasList {...handlers} />);

    await userEvent.click(await screen.findByRole("button", { name: "Maria Souza" }));

    expect(handlers.onVerFicha).toHaveBeenCalledWith(expect.objectContaining({ nome: "Maria Souza" }));
  });
});
