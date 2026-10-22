import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Usuario } from "@/types/usuario";

vi.mock("@/lib/api/services/usuario", () => ({ listUsuarios: vi.fn(), updatePerfil: vi.fn(), updateAtivo: vi.fn() }));
vi.mock("@/contexts/CurrentUserContext", () => ({
  useCurrentUser: () => ({ user: { id: "x", name: "Renato", email: "renato@exemplo.com", perfil: 1 }, isLoading: false }),
}));

import { listUsuarios, updateAtivo, updatePerfil } from "@/lib/api/services/usuario";
import { EditarUsuarioModal } from "./EditarUsuarioModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const listar = vi.mocked(listUsuarios);
const mudarPerfil = vi.mocked(updatePerfil);
const mudarAtivo = vi.mocked(updateAtivo);
const handlers = { onClose: vi.fn(), onSuccess: vi.fn() };

function usuario(over: Partial<Usuario>): Usuario {
  return {
    usuarioId: 2,
    cpf: "52998224725",
    nome: "Maria Souza",
    email: "maria@exemplo.com",
    celular: "54996384949",
    perfil: 4,
    perfilDescricao: "Caixa",
    ativo: true,
    trocarSenha: false,
    dataCriacao: "2026-10-08T16:54:36.990448",
    ...over,
  };
}

const admin = usuario({ usuarioId: 1, nome: "Renato", email: "renato@exemplo.com", perfil: 1, perfilDescricao: "Administrador" });
const maria = usuario({});

beforeEach(() => {
  vi.resetAllMocks();
  listar.mockResolvedValue([admin, maria]);
  mudarPerfil.mockResolvedValue();
  mudarAtivo.mockResolvedValue();
});

