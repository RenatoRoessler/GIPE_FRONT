import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/hooks/useLogout", () => ({ useLogout: () => vi.fn() }));
vi.mock("@/lib/api/services/empresa", () => ({ addEmpresa: vi.fn() }));
vi.mock("@/lib/api/services/cep", () => ({ fetchAddressByCep: vi.fn().mockResolvedValue(null) }));

import { addEmpresa } from "@/lib/api/services/empresa";
import { NovaEmpresa } from "./NovaEmpresa";

type User = ReturnType<typeof userEvent.setup>;

// jsdom não implementa <dialog> (o ConfirmDialog usa o Modal).
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

// Preencher o formulário campo a campo é lento; o limite padrão ficaria perto do estouro.
vi.setConfig({ testTimeout: 30_000 });

beforeEach(() => {
  push.mockReset();
  vi.mocked(addEmpresa).mockReset();
});

async function preencher(user: User, cnpj = "11222333000181") {
  await user.type(screen.getByLabelText(/^CNPJ/), cnpj);
  await user.type(screen.getByLabelText(/^Razão social/), "Estacionamento Norte LTDA");
  await user.type(screen.getByLabelText(/^Nome fantasia/), "Norte");
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

const criar = () => screen.getByRole("button", { name: /^Criar empresa|^Criando/ });

describe("NovaEmpresa: abertura", () => {
  it("abre com o título, as três seções abertas e os campos em branco", () => {
    renderWithProviders(<NovaEmpresa />);

    expect(screen.getByRole("heading", { level: 1, name: "Adicionar empresa" })).toBeInTheDocument();
    for (const secao of ["Dados da empresa", "Funcionamento", "Pagamentos"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${secao}`) })).toHaveAttribute("aria-expanded", "true");
    }
    expect(screen.getByLabelText(/^CNPJ/)).toHaveValue("");
    expect(screen.getByLabelText(/^Razão social/)).toHaveValue("");
  });

  it("o CNPJ é editável (não fica travado como em Minha empresa)", () => {
    renderWithProviders(<NovaEmpresa />);

    expect(screen.getByLabelText(/^CNPJ/)).toBeEnabled();
  });

  it("só Dinheiro vem ligado nos meios de pagamento, como na adesão", () => {
    renderWithProviders(<NovaEmpresa />);

    expect(screen.getByRole("switch", { name: "Dinheiro" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Pix" })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "Cartão de crédito" })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "Cartão de débito" })).not.toBeChecked();
  });

  it("os botões Cancelar e Criar empresa já vêm habilitados", () => {
    renderWithProviders(<NovaEmpresa />);

    expect(criar()).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
  });
});

describe("NovaEmpresa: validação", () => {
  it("formulário vazio não envia, mostra os erros e foca o primeiro campo inválido", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NovaEmpresa />);

    await user.click(criar());

    await waitFor(() => expect(screen.getByLabelText(/^CNPJ/)).toHaveFocus());
    expect(addEmpresa).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Informe|inválid/i).length).toBeGreaterThan(0);
  });

  it("todos os meios desligados bloqueiam o envio", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NovaEmpresa />);
    await preencher(user);
    await user.click(screen.getByRole("switch", { name: "Dinheiro" }));

    await user.click(criar());

    expect(addEmpresa).not.toHaveBeenCalled();
  });

  it("CNPJ inválido não envia", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NovaEmpresa />);
    await preencher(user, "11111111111111");

    await user.click(criar());

    expect(addEmpresa).not.toHaveBeenCalled();
  });
});

describe("NovaEmpresa: criação", () => {
  it("com dados válidos envia uma vez e troca o formulário pelo painel de empresa criada", async () => {
    const user = userEvent.setup();
    vi.mocked(addEmpresa).mockResolvedValue({ empresaGuid: "guid-1" });
    renderWithProviders(<NovaEmpresa />);
    await preencher(user);

    await user.click(criar());

    expect(await screen.findByRole("heading", { name: "Empresa criada" })).toBeInTheDocument();
    expect(screen.getByText("Estacionamento Norte LTDA")).toBeInTheDocument();
    expect(addEmpresa).toHaveBeenCalledTimes(1);
    const enviado = vi.mocked(addEmpresa).mock.calls[0][0];
    expect(enviado.company.razaoSocial).toBe("Estacionamento Norte LTDA");
    expect(enviado.payments).toEqual({ dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: false });
    expect(screen.queryByLabelText(/^CNPJ/)).not.toBeInTheDocument();
  });

  it("enquanto cria, os botões e os campos ficam desabilitados e o principal mostra 'Criando…'", async () => {
    const user = userEvent.setup();
    vi.mocked(addEmpresa).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<NovaEmpresa />);
    await preencher(user);

    await user.click(criar());

    await waitFor(() => expect(screen.getByRole("button", { name: "Criando…" })).toBeDisabled());
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByLabelText(/^Razão social/)).toBeDisabled();
  });

  it("um segundo clique enquanto cria não envia de novo", async () => {
    const user = userEvent.setup();
    vi.mocked(addEmpresa).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<NovaEmpresa />);
    await preencher(user);

    await user.click(criar());
    await waitFor(() => expect(screen.getByRole("button", { name: "Criando…" })).toBeDisabled());
    await user.click(screen.getByRole("button", { name: "Criando…" }));

    expect(addEmpresa).toHaveBeenCalledTimes(1);
  });

  it("depois de criar, Voltar para Minha empresa leva para lá", async () => {
    const user = userEvent.setup();
    vi.mocked(addEmpresa).mockResolvedValue({ empresaGuid: "guid-1" });
    renderWithProviders(<NovaEmpresa />);
    await preencher(user);
    await user.click(criar());
    await screen.findByRole("heading", { name: "Empresa criada" });

    await user.click(screen.getByRole("button", { name: "Voltar para Minha empresa" }));

    expect(push).toHaveBeenCalledWith("/minha-empresa");
  });
});

describe("NovaEmpresa: erros da API", () => {
  it("mostra a mensagem da API (ex.: CNPJ já cadastrado) e mantém o que foi digitado", async () => {
    const user = userEvent.setup();
    vi.mocked(addEmpresa).mockRejectedValue(new ApiError("validation", "CNPJ já cadastrado.", 400));
    renderWithProviders(<NovaEmpresa />);
    await preencher(user);

    await user.click(criar());

    expect(await screen.findByRole("alert")).toHaveTextContent("CNPJ já cadastrado.");
    expect(screen.getByLabelText(/^Razão social/)).toHaveValue("Estacionamento Norte LTDA");
    expect(screen.getByLabelText(/^Razão social/)).toBeEnabled();
    expect(criar()).toBeEnabled();
    expect(screen.queryByRole("heading", { name: "Empresa criada" })).not.toBeInTheDocument();
  });

  it("depois do erro dá para corrigir e enviar de novo", async () => {
    const user = userEvent.setup();
    vi.mocked(addEmpresa).mockRejectedValueOnce(new ApiError("validation", "CNPJ já cadastrado.", 400));
    renderWithProviders(<NovaEmpresa />);
    await preencher(user);
    await user.click(criar());
    await screen.findByRole("alert");

    vi.mocked(addEmpresa).mockResolvedValue({ empresaGuid: "guid-2" });
    await user.click(criar());

    expect(await screen.findByRole("heading", { name: "Empresa criada" })).toBeInTheDocument();
    expect(addEmpresa).toHaveBeenCalledTimes(2);
  });

  it("403 mostra o aviso de permissão", async () => {
    const user = userEvent.setup();
    vi.mocked(addEmpresa).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    renderWithProviders(<NovaEmpresa />);
    await preencher(user);

    await user.click(criar());

    expect(await screen.findByText("Você não tem permissão para adicionar empresas.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Razão social/)).toHaveValue("Estacionamento Norte LTDA");
  });

  it("falha de rede mostra a mensagem padrão do sistema", async () => {
    const user = userEvent.setup();
    vi.mocked(addEmpresa).mockRejectedValue(new ApiError("network"));
    renderWithProviders(<NovaEmpresa />);
    await preencher(user);

    await user.click(criar());

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor.");
  });
});

describe("NovaEmpresa: cancelar", () => {
  it("sem dados digitados volta direto para Minha empresa", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NovaEmpresa />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(push).toHaveBeenCalledWith("/minha-empresa");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("com dados digitados pergunta antes de descartar, e Continuar editando mantém tudo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NovaEmpresa />);
    await user.type(screen.getByLabelText(/^Razão social/), "Algo digitado");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(await screen.findByRole("dialog", { name: "Descartar os dados da nova empresa?" })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Continuar editando" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Razão social/)).toHaveValue("Algo digitado");
  });

  it("confirmar o descarte volta para Minha empresa", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NovaEmpresa />);
    await user.type(screen.getByLabelText(/^Razão social/), "Algo digitado");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await user.click(await screen.findByRole("button", { name: "Descartar" }));

    expect(push).toHaveBeenCalledWith("/minha-empresa");
    expect(addEmpresa).not.toHaveBeenCalled();
  });
});
