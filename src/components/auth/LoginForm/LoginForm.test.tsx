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
vi.mock("@/lib/api/services/auth", () => ({ login: vi.fn(), selecionarEmpresa: vi.fn(), trocarSenhaPrimeiroAcesso: vi.fn() }));
vi.mock("@/lib/auth", () => ({ clearToken: vi.fn(), saveToken: vi.fn(), getToken: vi.fn() }));
vi.mock("@/lib/rememberedLogin", () => ({
  clearRememberedLogin: vi.fn(),
  loadRememberedLogin: vi.fn(),
  saveRememberedLogin: vi.fn(),
}));

import { login, selecionarEmpresa, trocarSenhaPrimeiroAcesso } from "@/lib/api/services/auth";
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
    vi.mocked(trocarSenhaPrimeiroAcesso).mockResolvedValue();

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
    expect(trocarSenhaPrimeiroAcesso).toHaveBeenCalledWith({ passwordChangeToken: "troca", novaSenha: "Nova@1234" });
    expect(getPasswordChange()).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it("o login mostra o aviso de senha alterada ao chegar com ?senha=alterada", async () => {
    searchParams = new URLSearchParams("senha=alterada");
    renderWithProviders(<LoginForm />);
    expect(await screen.findByText("Senha alterada! Faça login com a nova senha.")).toBeInTheDocument();
  });
});

describe("LoginForm: usuário com mais de uma empresa", () => {
  const escolha = {
    kind: "escolher-empresa" as const,
    preAuthToken: "pre",
    empresas: [
      { id: "guid-a", nome: "Central", cnpj: "11222333000181" },
      { id: "guid-b", nome: "Filial Norte", cnpj: "22333444000155" },
    ],
  };
  const selecionar = vi.mocked(selecionarEmpresa);

  async function ateAEscolha(user: User, opcoes?: { lembrar?: boolean }) {
    entrar.mockResolvedValue(escolha);
    renderWithProviders(<LoginForm />);
    await preencherEEnviar(user, opcoes);
    await screen.findByRole("heading", { name: "Escolha a empresa" });
  }

  it("mostra a lista de empresas no lugar do formulário, sem criar sessão", async () => {
    const user = userEvent.setup();
    await ateAEscolha(user);

    expect(screen.getByRole("button", { name: /Entrar em Central/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar em Filial Norte/ })).toBeInTheDocument();
    expect(screen.queryByLabelText("CPF")).not.toBeInTheDocument();
    expect(saveToken).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("escolher a empresa envia o token de pré-autenticação e o guid, salva a sessão e vai ao dashboard", async () => {
    const user = userEvent.setup();
    selecionar.mockResolvedValue("token-da-empresa");
    await ateAEscolha(user);

    await user.click(screen.getByRole("button", { name: /Entrar em Filial Norte/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(selecionar).toHaveBeenCalledWith({ preAuthToken: "pre", empresaGuid: "guid-b" });
    expect(saveToken).toHaveBeenCalledWith("token-da-empresa");
    expect(clearRememberedLogin).toHaveBeenCalled();
  });

  it("com Lembrar senha marcado, a credencial só é salva depois de escolher a empresa", async () => {
    const user = userEvent.setup();
    selecionar.mockResolvedValue("token-da-empresa");
    await ateAEscolha(user, { lembrar: true });
    expect(saveRememberedLogin).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Entrar em Central/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(saveRememberedLogin).toHaveBeenCalledWith({ cpf: CPF, senha: "Temp@1234" });
  });

  it("enquanto entra, a empresa mostra 'Entrando…' e a lista fica desabilitada", async () => {
    const user = userEvent.setup();
    selecionar.mockReturnValue(new Promise(() => {}));
    await ateAEscolha(user);

    await user.click(screen.getByRole("button", { name: /Entrar em Central/ }));

    expect(await screen.findByText("Entrando…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar em Filial Norte/ })).toBeDisabled();
  });

  it("erro ao escolher mostra a mensagem e deixa tentar de novo", async () => {
    const user = userEvent.setup();
    selecionar.mockRejectedValueOnce(new ApiError("network"));
    await ateAEscolha(user);

    await user.click(screen.getByRole("button", { name: /Entrar em Central/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor.");
    expect(screen.getByRole("button", { name: /Entrar em Central/ })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();

    selecionar.mockResolvedValue("token-da-empresa");
    await user.click(screen.getByRole("button", { name: /Entrar em Central/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
  });

  it("escolha expirada mostra a mensagem e só oferece voltar ao login", async () => {
    const user = userEvent.setup();
    selecionar.mockRejectedValue(new ApiError("unauthorized", "Sua escolha expirou. Entre novamente.", 401));
    await ateAEscolha(user);

    await user.click(screen.getByRole("button", { name: /Entrar em Central/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sua escolha expirou. Entre novamente.");
    expect(screen.queryByRole("button", { name: /Entrar em/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Voltar ao login" }));
    expect(await screen.findByLabelText("CPF")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Voltar descarta a etapa e mostra o login de novo, com o CPF que já estava digitado", async () => {
    const user = userEvent.setup();
    await ateAEscolha(user);

    await user.click(screen.getByRole("link", { name: "Voltar" }));

    expect(await screen.findByLabelText("CPF")).toHaveValue(CPF);
    expect(screen.queryByRole("heading", { name: "Escolha a empresa" })).not.toBeInTheDocument();
    expect(selecionar).not.toHaveBeenCalled();
  });

  it("o token de pré-autenticação não é guardado fora do componente", async () => {
    const user = userEvent.setup();
    await ateAEscolha(user);

    expect(getPasswordChange()).toBeNull();
    expect(saveToken).not.toHaveBeenCalled();
    expect(saveRememberedLogin).not.toHaveBeenCalled();
  });

  it("uma só empresa continua entrando direto, sem a etapa de escolha", async () => {
    const user = userEvent.setup();
    entrar.mockResolvedValue({ kind: "sessao", token: "sessao-token" });
    renderWithProviders(<LoginForm />);
    await preencherEEnviar(user);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByRole("heading", { name: "Escolha a empresa" })).not.toBeInTheDocument();
    expect(selecionar).not.toHaveBeenCalled();
  });

  it("depois de trocar a senha do primeiro acesso, o login seguinte cai na escolha de empresa (RF10)", async () => {
    const user = userEvent.setup();
    entrar.mockResolvedValueOnce({ kind: "trocar-senha", passwordChangeToken: "troca" });
    const primeiro = renderWithProviders(<LoginForm />);
    await preencherEEnviar(user);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/primeiro-acesso"));
    primeiro.unmount();
    vi.mocked(trocarSenhaPrimeiroAcesso).mockResolvedValue();
    const troca = renderWithProviders(<PrimeiroAcessoForm />);
    await user.type(screen.getByLabelText("Nova senha"), "Nova@1234");
    await user.type(screen.getByLabelText("Repetir senha"), "Nova@1234");
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login?senha=alterada"));
    expect(saveToken).not.toHaveBeenCalled();
    troca.unmount();

    // Segundo login, já com a senha nova e duas empresas: cai na escolha.
    entrar.mockResolvedValue(escolha);
    renderWithProviders(<LoginForm />);
    await preencherEEnviar(user);
    expect(await screen.findByRole("heading", { name: "Escolha a empresa" })).toBeInTheDocument();
  });
});
