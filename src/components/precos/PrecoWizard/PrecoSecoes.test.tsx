import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { validarSecoesPreco, type PrecoSecaoId } from "@/lib/schemas/preco";
import { renderWithTheme } from "@/test/render";
import { TIPO_CATEGORIA, type PrecoFormValues } from "@/types/preco";
import { novoPrecoFormValues } from "../novoPreco";
import { PrecoSecoes } from "./PrecoSecoes";
import { usePrecoForms } from "./usePrecoForms";

const SALVA: PrecoFormValues = {
  info: {
    descricao: "Tarifa padrão",
    tipoRegra: "1",
    inicioVigencia: "2026-11-07T00:00",
    fimVigencia: "",
    toleranciaEntradaMinutos: "0",
    toleranciaAlteracaoFaixaMinutos: "0",
    periodoDiaria: "1440",
    valorDiaria: "100,00",
    valorAdicionalDiaria: "2,00",
    empresaConveniadaId: "",
    ativo: true,
  },
  horarios: [{ diaSemana: "2", horaInicio: "08:00", horaFim: "18:00", dataInicio: "", dataFim: "", ativo: true }],
  faixas: [{ minutosLimite: "60", valor: "15,00", percentualConveniada: "" }],
  categorias: [TIPO_CATEGORIA.Todas],
};

function Harness({ initial, edicao = false }: { initial: PrecoFormValues; edicao?: boolean }) {
  const forms = usePrecoForms(initial);
  const [original] = useState(initial);
  const [aberta, setAberta] = useState<PrecoSecaoId | null>(edicao ? null : "basico");
  return (
    <PrecoSecoes
      forms={forms}
      original={edicao ? original : undefined}
      aberta={aberta}
      onAbrir={setAberta}
      mensagens={validarSecoesPreco(forms.values)}
      visitadas={new Set()}
      falhaSecao={null}
      faixasEditadas
      disabled={false}
      convenios={{ data: [], estado: "pronto" }}
    />
  );
}

function cabecalho(titulo: string) {
  return screen.getByRole("button", { name: new RegExp(titulo) });
}

describe("PrecoSecoes", () => {
  it("renderiza as quatro seções com os campos de cada uma, todos montados", () => {
    renderWithTheme(<Harness initial={novoPrecoFormValues()} />);
    expect(screen.getAllByRole("button", { name: /O básico|Categorias|Quando vale|Quanto cobra/ })).toHaveLength(4);
    expect(cabecalho("O básico")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Descrição")).toBeVisible();
    // Painéis recolhidos continuam montados, só ocultos.
    expect(screen.getByRole("button", { name: "Segunda-feira, 08h", hidden: true })).not.toBeVisible();
    expect(screen.getByText("Faixas de valores")).not.toBeVisible();
  });

  it("abrir uma seção fecha a outra", async () => {
    renderWithTheme(<Harness initial={novoPrecoFormValues()} />);
    await userEvent.click(cabecalho("Quanto cobra"));
    expect(cabecalho("Quanto cobra")).toHaveAttribute("aria-expanded", "true");
    expect(cabecalho("O básico")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByLabelText("Descrição")).not.toBeVisible();
  });

  it("Continuar abre a próxima seção no cadastro e some na última", async () => {
    renderWithTheme(<Harness initial={novoPrecoFormValues()} />);
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(cabecalho("Categorias")).toHaveAttribute("aria-expanded", "true");
    expect(cabecalho("O básico")).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(cabecalho("Quanto cobra"));
    expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
  });

  it("na edição não há Continuar", () => {
    renderWithTheme(<Harness initial={SALVA} edicao />);
    expect(screen.queryByRole("button", { name: "Continuar", hidden: true })).not.toBeInTheDocument();
    expect(cabecalho("O básico")).toHaveAttribute("aria-expanded", "false");
  });

  it("na edição mostra o resumo salvo e, ao mudar um valor, Alterado com antes → depois", async () => {
    renderWithTheme(<Harness initial={SALVA} edicao />);
    expect(screen.getByText("1 degrau · diária R$ 100,00")).toBeInTheDocument();
    expect(screen.queryByText("Alterado")).not.toBeInTheDocument();

    await userEvent.click(cabecalho("Quanto cobra"));
    await userEvent.click(screen.getByRole("button", { name: "Aumentar valor da diária" }));

    const item = cabecalho("Quanto cobra");
    expect(screen.getAllByText("Alterado")).toHaveLength(1);
    expect(within(item).getByText("R$ 100,00")).toBeInTheDocument();
    expect(within(item).getByText("R$ 101,00")).toBeInTheDocument();
    expect(item).toHaveTextContent("Valor da diária: R$ 100,00 → R$ 101,00");
  });

  it("marca as seções: número quando pendente, ✓ quando pronta", () => {
    renderWithTheme(<Harness initial={{ ...novoPrecoFormValues(), categorias: [TIPO_CATEGORIA.Moto] }} />);
    expect(within(cabecalho("Categorias")).getByRole("img", { name: "Seção pronta" })).toBeInTheDocument();
    expect(within(cabecalho("O básico")).getByRole("img", { name: "Seção 1" })).toBeInTheDocument();
    expect(within(cabecalho("Quando vale")).getByRole("img", { name: "Seção 3" })).toBeInTheDocument();
  });
});
