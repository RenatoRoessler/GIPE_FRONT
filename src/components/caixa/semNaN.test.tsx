import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "@/styles/theme";
import type { Caixa, Movimento, Turno, TurnoFormaPagamento } from "@/types/caixa";

vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => ({ user: { name: "Maria", perfil: 1 }, isLoading: false }) }));
vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn().mockResolvedValue({ company: { razaoSocial: "Central", cnpj: "66326569000150" } }) }));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { formatMoeda } from "./format";
import { FormasPagamentoTabela } from "./FormasPagamentoTabela";
import { GavetaResumo } from "./GavetaResumo";
import { GraficosCaixa } from "./GraficosCaixa";
import { LinhaDoTempo } from "./LinhaDoTempo";
import { MovimentosLista } from "./MovimentosLista";
import { montarLinhaDoTempo } from "./eventosCaixa";
import { montarComprovanteTurno, montarExtrato } from "./pdf/modelos";
import { ResumoFechamento } from "./ResumoFechamento";
import { TurnoAtual } from "./TurnoAtual";
import { calcularGaveta } from "./gaveta";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

// Tudo o que é número vem quebrado: a API pode mandar campo ausente (undefined), null ou NaN em qualquer um.
const NAN = Number.NaN;
const SEM = undefined as unknown as number;

function formaQuebrada(extra: Partial<TurnoFormaPagamento> = {}): TurnoFormaPagamento {
  return { formaPagamento: 1, entradas: SEM, saidas: NAN, valorEsperado: SEM, valorInformado: NAN, diferenca: NAN, ...extra };
}

const turnoQuebrado: Turno = {
  turnoId: 1,
  caixaId: 1,
  usuarioId: 1,
  usuario: "Ana",
  usuarioIdFechamento: null,
  dataHoraInicio: "2026-10-23T08:00:00",
  dataHoraFim: "2026-10-23T18:00:00",
  valorFundoCaixa: SEM,
  status: 1,
  saldoCaixa: NAN,
  totalEntradas: NAN,
  totalSaidas: SEM,
  totalSaida: NAN,
  saldoCaixaInformado: NAN,
  totalDiferenca: NAN,
  observacao: null,
  disponivelSangria: NAN,
  formasPagamento: [formaQuebrada(), formaQuebrada({ formaPagamento: 2 })],
};

const caixaQuebrado: Caixa = {
  caixaId: 1,
  dataHoraAbertura: "2026-10-23T08:00:00",
  valorFundoCaixa: SEM,
  valorTotalEntrada: NAN,
  valorTotalSaida: SEM,
  saldoAtual: NAN,
};

const movimentosQuebrados: Movimento[] = [
  { movimentoId: 1, dataHora: "2026-10-23T09:00:00", tipo: "entrada", valor: NAN, formaPagamento: 1, turnoId: 1, usuario: "Ana", motivo: null },
  { movimentoId: 2, dataHora: "2026-10-23T10:00:00", tipo: "sangria", valor: SEM, formaPagamento: null, turnoId: 1, usuario: "Ana", motivo: "x" },
  { movimentoId: 3, dataHora: "2026-10-23T11:00:00", tipo: "saida", valor: NAN, formaPagamento: 2, turnoId: 1, usuario: "Ana", motivo: null },
];

function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}

const renderizar = (ui: ReactNode) => render(ui, { wrapper: Providers });
const semNaN = () => expect(document.body.textContent).not.toMatch(/NaN|undefined|Infinity/);

describe("formatMoeda", () => {
  it("número válido sai em reais", () => {
    expect(formatMoeda(1234.5)).toMatch(/^R\$\s1\.234,50$/);
    expect(formatMoeda(0)).toMatch(/^R\$\s0,00$/);
    expect(formatMoeda(-5)).toContain("5,00");
  });

  it.each([[NaN], [Infinity], [-Infinity], [undefined], [null]])("%s vira traço, nunca R$ NaN", (valor) => {
    expect(formatMoeda(valor as number | null | undefined)).toBe("—");
  });
});

describe("caixa: nenhuma tela mostra NaN com dados quebrados", () => {
  it("gaveta", () => {
    renderizar(<GavetaResumo caixa={caixaQuebrado} turno={turnoQuebrado} onRetirada={vi.fn()} />);
    semNaN();
    expect(screen.getByText("Na gaveta agora")).toBeInTheDocument();
  });

  it("gaveta sem turno", () => {
    renderizar(<GavetaResumo caixa={caixaQuebrado} turno={null} onRetirada={vi.fn()} />);
    semNaN();
  });

  it("turno atual e tabela por forma de pagamento", () => {
    renderizar(<TurnoAtual turno={turnoQuebrado} />);
    semNaN();
    expect(screen.getAllByRole("row").length).toBeGreaterThan(2);
  });

  it("tabela sozinha, sem nenhuma entrada válida: barras com largura 0", () => {
    const { container } = renderizar(<FormasPagamentoTabela formas={[formaQuebrada(), formaQuebrada({ formaPagamento: 2 })]} />);
    semNaN();
    for (const barra of container.querySelectorAll('span[aria-hidden="true"] > span')) {
      expect(barra).toHaveStyle({ width: "0%" });
    }
  });

  it("lista de movimentos", () => {
    renderizar(<MovimentosLista movimentos={movimentosQuebrados} />);
    semNaN();
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });

  it("gráficos", () => {
    renderizar(<GraficosCaixa movimentos={movimentosQuebrados} />);
    semNaN();
  });

  it("linha do tempo", () => {
    renderizar(<LinhaDoTempo eventos={montarLinhaDoTempo(caixaQuebrado, [turnoQuebrado], movimentosQuebrados)} />);
    semNaN();
  });

  it("resumo de fechamento", () => {
    renderizar(<ResumoFechamento tipo="fechamento" turno={turnoQuebrado} onConcluir={vi.fn()} />);
    semNaN();
  });
});

describe("caixa: gaveta e PDFs com dados quebrados", () => {
  it("a conta da gaveta cai em null em vez de NaN", () => {
    const gaveta = calcularGaveta(turnoQuebrado);
    expect(gaveta.naGaveta).toBeNull();
    expect(gaveta.retiravel).toBeNull();
  });

  it("os textos dos PDFs não trazem NaN", () => {
    const comprovante = JSON.stringify(montarComprovanteTurno({ tipo: "fechamento", turno: turnoQuebrado }));
    const extrato = JSON.stringify(montarExtrato({ caixa: caixaQuebrado, movimentos: movimentosQuebrados }));
    expect(comprovante).not.toMatch(/NaN|undefined/);
    expect(extrato).not.toMatch(/NaN|undefined/);
  });
});
