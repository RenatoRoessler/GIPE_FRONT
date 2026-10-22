import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/api/services/usuario", () => ({ alterarSenha: vi.fn() }));
vi.mock("@/lib/auth", () => ({ clearToken: vi.fn(), getToken: vi.fn() }));

import { alterarSenha } from "@/lib/api/services/usuario";
import { clearToken } from "@/lib/auth";
import { AlterarSenhaModal } from "./AlterarSenhaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const alterar = vi.mocked(alterarSenha);
const handlers = { onClose: vi.fn(), onSuccess: vi.fn() };

type User = ReturnType<typeof userEvent.setup>;

async function preencher(
  user: User,
  { atual = "antiga1", nova = "nova123", confirmacao }: { atual?: string; nova?: string; confirmacao?: string } = {},
) {
  await user.type(screen.getByLabelText("Senha atual"), atual);
  await user.type(screen.getByLabelText("Nova senha"), nova);
  await user.type(screen.getByLabelText("Confirmar nova senha"), confirmacao ?? nova);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("AlterarSenhaModal", () => {
  it("explica que a senha vale para todas as empresas e que o usuário segue logado", () => {
    renderWithProviders(<AlterarSenhaModal {...handlers} />);
    expect(screen.getByText(/vale para todas as empresas/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alterar senha" })).toBeDisabled();
  });

  it("mostra os critérios em texto e os marca ao cumprir", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AlterarSenhaModal {...handlers} />);
    await user.type(screen.getByLabelText("Senha atual"), "antiga1");
    await user.type(screen.getByLabelText("Nova senha"), "abc12");
    expect(screen.getByText("Pelo menos 6 caracteres").closest("li")).toHaveTextContent("(pendente)");
    await user.type(screen.getByLabelText("Nova senha"), "3");
    expect(screen.getByText("Pelo menos 6 caracteres").closest("li")).toHaveTextContent("(cumprida)");
    expect(screen.getByText("Diferente da senha atual").closest("li")).toHaveTextContent("(cumprida)");
  });

  it("recusa nova senha igual à atual", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AlterarSenhaModal {...handlers} />);
    await preencher(user, { atual: "mesma12", nova: "mesma12" });
    expect(screen.getByText("Diferente da senha atual").closest("li")).toHaveTextContent("(pendente)");
    expect(screen.getByRole("button", { name: "Alterar senha" })).toBeDisabled();
  });

  it("recusa confirmação diferente", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AlterarSenhaModal {...handlers} />);
    await preencher(user, { confirmacao: "outra123" });
    await user.tab();
    expect(await screen.findByText("A confirmação não confere com a nova senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alterar senha" })).toBeDisabled();
  });

  it("sucesso: avisa, fecha e não limpa o token", async () => {
    const user = userEvent.setup();
    alterar.mockResolvedValue();
    renderWithProviders(<AlterarSenhaModal {...handlers} />);
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));
    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Senha alterada."));
    expect(alterar).toHaveBeenCalledWith({ senhaAtual: "antiga1", novaSenha: "nova123" });
    expect(handlers.onClose).toHaveBeenCalled();
    expect(clearToken).not.toHaveBeenCalled();
  });

  it("senha atual incorreta (401) vira erro do campo e preserva os outros valores", async () => {
    const user = userEvent.setup();
    alterar.mockRejectedValue(new ApiError("unauthorized", undefined, 401));
    renderWithProviders(<AlterarSenhaModal {...handlers} />);
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(await screen.findByText("Senha atual incorreta.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nova senha")).toHaveValue("nova123");
    expect(screen.getByLabelText("Confirmar nova senha")).toHaveValue("nova123");
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("corrigir a senha atual limpa o erro do campo", async () => {
    const user = userEvent.setup();
    alterar.mockRejectedValue(new ApiError("unauthorized", undefined, 401));
    renderWithProviders(<AlterarSenhaModal {...handlers} />);
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));
    await screen.findByText("Senha atual incorreta.");
    await user.type(screen.getByLabelText("Senha atual"), "x");
    expect(screen.queryByText("Senha atual incorreta.")).not.toBeInTheDocument();
  });

  it("outros erros da API aparecem no banner", async () => {
    const user = userEvent.setup();
    alterar.mockRejectedValue(new ApiError("server"));
    renderWithProviders(<AlterarSenhaModal {...handlers} />);
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro no servidor");
  });
});
