import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { ContratoCliente } from "@/types/contrato";
import { CONTRATO_STATUS } from "@/types/mensalista";

vi.mock("@/components/ui/Logo", () => ({ Logo: () => <div data-testid="logo" /> }));

vi.mock("@/lib/api/services/contrato", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/services/contrato")>()),
  consultarContratoCliente: vi.fn(),
  aceitarContrato: vi.fn(),
}));

import { aceitarContrato, consultarContratoCliente, ContratoError } from "@/lib/api/services/contrato";
import type { ContratoErroKind } from "@/types/contrato";
import { ContratoAceite } from "./ContratoAceite";

const TOKEN = "ABCDE12345";
const HASH = "9f3a1c07aabbccdd1122334455667788d9e2c21b99887766554433221100ffee";

const pendente: ContratoCliente = {
  razaoSocial: "Estacionamento Central Ltda",
  nomeMensalista: "Maria Souza",
  versao: "3",
  titulo: "Contrato de Mensalidade",
  conteudo: "CLÁUSULA 1ª - DO OBJETO\nO presente contrato tem por objeto a vaga.\n\nCLÁUSULA 2ª - DO VALOR",
  hash: HASH,
  status: CONTRATO_STATUS.Pendente,
  tokenExpiracao: "2026-10-27T18:00:00",
  dataAceite: null,
};
const aceito: ContratoCliente = { ...pendente, status: CONTRATO_STATUS.Aceito, dataAceite: "2026-10-20T14:32:00" };

function erroContrato(kind: ContratoErroKind, status = 400, message = "erro do back") {
  const apiKind = status === 429 ? "rate_limited" : status === 404 ? "not_found" : "validation";
  return new ContratoError(kind, new ApiError(apiKind, message, status));
}

beforeEach(() => {
  vi.mocked(consultarContratoCliente).mockReset();
  vi.mocked(aceitarContrato).mockReset();
  window.print = vi.fn();
});

function abrir() {
  return renderWithProviders(<ContratoAceite token={TOKEN} />);
}

async function preencher(user: ReturnType<typeof userEvent.setup>, documento = "52998224725") {
  await user.click(await screen.findByRole("checkbox"));
  await user.type(screen.getByLabelText("CPF ou CNPJ"), documento);
}