describe("EditarUsuarioModal", () => {
  it("começa sem alterações e com Salvar desabilitado", async () => {
    renderWithProviders(<EditarUsuarioModal usuario={maria} {...handlers} />);
    expect(screen.getByText("529.982.247-25")).toBeInTheDocument();
    expect(screen.getByLabelText("Perfil")).toHaveValue("4");
    expect(screen.getByRole("switch", { name: "Acesso ativo nesta empresa" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(screen.getByText(/valem a partir do próximo login/)).toBeInTheDocument();
  });

  it("só o perfil mudou: chama apenas a rota de perfil", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditarUsuarioModal usuario={maria} {...handlers} />);
    await user.selectOptions(screen.getByLabelText("Perfil"), "Gerente");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Usuário atualizado."));
    expect(mudarPerfil).toHaveBeenCalledWith(2, 2);
    expect(mudarAtivo).not.toHaveBeenCalled();
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("inativar pede confirmação; cancelar não chama a API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditarUsuarioModal usuario={maria} {...handlers} />);
    await user.click(screen.getByRole("switch", { name: "Acesso ativo nesta empresa" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Tirar o acesso de Maria Souza?")).toBeInTheDocument();
    const dialogo = screen.getByText("Tirar o acesso de Maria Souza?").closest("dialog") as HTMLElement;
    await user.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(mudarAtivo).not.toHaveBeenCalled();
  });

  it("inativar confirmado chama só a rota de acesso", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditarUsuarioModal usuario={maria} {...handlers} />);
    await user.click(screen.getByRole("switch", { name: "Acesso ativo nesta empresa" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await user.click(await screen.findByRole("button", { name: "Tirar acesso" }));
    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalled());
    expect(mudarAtivo).toHaveBeenCalledWith(2, false);
    expect(mudarPerfil).not.toHaveBeenCalled();
  });

  it("rebaixar um Administrador pede confirmação própria", async () => {
    const user = userEvent.setup();
    const outroAdmin = usuario({ usuarioId: 3, nome: "Carlos", email: "carlos@exemplo.com", perfil: 1 });
    listar.mockResolvedValue([admin, outroAdmin]);
    renderWithProviders(<EditarUsuarioModal usuario={outroAdmin} {...handlers} />);
    await user.selectOptions(screen.getByLabelText("Perfil"), "Caixa");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Remover perfil de Administrador?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Alterar perfil" }));
    await waitFor(() => expect(mudarPerfil).toHaveBeenCalledWith(3, 4));
  });

  it("perfil e acesso juntos: duas confirmações em sequência e duas chamadas", async () => {
    const user = userEvent.setup();
    const outroAdmin = usuario({ usuarioId: 3, nome: "Carlos", email: "carlos@exemplo.com", perfil: 1 });
    listar.mockResolvedValue([admin, outroAdmin]);
    renderWithProviders(<EditarUsuarioModal usuario={outroAdmin} {...handlers} />);
    await user.selectOptions(screen.getByLabelText("Perfil"), "Caixa");
    await user.click(screen.getByRole("switch", { name: "Acesso ativo nesta empresa" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await user.click(await screen.findByRole("button", { name: "Tirar acesso" }));
    await user.click(await screen.findByRole("button", { name: "Alterar perfil" }));
    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalled());
    expect(mudarPerfil).toHaveBeenCalledWith(3, 4);
    expect(mudarAtivo).toHaveBeenCalledWith(3, false);
  });

  it("último Administrador ativo: controles desabilitados com a explicação", async () => {
    renderWithProviders(<EditarUsuarioModal usuario={admin} {...handlers} />);
    expect(await screen.findByText(/única pessoa com perfil de Administrador ativo/)).toBeInTheDocument();
    expect(screen.getByLabelText("Perfil")).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Acesso ativo nesta empresa" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("avisa quando a pessoa edita o próprio acesso", async () => {
    const outroAdmin = usuario({ usuarioId: 3, nome: "Carlos", email: "carlos@exemplo.com", perfil: 1 });
    listar.mockResolvedValue([admin, outroAdmin]);
    renderWithProviders(<EditarUsuarioModal usuario={admin} {...handlers} />);
    expect(await screen.findByText("Você está editando o seu próprio acesso.")).toBeInTheDocument();
  });

  it("erro da API aparece no banner e o modal continua aberto", async () => {
    const user = userEvent.setup();
    mudarPerfil.mockRejectedValue(new ApiError("validation", "A empresa precisa de um Administrador ativo.", 400));
    renderWithProviders(<EditarUsuarioModal usuario={maria} {...handlers} />);
    await user.selectOptions(screen.getByLabelText("Perfil"), "Gerente");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível alterar o perfil. A empresa precisa de um Administrador ativo.",
    );
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("falha parcial: o que foi aplicado permanece e só o que falhou é reenviado", async () => {
    const user = userEvent.setup();
    mudarAtivo.mockRejectedValueOnce(new ApiError("server"));
    renderWithProviders(<EditarUsuarioModal usuario={maria} {...handlers} />);
    await user.selectOptions(screen.getByLabelText("Perfil"), "Gerente");
    await user.click(screen.getByRole("switch", { name: "Acesso ativo nesta empresa" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await user.click(await screen.findByRole("button", { name: "Tirar acesso" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível alterar o acesso.");
    expect(mudarPerfil).toHaveBeenCalledTimes(1);

    mudarAtivo.mockResolvedValue();
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await user.click(await screen.findByRole("button", { name: "Tirar acesso" }));
    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalled());
    expect(mudarPerfil).toHaveBeenCalledTimes(1);
    expect(mudarAtivo).toHaveBeenCalledTimes(2);
  });

  it("perfil fora do enum aparece como opção desabilitada", () => {
    renderWithProviders(<EditarUsuarioModal usuario={usuario({ perfil: 9, perfilDescricao: "Auditor" })} {...handlers} />);
    expect(screen.getByRole("option", { name: "Auditor" })).toBeDisabled();
    expect(screen.getByLabelText("Perfil")).toHaveValue("9");
  });
});
