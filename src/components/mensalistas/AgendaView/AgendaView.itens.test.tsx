import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import {
  TIPO_PESSOA,
  type AgendaGrupoData,
  type AgendaGrupoId,
  type AgendaItemData,
  type Mensalista,
  type MensalistaVeiculo,
  type SituacaoMensalista,
} from "@/types/mensalista";
import { AgendaGrupo, AgendaItem, AgendaResumo } from ".";

// Quarta-feira, 21/10/2026.
const HOJE = new Date(2026, 9, 21);

const veiculo = (placa: string): MensalistaVeiculo => ({ placa, modelo: "Gol", cor: "PRATA", categoria: 2, condutores: [] });

function mensalista(extra: Partial<Mensalista> = {}): Mensalista {
  return {
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
    ativo: true,
    veiculos: [],
    situacao: "Em Dia",
    dataProximoVencimento: null,
    diasAteProximoVencimento: null,
    ...extra,
  };
}

function item(
  grupo: AgendaGrupoId,
  vence: Date | null,
  extra: { mensalista?: Partial<Mensalista>; situacao?: SituacaoMensalista; diasAtraso?: number } = {},
): AgendaItemData {
  return {
    mensalista: mensalista(extra.mensalista),
    grupo,
    situacao: extra.situacao ?? { kind: "ativo" },
    vence,
    diasAtraso: extra.diasAtraso ?? 0,
  };
}

const handlers = { onVerFicha: vi.fn(), onAcao: vi.fn() };

function renderItem(data: AgendaItemData, props: { reenviando?: boolean } = {}) {
  return renderWithTheme(
    <ul>
      <AgendaItem item={data} hoje={HOJE} {...handlers} {...props} />
    </ul>,
  );
}