describe("ContratoAceite: leitura", () => {
  it("mostra o carregamento enquanto consulta", () => {
    vi.mocked(consultarContratoCliente).mockReturnValue(new Promise(() => undefined));
    abrir();
    expect(screen.getByRole("status", { name: "Carregando contrato" })).toBeInTheDocument();
  });

  it("mostra a empresa, o título, a versão, o próprio nome e o texto com as quebras preservadas", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    abrir();

    expect(await screen.findByRole("heading", { level: 1, name: "Contrato de Mensalidade" })).toBeInTheDocument();
    expect(screen.getByText("Estacionamento Central Ltda")).toBeInTheDocument();
    expect(screen.getByText("Versão 3 · Para Maria Souza")).toBeInTheDocument();
    const texto = screen.getByText(/CLÁUSULA 1ª - DO OBJETO/);
    expect(texto.textContent).toBe(pendente.conteudo);
    expect(texto).toHaveStyle({ whiteSpace: "pre-wrap" });
    expect(consultarContratoCliente).toHaveBeenCalledWith(TOKEN);
  });

  it("pendente: avisa a validade do link e oferece pular para a confirmação", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    abrir();

    expect(await screen.findByText(/Leia o contrato e confirme no final\. Link válido até/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pular para a confirmação" })).toHaveAttribute("href", "#confirmacao");
    expect(screen.getByRole("checkbox", { name: /Li e concordo com os termos deste contrato/ })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Aceitar contrato" })).toBeEnabled();
    expect(screen.getByText(/registramos data, hora, endereço IP e navegador/)).toBeInTheDocument();
    expect(screen.getByText("9F3A 1C07 … 1100 FFEE")).toBeInTheDocument();
  });

  it("a identificação do texto pode ser vista completa", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    const user = userEvent.setup();
    abrir();

    await user.click(await screen.findByRole("button", { name: "Ver completo" }));
    expect(screen.getByText(/9F3A 1C07 AABB CCDD .* 1100 FFEE/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver resumo" })).toHaveAttribute("aria-expanded", "true");
  });

  it("já aceito: mostra o texto, a faixa de aceite e o selo, sem formulário", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(aceito);
    abrir();

    expect(await screen.findByText(/Contrato aceito em/)).toBeInTheDocument();
    expect(screen.getByText(/CLÁUSULA 1ª - DO OBJETO/)).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Contrato aceito" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("CPF ou CNPJ")).not.toBeInTheDocument();
    // Reabrir o link não repete os próximos passos.
    expect(screen.queryByText("Enviamos uma cópia para o seu e-mail.")).not.toBeInTheDocument();
  });
});

describe("ContratoAceite: erros ao abrir", () => {
  it("link vencido", async () => {
    vi.mocked(consultarContratoCliente).mockRejectedValue(erroContrato("vencido"));
    abrir();
    expect(await screen.findByRole("heading", { name: "Este link venceu" })).toBeInTheDocument();
  });

  it("link inválido ou contrato não encontrado", async () => {
    vi.mocked(consultarContratoCliente).mockRejectedValue(erroContrato("invalido", 404));
    abrir();
    expect(await screen.findByRole("heading", { name: "Link inválido" })).toBeInTheDocument();
  });

  it("contrato cancelado vale como link inválido", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue({ ...pendente, status: CONTRATO_STATUS.Cancelado });
    abrir();
    expect(await screen.findByRole("heading", { name: "Link inválido" })).toBeInTheDocument();
  });

  it("erro de rede tem mensagem própria e permite tentar de novo", async () => {
    vi.mocked(consultarContratoCliente).mockRejectedValueOnce(new ApiError("network"));
    const user = userEvent.setup();
    abrir();

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível abrir o contrato agora.");
    expect(screen.queryByRole("heading", { name: "Link inválido" })).not.toBeInTheDocument();

    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: "Contrato de Mensalidade" })).toBeInTheDocument();
  });

  it("muitas consultas seguidas pede para aguardar", async () => {
    vi.mocked(consultarContratoCliente).mockRejectedValue(erroContrato("rate-limited", 429));
    abrir();
    expect(await screen.findByRole("alert")).toHaveTextContent("Muitas consultas seguidas.");
  });
});

