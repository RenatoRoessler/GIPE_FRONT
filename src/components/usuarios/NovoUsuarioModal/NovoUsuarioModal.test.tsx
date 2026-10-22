import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { CpfConsulta } from "@/types/usuario";

vi.mock("@/lib/api/services/usuario", () => ({ consultarCpf: vi.fn(), createUsuario: vi.fn(), listUsuarios: vi.fn() }));

import { consultarCpf, createUsuario } from "@/lib/api/services/usuario";
import { NovoUsuarioModal } from "./NovoUsuarioModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const consultar = vi.mocked(consultarCpf);
const criar = vi.mocked(createUsuario);
const handlers = { onClose: vi.fn(), onSuccess: vi.fn(), onEditarExistente: vi.fn() };

const CPF = "529.982.247-25";

const naoEncontrado: CpfConsulta = {
  encontrado: false,
  cpf: "52998224725",
  usuarioId: null,
  nome: "",
  email: "",
  celular: "",
  vinculadoNaEmpresa: false,
};

const existente: CpfConsulta = {
  ...naoEncontrado,
  encontrado: true,
  usuarioId: 26,
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  celular: "54996384949",
};

type User = ReturnType<typeof userEvent.setup>;

async function informarCpf(user: User, cpf = CPF) {
  await user.type(screen.getByLabelText("CPF"), cpf);
  await user.click(screen.getByRole("button", { name: "Continuar" }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("NovoUsuarioModal", () => {
  it("mantém Continuar desabilitado e acusa CPF inválido", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NovoUsuarioModal {...handlers} />);
    const continuar = screen.getByRole("button", { name: "Continuar" });
    expect(continuar).toBeDisabled();
    await user.type(screen.getByLabelText("CPF"), "111.111.111-11");
    await user.tab();
    expect(screen.getByText("CPF inválido")).toBeInTheDocument();
    expect(continuar).toBeDisabled();
    expect(consultar).not.toHaveBeenCalled();
  });

  it("CPF novo: pede nome, e-mail, celular e perfil e cadastra com senha temporária", async () => {
    const user = userEvent.setup();
    consultar.mockResolvedValue(naoEncontrado);
    criar.mockResolvedValue({ usuarioId: 3, novoCadastro: true });
    renderWithProviders(<NovoUsuarioModal {...handlers} />);
    await informarCpf(user);

    expect(consultar).toHaveBeenCalledWith("52998224725");
    expect(await screen.findByLabelText("Nome")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome"), "Maria Souza");
    await user.type(screen.getByLabelText("E-mail"), "maria@exemplo.com");
    await user.type(screen.getByLabelText("Celular"), "54996384949");
    await user.selectOptions(screen.getByLabelText("Perfil"), "Caixa");
    await user.click(screen.getByRole("button", { name: "Cadastrar usuário" }));

    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Usuário criado. Senha temporária enviada por e-mail."));
    expect(criar).toHaveBeenCalledWith({
      cpf: CPF,
      nome: "Maria Souza",
      email: "maria@exemplo.com",
      celular: "(54) 99638-4949",
      perfil: "4",
    });
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("valida os campos antes de enviar", async () => {
    const user = userEvent.setup();
    consultar.mockResolvedValue(naoEncontrado);
    renderWithProviders(<NovoUsuarioModal {...handlers} />);
    await informarCpf(user);
    await user.click(await screen.findByRole("button", { name: "Cadastrar usuário" }));
    expect(await screen.findByText("Informe o nome")).toBeInTheDocument();
    expect(screen.getByText("Informe o e-mail")).toBeInTheDocument();
    expect(screen.getByText("Informe o celular")).toBeInTheDocument();
    expect(screen.getByText("Selecione o perfil")).toBeInTheDocument();
    expect(criar).not.toHaveBeenCalled();
  });

  it("pessoa já cadastrada: mostra os dados só para conferência e pede apenas o perfil", async () => {
    const user = userEvent.setup();
    consultar.mockResolvedValue(existente);
    criar.mockResolvedValue({ usuarioId: 26, novoCadastro: false });
    renderWithProviders(<NovoUsuarioModal {...handlers} />);
    await informarCpf(user);

    expect(await screen.findByText("Maria Souza")).toBeInTheDocument();
    expect(screen.getByText("maria@exemplo.com")).toBeInTheDocument();
    expect(screen.getByText("(54) 99638-4949")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
    expect(screen.getByText(/receberá um e-mail avisando/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Perfil"), "Gerente");
    await user.click(screen.getByRole("button", { name: "Dar acesso" }));

    await waitFor(() =>
      expect(handlers.onSuccess).toHaveBeenCalledWith("Acesso concedido. A pessoa foi avisada por e-mail."),
    );
    expect(criar).toHaveBeenCalledWith(expect.objectContaining({ perfil: "2", nome: "Maria Souza" }));
  });

  it("CPF já vinculado à empresa: avisa, não avança e oferece editar", async () => {
    const user = userEvent.setup();
    consultar.mockResolvedValue({ ...existente, vinculadoNaEmpresa: true });
    renderWithProviders(<NovoUsuarioModal {...handlers} />);
    await informarCpf(user);

    expect(await screen.findByText("Esta pessoa já tem acesso a esta empresa.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Perfil")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Editar usuário" }));
    expect(handlers.onEditarExistente).toHaveBeenCalledWith(26);
  });

  it("trocar o CPF depois do aviso libera a consulta de novo", async () => {
    const user = userEvent.setup();
    consultar.mockResolvedValue({ ...existente, vinculadoNaEmpresa: true });
    renderWithProviders(<NovoUsuarioModal {...handlers} />);
    await informarCpf(user);
    await screen.findByText("Esta pessoa já tem acesso a esta empresa.");
    await user.clear(screen.getByLabelText("CPF"));
    expect(screen.queryByText("Esta pessoa já tem acesso a esta empresa.")).not.toBeInTheDocument();
  });

  it("Voltar mantém o CPF digitado", async () => {
    const user = userEvent.setup();
    consultar.mockResolvedValue(naoEncontrado);
    renderWithProviders(<NovoUsuarioModal {...handlers} />);
    await informarCpf(user);
    await screen.findByLabelText("Nome");
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByLabelText("CPF")).toHaveValue(CPF);
  });

  it("mostra o erro da consulta e mantém o campo editável", async () => {
    const user = userEvent.setup();
    consultar.mockRejectedValue(new ApiError("network"));
    renderWithProviders(<NovoUsuarioModal {...handlers} />);
    await informarCpf(user);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor.");
    expect(screen.getByLabelText("CPF")).toBeEnabled();
  });

  it("erro ao salvar aparece no banner e o formulário continua preenchido", async () => {
    const user = userEvent.setup();
    consultar.mockResolvedValue(existente);
    criar.mockRejectedValue(new ApiError("validation", "Perfil inválido para esta empresa.", 400));
    renderWithProviders(<NovoUsuarioModal {...handlers} />);
    await informarCpf(user);
    await user.selectOptions(await screen.findByLabelText("Perfil"), "Caixa");
    await user.click(screen.getByRole("button", { name: "Dar acesso" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Perfil inválido para esta empresa.");
    expect(screen.getByLabelText("Perfil")).toHaveValue("4");
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("não deixa enviar duas vezes enquanto salva", async () => {
    const user = userEvent.setup();
    consultar.mockResolvedValue(existente);
    criar.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<NovoUsuarioModal {...handlers} />);
    await informarCpf(user);
    await user.selectOptions(await screen.findByLabelText("Perfil"), "Caixa");
    await user.click(screen.getByRole("button", { name: "Dar acesso" }));
    expect(await screen.findByRole("button", { name: "Salvando…" })).toBeDisabled();
    expect(criar).toHaveBeenCalledTimes(1);
  });
});
