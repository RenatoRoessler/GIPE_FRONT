import { fireEvent, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { PlanoAdesao } from "@/types/plano";
import { type ConsultaPlanos, PlanoStepFields } from "./PlanoStepFields";

const TRIAL: PlanoAdesao = {
  id: 1,
  tipo: 0,
  nome: "Teste gratuito",
  meses: 1,
  centavosTabela: 0,
  centavosAtual: 0,
  emPromocao: false,
};

const MENSAL_PROMO: PlanoAdesao = {
  id: 2,
  tipo: 1,
  nome: "Mensal",
  meses: 1,
  centavosTabela: 9990,
  centavosAtual: 6990,
  emPromocao: true,
  promocaoAte: "2027-06-30",
};

const MENSAL_SEM_DATA: PlanoAdesao = { ...MENSAL_PROMO, promocaoAte: undefined };
const MENSAL: PlanoAdesao = { ...MENSAL_PROMO, centavosAtual: 9990, emPromocao: false, promocaoAte: undefined };

function consulta(parcial: Partial<ConsultaPlanos> = {}): ConsultaPlanos {
  return { status: "success", dados: [TRIAL, MENSAL_PROMO], refazer: () => {}, refazendo: false, ...parcial };
}

function renderar(props: Partial<ComponentProps<typeof PlanoStepFields>> = {}) {
  return renderWithTheme(<PlanoStepFields planos={consulta()} plano={undefined} onChange={() => {}} {...props} />);
}

describe("PlanoStepFields: lista do back-end", () => {
  it("mostra Trial e Mensal na ordem recebida, sem nenhum selecionado", () => {
    renderar();
    const radios = screen.getAllByRole("radio");

    expect(radios.map((radio) => radio.getAttribute("value"))).toEqual(["0", "1"]);
    radios.forEach((radio) => expect(radio).not.toBeChecked());
  });

  it("respeita a ordem da lista, seja ela qual for", () => {
    renderar({ planos: consulta({ dados: [MENSAL_PROMO, TRIAL] }) });
    expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("value"))).toEqual(["1", "0"]);
  });

  it("o teste mostra a duração do back-end e as condições, sem valor em reais", () => {
    renderar();
    const teste = screen.getByRole("radio", { name: /Teste gratuito/ });

    expect(teste).toHaveAccessibleName(expect.stringContaining("1 mês"));
    expect(teste).toHaveAccessibleName(
      expect.stringContaining("Todas as funcionalidades, sem cartão de crédito e sem compromisso."),
    );
    expect(teste).not.toHaveAccessibleName(expect.stringContaining("R$"));
    expect(screen.getByText("1 mês")).toBeInTheDocument();
  });

  it("a duração do teste muda sozinha com o número do back-end", () => {
    renderar({ planos: consulta({ dados: [{ ...TRIAL, meses: 2 }, MENSAL_PROMO] }) });
    expect(screen.getByText("2 meses")).toBeInTheDocument();
  });

  it("em promoção mostra o riscado, o atual, a condição com a data e o selo", () => {
    renderar();
    const mensal = screen.getByRole("radio", { name: /Mensal/ });

    expect(mensal).toHaveAccessibleName("Mensal, de R$ 99,90 por R$ 69,90 por mês, promoção até 30/06/2027");
    const riscado = screen.getByText("R$ 99,90");
    expect(riscado.tagName).toBe("S");
    expect(riscado).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText((_, no) => no?.textContent === "R$ 69,90/mês" && no.children.length === 1)).toBeInTheDocument();
    expect(screen.getByText("R$ 69,90/mês até 30/06/2027; depois, R$ 99,90/mês.")).toBeInTheDocument();
    expect(screen.getByText("Promoção até 30/06/2027")).toBeInTheDocument();
  });

  it("em promoção sem data não cita data nem o preço depois", () => {
    renderar({ planos: consulta({ dados: [TRIAL, MENSAL_SEM_DATA] }) });

    expect(screen.getByText("Promoção")).toBeInTheDocument();
    expect(screen.getByText("R$ 69,90/mês em promoção.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Mensal/ })).not.toHaveAccessibleName(
      expect.stringMatching(/\d{2}\/\d{2}\/\d{4}/),
    );
  });

  it("sem promoção mostra só o valor atual, sem riscado nem selo", () => {
    renderar({ planos: consulta({ dados: [TRIAL, MENSAL] }) });

    expect(document.querySelector("s")).toBeNull();
    expect(screen.queryByText(/Promoção/)).not.toBeInTheDocument();
    expect(screen.getByText("Cobrado todo mês")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Mensal/ })).toHaveAccessibleName(
      "Mensal, R$ 99,90 por mês, cobrado todo mês",
    );
  });

  it("não traz valor, prazo ou regra fixos no código", () => {
    const outro: PlanoAdesao = { ...MENSAL_PROMO, centavosTabela: 8000, centavosAtual: 5000, promocaoAte: "2028-01-15" };
    renderar({ planos: consulta({ dados: [TRIAL, outro] }) });

    expect(screen.getByText("R$ 80,00")).toBeInTheDocument();
    expect(screen.getByText("Promoção até 15/01/2028")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/99,90|69,90|30\/06\/2027|12 meses|30 dias/);
  });

  it("mostra uma opção extra que o back-end passar a devolver", () => {
    const trimestral: PlanoAdesao = { ...MENSAL, id: 3, tipo: 2, nome: "Trimestral", meses: 3 };
    renderar({ planos: consulta({ dados: [TRIAL, MENSAL_PROMO, trimestral] }) });
    expect(screen.getByRole("radio", { name: /Trimestral/ })).toHaveAttribute("value", "2");
  });

  it("marca o plano recebido e avisa a escolha com o tipo numérico", () => {
    const onChange = vi.fn();
    renderar({ plano: 1, onChange });

    expect(screen.getByRole("radio", { name: /Mensal/ })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: /Teste gratuito/ }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("marca o teste quando o plano recebido é 0", () => {
    renderar({ plano: 0 });
    expect(screen.getByRole("radio", { name: /Teste gratuito/ })).toBeChecked();
  });

  it("mostra o erro de validação em role alert", () => {
    renderar({ error: "Escolha um plano para continuar." });
    expect(screen.getByRole("alert")).toHaveTextContent("Escolha um plano para continuar.");
  });
});

