import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { STATUS_SERVICO, type ItemFila } from "@/types/servico";
import { FilaTempo } from "./FilaTempo";

const AGORA = new Date("2026-11-14T15:00:00").getTime();
// Horário local, sem fuso: é como a API manda e como o componente lê.
const atras = (minutos: number) => {
  const data = new Date(AGORA - minutos * 60_000);
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}T${dois(data.getHours())}:${dois(data.getMinutes())}:00`;
};

const item = (status: ItemFila["status"], extra: Partial<ItemFila> = {}): ItemFila => ({
  patioServicoId: 1,
  idPatio: 10,
  nomeServico: "Lavagem completa",
  status,
  placa: "RTZ4E21",
  modelo: null,
  cor: null,
  categoria: null,
  prisma: null,
  entradaEm: null,
  ...extra,
});

describe("FilaTempo: Na fila", () => {
  it("mostra há quanto tempo espera e quanto leva", () => {
    renderWithProviders(<FilaTempo item={item(STATUS_SERVICO.Aguardando, { criadoEm: atras(12), duracaoMinutos: 60 })} agora={AGORA} />);

    expect(screen.getByText("12 min")).toBeInTheDocument();
    expect(screen.getByText("leva ~1 h")).toBeInTheDocument();
  });

  it("sem duração prevista, diz 'sem previsão'", () => {
    renderWithProviders(<FilaTempo item={item(STATUS_SERVICO.Aguardando, { criadoEm: atras(5) })} agora={AGORA} />);

    expect(screen.getByText("sem previsão")).toBeInTheDocument();
  });

  it("sem nenhum dado do back, não mostra nada", () => {
    const { container } = renderWithProviders(<FilaTempo item={item(STATUS_SERVICO.Aguardando)} agora={AGORA} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("só a duração, sem o momento em que entrou na fila, mostra só o que leva", () => {
    renderWithProviders(<FilaTempo item={item(STATUS_SERVICO.Aguardando, { duracaoMinutos: 30 })} agora={AGORA} />);

    expect(screen.getByText("leva ~30 min")).toBeInTheDocument();
    expect(screen.queryByText(/Na fila há/)).not.toBeInTheDocument();
  });
});

describe("FilaTempo: Em andamento", () => {
  const emAndamento = (decorrido: number, duracao: number | null) =>
    item(STATUS_SERVICO.EmExecucao, { iniciadoEm: atras(decorrido), duracaoMinutos: duracao });

  it("mostra a hora de início, o tempo decorrido, a previsão de término e a barra de progresso", () => {
    renderWithProviders(<FilaTempo item={emAndamento(30, 60)} agora={AGORA} />);

    expect(screen.getByText(/Iniciado às/)).toHaveTextContent("Iniciado às 14:30 · há 30 min");
    expect(screen.getByText(/termina ~/)).toHaveTextContent("termina ~15:30");
    expect(screen.getByRole("progressbar", { name: "Andamento de Lavagem completa: 50%" })).toHaveAttribute("aria-valuenow", "50");
    expect(screen.queryByText(/Passou/)).not.toBeInTheDocument();
  });

  it("passou da previsão: diz quanto passou, em texto", () => {
    renderWithProviders(<FilaTempo item={emAndamento(80, 60)} agora={AGORA} />);

    expect(screen.getByText("Passou 20 min da previsão")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("sem duração, mostra o início e o decorrido, sem previsão, barra nem atraso", () => {
    renderWithProviders(<FilaTempo item={emAndamento(500, null)} agora={AGORA} />);

    expect(screen.getByText(/Iniciado às/)).toBeInTheDocument();
    expect(screen.queryByText(/termina/)).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/Passou/)).not.toBeInTheDocument();
  });

  it("sem o momento de início, não mostra nada", () => {
    const { container } = renderWithProviders(<FilaTempo item={item(STATUS_SERVICO.EmExecucao, { duracaoMinutos: 60 })} agora={AGORA} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("FilaTempo: Pronto", () => {
  it("mostra a hora em que ficou pronto e há quanto tempo aguarda a retirada", () => {
    renderWithProviders(<FilaTempo item={item(STATUS_SERVICO.Pronto, { prontoEm: atras(26) })} agora={AGORA} />);

    expect(screen.getByText(/Pronto às/)).toHaveTextContent("Pronto às 14:34");
    expect(screen.getByText("aguardando retirada há 26 min")).toBeInTheDocument();
  });

  it("sem a hora em que ficou pronto, não mostra nada", () => {
    const { container } = renderWithProviders(<FilaTempo item={item(STATUS_SERVICO.Pronto)} agora={AGORA} />);

    expect(container).toBeEmptyDOMElement();
  });
});
