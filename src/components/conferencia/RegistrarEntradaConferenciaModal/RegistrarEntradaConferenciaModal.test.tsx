import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/api/services/conferenciaPatio", () => ({ registrarEntradaSemTicket: vi.fn() }));
vi.mock("@/lib/api/services/configuracao", () => ({ getConfiguracao: vi.fn(), updateConfiguracao: vi.fn() }));
vi.mock("@/lib/api/services/veiculo", () => ({ listModelos: vi.fn().mockResolvedValue([{ nome: "Onix", categoria: 2 }]) }));

import { registrarEntradaSemTicket } from "@/lib/api/services/conferenciaPatio";
import { getConfiguracao } from "@/lib/api/services/configuracao";
import { DICA_AVULSO, MENSAGEM_ENTRADA_REGISTRADA, RegistrarEntradaConferenciaModal } from "./RegistrarEntradaConferenciaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const onClose = vi.fn();
const onRegistrada = vi.fn();

function montar() {
  const utilitarios = renderWithProviders(<RegistrarEntradaConferenciaModal conferenciaId={1} placa="ZZZ9Z99" onClose={onClose} onRegistrada={onRegistrada} />);
  return { user: userEvent.setup(), ...utilitarios };
}

type User = ReturnType<typeof userEvent.setup>;

