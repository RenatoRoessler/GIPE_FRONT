import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeModeProvider } from "@/contexts/ThemeModeContext";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api/services/adesao", () => ({ saveAdesao: vi.fn() }));
vi.mock("@/lib/api/services/cep", () => ({ fetchAddressByCep: vi.fn().mockResolvedValue(null) }));

import { saveAdesao } from "@/lib/api/services/adesao";
import { OnboardingWizard } from "./OnboardingWizard";

type User = ReturnType<typeof userEvent.setup>;

// O Logo da tela lê o modo de tema do provider da aplicação.
const renderWizard = () =>
  renderWithProviders(
    <ThemeModeProvider>
      <OnboardingWizard />
    </ThemeModeProvider>,
  );

const meio = (nome: string) => screen.getByRole("switch", { name: nome });
const proximo = () => screen.getByRole("button", { name: /^Próximo:/ });
const criarConta = () => screen.getByRole("button", { name: /^(Criar conta|Criando conta)/ });
const titulo = (nome: string) => screen.findByRole("heading", { level: 1, name: nome });

// Os blocos recolhidos ficam ocultos: o usuário os abre antes de preencher.
async function abrirBlocos(user: User) {
  for (const nome of [/Endereço/, /Capacidade e pagamentos/]) {
    const cabecalho = screen.getByRole("button", { name: nome });
    if (cabecalho.getAttribute("aria-expanded") === "false") await user.click(cabecalho);
  }
}

async function preencherEmpresa(user: User, cnpj = "11222333000181") {
  await abrirBlocos(user);
  await user.type(screen.getByLabelText(/^CNPJ/), cnpj);
  await user.type(screen.getByLabelText(/^Razão social/), "Estacionamento Central LTDA");
  await user.type(screen.getByLabelText(/^Nome fantasia/), "Central");
  await user.selectOptions(screen.getByLabelText(/^Tipo de empresa/), "1");
  await user.type(screen.getByLabelText(/^Telefone/), "11987654321");
  await user.type(screen.getByLabelText(/^CEP/), "01310100");
  await user.type(screen.getByLabelText(/^Logradouro/), "Av. Paulista");
  await user.type(screen.getByLabelText(/^Número/), "1000");
  await user.type(screen.getByLabelText(/^Bairro/), "Bela Vista");
  await user.type(screen.getByLabelText(/^Cidade/), "São Paulo");
  await user.selectOptions(screen.getByLabelText(/^Estado/), "SP");
  await user.type(screen.getByLabelText(/^Vagas de moto/), "10");
  await user.type(screen.getByLabelText(/^Vagas de carro/), "50");
}

async function preencherUsuario(user: User, senha = "Senha@123") {
  await user.type(screen.getByLabelText(/^Nome completo/), "Ana Souza");
  await user.type(screen.getByLabelText(/^CPF/), "52998224725");
  await user.type(screen.getByLabelText(/^Celular/), "11912345678");
  await user.type(screen.getByLabelText(/^E-mail/), "ana@central.com");
  await user.type(screen.getByLabelText(/^Senha/), senha);
  await user.type(screen.getByLabelText(/^Repetir senha/), senha);
}

async function irAteHorarios(user: User) {
  await preencherEmpresa(user);
  await user.click(proximo());
  await titulo("Quando a empresa funciona?");
}

async function irAteTitular(user: User) {
  await irAteHorarios(user);
  await user.click(proximo());
  await titulo("Usuário titular");
}

async function irAteConferencia(user: User) {
  await irAteTitular(user);
  await preencherUsuario(user);
  await user.click(proximo());
  await titulo("Confira os dados");
}

// Preencher o formulário campo a campo é lento; o limite padrão ficaria perto do estouro.
vi.setConfig({ testTimeout: 30_000 });

beforeEach(() => {
  push.mockReset();
  vi.mocked(saveAdesao).mockReset().mockResolvedValue(undefined);
});

