import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { EMPTY_BUSINESS_HOURS_DATA, TipoEmpresa, type PaymentsData } from "@/types/adesao";
import type { EmpresaFormValues } from "@/types/empresa";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/api/services/empresa", () => ({ updateEmpresa: vi.fn(), getEmpresa: vi.fn() }));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const sessao = vi.hoisted(() => ({ atual: { user: { name: "Maria", perfil: 1 } as { name: string; perfil: number | null } | null, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

import { getEmpresa, updateEmpresa } from "@/lib/api/services/empresa";
import { MinhaEmpresa } from "./MinhaEmpresa";

const PAYMENTS: PaymentsData = { dinheiro: true, pix: true, cartaoCredito: false, cartaoDebito: false };

function initial(payments: PaymentsData = PAYMENTS): EmpresaFormValues {
  return {
    company: {
      cnpj: "11.222.333/0001-81",
      razaoSocial: "Estacionamento Central LTDA",
      nomeFantasia: "Central",
      tipoEmpresa: TipoEmpresa.Estacionamento,
      telefone: "(11) 98765-4321",
      cep: "01310-100",
      logradouro: "Av. Paulista",
      numero: "1000",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      quantidadeVagasMoto: "10",
      quantidadeVagasCarro: "50",
    },
    hours: EMPTY_BUSINESS_HOURS_DATA,
    payments,
  };
}

// Renderiza pela tela completa: depois de salvar, o cache da consulta devolve os dados novos ao formulário,
// como na aplicação (um `initial` fixo faria o formulário voltar aos valores antigos).
async function renderForm(payments?: PaymentsData) {
  vi.mocked(getEmpresa).mockResolvedValue(initial(payments));
  const view = renderWithProviders(<MinhaEmpresa />);
  await screen.findByRole("switch", { name: "Dinheiro" });
  return view;
}

const meio = (nome: string) => screen.getByRole("switch", { name: nome });
const secao = () => screen.getByRole("button", { name: /^Pagamentos/ });
const salvar = () => screen.getByRole("button", { name: /^Salvar|^Salvando/ });
const descartar = () => screen.getByRole("button", { name: "Descartar alterações" });

beforeEach(() => {
  vi.mocked(updateEmpresa).mockReset().mockResolvedValue(undefined);
  vi.mocked(getEmpresa).mockReset();
  push.mockReset();
  sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
});

describe("EmpresaForm: acesso a Adicionar empresa", () => {
  it("o Administrador vê o botão e ele leva à tela de nova empresa", async () => {
    await renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Adicionar empresa" }));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/minha-empresa/nova");
  });

  it.each([
    ["Gerente", 2],
    ["Caixa", 4],
    ["perfil desconhecido", null],
  ])("%s não vê o botão", async (_nome, perfil) => {
    sessao.atual = { user: { name: "X", perfil }, isLoading: false };
    await renderForm();

    expect(screen.queryByRole("button", { name: "Adicionar empresa" })).not.toBeInTheDocument();
  });

  it("enquanto o perfil carrega o botão não aparece", async () => {
    sessao.atual = { user: null, isLoading: true };
    await renderForm();

    expect(screen.queryByRole("button", { name: "Adicionar empresa" })).not.toBeInTheDocument();
  });
});

