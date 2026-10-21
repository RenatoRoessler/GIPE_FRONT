import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import {
  CONTRATO_STATUS,
  SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  TIPO_PESSOA,
  type ContratoMensalista,
  type Mensalista,
} from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({
  listAllMensalistas: vi.fn(),
  getContratoMensalista: vi.fn(),
  reenviarContrato: vi.fn(),
}));

import { getContratoMensalista, listAllMensalistas, reenviarContrato } from "@/lib/api/services/mensalista";
import { AgendaView } from "./AgendaView";
import { MENSALISTAS_QUERY_KEY } from "../useTiposMensalidade";

// Quarta-feira, 21/10/2026. Só o Date é falso, para o React Query e o userEvent continuarem com os temporizadores reais.
const HOJE = new Date(2026, 9, 21, 12);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: HOJE });
  vi.mocked(listAllMensalistas).mockReset();
  vi.mocked(getContratoMensalista).mockReset().mockResolvedValue(null);
  vi.mocked(reenviarContrato).mockReset();
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

afterEach(() => {
  vi.useRealTimers();
});

let proximoId = 1;

function mensalista(nome: string, vence: string | null, extra: Partial<Mensalista> = {}): Mensalista {
  return {
    mensalistaId: proximoId++,
    mensalistaTipoId: 3,
    tipoMensal: "Diurno",
    categoria: 99,
    valorMensalidade: 280,
    tipoPessoa: TIPO_PESSOA.Fisica,
    documento: "52998224725",
    nome,
    email: "a@exemplo.com",
    celular: "11912345678",
    diaVencimento: 5,
    ativo: true,
    veiculos: [],
    situacao: "Em Dia",
    dataProximoVencimento: vence,
    diasAteProximoVencimento: null,
    ...extra,
  };
}

const aguardando = (nome: string) =>
  mensalista(nome, null, { ativo: false, situacao: SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO });

const contrato = (extra: Partial<ContratoMensalista> = {}): ContratoMensalista => ({
  status: CONTRATO_STATUS.Aceito,
  versao: "1",
  titulo: "Contrato",
  dataGeracao: null,
  tokenExpiracao: null,
  dataAceite: "2026-10-20T14:32:00",
  ...extra,
});

const resposta = (items: Mensalista[], extra: Partial<{ totalRecords: number; truncado: boolean }> = {}) => ({
  items,
  totalRecords: items.length,
  truncado: false,
  ...extra,
});

const handlers = {
  onNovo: vi.fn(),
  onVerFicha: vi.fn(),
  onReceberPagamento: vi.fn(),
  onVerLista: vi.fn(),
  onToast: vi.fn(),
};

function abrir(items: Mensalista[], extra: Partial<{ totalRecords: number; truncado: boolean }> = {}) {
  vi.mocked(listAllMensalistas).mockResolvedValue(resposta(items, extra));
  return renderWithProviders(<AgendaView {...handlers} />);
}

const titulos = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

