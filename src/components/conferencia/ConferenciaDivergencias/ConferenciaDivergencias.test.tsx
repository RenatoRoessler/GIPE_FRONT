import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "styled-components";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { conferenciaAberta } from "@/lib/api/services/conferenciaPatio.fixture";
import { fromConferenciaResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { lightTheme } from "@/styles/theme";
import { SITUACAO_ITEM, SITUACAO_SEM_ENTRADA, type Conferencia } from "@/types/conferenciaPatio";
import type { EtapaProps } from "../tipos";

// As folhas têm os seus próprios testes: aqui só importa o que a tela entrega a elas.
vi.mock("../DarSaidaConferenciaModal", () => ({
  DarSaidaConferenciaModal: ({ item, onClose, onConcluida }: { item: { placa: string }; onClose: () => void; onConcluida: (mensagem: string) => void }) => (
    <div role="dialog" aria-label="Dar saída">
      Saída de {item.placa}
      <button type="button" onClick={() => onConcluida("Saída registrada.")}>
        concluir saída
      </button>
      <button type="button" onClick={onClose}>
        fechar saída
      </button>
    </div>
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

import { ConferenciaDivergencias } from "./ConferenciaDivergencias";

const base = fromConferenciaResponse(conferenciaAberta);

function montar(conferencia: Conferencia = base, acoes: Partial<EtapaProps["acoes"]> = {}) {
  const onIr = vi.fn();
  const onMensagem = vi.fn();
  const todas = {
    marcar: vi.fn().mockResolvedValue(null),
    descartar: vi.fn().mockResolvedValue(undefined),
    ...acoes,
  } as unknown as EtapaProps["acoes"];
  const arvore = (c: Conferencia) => (
    <ThemeProvider theme={lightTheme}>
      <ConferenciaDivergencias conferencia={c} acoes={todas} onIr={onIr} onMensagem={onMensagem} />
    </ThemeProvider>
  );
  const utilitarios = render(arvore(conferencia));
  return { onIr, onMensagem, acoes: todas, user: userEvent.setup(), reexibir: (c: Conferencia) => utilitarios.rerender(arvore(c)), ...utilitarios };
}

beforeEach(() => vi.clearAllMocks());

describe("ConferenciaDivergencias", () => {
  it("mostra quantas faltam resolver e as duas seções", () => {
    montar();
    expect(screen.getByRole("heading", { name: "Divergências" })).toBeInTheDocument();
    expect(screen.getByText("2 para resolver")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "No sistema, não está no pátio" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "No pátio, sem entrada" })).toBeInTheDocument();
  });

  it("não encontrado: placa, veículo, entrada com a permanência e as duas ações", () => {
    montar();
    const secao = screen.getByRole("region", { name: "No sistema, não está no pátio" });
    expect(within(secao).getByText("CCC3C33")).toBeInTheDocument();
    expect(within(secao).getByText("CG 125 · Prata")).toBeInTheDocument();
    expect(within(secao).getByText(/Entrada .* no sistema/)).toBeInTheDocument();
    expect(within(secao).getByRole("button", { name: "Procurar de novo: CCC3C33" })).toBeInTheDocument();
    expect(within(secao).getByRole("button", { name: "Dar saída: CCC3C33" })).toBeInTheDocument();
  });

  it("sem entrada: placa, hora da leitura e as duas ações", () => {
    montar();
    const secao = screen.getByRole("region", { name: "No pátio, sem entrada" });
    expect(within(secao).getByText("ZZZ9Z99")).toBeInTheDocument();
    expect(within(secao).getByText("Sem ticket aberto")).toBeInTheDocument();
    expect(within(secao).getByText(/Lida às/)).toBeInTheDocument();
    expect(within(secao).getByRole("button", { name: "Leitura errada: ZZZ9Z99" })).toBeInTheDocument();
    expect(within(secao).getByRole("button", { name: "Registrar entrada: ZZZ9Z99" })).toBeInTheDocument();
  });

  it("cada seção só aparece quando tem itens", () => {
    montar({ ...base, semEntrada: [] });
    expect(screen.queryByRole("region", { name: "No pátio, sem entrada" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "No sistema, não está no pátio" })).toBeInTheDocument();
  });

  it("sem entrada descartada ou resolvida não aparece", () => {
    montar({ ...base, semEntrada: [{ ...base.semEntrada[0], situacao: SITUACAO_SEM_ENTRADA.Descartada }] });
    expect(screen.queryByText("Sem ticket aberto")).not.toBeInTheDocument();
  });

  it("sem divergências: 'Tudo resolvido' e a mensagem de que o pátio bate", () => {
    montar({ ...base, semEntrada: [], itens: base.itens.map((item) => ({ ...item, situacao: SITUACAO_ITEM.Conferido })) });
    expect(screen.getByText("Tudo resolvido")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma divergência. O pátio bate com o sistema.")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("veículo conveniado traz o aviso da fatura", () => {
    montar({ ...base, itens: base.itens.map((item) => (item.situacao === SITUACAO_ITEM.NaoEncontrado ? { ...item, conveniado: true } : item)) });
    expect(screen.getByRole("status")).toHaveTextContent("O valor da saída vai para a fatura da conveniada");
    expect(screen.getByRole("img", { name: "Conveniado" })).toBeInTheDocument();
  });

  it("'Procurar de novo' volta o veículo a pendente", async () => {
    const { user, acoes } = montar();
    await user.click(screen.getByRole("button", { name: "Procurar de novo: CCC3C33" }));
    expect(acoes.marcar).toHaveBeenCalledWith(3, SITUACAO_ITEM.Pendente);
  });

  it("'Leitura errada' descarta a placa", async () => {
    const { user, acoes } = montar();
    await user.click(screen.getByRole("button", { name: "Leitura errada: ZZZ9Z99" }));
    expect(acoes.descartar).toHaveBeenCalledWith("ZZZ9Z99");
  });

  it("falha ao resolver: avisa com a mensagem e mantém o item", async () => {
    const marcar = vi.fn().mockRejectedValue(new Error("Esta conferência foi encerrada."));
    const { user, onMensagem } = montar(base, { marcar });
    await user.click(screen.getByRole("button", { name: "Procurar de novo: CCC3C33" }));
    await waitFor(() => expect(onMensagem).toHaveBeenCalledWith("Esta conferência foi encerrada.", "error"));
    expect(screen.getByText("CCC3C33")).toBeInTheDocument();
  });

  it("'Dar saída' abre a folha do veículo e o aviso de conclusão sobe para a página", async () => {
    const { user, onMensagem } = montar();
    await user.click(screen.getByRole("button", { name: "Dar saída: CCC3C33" }));
    expect(screen.getByRole("dialog", { name: "Dar saída" })).toHaveTextContent("Saída de CCC3C33");

    await user.click(screen.getByRole("button", { name: "concluir saída" }));
    expect(onMensagem).toHaveBeenCalledWith("Saída registrada.");

    await user.click(screen.getByRole("button", { name: "fechar saída" }));
    expect(screen.queryByRole("dialog", { name: "Dar saída" })).not.toBeInTheDocument();
  });

  it("'Registrar entrada' abre a folha da placa", async () => {
    const { user } = montar();
    await user.click(screen.getByRole("button", { name: "Registrar entrada: ZZZ9Z99" }));
    expect(screen.getByRole("dialog", { name: "Registrar entrada" })).toHaveTextContent("Entrada de ZZZ9Z99");
  });

  it("navega: voltar para a conferência e ver o resumo", async () => {
    const { user, onIr } = montar();
    await user.click(screen.getByRole("button", { name: "Voltar para a conferência" }));
    expect(onIr).toHaveBeenLastCalledWith("conferindo");
    await user.click(screen.getByRole("button", { name: "Ver resumo" }));
    expect(onIr).toHaveBeenLastCalledWith("resumo");
  });

  describe("foco depois de resolver", () => {
    it("vai para o cartão que ocupa o lugar do resolvido", async () => {
      const dois = {
        ...base,
        semEntrada: [],
        itens: [
          { ...base.itens[2], patioConferenciaItemId: 31, placa: "CCC3C33" },
          { ...base.itens[2], patioConferenciaItemId: 32, placa: "DDD4D44" },
        ],
      };
      const { user, reexibir } = montar(dois);

      await user.click(screen.getByRole("button", { name: "Procurar de novo: CCC3C33" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "Procurar de novo: CCC3C33" })).not.toBeDisabled());
      reexibir({ ...dois, itens: [{ ...dois.itens[0], situacao: SITUACAO_ITEM.Pendente }, dois.itens[1]] });

      await waitFor(() => expect(screen.getByRole("button", { name: "Procurar de novo: DDD4D44" })).toHaveFocus());
    });

    it("sem mais cartões, o foco vai para 'Ver resumo'", async () => {
      const um = { ...base, semEntrada: [], itens: [base.itens[2]] };
      const { user, reexibir } = montar(um);

      await user.click(screen.getByRole("button", { name: "Procurar de novo: CCC3C33" }));
      reexibir({ ...um, itens: [{ ...um.itens[0], situacao: SITUACAO_ITEM.Pendente }] });

      await waitFor(() => expect(screen.getByRole("button", { name: "Ver resumo" })).toHaveFocus());
    });
  });
});
