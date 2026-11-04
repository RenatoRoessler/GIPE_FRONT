import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conferenciaAberta } from "@/lib/api/services/conferenciaPatio.fixture";
import { fromConferenciaResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { lightTheme } from "@/styles/theme";
import { SITUACAO_ITEM, type Conferencia } from "@/types/conferenciaPatio";
import type { EtapaProps } from "../tipos";
import { ConferenciaResumo } from "./ConferenciaResumo";

const base = fromConferenciaResponse(conferenciaAberta);
const CHAVE = "conferencia-patio:observacao:1";

// Tudo conferido, sem divergências: o caminho feliz.
const completa: Conferencia = {
  ...base,
  semEntrada: [],
  itens: base.itens.map((item) => ({ ...item, situacao: SITUACAO_ITEM.Conferido })),
};

function montar(conferencia: Conferencia = base, acoes: Partial<EtapaProps["acoes"]> = {}) {
  const onIr = vi.fn();
  const onMensagem = vi.fn();
  const todas = { finalizar: vi.fn().mockResolvedValue(null), finalizando: false, ...acoes } as unknown as EtapaProps["acoes"];
  render(
    <ThemeProvider theme={lightTheme}>
      <ConferenciaResumo conferencia={conferencia} acoes={todas} onIr={onIr} onMensagem={onMensagem} />
    </ThemeProvider>,
  );
  return { onIr, onMensagem, acoes: todas, user: userEvent.setup() };
}

beforeEach(() => window.sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("ConferenciaResumo", () => {
  it("com pendências e divergências diz 'Quase lá' e mostra os três números", () => {
    montar();
    expect(screen.getByRole("heading", { name: "Quase lá" })).toBeInTheDocument();
    expect(screen.getByText("Resumo da conferência")).toBeInTheDocument();
    const numeros = (nome: string) => screen.getByText(nome).parentElement;
    expect(numeros("no sistema")).toHaveTextContent("3");
    expect(numeros("conferidos")).toHaveTextContent("1");
    expect(numeros("ajustes feitos")).toHaveTextContent("0");
  });

  it("mostra o início, a duração e quem conferiu", () => {
    montar();
    expect(screen.getByText(/\d{2}\/\d{2} · .* às .* · .* · Operador Teste/)).toBeInTheDocument();
  });

  it("tudo conferido e sem divergências: 'Pátio conferido', sem avisos", () => {
    montar(completa);
    expect(screen.getByRole("heading", { name: "Pátio conferido" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/sem resolver/)).not.toBeInTheDocument();
  });

  it("avisa dos que faltam e que ficam como não encontrados", () => {
    montar();
    expect(screen.getByRole("status")).toHaveTextContent("Falta 1 carro");
    expect(screen.getByRole("status")).toHaveTextContent("ele fica como não encontrado");
  });

  it("no plural", () => {
    montar({ ...base, itens: base.itens.map((item) => ({ ...item, situacao: SITUACAO_ITEM.Pendente })) });
    expect(screen.getByRole("status")).toHaveTextContent("Faltam 3 carros");
    expect(screen.getByRole("status")).toHaveTextContent("eles ficam como não encontrados");
  });

  it("o aviso de divergências leva à tela delas", async () => {
    const { user, onIr } = montar();
    await user.click(screen.getByRole("button", { name: /2 divergências sem resolver/ }));
    expect(onIr).toHaveBeenCalledWith("divergencias");
  });

  it("lista os ajustes com a descrição do servidor, ou diz que não houve", () => {
    montar({ ...base, ajustes: [{ tipo: 1, placa: "ccc1234", motivo: 1, descricao: "Saída · saiu sem baixa" }] });
    expect(screen.getByText("CCC-1234")).toBeInTheDocument();
    expect(screen.getByText("Saída · saiu sem baixa")).toBeInTheDocument();
  });

  it("sem ajustes", () => {
    montar();
    expect(screen.getByText("Nenhum ajuste nesta conferência.")).toBeInTheDocument();
  });

  describe("observação", () => {
    it("é opcional, mostra o contador e guarda o que foi digitado", async () => {
      const { user } = montar();
      expect(screen.getByText("0/500")).toBeInTheDocument();

      await user.type(screen.getByLabelText("Observação (opcional)"), "Kwid saiu");
      expect(screen.getByText("9/500")).toBeInTheDocument();
      expect(window.sessionStorage.getItem(CHAVE)).toBe("Kwid saiu");
    });

    it("volta preenchida depois de recarregar a página", () => {
      window.sessionStorage.setItem(CHAVE, "Texto salvo");
      montar();
      expect(screen.getByLabelText("Observação (opcional)")).toHaveValue("Texto salvo");
    });

    it("sem armazenamento disponível, continua funcionando", async () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("bloqueado");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("bloqueado");
      });
      const { user } = montar();
      await user.type(screen.getByLabelText("Observação (opcional)"), "ok");
      expect(screen.getByLabelText("Observação (opcional)")).toHaveValue("ok");
    });

    it("acima de 500 caracteres avisa e bloqueia o finalizar", async () => {
      const { user } = montar();
      await user.click(screen.getByLabelText("Observação (opcional)"));
      await user.paste("a".repeat(501));

      expect(screen.getByText("501/500")).toBeInTheDocument();
      expect(screen.getByLabelText("Observação (opcional)")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("button", { name: "Finalizar conferência" })).toBeDisabled();
    });
  });

  describe("finalizar", () => {
    it("envia a observação, avisa com o resultado e apaga o rascunho", async () => {
      const { user, acoes, onMensagem } = montar();
      await user.type(screen.getByLabelText("Observação (opcional)"), "Tudo certo");
      await user.click(screen.getByRole("button", { name: "Finalizar conferência" }));

      await waitFor(() => expect(acoes.finalizar).toHaveBeenCalledWith("Tudo certo"));
      await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("Conferência finalizada · 1 de 3 conferidos"));
      expect(window.sessionStorage.getItem(CHAVE)).toBeNull();
    });

    it("sem observação envia nada", async () => {
      const { user, acoes } = montar(completa);
      await user.click(screen.getByRole("button", { name: "Finalizar conferência" }));
      await waitFor(() => expect(acoes.finalizar).toHaveBeenCalledWith(undefined));
    });

    it("pode finalizar com pendências e divergências", async () => {
      const { user, acoes } = montar();
      expect(screen.getByRole("button", { name: "Finalizar conferência" })).toBeEnabled();
      await user.click(screen.getByRole("button", { name: "Finalizar conferência" }));
      await waitFor(() => expect(acoes.finalizar).toHaveBeenCalled());
    });

    it("erro: mostra a mensagem, mantém a observação e não avisa de sucesso", async () => {
      const finalizar = vi.fn().mockRejectedValue(new Error("Esta conferência foi encerrada."));
      const { user, onMensagem } = montar(base, { finalizar });
      await user.type(screen.getByLabelText("Observação (opcional)"), "Não perder isto");
      await user.click(screen.getByRole("button", { name: "Finalizar conferência" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Esta conferência foi encerrada.");
      expect(screen.getByLabelText("Observação (opcional)")).toHaveValue("Não perder isto");
      expect(window.sessionStorage.getItem(CHAVE)).toBe("Não perder isto");
      expect(onMensagem).not.toHaveBeenCalled();
    });

    it("enquanto finaliza, trava o botão e a observação", () => {
      montar(base, { finalizando: true });
      expect(screen.getByRole("button", { name: "Finalizando…" })).toBeDisabled();
      expect(screen.getByLabelText("Observação (opcional)")).toBeDisabled();
    });
  });

  it("'Voltar' leva à conferência", async () => {
    const { user, onIr } = montar();
    await user.click(screen.getByRole("button", { name: "Voltar para a conferência" }));
    expect(onIr).toHaveBeenCalledWith("conferindo");
  });
});
