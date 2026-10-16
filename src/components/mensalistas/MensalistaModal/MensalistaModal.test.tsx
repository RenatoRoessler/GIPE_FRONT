import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Mensalista, MensalistaTipo } from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({
  createMensalista: vi.fn(),
  updateMensalista: vi.fn(),
  listTiposMensalidade: vi.fn(),
}));

import { createMensalista, listTiposMensalidade, updateMensalista } from "@/lib/api/services/mensalista";
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

const diurno: MensalistaTipo = {
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  horarioEntrada: null,
  horarioSaida: null,
  ativo: true,
};
const antigo: MensalistaTipo = { ...diurno, mensalistaTipoId: 5, tipoMensal: "Antigo", ativo: false };

const maria: Mensalista = {
  mensalistaId: 7,
  mensalistaTipoId: 5,
  tipoMensal: "Antigo",
  categoria: 99,
  valorMensalidade: 280,
  tipoPessoa: 1,
  documento: "52998224725",
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  celular: "11912345678",
  diaVencimento: 5,
  ativo: true,
};

async function preencher(user: ReturnType<typeof userEvent.setup>, documento = "52998224725") {
  await screen.findByRole("option", { name: /Diurno/ });
  await user.selectOptions(screen.getByLabelText("Tipo de mensalidade"), "3");
  await user.type(screen.getByLabelText("CPF"), documento);
  await user.type(screen.getByLabelText("Nome"), "Maria Souza");
  await user.type(screen.getByLabelText("E-mail"), "maria@exemplo.com");
  await user.type(screen.getByLabelText("Celular"), "11912345678");
  await user.type(screen.getByLabelText("Dia de vencimento"), "5");
}

describe("MensalistaModal", () => {
  beforeEach(() => {
    vi.mocked(createMensalista).mockReset();
    vi.mocked(updateMensalista).mockReset();
    vi.mocked(listTiposMensalidade).mockReset().mockResolvedValue([diurno, antigo]);
    Object.values(handlers).forEach((fn) => fn.mockReset());
  });

  it("no cadastro oferece só os tipos ativos", async () => {
    renderWithProviders(<MensalistaModal {...handlers} />);
    expect(await screen.findByRole("option", { name: /Diurno/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Antigo/ })).not.toBeInTheDocument();
  });

  it("aplica a máscara de CPF e recusa CPF inválido", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MensalistaModal {...handlers} />);
    await preencher(user, "11111111111");

    expect(screen.getByLabelText("CPF")).toHaveValue("111.111.111-11");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("CPF inválido")).toBeInTheDocument();
    expect(createMensalista).not.toHaveBeenCalled();
  });

  it("trocar para pessoa jurídica limpa o documento e aceita CNPJ alfanumérico", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MensalistaModal {...handlers} />);
    await screen.findByRole("option", { name: /Diurno/ });
    await user.type(screen.getByLabelText("CPF"), "52998224725");

    await user.click(screen.getByLabelText("Pessoa jurídica"));
    const cnpj = screen.getByLabelText("CNPJ");
    expect(cnpj).toHaveValue("");

    await user.type(cnpj, "12abc34501de35");
    expect(cnpj).toHaveValue("12.ABC.345/01DE-35");
    expect(screen.getByLabelText("Razão social")).toBeInTheDocument();
  });

  it("cadastra com o payload do formulário e avisa o sucesso", async () => {
    vi.mocked(createMensalista).mockResolvedValue({ mensalistaId: 1 });
    const user = userEvent.setup();
    renderWithProviders(<MensalistaModal {...handlers} />);
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Mensalista cadastrado."));
    expect(vi.mocked(createMensalista).mock.calls[0][0]).toMatchObject({
      mensalistaTipoId: "3",
      tipoPessoa: "1",
      documento: "529.982.247-25",
      celular: "(11) 91234-5678",
      diaVencimento: "5",
      ativo: true,
    });
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("no cadastro não mostra o interruptor de ativo", async () => {
    renderWithProviders(<MensalistaModal {...handlers} />);
    await screen.findByRole("option", { name: /Diurno/ });
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("na edição bloqueia pessoa e documento e mantém o tipo atual mesmo inativo", async () => {
    renderWithProviders(<MensalistaModal mensalista={maria} {...handlers} />);

    expect(await screen.findByRole("option", { name: /Antigo.*\(inativo\)/ })).toBeInTheDocument();
    expect(screen.getByLabelText("CPF")).toBeDisabled();
    expect(screen.getByLabelText("CPF")).toHaveValue("529.982.247-25");
    expect(screen.getByLabelText("Pessoa física")).toBeDisabled();
    expect(screen.getByLabelText("Nome")).toHaveValue("Maria Souza");
    expect(screen.getByLabelText("Celular")).toHaveValue("(11) 91234-5678");
  });

  it("na edição reenvia pessoa e documento atuais e envia ativo=false ao desativar", async () => {
    vi.mocked(updateMensalista).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<MensalistaModal mensalista={maria} {...handlers} />);
    await screen.findByRole("option", { name: /Antigo/ });

    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Mensalista atualizado."));
    expect(updateMensalista).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ tipoPessoa: "1", documento: "529.982.247-25", ativo: false }),
    );
  });

  it("mostra o erro do servidor no banner", async () => {
    vi.mocked(createMensalista).mockRejectedValue(new ApiError("validation", "Tipo inativo ou inexistente."));
    const user = userEvent.setup();
    renderWithProviders(<MensalistaModal {...handlers} />);
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Tipo inativo ou inexistente.");
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("sem tipo ativo bloqueia o cadastro e oferece criar um tipo", async () => {
    vi.mocked(listTiposMensalidade).mockResolvedValue([antigo]);
    const user = userEvent.setup();
    renderWithProviders(<MensalistaModal {...handlers} />);

    expect(await screen.findByText("Crie um tipo de mensalidade antes de cadastrar mensalistas.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Criar tipo" }));
    expect(handlers.onGoToTipos).toHaveBeenCalled();
  });

  it("pede confirmação ao descartar com alterações e fecha direto sem alterações", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<MensalistaModal {...handlers} />);
    await screen.findByRole("option", { name: /Diurno/ });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
    unmount();

    handlers.onClose.mockReset();
    renderWithProviders(<MensalistaModal {...handlers} />);
    await screen.findByRole("option", { name: /Diurno/ });
    await user.type(screen.getByLabelText("Nome"), "Ana");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByText("Descartar alterações?")).toBeInTheDocument();
    expect(handlers.onClose).not.toHaveBeenCalled();
  });
});