describe("ContratoAceite: aceite", () => {
  it("enviar sem marcar nem informar o documento mostra o que falta e leva o foco ao primeiro problema", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    const user = userEvent.setup();
    abrir();

    await user.click(await screen.findByRole("button", { name: "Aceitar contrato" }));

    expect(await screen.findByText("Marque que leu e concorda com os termos")).toBeInTheDocument();
    expect(screen.getByText("Informe o seu CPF ou CNPJ")).toBeInTheDocument();
    expect(aceitarContrato).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("checkbox")).toHaveFocus());
  });

  it("documento inválido é recusado antes de ir à API", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    const user = userEvent.setup();
    abrir();

    await preencher(user, "11111111111");
    await user.click(screen.getByRole("button", { name: "Aceitar contrato" }));

    expect(await screen.findByText("Documento inválido. Confira os números")).toBeInTheDocument();
    expect(aceitarContrato).not.toHaveBeenCalled();
  });

  it("aplica a máscara de CPF e a de CNPJ conforme o tamanho", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    const user = userEvent.setup();
    abrir();
    const campo = await screen.findByLabelText("CPF ou CNPJ");

    await user.type(campo, "52998224725");
    expect(campo).toHaveValue("529.982.247-25");
    await user.clear(campo);
    await user.type(campo, "11222333000181");
    expect(campo).toHaveValue("11.222.333/0001-81");
  });

  it("documento que não confere: erro no campo, valor mantido e foco nele", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    vi.mocked(aceitarContrato).mockRejectedValue(erroContrato("documento"));
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Aceitar contrato" }));

    expect(
      await screen.findByText("O documento não confere com o do cadastro. Confira e tente de novo."),
    ).toBeInTheDocument();
    const campo = screen.getByLabelText("CPF ou CNPJ");
    expect(campo).toHaveValue("529.982.247-25");
    await waitFor(() => expect(campo).toHaveFocus());

    // Corrigiu: o erro do servidor some.
    await user.type(campo, "{Backspace}");
    await waitFor(() =>
      expect(
        screen.queryByText("O documento não confere com o do cadastro. Confira e tente de novo."),
      ).not.toBeInTheDocument(),
    );
  });

  it("muitas tentativas: avisa, desabilita o botão e mostra a espera", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    vi.mocked(aceitarContrato).mockRejectedValue(erroContrato("rate-limited", 429));
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Aceitar contrato" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Muitas tentativas seguidas. Aguarde 1 minuto");
    const botao = screen.getByRole("button", { name: /Tentar em/ });
    expect(botao).toBeDisabled();
    expect(botao).toHaveTextContent(/^Tentar em 0:(59|60)|^Tentar em 1:00/);
  });

  it("sucesso: o documento digitado some, o selo aparece com foco e os próximos passos", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    vi.mocked(aceitarContrato).mockResolvedValue({ dataAceite: "2026-10-21T14:32:00", hash: HASH });
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Aceitar contrato" }));

    expect(aceitarContrato).toHaveBeenCalledWith(TOKEN, "529.982.247-25");
    const titulo = await screen.findByRole("heading", { name: "Contrato aceito" });
    await waitFor(() => expect(titulo).toHaveFocus());
    expect(screen.getByText("Enviamos uma cópia para o seu e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Seu cadastro será ativado após o primeiro pagamento.")).toBeInTheDocument();
    expect(screen.getByText(/\(horário de Brasília\)/)).toBeInTheDocument();
    // Privacidade: nada do que foi digitado fica na tela.
    expect(screen.queryByLabelText("CPF ou CNPJ")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("529.982.247-25")).not.toBeInTheDocument();
    expect(screen.queryByText("529.982.247-25")).not.toBeInTheDocument();
  });

  it("imprimir ou salvar PDF chama a impressão do navegador", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(aceito);
    const user = userEvent.setup();
    abrir();

    await user.click(await screen.findByRole("button", { name: "Imprimir ou salvar PDF" }));
    expect(window.print).toHaveBeenCalled();
  });

  it("se o link venceu no meio do caminho, troca para a tela de link vencido", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    vi.mocked(aceitarContrato).mockRejectedValue(erroContrato("vencido"));
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Aceitar contrato" }));

    expect(await screen.findByRole("heading", { name: "Este link venceu" })).toBeInTheDocument();
  });

  it("se já tinha sido aceito em outro lugar, consulta de novo e mostra o selo", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValueOnce(pendente);
    vi.mocked(aceitarContrato).mockRejectedValue(erroContrato("ja-aceito"));
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    vi.mocked(consultarContratoCliente).mockResolvedValue(aceito);
    await user.click(screen.getByRole("button", { name: "Aceitar contrato" }));

    expect(await screen.findByRole("heading", { name: "Contrato aceito" })).toBeInTheDocument();
    expect(screen.queryByText("Enviamos uma cópia para o seu e-mail.")).not.toBeInTheDocument();
  });

  it("erro genérico do servidor aparece no banner e deixa tentar de novo", async () => {
    vi.mocked(consultarContratoCliente).mockResolvedValue(pendente);
    vi.mocked(aceitarContrato).mockRejectedValue(new ApiError("server"));
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Aceitar contrato" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro no servidor");
    expect(screen.getByRole("button", { name: "Aceitar contrato" })).toBeEnabled();
  });
});