describe("OnboardingWizard: estrutura", () => {
  it("tem as quatro etapas no indicador de progresso", () => {
    renderWizard();
    const lista = screen.getByRole("list", { name: "Progresso do cadastro" });
    for (const etapa of ["Empresa", "Horários", "Titular", "Conferir"]) {
      expect(within(lista).getByText(etapa)).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { level: 1, name: "Dados da empresa" })).toBeInTheDocument();
  });

  it("divide a etapa da empresa em blocos e abre só o primeiro", () => {
    renderWizard();
    expect(screen.getByRole("button", { name: /Identificação/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Endereço/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: /Capacidade e pagamentos/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("mostra o bloco de pagamentos com só Dinheiro ligado", async () => {
    const user = userEvent.setup();
    renderWizard();
    await abrirBlocos(user);
    expect(screen.getByRole("group", { name: "Meios de pagamento aceitos" })).toBeInTheDocument();
    expect(meio("Dinheiro")).toBeChecked();
    expect(meio("Pix")).not.toBeChecked();
  });

  it("a credencial acompanha o que é digitado", async () => {
    const user = userEvent.setup();
    renderWizard();
    // A credencial completa só aparece a partir de `md`; sem layout no teste, é consultada oculta.
    const credencial = screen.getByRole("region", { name: "Resumo da credencial", hidden: true });
    expect(within(credencial).getByText("— CARROS")).toBeInTheDocument();

    await abrirBlocos(user);
    await user.type(screen.getByLabelText(/^Nome fantasia/), "Central");
    await user.type(screen.getByLabelText(/^Vagas de carro/), "50");

    expect(within(credencial).getByText("Central")).toBeInTheDocument();
    expect(within(credencial).getByText("50 CARROS")).toBeInTheDocument();
  });
});

describe("OnboardingWizard: validação", () => {
  it("não avança com tudo vazio, conta os campos e foca o primeiro inválido", async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(proximo());

    expect(await screen.findByRole("alert")).toHaveTextContent(/Faltam \d+ campos para corrigir/);
    expect(screen.getByRole("heading", { level: 1, name: "Dados da empresa" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/^CNPJ/)).toHaveFocus());
    // Os blocos com erro abrem sozinhos.
    expect(screen.getByRole("button", { name: /Endereço/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("não avança com todos os meios desligados e mostra a mensagem", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user);
    await user.click(meio("Dinheiro"));
    expect(await screen.findByText("Selecione ao menos um meio de pagamento")).toBeInTheDocument();

    await user.click(proximo());
    expect(screen.getByRole("heading", { level: 1, name: "Dados da empresa" })).toBeInTheDocument();
    await waitFor(() => expect(meio("Dinheiro")).toHaveFocus());
  });

  it("não avança com os pagamentos válidos se os dados da empresa são inválidos", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user, "11111111111111");
    await user.click(proximo());

    expect(await screen.findByText("CNPJ inválido")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Dados da empresa" })).toBeInTheDocument();
  });

  it("o botão Continuar de um bloco só recolhe quando o bloco está certo", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("button", { name: /Identificação/ })).toHaveAttribute("aria-expanded", "true");

    await user.type(screen.getByLabelText(/^CNPJ/), "11222333000181");
    await user.type(screen.getByLabelText(/^Razão social/), "Central LTDA");
    await user.type(screen.getByLabelText(/^Nome fantasia/), "Central");
    await user.selectOptions(screen.getByLabelText(/^Tipo de empresa/), "1");
    await user.type(screen.getByLabelText(/^Telefone/), "11987654321");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Identificação/ })).toHaveAttribute("aria-expanded", "false"),
    );
    expect(screen.getByRole("button", { name: /Endereço/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("não conclui com uma senha fraca e diz o que falta", async () => {
    const user = userEvent.setup();
    renderWizard();
    await irAteTitular(user);
    await preencherUsuario(user, "123456");
    await user.click(proximo());

    expect(await screen.findByText(/Falta: .*uma letra maiúscula/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Usuário titular" })).toBeInTheDocument();
    expect(saveAdesao).not.toHaveBeenCalled();
  });

  it("na etapa do titular mostra o checklist de senha", async () => {
    const user = userEvent.setup();
    renderWizard();
    await irAteTitular(user);

    expect(screen.getByText("A senha precisa ter:")).toBeInTheDocument();
    expect(screen.getAllByText("(pendente)")).toHaveLength(5);
    await user.type(screen.getByLabelText(/^Senha/), "Senha@123");
    expect(screen.getAllByText("(cumprida)")).toHaveLength(5);
  });
});

describe("OnboardingWizard: navegação", () => {
  it("voltar não perde o que foi preenchido", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user);
    await user.click(meio("Pix"));
    await user.click(proximo());
    await titulo("Quando a empresa funciona?");
    await user.click(screen.getByRole("button", { name: "Voltar" }));

    await titulo("Dados da empresa");
    expect(screen.getByLabelText(/^CNPJ/)).toHaveValue("11.222.333/0001-81");
    expect(meio("Dinheiro")).toBeChecked();
    expect(meio("Pix")).toBeChecked();
  });

  it("etapas concluídas do indicador voltam para a etapa", async () => {
    const user = userEvent.setup();
    renderWizard();
    await irAteTitular(user);

    await user.click(screen.getByRole("button", { name: "Voltar para Empresa" }));
    await titulo("Dados da empresa");
    expect(screen.getByLabelText(/^Nome fantasia/)).toHaveValue("Central");
  });

  it("os atalhos de horário preenchem os 7 dias", async () => {
    const user = userEvent.setup();
    renderWizard();
    await irAteHorarios(user);

    await user.click(screen.getByRole("button", { name: "Todos os dias" }));
    expect(screen.getByRole("button", { name: "Todos os dias" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Abertura de Domingo")).toHaveValue("08:00");
  });

  it("Editar na conferência volta direto para a conferência depois de corrigir", async () => {
    const user = userEvent.setup();
    renderWizard();
    await irAteConferencia(user);

    await user.click(screen.getByRole("button", { name: "Editar Titular" }));
    await titulo("Usuário titular");

    await user.click(screen.getByRole("button", { name: "Voltar para a conferência" }));
    await titulo("Confira os dados");
  });

  it("a conferência mostra os dados e nunca a senha", async () => {
    const user = userEvent.setup();
    renderWizard();
    await irAteConferencia(user);

    expect(screen.getByText("Estacionamento Central LTDA")).toBeInTheDocument();
    expect(screen.getByText("••••••••")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("Senha@123");
  });
});

describe("OnboardingWizard: envio", () => {
  it("envia os dados escolhidos e vai para o login", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user);
    await user.click(meio("Pix"));
    await user.click(meio("Cartão de débito"));
    await user.click(proximo());
    await titulo("Quando a empresa funciona?");
    await user.click(proximo());
    await titulo("Usuário titular");
    await preencherUsuario(user);
    await user.click(proximo());
    await titulo("Confira os dados");
    await user.click(criarConta());

    await waitFor(() => expect(saveAdesao).toHaveBeenCalledTimes(1));
    expect(vi.mocked(saveAdesao).mock.calls[0][0].payments).toEqual({
      dinheiro: true,
      pix: true,
      cartaoCredito: false,
      cartaoDebito: true,
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login?cadastro=sucesso"));
  });

  it("não envia duas vezes: o botão fica desabilitado e indica o progresso", async () => {
    const user = userEvent.setup();
    vi.mocked(saveAdesao).mockReturnValue(new Promise(() => {}));
    renderWizard();
    await irAteConferencia(user);

    await user.click(criarConta());
    const botao = await screen.findByRole("button", { name: "Criando conta…" });
    expect(botao).toBeDisabled();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeDisabled();
    expect(saveAdesao).toHaveBeenCalledTimes(1);
  });

  it("CNPJ já cadastrado leva de volta ao campo, mantendo o preenchimento", async () => {
    const user = userEvent.setup();
    vi.mocked(saveAdesao).mockRejectedValue(new ApiError("validation", "CNPJ já cadastrado.", 400));
    renderWizard();
    await irAteConferencia(user);
    await user.click(criarConta());

    expect(await screen.findByRole("alert")).toHaveTextContent("CNPJ já cadastrado.");
    await user.click(screen.getByRole("button", { name: "Corrigir CNPJ" }));

    await titulo("Dados da empresa");
    await waitFor(() => expect(screen.getByLabelText(/^CNPJ/)).toHaveFocus());
    expect(screen.getByLabelText(/^CNPJ/)).toHaveValue("11.222.333/0001-81");
    expect(screen.getByLabelText(/^Razão social/)).toHaveValue("Estacionamento Central LTDA");
  });

  it("falha de rede mostra a mensagem e permite tentar de novo sem perder nada", async () => {
    const user = userEvent.setup();
    vi.mocked(saveAdesao).mockRejectedValueOnce(new ApiError("network"));
    renderWizard();
    await irAteConferencia(user);
    await user.click(criarConta());

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor.");
    expect(screen.queryByRole("button", { name: /^Corrigir/ })).not.toBeInTheDocument();

    await user.click(criarConta());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login?cadastro=sucesso"));
    expect(saveAdesao).toHaveBeenCalledTimes(2);
  });
});
