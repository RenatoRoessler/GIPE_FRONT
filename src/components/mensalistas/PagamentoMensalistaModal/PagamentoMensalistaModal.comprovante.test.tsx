import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { TIPO_PESSOA, type Mensalista, type PagamentoMensalistaResultado, type SituacaoMensalista } from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({
  pagarMensalista: vi.fn(),
  listMensalistas: vi.fn(),
  reenviarContrato: vi.fn(),
}));

import { listMensalistas, pagarMensalista, reenviarContrato } from "@/lib/api/services/mensalista";
import { PagamentoMensalistaModal } from "./PagamentoMensalistaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const maria: Mensalista = {
  mensalistaId: 1,
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  tipoPessoa: TIPO_PESSOA.Fisica,
  documento: "52998224725",
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  celular: "11912345678",
  diaVencimento: 5,
  ativo: false,
  veiculos: [],
  situacao: "Aguardando Primeiro Pagamento",
  dataProximoVencimento: null,
  diasAteProximoVencimento: null,
};

const primeiro: SituacaoMensalista = { kind: "aguardando-pagamento", aceitoEm: null };
const handlers = { onClose: vi.fn(), onToast: vi.fn() };

const completo: PagamentoMensalistaResultado = {
  paga: { cobrancaId: 1, valor: 280, vencimento: "2026-10-05", dataPagamento: "2026-10-21T14:32:00", formaPagamento: 2, status: 1 },
  proxima: { cobrancaId: 2, valor: 280, vencimento: "2026-11-05", dataPagamento: null, formaPagamento: null, status: 0 },
};

const botaoConfirmar = () => screen.getByRole("button", { name: /^Confirmar|^Registrando/ });

function abrir(mensalista: Mensalista = maria, situacao: SituacaoMensalista = primeiro) {
  renderWithProviders(<PagamentoMensalistaModal mensalista={mensalista} situacao={situacao} {...handlers} />);
}