describe("PlanoStepFields: carregando e erro", () => {
  it("carregando mostra o status e nenhuma opção", () => {
    renderar({ planos: consulta({ status: "pending", dados: undefined }) });
    expect(screen.getByRole("status")).toHaveTextContent("Carregando planos…");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("erro mostra o aviso e nenhuma opção nem preço", () => {
    renderar({ planos: consulta({ status: "error", dados: undefined }) });
    expect(screen.getByRole("alert")).toHaveTextContent("Não conseguimos carregar os planos");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("R$");
  });

  it("Tentar de novo chama refazer e, durante a tentativa, o botão segue montado e focado", () => {
    const refazer = vi.fn();
    const { rerender } = renderar({ planos: consulta({ status: "error", dados: undefined, refazer }) });
    const botao = screen.getByRole("button", { name: "Tentar de novo" });
    botao.focus();
    fireEvent.click(botao);
    expect(refazer).toHaveBeenCalledTimes(1);

    rerender(
      <PlanoStepFields
        planos={consulta({ status: "error", dados: undefined, refazer, refazendo: true })}
        plano={undefined}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Tentando de novo…" })).toBe(botao);
    expect(botao).toHaveFocus();
  });

  it("depois de carregar, troca o erro pelas opções", () => {
    const { rerender } = renderar({ planos: consulta({ status: "error", dados: undefined }) });
    rerender(<PlanoStepFields planos={consulta()} plano={undefined} onChange={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    ["carregando", { status: "pending", dados: undefined } as const],
    ["erro", { status: "error", dados: undefined } as const],
  ])("mantém a lista das áreas do sistema no estado %s", (_nome, parcial) => {
    renderar({ planos: consulta(parcial) });
    const bloco = screen.getByRole("region", { name: "Tudo isso incluso no plano" });
    expect(within(bloco).getAllByRole("listitem")).toHaveLength(13);
  });
});

describe("PlanoStepFields: áreas do sistema", () => {
  it("lista as 13 áreas do sistema como incluídas no plano", () => {
    renderar();
    const bloco = screen.getByRole("region", { name: "Tudo isso incluso no plano" });

    expect(within(bloco).getAllByRole("listitem")).toHaveLength(13);
    expect(within(bloco).getByText("Quadro de chaves")).toBeInTheDocument();
    expect(within(bloco).getByText("Cada chave no seu gancho, com o gancho livre sugerido na entrada.")).toBeInTheDocument();
    expect(within(bloco).queryByText(/Relatórios|avarias/)).not.toBeInTheDocument();
  });
});