describe("AgendaItem", () => {
  it("atrasado: data, atraso em texto, nome, tipo, placas e valor", () => {
    renderItem(
      item("atrasados", new Date(2026, 9, 15), {
        diasAtraso: 6,
        mensalista: { veiculos: [veiculo("ABC1D23"), veiculo("BRA2E19"), veiculo("XYZ9K88")], valorMensalidade: 900 },
      }),
    );

    expect(screen.getByText("15/10")).toBeInTheDocument();
    expect(screen.getByText("6 dias de atraso")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver ficha de Maria Souza" })).toHaveTextContent("Maria Souza");
    expect(screen.getByText("Diurno · Todas")).toBeInTheDocument();
    expect(screen.getByText("ABC1D23")).toBeInTheDocument();
    expect(screen.getByText("BRA2E19")).toBeInTheDocument();
    expect(screen.queryByText("XYZ9K88")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("R$ 900,00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Receber de Maria Souza" })).toHaveTextContent("Receber");
  });

  it("um dia de atraso fica no singular", () => {
    renderItem(item("atrasados", new Date(2026, 9, 20), { diasAtraso: 1 }));
    expect(screen.getByText("1 dia de atraso")).toBeInTheDocument();
  });

  it("sem veículos não mostra placas nem quebra", () => {
    renderItem(item("hoje", HOJE));
    expect(screen.queryByText(/^[A-Z]{3}\d/)).not.toBeInTheDocument();
    expect(screen.getByText("hoje")).toBeInTheDocument();
  });

  it.each([
    ["amanhã", new Date(2026, 9, 22), "quinta"],
    ["no sábado", new Date(2026, 9, 24), "sábado"],
    ["na semana que vem", new Date(2026, 9, 28), "em 7 dias"],
    ["em um mês", new Date(2026, 10, 20), "em 30 dias"],
  ])("o vencimento %s diz %s", (_nome, vence, esperado) => {
    renderItem(item("semana", vence));
    expect(screen.getByText(esperado)).toBeInTheDocument();
  });

  it("sem data de vencimento mostra um traço e o motivo", () => {
    renderItem(item("em-dia", null));
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Sem cobrança")).toBeInTheDocument();
    renderItem(item("inativos", null, { mensalista: { ativo: false, nome: "Pedro" } }));
    expect(screen.getByText("Inativo")).toBeInTheDocument();
  });

  it("1º pagamento: selo no lugar da data, fato do contrato e Receber como ação", () => {
    renderItem(
      item("sem-pagamento", null, {
        mensalista: { ativo: false },
        situacao: { kind: "aguardando-pagamento", aceitoEm: "2026-10-20T14:32:00" },
      }),
    );

    expect(screen.getByText("1º pagamento")).toBeInTheDocument();
    expect(screen.getByText(/Contrato aceito em/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Receber de Maria Souza" })).toBeInTheDocument();
  });

  it.each([
    [{ kind: "aguardando-aceite", expiraEm: "2026-10-27T10:00:00" } as SituacaoMensalista, "Contrato", "Reenviar contrato para Maria Souza", "Reenviar"],
    [{ kind: "link-vencido" } as SituacaoMensalista, "Link vencido", "Reenviar contrato para Maria Souza", "Reenviar"],
    [{ kind: "sem-contrato" } as SituacaoMensalista, "Sem contrato", "Enviar contrato para Maria Souza", "Enviar contrato"],
  ])("contrato travado (%o): sem Receber, com a ação de contrato", (situacao, selo, nomeAcessivel, rotulo) => {
    renderItem(item("sem-pagamento", null, { mensalista: { ativo: false }, situacao }));

    expect(screen.getByText(selo)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Receber/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: nomeAcessivel })).toHaveTextContent(rotulo);
  });

  it("enquanto o contrato é consultado, não oferece ação", () => {
    renderItem(item("sem-pagamento", null, { mensalista: { ativo: false }, situacao: { kind: "carregando" } }));

    expect(screen.queryByRole("button", { name: /Receber|Reenviar|Enviar/ })).not.toBeInTheDocument();
  });

  it("o nome abre a ficha e a ação entrega o item", async () => {
    handlers.onVerFicha.mockReset();
    handlers.onAcao.mockReset();
    const dados = item("atrasados", new Date(2026, 9, 15), { diasAtraso: 6 });
    renderItem(dados);

    await userEvent.click(screen.getByRole("button", { name: "Ver ficha de Maria Souza" }));
    expect(handlers.onVerFicha).toHaveBeenCalledWith(dados.mensalista);

    await userEvent.click(screen.getByRole("button", { name: "Receber de Maria Souza" }));
    expect(handlers.onAcao).toHaveBeenCalledWith(dados, "receber");
  });

  it("reenviando: o botão fica desabilitado e diz o que acontece", () => {
    renderItem(
      item("sem-pagamento", null, { mensalista: { ativo: false }, situacao: { kind: "link-vencido" } }),
      { reenviando: true },
    );

    expect(screen.getByRole("button", { name: "Reenviar contrato para Maria Souza" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reenviar contrato para Maria Souza" })).toHaveTextContent("Reenviando…");
  });
});

function grupo(id: AgendaGrupoId, quantos: number, titulo = "Grupo"): AgendaGrupoData {
  return {
    id,
    titulo,
    itens: Array.from({ length: quantos }, (_, i) =>
      item(id, new Date(2026, 9, 22 + (i % 3)), { mensalista: { mensalistaId: i + 1, nome: `Pessoa ${i + 1}` }, diasAtraso: id === "atrasados" ? i + 1 : 0 }),
    ),
  };
}

function renderGrupo(data: AgendaGrupoData, semLimite = false) {
  return renderWithTheme(<AgendaGrupo grupo={data} hoje={HOJE} semLimite={semLimite} {...handlers} />);
}

describe("AgendaGrupo", () => {
  it("é uma seção nomeada pelo título, com a contagem e os itens em lista", () => {
    renderGrupo(grupo("hoje", 2, "Vencem hoje"));

    const secao = screen.getByRole("region", { name: "Vencem hoje" });
    expect(within(secao).getByRole("heading", { name: "Vencem hoje" })).toBeInTheDocument();
    expect(within(secao).getAllByRole("listitem")).toHaveLength(2);
    expect(within(secao).getByText("2")).toBeInTheDocument();
  });

  it("atrasados mostram todos, mesmo passando de cinco", () => {
    renderGrupo(grupo("atrasados", 8, "Atrasados"));

    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.queryByRole("button", { name: /Ver os outros/ })).not.toBeInTheDocument();
  });

  it("esta semana mostra cinco e deixa o resto atrás de um botão que alterna", async () => {
    renderGrupo(grupo("semana", 8, "Esta semana"));

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("5 de 8")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ver os outros 3" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getByRole("button", { name: "Mostrar menos" })).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByRole("button", { name: "Mostrar menos" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("com cinco ou menos não há botão", () => {
    renderGrupo(grupo("semana", 5, "Esta semana"));
    expect(screen.queryByRole("button", { name: /Ver os outros/ })).not.toBeInTheDocument();
  });

  it("numa busca mostra todos os resultados", () => {
    renderGrupo(grupo("sem-pagamento", 8, "Ainda sem pagamento"), true);
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
  });

  it("reenviando desabilita só o item daquele mensalista", () => {
    const dados = grupo("sem-pagamento", 2, "Ainda sem pagamento");
    dados.itens.forEach((it) => {
      it.situacao = { kind: "link-vencido" };
    });
    renderWithTheme(<AgendaGrupo grupo={dados} hoje={HOJE} reenviandoId={2} {...handlers} />);

    expect(screen.getByRole("button", { name: "Reenviar contrato para Pessoa 2" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reenviar contrato para Pessoa 1" })).toBeEnabled();
  });
});

describe("AgendaResumo", () => {
  const ate = new Date(2026, 9, 25);

  it("diz quantos vencem até domingo e o total", () => {
    renderWithTheme(<AgendaResumo resumo={{ quantidade: 7, total: 3640, ate }} />);

    const frase = screen.getByRole("status");
    expect(frase).toHaveTextContent("Até domingo, 25/10: 7 mensalistas vencem, somando R$ 3.640,00.");
    expect(frase).toHaveTextContent("Até domingo: 7 vencem, R$ 3.640,00");
  });

  it("usa o singular com um mensalista", () => {
    renderWithTheme(<AgendaResumo resumo={{ quantidade: 1, total: 280, ate }} />);

    expect(screen.getByRole("status")).toHaveTextContent("1 mensalista vence, somando R$ 280,00.");
    expect(screen.getByRole("status")).toHaveTextContent("Até domingo: 1 vence, R$ 280,00");
  });

  it("sem vencimentos diz isso em vez de mostrar zero", () => {
    renderWithTheme(<AgendaResumo resumo={{ quantidade: 0, total: 0, ate }} />);

    expect(screen.getByRole("status")).toHaveTextContent("Nenhum mensalista vence até domingo, 25/10.");
    expect(screen.getByRole("status")).not.toHaveTextContent("R$");
  });

  it("avisa quando o total vale só para o que foi carregado", () => {
    renderWithTheme(<AgendaResumo resumo={{ quantidade: 2, total: 560, ate }} truncado />);

    expect(screen.getByRole("status")).toHaveTextContent("(nesta carga)");
  });
});