beforeEach(() => {
  vi.mocked(pagarMensalista).mockReset();
  vi.mocked(listMensalistas).mockReset();
  vi.mocked(reenviarContrato).mockReset();
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

describe("comprovante do pagamento", () => {
  async function pagar(resposta: PagamentoMensalistaResultado, mensalista: Mensalista = maria, situacao = primeiro) {
    const user = userEvent.setup();
    vi.mocked(pagarMensalista).mockResolvedValue(resposta);
    abrir(mensalista, situacao);
    await user.click(botaoConfirmar());
    await screen.findByRole("dialog", { name: "Pagamento registrado" });
    return user;
  }

  it("troca o formulário pelo comprovante, com foco, valor, forma e próxima cobrança", async () => {
    await pagar(completo);

    const selo = screen.getByRole("status");
    expect(selo).toHaveFocus();
    expect(selo).toHaveTextContent("R$ 280,00 recebidos");
    expect(selo).toHaveTextContent("Pix");
    expect(selo).toHaveTextContent("Maria Souza · Diurno · Todas");
    expect(selo).toHaveTextContent("Mensalista ativado.");
    expect(screen.getByText("R$ 280,00 · vence em 05/11/26")).toBeInTheDocument();
    expect(screen.queryByText("Valor atualizado do tipo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Valor pago (R$)")).not.toBeInTheDocument();
    expect(handlers.onToast).not.toHaveBeenCalled();
  });

  it("explica o vencimento quando o mês não tem o dia do cadastro", async () => {
    await pagar({ ...completo, proxima: { ...completo.proxima!, vencimento: "2026-12-01" } }, { ...maria, diaVencimento: 31 });

    expect(screen.getByText("R$ 280,00 · vence em 01/12/26")).toBeInTheDocument();
    expect(screen.getByText("Dia 31 do cadastro; novembro não tem dia 31, então vence em 01/12.")).toBeInTheDocument();
  });

  it("avisa quando o valor da próxima cobrança foi atualizado", async () => {
    await pagar({ ...completo, proxima: { ...completo.proxima!, valor: 300 } });

    expect(screen.getByText("R$ 300,00 · vence em 05/11/26")).toBeInTheDocument();
    expect(screen.getByText("Valor atualizado do tipo")).toBeInTheDocument();
  });

  it("sem a próxima cobrança na resposta, diz só que foi gerada", async () => {
    await pagar({ ...completo, proxima: null });

    expect(screen.getByText("Próxima cobrança gerada.")).toBeInTheDocument();
  });

  it("Concluir fecha com o toast de ativação", async () => {
    const user = await pagar(completo);

    await user.click(screen.getByRole("button", { name: "Concluir" }));

    expect(handlers.onToast).toHaveBeenCalledWith("Pagamento registrado. Mensalista ativado.");
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("para quem já estava ativo, não fala em ativação", async () => {
    const user = await pagar(completo, { ...maria, ativo: true, situacao: "Em Dia" }, { kind: "ativo" });

    expect(screen.getByText("Mensalista ativo.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Concluir" }));
    expect(handlers.onToast).toHaveBeenCalledWith("Pagamento registrado.");
  });

  it("fechar pelo ✕ também conclui, porque o pagamento já foi gravado", async () => {
    const user = await pagar(completo);

    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(handlers.onToast).toHaveBeenCalledWith("Pagamento registrado. Mensalista ativado.");
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });
});

describe("erros do pagamento", () => {
  async function falhar(erro: ApiError) {
    const user = userEvent.setup();
    vi.mocked(pagarMensalista).mockRejectedValue(erro);
    abrir();
    await user.click(botaoConfirmar());
    await screen.findByRole("alert");
    return user;
  }

  it("contrato não aceito: orienta e oferece reenviar o contrato", async () => {
    vi.mocked(reenviarContrato).mockResolvedValue({ email: "maria@exemplo.com", tokenExpiracao: null });
    const user = await falhar(new ApiError("validation", "O contrato ainda não foi aceito.", 400));

    expect(screen.getByRole("alert")).toHaveTextContent("O primeiro pagamento só é liberado depois do aceite do contrato.");
    expect(screen.getByLabelText("Valor pago (R$)")).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Reenviar contrato" }));

    await waitFor(() => expect(reenviarContrato).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(handlers.onToast).toHaveBeenCalledWith(expect.stringContaining("Novo link enviado para maria@exemplo.com")),
    );
  });

  it("sem cobrança pendente: só oferece fechar", async () => {
    const user = await falhar(new ApiError("validation", "Mensalista sem cobrança pendente.", 400));

    expect(screen.getByRole("alert")).toHaveTextContent("Este mensalista não tem cobrança pendente para receber.");
    await user.click(within(screen.getByRole("alert")).getByRole("button", { name: "Fechar" }));
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("sessão inválida pede para entrar novamente", async () => {
    await falhar(new ApiError("unauthorized", "Sua sessão expirou. Entre novamente."));

    expect(screen.getByRole("alert")).toHaveTextContent("Entre novamente e tente de novo.");
  });

  it("sem permissão mostra a mensagem da API", async () => {
    await falhar(new ApiError("forbidden", "Você não tem permissão para realizar esta ação.", 403));

    expect(screen.getByRole("alert")).toHaveTextContent("Você não tem permissão para realizar esta ação.");
  });

  describe("falha de rede", () => {
    beforeEach(() => {
      vi.mocked(listMensalistas).mockResolvedValue({ items: [maria] } as never);
    });

    it("bloqueia um novo envio até conferir a situação, mesmo mexendo no formulário", async () => {
      const user = await falhar(new ApiError("network"));

      expect(screen.getByRole("alert")).toHaveTextContent("Confira a situação do mensalista antes de tentar de novo.");
      expect(botaoConfirmar()).toBeDisabled();
      expect(screen.getByRole("button", { name: "Conferir situação" })).toBeEnabled();

      await user.type(screen.getByLabelText("Valor pago (R$)"), "1");
      expect(botaoConfirmar()).toBeDisabled();
      expect(pagarMensalista).toHaveBeenCalledTimes(1);
    });

    it("se a situação mudou, mostra o comprovante resumido", async () => {
      vi.mocked(listMensalistas).mockResolvedValue({
        items: [{ ...maria, ativo: true, situacao: "Em Dia", dataProximoVencimento: "2026-11-05T00:00:00" }],
      } as never);
      const user = await falhar(new ApiError("timeout"));

      await user.click(screen.getByRole("button", { name: "Conferir situação" }));

      expect(await screen.findByText("Pagamento já registrado")).toBeInTheDocument();
      expect(listMensalistas).toHaveBeenCalledWith(expect.objectContaining({ documento: "52998224725" }));
      await user.click(screen.getByRole("button", { name: "Concluir" }));
      expect(handlers.onToast).toHaveBeenCalledWith("Pagamento já registrado.");
      expect(handlers.onClose).toHaveBeenCalled();
    });

    it("se nada mudou, libera tentar de novo", async () => {
      const user = await falhar(new ApiError("network"));

      await user.click(screen.getByRole("button", { name: "Conferir situação" }));

      expect(
        await screen.findByText("Nada foi registrado para este mensalista. Você pode tentar de novo."),
      ).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(botaoConfirmar()).toBeEnabled();
    });

    it("se a conferência falhar, mantém o bloqueio e avisa", async () => {
      vi.mocked(listMensalistas).mockRejectedValue(new ApiError("network"));
      const user = await falhar(new ApiError("network"));

      await user.click(screen.getByRole("button", { name: "Conferir situação" }));

      expect(await screen.findByText("Não foi possível conferir agora. Tente conferir de novo.")).toBeInTheDocument();
      expect(botaoConfirmar()).toBeDisabled();
    });
  });
});
