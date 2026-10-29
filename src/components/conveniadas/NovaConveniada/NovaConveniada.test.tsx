import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api/services/conveniada", () => ({ cadastrarConveniada: vi.fn() }));
vi.mock("@/lib/api/services/cep", () => ({ fetchAddressByCep: vi.fn() }));

import { cadastrarConveniada } from "@/lib/api/services/conveniada";
import { fetchAddressByCep } from "@/lib/api/services/cep";
import { NovaConveniada } from "./NovaConveniada";

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

// Preencher o formulário campo a campo é lento.
vi.setConfig({ testTimeout: 30_000 });

const cadastrar = vi.mocked(cadastrarConveniada);

beforeEach(() => {
  push.mockReset();
  cadastrar.mockReset();
  vi.mocked(fetchAddressByCep).mockReset().mockResolvedValue(null);
});

async function preencher(user: User) {
  await user.type(screen.getByLabelText(/^CNPJ/), "11222333000181");
  await user.type(screen.getByLabelText(/^Telefone/), "1134567890");
  await user.type(screen.getByLabelText(/^Razão social/), "Auto Peças Sul LTDA");
  await user.type(screen.getByLabelText(/^CEP/), "01310100");
  await user.type(screen.getByLabelText(/^Logradouro/), "Rua X");
  await user.type(screen.getByLabelText(/^Número/), "10");
  await user.type(screen.getByLabelText(/^Bairro/), "Centro");
  await user.type(screen.getByLabelText(/^Cidade/), "São Paulo");
  await user.selectOptions(screen.getByLabelText(/^Estado/), "SP");
  await user.type(screen.getByLabelText(/^Nome(?! fantasia)/), "Maria Souza");
  await user.type(screen.getByLabelText(/^CPF/), "52998224725");
  await user.type(screen.getByLabelText(/^E-mail/), "maria@exemplo.com");
  await user.type(screen.getByLabelText(/^Celular/), "11987654321");
}

const botaoCadastrar = () => screen.getByRole("button", { name: /^Cadastrar|^Cadastrando/ });

describe("NovaConveniada", () => {
  it("abre com as duas seções e os campos em branco", () => {
    renderWithProviders(<NovaConveniada />);

    expect(screen.getByRole("heading", { level: 1, name: "Nova conveniada" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Empresa" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Responsável" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^CNPJ/)).toHaveValue("");
    expect(screen.getByLabelText(/^Nome fantasia/)).not.toBeRequired();
  });

  it("sinaliza os campos vazios e não envia", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NovaConveniada />);

    await user.click(botaoCadastrar());

    expect(await screen.findByText("Informe o CNPJ")).toBeInTheDocument();
    expect(screen.getByText("Informe a razão social")).toBeInTheDocument();
    expect(screen.getByText("Informe o CPF")).toBeInTheDocument();
    expect(cadastrar).not.toHaveBeenCalled();
  });

  it("rejeita CNPJ e CPF inválidos", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NovaConveniada />);

    await preencher(user);
    await user.clear(screen.getByLabelText(/^CNPJ/));
    await user.type(screen.getByLabelText(/^CNPJ/), "11222333000182");
    await user.clear(screen.getByLabelText(/^CPF/));
    await user.type(screen.getByLabelText(/^CPF/), "11111111111");
    await user.click(botaoCadastrar());

    expect(await screen.findByText("CNPJ inválido")).toBeInTheDocument();
    expect(screen.getByText("CPF inválido")).toBeInTheDocument();
    expect(cadastrar).not.toHaveBeenCalled();
  });

  it("preenche o endereço pelo CEP sem tocar no número", async () => {
    vi.mocked(fetchAddressByCep).mockResolvedValue({
      logradouro: "Avenida Paulista",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
    } as Awaited<ReturnType<typeof fetchAddressByCep>>);
    const user = userEvent.setup();
    renderWithProviders(<NovaConveniada />);

    await user.type(screen.getByLabelText(/^CEP/), "01310100");

    await waitFor(() => expect(screen.getByLabelText(/^Logradouro/)).toHaveValue("Avenida Paulista"));
    expect(screen.getByLabelText(/^Bairro/)).toHaveValue("Bela Vista");
    expect(screen.getByLabelText(/^Estado/)).toHaveValue("SP");
    expect(screen.getByLabelText(/^Número/)).toHaveValue("");
  });

  it("envia o cadastro e volta à listagem com o resultado", async () => {
    cadastrar.mockResolvedValue({ empresaConveniadaId: 1, empresaGuid: "g", novaEmpresa: true, usuarioId: 2, novoUsuario: false });
    const user = userEvent.setup();
    renderWithProviders(<NovaConveniada />);

    await preencher(user);
    await user.click(botaoCadastrar());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/empresas-conveniadas?cadastro=10"));
    expect(cadastrar).toHaveBeenCalledWith(
      expect.objectContaining({ cnpj: "11.222.333/0001-81", razaoSocial: "Auto Peças Sul LTDA", usuarioCpf: "529.982.247-25" }),
    );
  });

  it("desabilita o botão durante o envio", async () => {
    cadastrar.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<NovaConveniada />);

    await preencher(user);
    await user.click(botaoCadastrar());

    const botao = await screen.findByRole("button", { name: "Cadastrando…" });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute("aria-busy", "true");
  });

  it("mostra o erro do back e mantém os dados digitados", async () => {
    cadastrar.mockRejectedValue(new ApiError("validation", "Esta empresa já é conveniada deste estacionamento.", 400));
    const user = userEvent.setup();
    renderWithProviders(<NovaConveniada />);

    await preencher(user);
    await user.click(botaoCadastrar());

    expect(await screen.findByRole("alert")).toHaveTextContent("Esta empresa já é conveniada deste estacionamento.");
    expect(screen.getByLabelText(/^Razão social/)).toHaveValue("Auto Peças Sul LTDA");
    expect(screen.getByLabelText(/^E-mail/)).toHaveValue("maria@exemplo.com");
    expect(push).not.toHaveBeenCalled();
  });

  it("cancelar sem alterações volta direto", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NovaConveniada />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(push).toHaveBeenCalledWith("/empresas-conveniadas");
  });

  it("cancelar com alterações pede confirmação antes de descartar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NovaConveniada />);

    await user.type(screen.getByLabelText(/^Razão social/), "Auto Peças");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Descartar o cadastro?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(push).toHaveBeenCalledWith("/empresas-conveniadas");
  });
});