async function preencher(user: User, { categoria = "Carro pequeno", modelo = "Gol", cor = "Prata" } = {}) {
  await user.type(screen.getByLabelText("Modelo"), modelo);
  await user.click(screen.getByRole("radio", { name: categoria }));
  await user.click(screen.getByRole("radio", { name: cor }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(registrarEntradaSemTicket).mockResolvedValue({ patioId: 5 });
  // Padrão da empresa: modelo e cor obrigatórios, prisma opcional.
  vi.mocked(getConfiguracao).mockResolvedValue({ modelo: true, cor: true, prisma: false, servicos: false, entradaDiretoCamera: true, alteradoPorId: null, alteradoEm: null });
});

describe("RegistrarEntradaConferenciaModal", () => {
  it("mostra a placa e os campos, com o registro bloqueado até preencher o que falta", async () => {
    montar();
    const dialogo = await screen.findByRole("dialog", { name: "Registrar entrada" });

    expect(within(dialogo).getByText("ZZZ9Z99")).toBeInTheDocument();
    expect(screen.getByLabelText("Modelo")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Categoria/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Cor" })).toBeInTheDocument();
    expect(screen.getByLabelText("Código do ticket (opcional)")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Entrar como mensalista" })).not.toBeChecked();

    expect(screen.getByRole("button", { name: "Registrar e conferir" })).toBeDisabled();
    expect(screen.getByText("Falta: modelo, categoria e cor.")).toBeInTheDocument();
  });

  it("registra como avulso, fecha e avisa", async () => {
    const { user } = montar();
    await screen.findByRole("dialog");
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Registrar e conferir" }));

    await waitFor(() => expect(registrarEntradaSemTicket).toHaveBeenCalledWith(1, "ZZZ9Z99", { categoria: 2, modelo: "Gol", cor: "PRATA", mensalista: false }));
    expect(onRegistrada).toHaveBeenCalledWith(MENSAGEM_ENTRADA_REGISTRADA);
    expect(onClose).toHaveBeenCalled();
  });

  it("envia o código do ticket (só números) e o mensalista", async () => {
    const { user } = montar();
    await screen.findByRole("dialog");
    await preencher(user);
    await user.type(screen.getByLabelText("Código do ticket (opcional)"), "24a024");
    await user.click(screen.getByRole("switch", { name: "Entrar como mensalista" }));
    await user.click(screen.getByRole("button", { name: "Registrar e conferir" }));

    await waitFor(() =>
      expect(registrarEntradaSemTicket).toHaveBeenCalledWith(1, "ZZZ9Z99", { categoria: 2, modelo: "Gol", cor: "PRATA", codigoTicket: 24024, mensalista: true }),
    );
  });

  it("um modelo conhecido sugere a categoria", async () => {
    const { user } = montar();
    await screen.findByRole("dialog");
    await user.type(screen.getByLabelText("Modelo"), "Onix");
    await waitFor(() => expect(screen.getByRole("radio", { name: "Carro pequeno" })).toBeChecked());
  });

  it("mensalista recusado: mostra o motivo, desliga a escolha, mantém o formulário e sugere avulso", async () => {
    vi.mocked(registrarEntradaSemTicket).mockRejectedValueOnce(new ApiError("validation", "Mensalista com atraso acima da tolerância.", 400));
    const { user } = montar();
    await screen.findByRole("dialog");
    await preencher(user);
    await user.click(screen.getByRole("switch", { name: "Entrar como mensalista" }));
    await user.click(screen.getByRole("button", { name: "Registrar e conferir" }));

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Mensalista com atraso acima da tolerância.");
    expect(alerta).toHaveTextContent(DICA_AVULSO);
    expect(screen.getByRole("switch", { name: "Entrar como mensalista" })).not.toBeChecked();
    expect(screen.getByLabelText("Modelo")).toHaveValue("Gol");
    expect(onClose).not.toHaveBeenCalled();

    // Registra como avulso na sequência.
    await user.click(screen.getByRole("button", { name: "Registrar e conferir" }));
    await waitFor(() => expect(onRegistrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntradaSemTicket).mock.calls[1][2]).toMatchObject({ mensalista: false });
  });

  it("'Depois' fecha sem registrar", async () => {
    const { user } = montar();
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Depois" }));
    expect(onClose).toHaveBeenCalled();
    expect(registrarEntradaSemTicket).not.toHaveBeenCalled();
  });

  it("outro erro do back aparece sem sugerir avulso", async () => {
    vi.mocked(registrarEntradaSemTicket).mockRejectedValueOnce(new ApiError("not_found", "Placa não está pendente.", 404));
    const { user } = montar();
    await screen.findByRole("dialog");
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Registrar e conferir" }));

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Placa não está pendente.");
    expect(alerta).not.toHaveTextContent(DICA_AVULSO);
  });
});

describe("RegistrarEntradaConferenciaModal: regras da empresa", () => {
  const configurar = (regras: { modelo?: boolean; cor?: boolean; prisma?: boolean }) =>
    vi.mocked(getConfiguracao).mockResolvedValue({ modelo: true, cor: true, prisma: false, servicos: false, entradaDiretoCamera: true, alteradoPorId: 1, alteradoEm: "2026-11-08T16:36:03", ...regras });

  it("com o prisma obrigatório mostra o campo, pede no rodapé e envia o prisma", async () => {
    configurar({ prisma: true });
    const { user } = montar();
    await screen.findByRole("dialog");
    await preencher(user);
    await user.click(await screen.findByLabelText("Prisma"));
    expect(screen.getByText("Falta: prisma.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar e conferir" })).toBeDisabled();

    await user.type(screen.getByLabelText("Prisma"), "45");
    await user.click(screen.getByRole("button", { name: "Registrar e conferir" }));
    await waitFor(() =>
      expect(registrarEntradaSemTicket).toHaveBeenCalledWith(1, "ZZZ9Z99", { categoria: 2, modelo: "Gol", cor: "PRATA", prisma: 45, mensalista: false }),
    );
  });

  it("o prisma só aceita números de 1 a 999: 0 bloqueia o registro e diz a regra", async () => {
    configurar({ prisma: true });
    const { user } = montar();
    await screen.findByRole("dialog");
    await preencher(user);
    const campo = await screen.findByLabelText("Prisma");
    await user.type(campo, "0");
    await user.tab();
    expect(await screen.findByText("Use um número de 1 a 999")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar e conferir" })).toBeDisabled();

    await user.clear(campo);
    await user.type(campo, "abc12");
    expect(campo).toHaveValue("12");
    expect(screen.getByRole("button", { name: "Registrar e conferir" })).toBeEnabled();
  });

  it("sem o prisma obrigatório o campo não aparece", async () => {
    montar();
    await screen.findByRole("dialog");
    expect(screen.queryByLabelText("Prisma")).not.toBeInTheDocument();
  });

  it("entrar como mensalista tira a exigência do prisma", async () => {
    configurar({ prisma: true });
    const { user } = montar();
    await screen.findByRole("dialog");
    await preencher(user);
    await screen.findByLabelText("Prisma");
    expect(screen.getByRole("button", { name: "Registrar e conferir" })).toBeDisabled();

    await user.click(screen.getByRole("switch", { name: "Entrar como mensalista" }));
    await waitFor(() => expect(screen.queryByLabelText("Prisma")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Registrar e conferir" })).toBeEnabled();
  });

  it("com modelo e cor desligados os campos não aparecem; só a categoria basta, e o payload os omite", async () => {
    configurar({ modelo: false, cor: false });
    const { user } = montar();
    await screen.findByRole("dialog");
    await waitFor(() => expect(screen.queryByLabelText("Modelo")).not.toBeInTheDocument());
    expect(screen.queryByRole("group", { name: "Cor" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));
    await user.click(screen.getByRole("button", { name: "Registrar e conferir" }));

    await waitFor(() => expect(registrarEntradaSemTicket).toHaveBeenCalledWith(1, "ZZZ9Z99", { categoria: 2, mensalista: false }));
  });
});
