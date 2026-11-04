import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "styled-components";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { conferenciaAberta, leituraConferido, leituraJaConferido, leituraSemEntrada } from "@/lib/api/services/conferenciaPatio.fixture";
import { fromConferenciaResponse, fromLeituraResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { lightTheme } from "@/styles/theme";
import { METODO_CONFERENCIA, ORIGEM_ITEM, SITUACAO_ITEM, type Conferencia } from "@/types/conferenciaPatio";
import type { EtapaProps } from "../tipos";

// O visor e o registro de entrada têm os seus próprios testes: aqui só importa o que a tela entrega a eles.
vi.mock("../VisorPlacas", () => ({
  VisorPlacas: (props: { ativo: boolean; onPlaca: (placa: string) => void; onRegistrarEntrada: (placa: string) => void; onDigitar: () => void }) => (
    <section aria-label="Visor" data-ativo={String(props.ativo)}>
      <button type="button" onClick={() => props.onPlaca("ABC1D23")}>
        simular leitura
      </button>
      <button type="button" onClick={() => props.onRegistrarEntrada("ZZZ9Z99")}>
        simular sem entrada
      </button>
    </section>
  ),
}));
vi.mock("../RegistrarEntradaConferenciaModal", () => ({
  RegistrarEntradaConferenciaModal: ({ placa, onClose }: { placa: string; onClose: () => void }) => (
    <div role="dialog" aria-label="Registrar entrada">
      Entrada de {placa}
      <button type="button" onClick={onClose}>
        fechar entrada
      </button>
    </div>
  ),
}));

import { ConferenciaConferindo } from "./ConferenciaConferindo";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const base = fromConferenciaResponse(conferenciaAberta);

function montar(conferencia: Conferencia = base, acoes: Partial<EtapaProps["acoes"]> = {}) {
  const onIr = vi.fn();
  const onMensagem = vi.fn();
  const todas = {
    marcar: vi.fn().mockResolvedValue(null),
    marcando: false,
    ler: vi.fn().mockResolvedValue(fromLeituraResponse(leituraConferido)),
    ultimaLeitura: null,
    ...acoes,
  } as unknown as EtapaProps["acoes"];
  const utilitarios = render(
    <ThemeProvider theme={lightTheme}>
      <ConferenciaConferindo conferencia={conferencia} acoes={todas} onIr={onIr} onMensagem={onMensagem} />
    </ThemeProvider>,
  );
  return { onIr, onMensagem, acoes: todas, user: userEvent.setup(), ...utilitarios };
}

function comItens(situacoes: number[], extra: Partial<Conferencia> = {}): Conferencia {
  return {
    ...base,
    semEntrada: [],
    ...extra,
    itens: situacoes.map((situacao, indice) => ({
      ...base.itens[0],
      patioConferenciaItemId: indice + 1,
      placa: `AAA${indice}B${indice}${indice}`.slice(0, 7),
      situacao,
      dataEntrada: `2026-10-${10 + indice}T10:00:00`,
      dataConferido: situacao === SITUACAO_ITEM.Conferido ? `2026-11-04T10:0${indice}:00` : null,
    })),
  };
}

beforeEach(() => vi.clearAllMocks());

describe("ConferenciaConferindo", () => {
  it("mostra o progresso em texto e em barra", () => {
    montar();
    expect(screen.getByRole("heading", { name: "Conferindo pátio" })).toBeInTheDocument();
    expect(screen.getByText("Salvo a cada placa")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 de 3 conferidos");
    const barra = screen.getByRole("progressbar", { name: "Progresso da conferência" });
    expect(barra).toHaveAttribute("aria-valuenow", "1");
    expect(barra).toHaveAttribute("aria-valuemax", "3");
  });

  it("os filtros mostram a contagem no nome e começam em 'Faltam'", () => {
    montar();
    expect(screen.getByRole("button", { name: "Faltam 1", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conferidos 1", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Divergências 2" })).toBeInTheDocument();
  });

  it("lista os que faltam e troca para os conferidos", async () => {
    const { user } = montar();
    const lista = screen.getByRole("list", { name: "Veículos" });
    expect(within(lista).getAllByRole("listitem")).toHaveLength(1);
    expect(within(lista).getByText("AAA1A11")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Conferidos 1" }));
    expect(screen.getByRole("button", { name: "Conferidos 1", pressed: true })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Veículos" })).getByText("BBB2B22")).toBeInTheDocument();
  });

  it("faltam: o que está há mais tempo no pátio vem primeiro", () => {
    montar(comItens([1, 1, 1]));
    const placas = within(screen.getByRole("list", { name: "Veículos" }))
      .getAllByRole("listitem")
      .map((li) => li.getAttribute("data-item-id"));
    expect(placas).toEqual(["1", "2", "3"]);
  });

  it("sem divergências, o filtro de divergências não aparece", () => {
    montar(comItens([1, 2]));
    expect(screen.queryByRole("button", { name: /Divergências/ })).not.toBeInTheDocument();
  });

  it("o filtro de divergências leva à tela de divergências", async () => {
    const { user, onIr } = montar();
    await user.click(screen.getByRole("button", { name: "Divergências 2" }));
    expect(onIr).toHaveBeenCalledWith("divergencias");
  });

  it("mensagens de lista vazia por filtro", async () => {
    const { user } = montar(comItens([2, 2]));
    expect(screen.getByText("Nenhum carro faltando. Pode ver o resumo.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Conferidos 2" }));
    expect(screen.queryByText("Nenhum carro conferido ainda.")).not.toBeInTheDocument();
  });

  it("nenhum conferido ainda", async () => {
    const { user } = montar(comItens([1]));
    await user.click(screen.getByRole("button", { name: "Conferidos 0" }));
    expect(screen.getByText("Nenhum carro conferido ainda.")).toBeInTheDocument();
  });

  describe("marcar", () => {
    it("'Está no pátio' marca como conferido", async () => {
      const { user, acoes } = montar();
      await user.click(screen.getByRole("button", { name: "Está no pátio: AAA1A11" }));
      expect(acoes.marcar).toHaveBeenCalledWith(1, SITUACAO_ITEM.Conferido);
    });

    it("'Não achei' marca como não encontrado", async () => {
      const { user, acoes } = montar();
      await user.click(screen.getByRole("button", { name: "Não achei: AAA1A11" }));
      expect(acoes.marcar).toHaveBeenCalledWith(1, SITUACAO_ITEM.NaoEncontrado);
    });

    it("falha: avisa com a mensagem e mantém o item", async () => {
      const marcar = vi.fn().mockRejectedValue(new Error("Esta conferência foi encerrada."));
      const { user, onMensagem } = montar(base, { marcar });
      await user.click(screen.getByRole("button", { name: "Está no pátio: AAA1A11" }));
      await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("Esta conferência foi encerrada.", "error"));
      expect(screen.getByRole("button", { name: "Está no pátio: AAA1A11" })).toBeInTheDocument();
    });

    it("trava os botões enquanto marca", () => {
      montar(base, { marcando: true });
      expect(screen.getByRole("button", { name: "Está no pátio: AAA1A11" })).toBeDisabled();
    });

    it("depois de marcar, o foco vai para o item que ocupa o lugar", async () => {
      const dois = comItens([1, 1]);
      const marcar = vi.fn().mockResolvedValue(null);
      const { user, rerender, acoes, onIr, onMensagem } = montar(dois, { marcar });

      await user.click(screen.getByRole("button", { name: `Está no pátio: ${dois.itens[0].placa}` }));
      await waitFor(() => expect(marcar).toHaveBeenCalled());

      // O cache muda: o primeiro item virou conferido e sai da lista "Faltam".
      const depois = { ...dois, itens: [{ ...dois.itens[0], situacao: SITUACAO_ITEM.Conferido }, dois.itens[1]] };
      rerender(
        <ThemeProvider theme={lightTheme}>
          <ConferenciaConferindo conferencia={depois} acoes={acoes} onIr={onIr} onMensagem={onMensagem} />
        </ThemeProvider>,
      );

      await waitFor(() => expect(screen.getByRole("button", { name: `Está no pátio: ${dois.itens[1].placa}` })).toHaveFocus());
    });
  });

  describe("rodapé", () => {
    it("com pendentes, a ação principal é 'Ver resumo'", async () => {
      const { user, onIr } = montar();
      await user.click(screen.getByRole("button", { name: "Ver resumo" }));
      expect(onIr).toHaveBeenCalledWith("resumo");
    });

    it("sem pendentes e com divergências, a ação principal é 'Resolver divergências'", async () => {
      const { user, onIr } = montar(comItens([2, 3]));
      expect(screen.queryByRole("button", { name: "Ver resumo" })).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Resolver divergências" }));
      expect(onIr).toHaveBeenCalledWith("divergencias");
    });

    it("sem pendentes e sem divergências, 'Ver resumo'", () => {
      montar(comItens([2, 2]));
      expect(screen.getByRole("button", { name: "Ver resumo" })).toBeInTheDocument();
    });

    it("'Voltar' leva ao início", async () => {
      const { user, onIr } = montar();
      await user.click(screen.getByRole("button", { name: "Voltar (a conferência fica salva)" }));
      expect(onIr).toHaveBeenCalledWith("inicio");
    });
  });

  describe("câmera", () => {
    it("só aparece no método câmera, ativa, e lê pela origem câmera", async () => {
      const { user, acoes } = montar({ ...base, metodo: METODO_CONFERENCIA.Camera });
      expect(screen.getByLabelText("Visor")).toHaveAttribute("data-ativo", "true");

      await user.click(screen.getByRole("button", { name: "simular leitura" }));
      expect(acoes.ler).toHaveBeenCalledWith("ABC1D23", ORIGEM_ITEM.Camera);
    });

    it("no método lista não mostra o visor", () => {
      montar({ ...base, metodo: METODO_CONFERENCIA.Lista });
      expect(screen.queryByLabelText("Visor")).not.toBeInTheDocument();
    });

    it("uma leitura que falha não derruba a tela", async () => {
      const ler = vi.fn().mockRejectedValue(new Error("sem rede"));
      const { user } = montar({ ...base, metodo: METODO_CONFERENCIA.Camera }, { ler });
      await user.click(screen.getByRole("button", { name: "simular leitura" }));
      expect(ler).toHaveBeenCalled();
      expect(screen.getByRole("heading", { name: "Conferindo pátio" })).toBeInTheDocument();
    });

    it("'Registrar agora' abre o registro da entrada e desliga a câmera enquanto está aberto", async () => {
      const { user } = montar({ ...base, metodo: METODO_CONFERENCIA.Camera });
      await user.click(screen.getByRole("button", { name: "simular sem entrada" }));

      expect(screen.getByRole("dialog", { name: "Registrar entrada" })).toHaveTextContent("Entrada de ZZZ9Z99");
      expect(screen.getByLabelText("Visor")).toHaveAttribute("data-ativo", "false");

      await user.click(screen.getByRole("button", { name: "fechar entrada" }));
      expect(screen.queryByRole("dialog", { name: "Registrar entrada" })).not.toBeInTheDocument();
      expect(screen.getByLabelText("Visor")).toHaveAttribute("data-ativo", "true");
    });
  });

  describe("digitar placa", () => {
    it("confere a placa digitada pela origem manual e avisa 'conferido'", async () => {
      const { user, acoes, onMensagem } = montar();
      await user.click(screen.getByRole("button", { name: "Digitar placa" }));
      await user.type(screen.getByLabelText("Placa"), "bbb2b22");
      await user.click(screen.getByRole("button", { name: "Conferir" }));

      await waitFor(() => expect(acoes.ler).toHaveBeenCalledWith("BBB2B22", ORIGEM_ITEM.Manual));
      expect(onMensagem).toHaveBeenCalledWith("BBB2B22 conferido.");
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Digitar placa" })).not.toBeInTheDocument());
    });

    it("já conferido", async () => {
      const ler = vi.fn().mockResolvedValue(fromLeituraResponse(leituraJaConferido));
      const { user, onMensagem } = montar(base, { ler });
      await user.click(screen.getByRole("button", { name: "Digitar placa" }));
      await user.type(screen.getByLabelText("Placa"), "BBB2B22");
      await user.click(screen.getByRole("button", { name: "Conferir" }));
      await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("BBB2B22 já estava conferido."));
    });

    it("sem entrada: avisa que está nas divergências", async () => {
      const ler = vi.fn().mockResolvedValue(fromLeituraResponse(leituraSemEntrada));
      const { user, onMensagem } = montar(base, { ler });
      await user.click(screen.getByRole("button", { name: "Digitar placa" }));
      await user.type(screen.getByLabelText("Placa"), "ZZZ9Z99");
      await user.click(screen.getByRole("button", { name: "Conferir" }));
      await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("ZZZ9Z99 está sem entrada. Resolva em Divergências.", "error"));
    });

    it("placa inválida: mostra o erro e não envia", async () => {
      const { user, acoes } = montar();
      await user.click(screen.getByRole("button", { name: "Digitar placa" }));
      await user.type(screen.getByLabelText("Placa"), "ABC");
      await user.click(screen.getByRole("button", { name: "Conferir" }));

      expect(await screen.findByText(/Placa inválida/)).toBeInTheDocument();
      expect(acoes.ler).not.toHaveBeenCalled();
    });

    it("falha ao conferir: mostra o erro e mantém a folha aberta", async () => {
      const ler = vi.fn().mockRejectedValue(new Error("Esta conferência foi encerrada."));
      const { user } = montar(base, { ler });
      await user.click(screen.getByRole("button", { name: "Digitar placa" }));
      await user.type(screen.getByLabelText("Placa"), "BBB2B22");
      await user.click(screen.getByRole("button", { name: "Conferir" }));

      expect(await screen.findByText("Esta conferência foi encerrada.")).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Digitar placa" })).toBeInTheDocument();
    });
  });
});
