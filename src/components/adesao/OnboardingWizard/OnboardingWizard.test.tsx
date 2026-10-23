import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeModeProvider } from "@/contexts/ThemeModeContext";
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
const proximo = () => screen.getByRole("button", { name: "Próximo" });

async function preencherEmpresa(user: User, cnpj = "11222333000181") {
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

async function preencherUsuario(user: User) {
  await user.type(screen.getByLabelText(/^Nome completo/), "Ana Souza");
  await user.type(screen.getByLabelText(/^CPF/), "52998224725");
  await user.type(screen.getByLabelText(/^Celular/), "11912345678");
  await user.type(screen.getByLabelText(/^E-mail/), "ana@central.com");
  await user.type(screen.getByLabelText(/^Senha/), "Senha@123");
  await user.type(screen.getByLabelText(/^Repetir senha/), "Senha@123");
}

// Preencher o formulário campo a campo é lento; o limite padrão ficaria perto do estouro.
vi.setConfig({ testTimeout: 20_000 });

beforeEach(() => {
  push.mockReset();
  vi.mocked(saveAdesao).mockReset().mockResolvedValue(undefined);
});

describe("OnboardingWizard: pagamentos na etapa 1", () => {
  it("mostra o bloco de pagamentos na etapa de dados da empresa, com só Dinheiro ligado", () => {
    renderWizard();
    expect(screen.getByRole("group", { name: "Meios de pagamento aceitos" })).toBeInTheDocument();
    expect(meio("Dinheiro")).toBeChecked();
    expect(meio("Pix")).not.toBeChecked();
    expect(meio("Cartão de crédito")).not.toBeChecked();
    expect(meio("Cartão de débito")).not.toBeChecked();
  });

  it("continua com as três etapas do Stepper", () => {
    renderWizard();
    expect(screen.getByText("Dados da empresa")).toBeInTheDocument();
    expect(screen.getByText("Funcionamento")).toBeInTheDocument();
    expect(screen.getByText("Usuário titular")).toBeInTheDocument();
  });

  it("não avança com todos os meios desligados e mostra a mensagem", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user);
    await user.click(meio("Dinheiro"));
    expect(await screen.findByText("Selecione ao menos um meio de pagamento")).toBeInTheDocument();

    await user.click(proximo());
    expect(screen.getByText("Conte para a gente sobre a sua empresa.")).toBeInTheDocument();
    expect(screen.queryByText("Quando a empresa funciona?")).not.toBeInTheDocument();
    await waitFor(() => expect(meio("Dinheiro")).toHaveFocus());
  });

  it("não avança com os pagamentos válidos se os dados da empresa são inválidos", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user, "11111111111111");
    await user.click(proximo());

    expect(await screen.findByText("CNPJ inválido")).toBeInTheDocument();
    expect(screen.queryByText("Quando a empresa funciona?")).not.toBeInTheDocument();
    expect(screen.getByText("Conte para a gente sobre a sua empresa.")).toBeInTheDocument();
  });

  it("avança com ao menos um meio ligado", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user);
    await user.click(proximo());
    expect(await screen.findByText("Quando a empresa funciona?")).toBeInTheDocument();
  });

  it("guarda os meios escolhidos ao voltar para a etapa 1", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user);
    await user.click(meio("Pix"));
    await user.click(proximo());
    await screen.findByText("Quando a empresa funciona?");
    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(await screen.findByText("Conte para a gente sobre a sua empresa.")).toBeInTheDocument();
    expect(meio("Dinheiro")).toBeChecked();
    expect(meio("Pix")).toBeChecked();
  });

  it("envia os meios escolhidos ao concluir a adesão", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user);
    await user.click(meio("Pix"));
    await user.click(meio("Cartão de débito"));
    await user.click(proximo());
    await screen.findByText("Quando a empresa funciona?");
    await user.click(proximo());
    await screen.findByText("Agora crie o usuário titular da conta.");
    await preencherUsuario(user);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(saveAdesao).toHaveBeenCalledTimes(1));
    expect(vi.mocked(saveAdesao).mock.calls[0][0].payments).toEqual({
      dinheiro: true,
      pix: true,
      cartaoCredito: false,
      cartaoDebito: true,
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login?cadastro=sucesso"));
  });

  it("na etapa do titular mostra o checklist de senha e marca o que já foi cumprido", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user);
    await user.click(proximo());
    await screen.findByText("Quando a empresa funciona?");
    await user.click(proximo());
    await screen.findByText("Agora crie o usuário titular da conta.");

    expect(screen.getByText("A senha precisa ter:")).toBeInTheDocument();
    expect(screen.getByText("Pelo menos 8 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Um símbolo (ex.: @, #, !)")).toBeInTheDocument();

    expect(screen.getAllByText("(pendente)")).toHaveLength(5);

    await user.type(screen.getByLabelText(/^Senha/), "Senha@123");

    expect(screen.getAllByText("(cumprida)")).toHaveLength(5);
    expect(screen.queryByText("(pendente)")).not.toBeInTheDocument();
  });

  it("não conclui com uma senha fraca e diz o que falta", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user);
    await user.click(proximo());
    await screen.findByText("Quando a empresa funciona?");
    await user.click(proximo());
    await screen.findByText("Agora crie o usuário titular da conta.");
    await user.type(screen.getByLabelText(/^Nome completo/), "Ana Souza");
    await user.type(screen.getByLabelText(/^CPF/), "52998224725");
    await user.type(screen.getByLabelText(/^Celular/), "11912345678");
    await user.type(screen.getByLabelText(/^E-mail/), "ana@central.com");
    await user.type(screen.getByLabelText(/^Senha/), "123456");
    await user.type(screen.getByLabelText(/^Repetir senha/), "123456");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText(/Falta: .*uma letra maiúscula/)).toBeInTheDocument();
    expect(saveAdesao).not.toHaveBeenCalled();
  });

  it("sem mexer no bloco, a adesão envia o padrão: só dinheiro", async () => {
    const user = userEvent.setup();
    renderWizard();
    await preencherEmpresa(user);
    await user.click(proximo());
    await screen.findByText("Quando a empresa funciona?");
    await user.click(proximo());
    await screen.findByText("Agora crie o usuário titular da conta.");
    await preencherUsuario(user);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(saveAdesao).toHaveBeenCalledTimes(1));
    expect(vi.mocked(saveAdesao).mock.calls[0][0].payments).toEqual({
      dinheiro: true,
      pix: false,
      cartaoCredito: false,
      cartaoDebito: false,
    });
  });
});
