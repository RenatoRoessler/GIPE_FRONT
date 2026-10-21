import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { MensalistaTipo } from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({
  createMensalista: vi.fn(),
  updateMensalista: vi.fn(),
  listTiposMensalidade: vi.fn(),
}));

// O leitor de câmera tem testes próprios: aqui ele só devolve uma placa.
vi.mock("@/components/veiculos/LeitorPlacaModal", () => ({
  LeitorPlacaModal: ({ open, onConfirm }: { open: boolean; onConfirm: (placa: string) => void }) =>
    open ? (
      <button type="button" onClick={() => onConfirm("RIO2A18")}>
        Confirmar leitura
      </button>
    ) : null,
}));

import { createMensalista, listTiposMensalidade } from "@/lib/api/services/mensalista";
import { MensalistaModal } from "./MensalistaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const handlers = { onClose: vi.fn(), onSuccess: vi.fn(), onGoToTipos: vi.fn() };

const todas: MensalistaTipo = {
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  horarioEntrada: null,
  horarioSaida: null,
  ativo: true,
};
const pequeno: MensalistaTipo = { ...todas, mensalistaTipoId: 4, tipoMensal: "Pequeno", categoria: 2, valorMensalidade: 200 };

type User = ReturnType<typeof userEvent.setup>;

async function abrir(user: User) {
  renderWithProviders(<MensalistaModal {...handlers} />);
  await screen.findByRole("option", { name: /Diurno/ });
  return user;
}

async function preencherDados(user: User, tipoId = "3", documento = "52998224725") {
  await user.selectOptions(screen.getByLabelText("Tipo de mensalidade"), tipoId);
  await user.type(screen.getByLabelText("CPF"), documento);
  await user.type(screen.getByLabelText("Nome"), "Maria Souza");
  await user.type(screen.getByLabelText("E-mail"), "maria@exemplo.com");
  await user.type(screen.getByLabelText("Celular"), "11912345678");
  await user.type(screen.getByLabelText("Dia de vencimento"), "5");
}

async function preencherJuridica(user: User) {
  await user.selectOptions(screen.getByLabelText("Tipo de mensalidade"), "3");
  await user.click(screen.getByLabelText("Pessoa jurídica"));
  await user.type(screen.getByLabelText("CNPJ"), "11222333000181");
  await user.type(screen.getByLabelText("Razão social"), "Transportes XYZ");
  await user.type(screen.getByLabelText("E-mail"), "contato@xyz.com");
  await user.type(screen.getByLabelText("Celular"), "11912345678");
  await user.type(screen.getByLabelText("Dia de vencimento"), "10");
}

const adicionarVeiculo = (user: User) => user.click(screen.getAllByRole("button", { name: "Adicionar veículo" })[0]);

