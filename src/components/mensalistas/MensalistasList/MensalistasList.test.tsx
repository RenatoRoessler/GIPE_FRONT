import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { TODOS_OS_DIAS, type Mensalista, type MensalistaTipo } from "@/types/mensalista";

const replace = vi.fn();
let pagina: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: (key: string) => (key === "pagina" ? pagina : null) }),
}));

vi.mock("@/lib/api/services/mensalista", () => ({
  listMensalistas: vi.fn(),
  listTiposMensalidade: vi.fn(),
  getContratoMensalista: vi.fn(),
  reenviarContrato: vi.fn(),
}));

import {
  getContratoMensalista,
  listMensalistas,
  listTiposMensalidade,
  reenviarContrato,
} from "@/lib/api/services/mensalista";
import { MensalistasList } from "./MensalistasList";

const maria: Mensalista = {
  mensalistaId: 1,
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  tipoPessoa: 1,
  documento: "52998224725",
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  celular: "11912345678",
  diaVencimento: 5,
  ativo: true,
  veiculos: [],
  situacao: null,
  dataProximoVencimento: null,
  diasAteProximoVencimento: null,
};
const joao: Mensalista = { ...maria, mensalistaId: 2, nome: "João Lima", ativo: false };

const tipoAtivo: MensalistaTipo = {
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  horarioEntrada: null,
  horarioSaida: null,
  ...TODOS_OS_DIAS,
  ativo: true,
};

function page(items: Mensalista[], extra: Partial<{ page: number; totalPages: number; totalRecords: number }> = {}) {
  return { items, page: 1, pageSize: 20, totalRecords: items.length, totalPages: items.length ? 1 : 0, ...extra };
}

const handlers = { onNovo: vi.fn(), onEditar: vi.fn(), onVerFicha: vi.fn(), onReceberPagamento: vi.fn(), onToast: vi.fn(), onCriarTipo: vi.fn() };

describe("MensalistasList", () => {
  beforeEach(() => {
    vi.mocked(listMensalistas).mockReset();
    vi.mocked(listTiposMensalidade).mockReset().mockResolvedValue([tipoAtivo]);
    vi.mocked(getContratoMensalista).mockReset().mockResolvedValue(null);
    vi.mocked(reenviarContrato).mockReset();
    replace.mockReset();
    Object.values(handlers).forEach((fn) => fn.mockReset());
    pagina = null;
  });

  it("mostra o carregamento enquanto busca", () => {
    vi.mocked(listMensalistas).mockReturnValue(new Promise(() => undefined));
    renderWithProviders(<MensalistasList {...handlers} />);
    expect(screen.getByRole("status", { name: "Carregando mensalistas" })).toBeInTheDocument();
  });

  it("lista os mensalistas com documento mascarado, tipo, valor, vencimento e situação", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([maria, joao]));
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByText("Maria Souza")).toBeInTheDocument();
    expect(screen.getAllByText("maria@exemplo.com")).toHaveLength(2);
    expect(screen.getAllByText("(11) 91234-5678")).toHaveLength(2);
    expect(screen.getAllByText("529.982.247-25")).toHaveLength(2);
    expect(screen.getAllByText("dia 5")).toHaveLength(2);
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();
    expect(listMensalistas).toHaveBeenCalledWith({ pagina: 1, tamanhoPagina: 20, documento: "" });
  });

  it("abre cadastro e edição", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([maria]));
    renderWithProviders(<MensalistasList {...handlers} />);

    await userEvent.click(await screen.findByRole("button", { name: "Novo mensalista" }));
    expect(handlers.onNovo).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Editar Maria Souza" }));
    expect(handlers.onEditar).toHaveBeenCalledWith(maria);
  });

  it("busca por documento sem máscara, depois do debounce", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([maria]));
    const user = userEvent.setup();
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    await user.type(screen.getByLabelText("Buscar por nome, placa, CPF ou CNPJ"), "529.982");

    await waitFor(() =>
      expect(listMensalistas).toHaveBeenLastCalledWith({ pagina: 1, tamanhoPagina: 20, documento: "529982" }),
    );
  });

  it("volta para a página 1 ao digitar a busca estando em outra página", async () => {
    pagina = "3";
    vi.mocked(listMensalistas).mockResolvedValue(page([maria], { page: 3, totalPages: 3, totalRecords: 41 }));
    const user = userEvent.setup();
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    await user.type(screen.getByLabelText("Buscar por nome, placa, CPF ou CNPJ"), "5");
    expect(replace).toHaveBeenCalledWith("/mensalistas?aba=lista", { scroll: false });
  });

  it("troca de página pedindo a página certa", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([maria], { page: 1, totalPages: 3, totalRecords: 41 }));
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    const next = screen.getByRole("button", { name: /próxima/i });
    await userEvent.click(next);
    expect(replace).toHaveBeenCalledWith("/mensalistas?aba=lista&pagina=2", { scroll: false });
  });

  it("vazio da busca mostra a mensagem e permite limpar", async () => {
    vi.mocked(listMensalistas).mockImplementation(async ({ documento }) =>
      documento ? page([]) : page([maria]),
    );
    const user = userEvent.setup();
    renderWithProviders(<MensalistasList {...handlers} />);
    await screen.findByText("Maria Souza");

    await user.type(screen.getByLabelText("Buscar por nome, placa, CPF ou CNPJ"), "999");
    expect(await screen.findByText("Nenhum mensalista com esse documento.")).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar por nome, placa, CPF ou CNPJ")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(await screen.findByText("Maria Souza")).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar por nome, placa, CPF ou CNPJ")).toHaveValue("");
  });

  it("vazio com tipo ativo oferece cadastrar o primeiro mensalista", async () => {
    vi.mocked(listMensalistas).mockResolvedValue(page([]));
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByText("Nenhum mensalista cadastrado.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Novo mensalista" }));
    expect(handlers.onNovo).toHaveBeenCalled();
  });

  it("sem tipo ativo orienta a criar um tipo antes", async () => {
    vi.mocked(listTiposMensalidade).mockResolvedValue([{ ...tipoAtivo, ativo: false }]);
    vi.mocked(listMensalistas).mockResolvedValue(page([]));
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByText("Crie um tipo de mensalidade antes de cadastrar mensalistas.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Criar tipo de mensalidade" }));
    expect(handlers.onCriarTipo).toHaveBeenCalled();
    expect(handlers.onNovo).not.toHaveBeenCalled();
  });

  it("mostra o erro e permite tentar novamente", async () => {
    vi.mocked(listMensalistas).mockRejectedValueOnce(new ApiError("server"));
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os mensalistas");

    vi.mocked(listMensalistas).mockResolvedValue(page([maria]));
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Maria Souza")).toBeInTheDocument();
  });

  it("no 403 mostra o aviso de permissão", async () => {
    vi.mocked(listMensalistas).mockRejectedValue(new ApiError("forbidden"));
    renderWithProviders(<MensalistasList {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});
