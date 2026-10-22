import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";

const push = vi.fn();
const replace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => searchParams,
}));
vi.mock("@/contexts/ThemeModeContext", () => ({ useThemeMode: () => ({ mode: "light", toggleThemeMode: vi.fn() }) }));
vi.mock("@/lib/api/services/auth", () => ({ login: vi.fn() }));
vi.mock("@/lib/api/services/usuario", () => ({ alterarSenha: vi.fn() }));
vi.mock("@/lib/auth", () => ({ clearToken: vi.fn(), saveToken: vi.fn(), getToken: vi.fn() }));
vi.mock("@/lib/rememberedLogin", () => ({
  clearRememberedLogin: vi.fn(),
  loadRememberedLogin: vi.fn(),
  saveRememberedLogin: vi.fn(),
}));

import { login } from "@/lib/api/services/auth";
import { alterarSenha } from "@/lib/api/services/usuario";
import { clearToken, saveToken } from "@/lib/auth";
import { clearPasswordChange, getPasswordChange } from "@/lib/passwordChangeSession";
import { clearRememberedLogin, loadRememberedLogin, saveRememberedLogin } from "@/lib/rememberedLogin";
import { LoginForm } from "./LoginForm";
import { PrimeiroAcessoForm } from "../PrimeiroAcessoForm";

const entrar = vi.mocked(login);
const CPF = "529.982.247-25";

type User = ReturnType<typeof userEvent.setup>;

async function preencherEEnviar(user: User, { lembrar = false } = {}) {
  await user.type(screen.getByLabelText("CPF"), CPF);
  await user.type(screen.getByLabelText("Senha"), "Temp@1234");
  if (lembrar) {
    await user.click(screen.getByRole("checkbox", { name: /Lembrar senha/ }));
  }
  await user.click(screen.getByRole("button", { name: "Entrar" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
  vi.mocked(loadRememberedLogin).mockResolvedValue(null);
  vi.mocked(clearRememberedLogin).mockResolvedValue(undefined);
  vi.mocked(saveRememberedLogin).mockResolvedValue(undefined);
  clearPasswordChange();
});

describe("LoginForm: primeiro acesso", () => {
  it("troca de senha exigida: guarda o token, vai ao primeiro acesso e não cria sessão", async () => {
    const user = userEvent.setup();
    entrar.mockResolvedValue({ kind: "trocar-senha", passwordChangeToken: "troca" });
    renderWithProviders(<LoginForm />);
    await preencherEEnviar(user);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/primeiro-acesso"));
    expect(getPasswordChange()).toEqual({ token: "troca", senhaAtual: "Temp@1234" });
    expect(saveToken).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalledWith("/dashboard");
  });

  it("não aparece erro nem aviso no login", async () => {
    const user = userEvent.setup();
    entrar.mockResolvedValue({ kind: "trocar-senha", passwordChangeToken: "troca" });
    renderWithProviders(<LoginForm />);
    await preencherEEnviar(user);
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("não lembra a senha temporária, mesmo com Lembrar senha marcado, e limpa a lembrada", async () => {
    const user = userEvent.setup();
    entrar.mockResolvedValue({ kind: "trocar-senha", passwordChangeToken: "troca" });
    renderWithProviders(<LoginForm />);
    await preencherEEnviar(user, { lembrar: true });

    await waitFor(() => expect(push).toHaveBeenCalledWith("/primeiro-acesso"));
    expect(saveRememberedLogin).not.toHaveBeenCalled();
    expect(clearRememberedLogin).toHaveBeenCalled();
  });

  it("sessão: salva o token e vai ao dashboard", async () => {
    const user = userEvent.setup();
    entrar.mockResolvedValue({ kind: "sessao", token: "sessao-token" });
    renderWithProviders(<LoginForm />);
    await preencherEEnviar(user);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(saveToken).toHaveBeenCalledWith("sessao-token");
    expect(clearRememberedLogin).toHaveBeenCalled();
    expect(getPasswordChange()).toBeNull();
  });

  it("sessão com Lembrar senha marcado: salva a credencial", async () => {
    const user = userEvent.setup();
    entrar.mockResolvedValue({ kind: "sessao", token: "sessao-token" });
    renderWithProviders(<LoginForm />);
    await preencherEEnviar(user, { lembrar: true });

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(saveRememberedLogin).toHaveBeenCalledWith({ cpf: CPF, senha: "Temp@1234" });
  });

  it("credencial inválida mostra o erro e não navega", async () => {
    const user = userEvent.setup();
    entrar.mockRejectedValue(new ApiError("unauthorized", "CPF ou senha inválidos.", 401));
    renderWithProviders(<LoginForm />);
    await preencherEEnviar(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("CPF ou senha inválidos.");
    expect(push).not.toHaveBeenCalled();
    expect(saveToken).not.toHaveBeenCalled();
  });

  it("limpa o token de sessão antigo antes de entrar", async () => {
    const user = userEvent.setup();
    entrar.mockResolvedValue({ kind: "trocar-senha", passwordChangeToken: "troca" });
    renderWithProviders(<LoginForm />);
    await preencherEEnviar(user);
    await waitFor(() => expect(clearToken).toHaveBeenCalled());
  });
});

describe("fluxo completo do primeiro acesso (serviços mockados)", () => {
  it("login com troca -> tela de primeiro acesso -> troca -> login com aviso", async () => {
    const user = userEvent.setup();
    entrar.mockResolvedValue({ kind: "trocar-senha", passwordChangeToken: "troca" });
    vi.mocked(alterarSenha).mockResolvedValue();

    const login1 = renderWithProviders(<LoginForm />);
    await preencherEEnviar(user);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/primeiro-acesso"));
    login1.unmount();

    // O token guardado no login é o que a tela de primeiro acesso usa.
    renderWithProviders(<PrimeiroAcessoForm />);
    await user.type(screen.getByLabelText("Nova senha"), "Nova@1234");
    await user.type(screen.getByLabelText("Repetir senha"), "Nova@1234");
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login?senha=alterada"));
    expect(alterarSenha).toHaveBeenCalledWith(
      { senhaAtual: "Temp@1234", novaSenha: "Nova@1234" },
      { bearerToken: "troca" },
    );
    expect(getPasswordChange()).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("o login mostra o aviso de senha alterada ao chegar com ?senha=alterada", async () => {
    searchParams = new URLSearchParams("senha=alterada");
    renderWithProviders(<LoginForm />);
    expect(await screen.findByText("Senha alterada! Faça login com a nova senha.")).toBeInTheDocument();
  });
});