beforeEach(() => {
  vi.mocked(createMensalista).mockReset();
  vi.mocked(listTiposMensalidade).mockReset().mockResolvedValue([todas, pequeno]);
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

describe("MensalistaModal: veículos", () => {
  it("sem veículos mostra o estado vazio e salva do mesmo jeito", async () => {
    vi.mocked(createMensalista).mockResolvedValue({ mensalistaId: 1 });
    const user = await abrir(userEvent.setup());
    expect(screen.getByText("Nenhum veículo. O mensalista pode ser salvo sem veículos.")).toBeInTheDocument();

    await preencherDados(user);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(createMensalista).toHaveBeenCalled());
    expect(vi.mocked(createMensalista).mock.calls[0][0].veiculos).toEqual([]);
  });

  it("adicionar veículo abre o item com foco na placa e sem condutores para pessoa física", async () => {
    const user = await abrir(userEvent.setup());
    await adicionarVeiculo(user);

    const placa = screen.getByLabelText("Placa");
    expect(placa).toHaveFocus();
    expect(screen.getByLabelText("Modelo")).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
    expect(screen.getByText("Veículos (1)")).toBeInTheDocument();
    expect(screen.queryByText("Condutores autorizados")).not.toBeInTheDocument();
  });

  it("cadastra o veículo com a placa normalizada", async () => {
    vi.mocked(createMensalista).mockResolvedValue({ mensalistaId: 1 });
    const user = await abrir(userEvent.setup());
    await preencherDados(user);
    await adicionarVeiculo(user);
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.type(screen.getByLabelText("Modelo"), "Gol");
    await user.selectOptions(screen.getByLabelText("Categoria"), "2");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(createMensalista).toHaveBeenCalled());
    expect(vi.mocked(createMensalista).mock.calls[0][0].veiculos).toMatchObject([
      { placa: "ABC1D23", modelo: "Gol", categoria: "2", cor: "PRATA", condutores: [] },
    ]);
  });

  it("tipo 'todas' oferece as categorias de veículo, sem 'Todas'", async () => {
    const user = await abrir(userEvent.setup());
    await user.selectOptions(screen.getByLabelText("Tipo de mensalidade"), "3");
    await adicionarVeiculo(user);

    const categoria = screen.getByLabelText("Categoria");
    expect(within(categoria).getByRole("option", { name: "Moto" })).toBeInTheDocument();
    expect(within(categoria).queryByRole("option", { name: "Todas" })).not.toBeInTheDocument();
  });

  it("tipo de categoria específica trava a categoria do veículo", async () => {
    const user = await abrir(userEvent.setup());
    await user.selectOptions(screen.getByLabelText("Tipo de mensalidade"), "4");
    await adicionarVeiculo(user);

    const categoria = screen.getByLabelText("Categoria");
    expect(categoria).toHaveAttribute("readonly");
    expect(categoria).toHaveValue("Carro pequeno");
    expect(screen.getByText("Definida pelo tipo de mensalidade.")).toBeInTheDocument();
  });

  it("trocar para um tipo de categoria específica ajusta os veículos e avisa", async () => {
    const user = await abrir(userEvent.setup());
    await user.selectOptions(screen.getByLabelText("Tipo de mensalidade"), "3");
    await adicionarVeiculo(user);
    await user.selectOptions(screen.getByLabelText("Categoria"), "5");

    await user.selectOptions(screen.getByLabelText("Tipo de mensalidade"), "4");

    expect(await screen.findByText("Categorias dos veículos ajustadas para Carro pequeno.")).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toHaveValue("Carro pequeno");
  });

  it("o leitor de placa preenche a placa do veículo certo", async () => {
    const user = await abrir(userEvent.setup());
    await adicionarVeiculo(user);
    await user.click(screen.getByRole("button", { name: "Ler a placa do veículo 1 pela câmera" }));
    await user.click(screen.getByRole("button", { name: "Confirmar leitura" }));

    expect(screen.getByLabelText("Placa")).toHaveValue("RIO2A18");
  });

  it("veículo vazio sai direto; preenchido pede confirmação", async () => {
    const user = await abrir(userEvent.setup());
    await adicionarVeiculo(user);
    await user.click(screen.getByRole("button", { name: "Remover veículo 1" }));
    expect(screen.getByText("Nenhum veículo. O mensalista pode ser salvo sem veículos.")).toBeInTheDocument();

    await adicionarVeiculo(user);
    await user.type(screen.getByLabelText("Placa"), "ABC1D23");
    await user.click(screen.getByRole("button", { name: "Remover veículo ABC1D23" }));

    expect(screen.getByRole("dialog", { name: "Remover o veículo ABC1D23?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover" }));
    expect(screen.getByText("Veículos (0)")).toBeInTheDocument();
  });

  it("manter o veículo no diálogo não remove nada", async () => {
    const user = await abrir(userEvent.setup());
    await adicionarVeiculo(user);
    await user.type(screen.getByLabelText("Placa"), "ABC1D23");
    await user.click(screen.getByRole("button", { name: "Remover veículo ABC1D23" }));
    await user.click(screen.getByRole("button", { name: "Manter" }));

    expect(screen.getByText("Veículos (1)")).toBeInTheDocument();
  });

  it("placa repetida impede salvar e marca as duas", async () => {
    const user = await abrir(userEvent.setup());
    await preencherDados(user);
    for (let i = 0; i < 2; i += 1) {
      await adicionarVeiculo(user);
      await user.type(screen.getAllByLabelText("Placa").at(-1)!, "ABC1D23");
      await user.selectOptions(screen.getAllByLabelText("Categoria").at(-1)!, "2");
    }
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findAllByText("Placa já informada neste cadastro")).toHaveLength(2);
    expect(createMensalista).not.toHaveBeenCalled();
  });

  it("salvar com erro abre o veículo recolhido e leva o foco ao campo inválido", async () => {
    const user = await abrir(userEvent.setup());
    await preencherDados(user);
    await adicionarVeiculo(user);
    await adicionarVeiculo(user);
    // Recolhe o primeiro veículo (sem placa) antes de tentar salvar.
    await user.click(screen.getAllByRole("button", { name: /Novo veículo/ })[0]);
    const painelDoPrimeiro = () => screen.getAllByRole("region", { hidden: true })[1];
    expect(painelDoPrimeiro()).toHaveAttribute("hidden");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(painelDoPrimeiro()).not.toHaveAttribute("hidden"));
    await waitFor(() => expect(painelDoPrimeiro().contains(document.activeElement)).toBe(true));
    expect(document.activeElement).toHaveAttribute("aria-invalid", "true");
  });
});