describe("AgendaView", () => {
  it("mostra os grupos na ordem e sem os vazios, com o resumo", async () => {
    abrir([
      mensalista("Em dia Silva", "2026-12-10"),
      mensalista("Semana Souza", "2026-10-23", { valorMensalidade: 620 }),
      aguardando("Primeiro Lima"),
      mensalista("Hoje Reis", "2026-10-21", { valorMensalidade: 300 }),
      mensalista("Atrasado Alfa", "2026-10-15", { valorMensalidade: 900 }),
      mensalista("Desativado", null, { ativo: false, situacao: "Inativo" }),
    ]);

    await screen.findByRole("region", { name: "Atrasados" });
    expect(titulos()).toEqual(["Atrasados", "Vencem hoje", "Esta semana", "Ainda sem pagamento"]);
    const resumo = screen.getAllByRole("status").find((el) => el.textContent?.includes("Até domingo, 25/10"));
    expect(resumo).toHaveTextContent("Até domingo, 25/10: 2 mensalistas vencem, somando R$ 920,00.");
    expect(screen.getByText("6 dias de atraso")).toBeInTheDocument();
    expect(screen.queryByText("Em dia Silva")).not.toBeInTheDocument();
    expect(screen.queryByText("Desativado")).not.toBeInTheDocument();
  });

  it("deixa uma linha para os que estão em dia, que leva à lista", async () => {
    abrir([mensalista("Hoje Reis", "2026-10-21"), mensalista("A", "2026-12-10"), mensalista("B", "2026-12-11")]);

    expect(await screen.findByText("2 mensalistas em dia, com vencimento depois de domingo")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ver todos" }));
    expect(handlers.onVerLista).toHaveBeenCalled();
  });

  it("carregando mostra esqueletos num status", () => {
    vi.mocked(listAllMensalistas).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AgendaView {...handlers} />);

    expect(screen.getByRole("status", { name: "Carregando a agenda" })).toBeInTheDocument();
  });

  it("sem nenhum cadastro, convida a cadastrar", async () => {
    abrir([]);

    expect(await screen.findByText("Nenhum mensalista cadastrado.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Novo mensalista" }));
    expect(handlers.onNovo).toHaveBeenCalled();
  });

  it("sem nada a atender, diz isso e leva à lista", async () => {
    abrir([mensalista("Em dia Silva", "2026-12-10")]);

    expect(await screen.findByText("Nenhum mensalista para atender até domingo.")).toBeInTheDocument();
    expect(screen.getByText("Nenhum mensalista vence até domingo, 25/10.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ver todos os mensalistas" }));
    expect(handlers.onVerLista).toHaveBeenCalled();
  });

  it("erro mostra a mensagem do back e deixa tentar de novo", async () => {
    vi.mocked(listAllMensalistas).mockRejectedValueOnce(new ApiError("server", "Instabilidade no servidor.", 500));
    renderWithProviders(<AgendaView {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar a agenda. Instabilidade no servidor.");

    vi.mocked(listAllMensalistas).mockResolvedValue(resposta([mensalista("Hoje Reis", "2026-10-21")]));
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("region", { name: "Vencem hoje" })).toBeInTheDocument();
  });

  it("erro de permissão não oferece tentar de novo", async () => {
    vi.mocked(listAllMensalistas).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    renderWithProviders(<AgendaView {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("avisa quando a carga foi cortada", async () => {
    abrir([mensalista("Hoje Reis", "2026-10-21")], { totalRecords: 1500, truncado: true });

    expect(await screen.findByText("Mostrando os primeiros 1 de 1500 mensalistas. Use a Lista para os demais.")).toBeInTheDocument();
    expect(screen.getByText(/Até domingo, 25\/10/)).toHaveTextContent("(nesta carga)");
  });
});

describe("AgendaView: busca", () => {
  const veiculo = (placa: string) => ({ placa, modelo: "Gol", cor: "PRATA", categoria: 2 as const, condutores: [] });

  async function comDados() {
    abrir([
      mensalista("José da Conceição", "2026-10-15", { documento: "11222333000181", veiculos: [veiculo("ABC1D23")] }),
      mensalista("Maria Souza", "2026-10-22"),
      mensalista("Em dia Silva", "2026-12-10", { documento: "98765432100", veiculos: [veiculo("XYZ9K88")] }),
    ]);
    await screen.findByRole("region", { name: "Atrasados" });
  }

  const buscar = (texto: string) => userEvent.type(screen.getByLabelText("Buscar por nome, placa ou documento"), texto);

  it("filtra por nome, mantendo os grupos e anunciando o resultado", async () => {
    await comDados();
    await buscar("conceicao");

    expect(await screen.findByText("1 encontrado")).toBeInTheDocument();
    expect(titulos()).toEqual(["Atrasados"]);
    expect(screen.queryByText("Maria Souza")).not.toBeInTheDocument();
  });

  it("acha por placa quem está em dia, num grupo à parte", async () => {
    await comDados();
    await buscar("xyz-9k88");

    expect(await screen.findByRole("region", { name: "Em dia" })).toBeInTheDocument();
    expect(screen.getByText("Em dia Silva")).toBeInTheDocument();
    expect(screen.queryByText("José da Conceição")).not.toBeInTheDocument();
  });

  it("acha por documento, mascarado ou não", async () => {
    await comDados();
    await buscar("11.222.333");

    await waitFor(() => expect(screen.queryByText("Maria Souza")).not.toBeInTheDocument());
    expect(screen.getByText("José da Conceição")).toBeInTheDocument();
  });

  it("sem resultado, diz o que foi buscado e deixa limpar", async () => {
    await comDados();
    await buscar("zzzz");

    expect(await screen.findByText("Nada encontrado para “zzzz”.")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(await screen.findByRole("region", { name: "Atrasados" })).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar por nome, placa ou documento")).toHaveValue("");
  });

  it("mostra todos os resultados, sem o corte de cinco", async () => {
    abrir(Array.from({ length: 8 }, (_, i) => mensalista(`Pessoa ${i + 1}`, "2026-10-23")));
    await screen.findByRole("region", { name: "Esta semana" });
    expect(screen.getAllByRole("listitem")).toHaveLength(5);

    await buscar("pessoa");

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(8));
    expect(screen.queryByRole("button", { name: /Ver os outros/ })).not.toBeInTheDocument();
  });
});

describe("AgendaView: ações", () => {
  it("Receber abre o pagamento com o mensalista e a situação do item", async () => {
    const atrasado = mensalista("Atrasado Alfa", "2026-10-15");
    abrir([atrasado]);

    await userEvent.click(await screen.findByRole("button", { name: "Receber de Atrasado Alfa" }));

    expect(handlers.onReceberPagamento).toHaveBeenCalledWith(atrasado, { kind: "ativo" });
  });

  it("quem aguarda o 1º pagamento com contrato aceito recebe com a situação do contrato", async () => {
    const ana = aguardando("Ana Lima");
    vi.mocked(getContratoMensalista).mockResolvedValue(contrato());
    abrir([ana]);

    await userEvent.click(await screen.findByRole("button", { name: "Receber de Ana Lima" }));

    expect(handlers.onReceberPagamento).toHaveBeenCalledWith(ana, { kind: "aguardando-pagamento", aceitoEm: "2026-10-20T14:32:00" });
  });

  it("o nome abre a ficha", async () => {
    const maria = mensalista("Maria Souza", "2026-10-22");
    abrir([maria]);

    await userEvent.click(await screen.findByRole("button", { name: "Ver ficha de Maria Souza" }));

    expect(handlers.onVerFicha).toHaveBeenCalledWith(maria);
  });

  it("contrato com o link vencido oferece reenviar, e o reenvio desabilita só aquele item", async () => {
    const ana = aguardando("Ana Lima");
    const bia = aguardando("Bia Costa");
    vi.mocked(getContratoMensalista).mockResolvedValue(contrato({ status: CONTRATO_STATUS.Pendente, tokenExpiracao: "2026-10-10T10:00:00" }));
    let concluir: (valor: { email: string; tokenExpiracao: string | null }) => void = () => {};
    vi.mocked(reenviarContrato).mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    abrir([ana, bia]);

    await userEvent.click(await screen.findByRole("button", { name: "Reenviar contrato para Ana Lima" }));

    await waitFor(() => expect(reenviarContrato).toHaveBeenCalledWith(ana.mensalistaId));
    expect(screen.getByRole("button", { name: "Reenviar contrato para Ana Lima" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reenviar contrato para Bia Costa" })).toBeEnabled();

    await act(async () => concluir({ email: "ana@exemplo.com", tokenExpiracao: null }));
    await waitFor(() =>
      expect(handlers.onToast).toHaveBeenCalledWith(expect.stringContaining("Novo link enviado para ana@exemplo.com")),
    );
  });

  describe("depois do pagamento", () => {
    async function pagarPrimeiro() {
      const itens = [
        mensalista("Primeiro Atraso", "2026-10-10"),
        mensalista("Segundo Atraso", "2026-10-12"),
        mensalista("Terceiro Atraso", "2026-10-14"),
      ];
      const tela = abrir(itens);
      await userEvent.click(await screen.findByRole("button", { name: "Receber de Primeiro Atraso" }));
      // O modal de pagamento abre: a agenda fica bloqueada até ele fechar.
      tela.rerender(<AgendaView {...handlers} bloqueado />);
      return { tela, itens };
    }

    async function atualizarSem(tela: Awaited<ReturnType<typeof pagarPrimeiro>>["tela"], restantes: Mensalista[]) {
      vi.mocked(listAllMensalistas).mockResolvedValue(resposta(restantes));
      await act(async () => {
        await tela.queryClient.invalidateQueries({ queryKey: MENSALISTAS_QUERY_KEY });
      });
    }

    it("o item sai do grupo, o foco vai para o vizinho e o leitor de tela é avisado", async () => {
      const { tela, itens } = await pagarPrimeiro();
      await atualizarSem(tela, itens.slice(1));
      await waitFor(() => expect(screen.queryByText("Primeiro Atraso")).not.toBeInTheDocument());

      tela.rerender(<AgendaView {...handlers} bloqueado={false} />);

      await waitFor(() => expect(screen.getByRole("button", { name: "Ver ficha de Segundo Atraso" })).toHaveFocus());
      expect(screen.getByText("Primeiro Atraso saiu de Atrasados.")).toBeInTheDocument();
    });

    it("se o grupo acabou, o foco vai para o campo de busca", async () => {
      const unico = mensalista("Único Atraso", "2026-10-10");
      const emDia = mensalista("Em dia Silva", "2026-12-10");
      const tela = abrir([unico, emDia]);
      await userEvent.click(await screen.findByRole("button", { name: "Receber de Único Atraso" }));
      tela.rerender(<AgendaView {...handlers} bloqueado />);
      await atualizarSem(tela, [emDia]);

      tela.rerender(<AgendaView {...handlers} bloqueado={false} />);

      await waitFor(() => expect(screen.getByText("Único Atraso saiu de Atrasados.")).toBeInTheDocument());
      expect(screen.getByLabelText("Buscar por nome, placa ou documento")).toHaveFocus();
    });

    it("se o pagamento foi cancelado e o item continua, o foco não se mexe", async () => {
      const { tela } = await pagarPrimeiro();

      tela.rerender(<AgendaView {...handlers} bloqueado={false} />);

      expect(screen.queryByText(/saiu de/)).not.toBeInTheDocument();
      // O foco continua onde o operador o deixou: no próprio botão que abriu o pagamento.
      expect(within(document.body).getByRole("button", { name: "Receber de Primeiro Atraso" })).toHaveFocus();
    });
  });
});
