import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/contexts/ThemeModeContext", () => ({ useThemeMode: () => ({ mode: "light", toggleThemeMode: vi.fn() }) }));
vi.mock("@/lib/api/services/auth", () => ({ trocarSenhaPrimeiroAcesso: vi.fn() }));
vi.mock("@/lib/rememberedLogin", () => ({ clearRememberedLogin: vi.fn().mockResolvedValue(undefined) }));

import { trocarSenhaPrimeiroAcesso } from "@/lib/api/services/auth";
import { clearPasswordChange, getPasswordChange, setPasswordChange } from "@/lib/passwordChangeSession";
import { clearRememberedLogin } from "@/lib/rememberedLogin";
import { PrimeiroAcessoForm } from "./PrimeiroAcessoForm";

const trocar = vi.mocked(trocarSenhaPrimeiroAcesso);
const SENHA = "Nova@1234";
const TEMPORARIA = "Temp@1234";

type User = ReturnType<typeof userEvent.setup>;

async function preencher(user: User, senha = SENHA, confirmacao = senha) {
  await user.type(screen.getByLabelText("Nova senha"), senha);
  await user.type(screen.getByLabelText("Repetir senha"), confirmacao);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(clearRememberedLogin).mockResolvedValue(undefined);
  clearPasswordChange();
});

describe("PrimeiroAcessoForm: sem token", () => {
  it("não mostra o formulário e leva ao login", async () => {
    renderWithProviders(<PrimeiroAcessoForm />);
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});

describe("PrimeiroAcessoForm: com token", () => {
  beforeEach(() => {
    setPasswordChange({ token: "token-de-troca", senhaAtual: TEMPORARIA });
  });

  it("mostra o formulário, o checklist e o botão desabilitado", () => {
    renderWithProviders(<PrimeiroAcessoForm />);
    expect(screen.getByRole("heading", { name: "Crie sua senha" })).toBeInTheDocument();
    expect(screen.getByText(/primeiro acesso/i)).toBeInTheDocument();
    expect(screen.getByText("Pelo menos 8 caracteres")).toBeInTheDocument();
    expect(screen.getByText(/volta ao login e entra com a nova senha/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar nova senha" })).toBeDisabled();
    expect(screen.getByLabelText("Nova senha")).toHaveFocus();
    expect(replace).not.toHaveBeenCalled();
  });

  it("mantém o botão desabilitado com senha fraca e com confirmação diferente", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrimeiroAcessoForm />);
    await preencher(user, "fraca");
    expect(screen.getByRole("button", { name: "Salvar nova senha" })).toBeDisabled();
    await user.clear(screen.getByLabelText("Nova senha"));
    await user.clear(screen.getByLabelText("Repetir senha"));
    await preencher(user, SENHA, "Outra@1234");
    expect(screen.getByRole("button", { name: "Salvar nova senha" })).toBeDisabled();
    expect(trocar).not.toHaveBeenCalled();
  });

  it("sucesso: limpa o token e a senha lembrada e vai ao login com o aviso", async () => {
    const user = userEvent.setup();
    trocar.mockResolvedValue();
    renderWithProviders(<PrimeiroAcessoForm />);
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login?senha=alterada"));
    expect(trocar).toHaveBeenCalledWith({ passwordChangeToken: "token-de-troca", novaSenha: SENHA });
    expect(clearRememberedLogin).toHaveBeenCalled();
    expect(getPasswordChange()).toBeNull();
    // Concluir não pode mandar ao login por outro caminho.
    expect(replace).not.toHaveBeenCalled();
  });

  it("mostra Salvando… e trava os campos durante o envio", async () => {
    const user = userEvent.setup();
    trocar.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<PrimeiroAcessoForm />);
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(await screen.findByRole("button", { name: "Salvando..." })).toBeDisabled();
    expect(screen.getByLabelText("Nova senha")).toBeDisabled();
    expect(trocar).toHaveBeenCalledTimes(1);
  });

  it.each([["unauthorized", 401], ["forbidden", 403], ["not_found", 404]] as const)(
    "token recusado (%s): mostra o prazo expirado, limpa o token e não volta sozinho ao login",
    async (kind, status) => {
      const user = userEvent.setup();
      trocar.mockRejectedValue(new ApiError(kind, undefined, status));
      renderWithProviders(<PrimeiroAcessoForm />);
      await preencher(user);
      await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));

      expect(await screen.findByText("Não foi possível trocar a senha")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent("O tempo para criar sua senha acabou");
      expect(screen.getByRole("link", { name: "Ir para o login" })).toHaveAttribute("href", "/login");
      expect(getPasswordChange()).toBeNull();
      expect(replace).not.toHaveBeenCalled();
    },
  );

  it("erro de regra da senha fica no formulário com os valores preservados", async () => {
    const user = userEvent.setup();
    trocar.mockRejectedValue(new ApiError("validation", "A nova senha não pode ser igual à anterior.", 400));
    renderWithProviders(<PrimeiroAcessoForm />);
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A nova senha não pode ser igual à anterior.");
    expect(screen.getByLabelText("Nova senha")).toHaveValue(SENHA);
    expect(screen.getByLabelText("Repetir senha")).toHaveValue(SENHA);
    expect(screen.getByRole("button", { name: "Salvar nova senha" })).toBeEnabled();
    expect(getPasswordChange()?.token).toBe("token-de-troca");
  });

  it("erro de rede também fica no formulário", async () => {
    const user = userEvent.setup();
    trocar.mockRejectedValue(new ApiError("network"));
    renderWithProviders(<PrimeiroAcessoForm />);
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor.");
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
  });

  it("o token de troca e a senha temporária nunca aparecem na tela", () => {
    renderWithProviders(<PrimeiroAcessoForm />);
    expect(document.body.innerHTML).not.toContain("token-de-troca");
    expect(document.body.innerHTML).not.toContain(TEMPORARIA);
  });

  it("recusa nova senha igual à temporária sem chamar a API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrimeiroAcessoForm />);
    await preencher(user, TEMPORARIA);
    expect(screen.getByRole("alert")).toHaveTextContent("diferente da senha temporária");
    expect(screen.getByRole("button", { name: "Salvar nova senha" })).toBeDisabled();
    expect(trocar).not.toHaveBeenCalled();
  });

  it("perder o token depois de aberto (ex.: outra aba limpa) leva ao login", async () => {
    renderWithProviders(<PrimeiroAcessoForm />);
    act(() => clearPasswordChange());
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