describe("MensalistaModal: condutores (pessoa jurídica)", () => {
  async function abrirJuridica() {
    const user = await abrir(userEvent.setup());
    await preencherJuridica(user);
    return user;
  }

  it("o veículo novo já vem com um condutor em branco, que não pode ser removido sozinho", async () => {
    const user = await abrirJuridica();
    await adicionarVeiculo(user);

    expect(screen.getByText("Condutores autorizados")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome do condutor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover condutor 1" })).toBeDisabled();
    expect(screen.getByText("Pelo menos um condutor por veículo.")).toBeInTheDocument();
  });

  it("adicionar condutor habilita a remoção e leva o foco ao novo campo", async () => {
    const user = await abrirJuridica();
    await adicionarVeiculo(user);
    await user.click(screen.getByRole("button", { name: "Adicionar condutor" }));

    expect(screen.getAllByLabelText("Nome do condutor")).toHaveLength(2);
    expect(screen.getAllByLabelText("Nome do condutor")[1]).toHaveFocus();
    expect(screen.getByRole("button", { name: "Remover condutor 1" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Remover condutor 2" }));
    expect(screen.getAllByLabelText("Nome do condutor")).toHaveLength(1);
  });

  it("CPF repetido no mesmo veículo impede salvar", async () => {
    const user = await abrirJuridica();
    await adicionarVeiculo(user);
    await user.type(screen.getByLabelText("Placa"), "ABC1D23");
    await user.selectOptions(screen.getByLabelText("Categoria"), "2");
    await user.click(screen.getByRole("button", { name: "Adicionar condutor" }));
    const nomes = screen.getAllByLabelText("Nome do condutor");
    const cpfs = screen.getAllByLabelText("CPF do condutor");
    await user.type(nomes[0], "Ana Lima");
    await user.type(cpfs[0], "52998224725");
    await user.type(nomes[1], "Ana de novo");
    await user.type(cpfs[1], "52998224725");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findAllByText("Este CPF já está neste veículo")).toHaveLength(2);
    expect(createMensalista).not.toHaveBeenCalled();
  });

  it("envia os condutores com CPF só em dígitos", async () => {
    vi.mocked(createMensalista).mockResolvedValue({ mensalistaId: 1 });
    const user = await abrirJuridica();
    await adicionarVeiculo(user);
    await user.type(screen.getByLabelText("Placa"), "ABC1D23");
    await user.selectOptions(screen.getByLabelText("Categoria"), "2");
    await user.type(screen.getByLabelText("Nome do condutor"), "Ana Lima");
    await user.type(screen.getByLabelText("CPF do condutor"), "52998224725");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(createMensalista).toHaveBeenCalled());
    expect(vi.mocked(createMensalista).mock.calls[0][0].veiculos[0].condutores).toMatchObject([
      { nome: "Ana Lima", cpf: "529.982.247-25" },
    ]);
  });

  it("trocar a pessoa cria um condutor em branco (física → jurídica) ou tira os condutores (jurídica → física)", async () => {
    const user = await abrir(userEvent.setup());
    await adicionarVeiculo(user);
    expect(screen.queryByLabelText("Nome do condutor")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Pessoa jurídica"));
    expect(await screen.findByLabelText("Nome do condutor")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Pessoa física"));
    expect(screen.queryByLabelText("Nome do condutor")).not.toBeInTheDocument();
  });

  it("copia os condutores de outro veículo sem repetir CPF", async () => {
    const user = await abrirJuridica();
    await adicionarVeiculo(user);
    await user.type(screen.getByLabelText("Placa"), "ABC1D23");
    await user.type(screen.getByLabelText("Nome do condutor"), "Ana Lima");
    await user.type(screen.getByLabelText("CPF do condutor"), "52998224725");

    await adicionarVeiculo(user);
    await user.selectOptions(screen.getByLabelText("Copiar condutores de…"), "ABC1D23");

    await waitFor(() => {
      const abertos = screen.getAllByRole("region");
      const segundo = abertos[abertos.length - 1];
      expect(within(segundo).getByLabelText("Nome do condutor")).toHaveValue("Ana Lima");
      expect(within(segundo).getByLabelText("CPF do condutor")).toHaveValue("529.982.247-25");
    });
  });
});