describe("EmpresaForm: seção Pagamentos", () => {
  it("mostra a terceira seção aberta, com os meios atuais e o resumo", async () => {
    await renderForm();
    expect(secao()).toHaveAttribute("aria-expanded", "true");
    expect(secao()).toHaveTextContent("Dinheiro, Pix");
    expect(meio("Dinheiro")).toBeChecked();
    expect(meio("Pix")).toBeChecked();
    expect(meio("Cartão de crédito")).not.toBeChecked();
    expect(meio("Cartão de débito")).not.toBeChecked();
  });

  it("o resumo acompanha as alterações", async () => {
    const user = userEvent.setup();
    await renderForm();
    await user.click(meio("Cartão de débito"));
    expect(secao()).toHaveTextContent("Dinheiro, Pix, Débito");
  });

  it("começa sem alterações e liga o Salvar ao mudar um meio", async () => {
    const user = userEvent.setup();
    await renderForm();
    expect(salvar()).toBeDisabled();
    expect(descartar()).toBeDisabled();
    await user.click(meio("Cartão de crédito"));
    expect(salvar()).toBeEnabled();
    expect(descartar()).toBeEnabled();
  });

  it("salva enviando os quatro meios junto com o restante", async () => {
    const user = userEvent.setup();
    await renderForm();
    await user.click(meio("Cartão de crédito"));
    await user.click(meio("Pix"));
    await user.click(salvar());

    await waitFor(() => expect(updateEmpresa).toHaveBeenCalledTimes(1));
    const values = vi.mocked(updateEmpresa).mock.calls[0][0];
    expect(values.payments).toEqual({ dinheiro: true, pix: false, cartaoCredito: true, cartaoDebito: false });
    expect(values.company.razaoSocial).toBe("Estacionamento Central LTDA");
    expect(await screen.findByText("Dados da empresa salvos com sucesso.")).toBeInTheDocument();
  });

  it("depois de salvar, o novo estado vira o último salvo", async () => {
    const user = userEvent.setup();
    await renderForm();
    await user.click(meio("Cartão de crédito"));
    await user.click(salvar());
    await screen.findByText("Dados da empresa salvos com sucesso.");
    expect(salvar()).toBeDisabled();
    expect(secao()).toHaveTextContent("Dinheiro, Pix, Crédito");

    await user.click(meio("Cartão de débito"));
    await user.click(descartar());
    expect(meio("Cartão de débito")).not.toBeChecked();
    expect(meio("Cartão de crédito")).toBeChecked();
  });

  it("descartar volta ao último estado salvo", async () => {
    const user = userEvent.setup();
    await renderForm();
    await user.click(meio("Cartão de crédito"));
    await user.click(meio("Dinheiro"));
    await user.click(descartar());

    expect(meio("Cartão de crédito")).not.toBeChecked();
    expect(meio("Dinheiro")).toBeChecked();
    expect(secao()).toHaveTextContent("Dinheiro, Pix");
    expect(salvar()).toBeDisabled();
  });

  it("todos desligados bloqueia o salvamento, marca a seção e foca o primeiro meio", async () => {
    const user = userEvent.setup();
    await renderForm();
    await user.click(meio("Dinheiro"));
    await user.click(meio("Pix"));
    expect(await screen.findByText("Selecione ao menos um meio de pagamento")).toBeInTheDocument();

    await user.click(salvar());
    expect(updateEmpresa).not.toHaveBeenCalled();
    expect(secao()).toHaveTextContent("Há campos para corrigir");
    await waitFor(() => expect(meio("Dinheiro")).toHaveFocus());
  });

  it("abre a seção recolhida que tem erro", async () => {
    const user = userEvent.setup();
    await renderForm();
    await user.click(meio("Dinheiro"));
    await user.click(meio("Pix"));
    await user.click(secao());
    expect(secao()).toHaveAttribute("aria-expanded", "false");

    await user.click(salvar());
    expect(updateEmpresa).not.toHaveBeenCalled();
    await waitFor(() => expect(secao()).toHaveAttribute("aria-expanded", "true"));
  });

  it("falha no salvamento mostra o erro e mantém o que foi marcado", async () => {
    vi.mocked(updateEmpresa).mockRejectedValue(new ApiError("server", "Erro no servidor. Tente novamente em instantes.", 500));
    const user = userEvent.setup();
    await renderForm();
    await user.click(meio("Cartão de crédito"));
    await user.click(salvar());

    expect(await screen.findByText("Erro no servidor. Tente novamente em instantes.")).toBeInTheDocument();
    expect(meio("Cartão de crédito")).toBeChecked();
    expect(salvar()).toBeEnabled();
  });

  it("trava os meios durante o salvamento", async () => {
    let concluir: () => void = () => {};
    vi.mocked(updateEmpresa).mockReturnValue(new Promise<void>((resolve) => (concluir = resolve)));
    const user = userEvent.setup();
    await renderForm();
    await user.click(meio("Cartão de crédito"));
    await user.click(salvar());

    await screen.findByRole("button", { name: "Salvando..." });
    for (const nome of ["Dinheiro", "Pix", "Cartão de crédito", "Cartão de débito"]) {
      expect(meio(nome)).toBeDisabled();
    }
    concluir();
    await screen.findByText("Dados da empresa salvos com sucesso.");
  });

  it("empresa antiga, com todos os meios ligados, aparece completa", async () => {
    await renderForm({ dinheiro: true, pix: true, cartaoCredito: true, cartaoDebito: true });
    expect(secao()).toHaveTextContent("Dinheiro, Pix, Crédito, Débito");
  });
});
