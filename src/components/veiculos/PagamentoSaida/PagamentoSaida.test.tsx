import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { CATEGORIA_VEICULO } from "@/types/veiculo";
import type { SaidaConsulta } from "@/types/saida";
import { FORMA_DINHEIRO, FORMAS_SAIDA } from "../saida";
import type { MeiosPagamento } from "../useMeiosPagamento";
import {
  DIGITE_VALOR_HINT,
  ESCOLHA_ATALHO_MESSAGE,
  MEIO_UNICO_HINT,
  PagamentoSaida,
  SEM_MEIOS_MESSAGE,
  type PagamentoSaidaProps,
} from "./PagamentoSaida";

const consulta = {
  patioId: 1,
  placa: "BRA2E19",
  categoria: CATEGORIA_VEICULO.CarroMedio,
  valor: 12.5,
} as SaidaConsulta;

const forma = (label: string) => FORMAS_SAIDA.find((item) => item.label === label)!.value;

// Só os rádios das formas de pagamento (os atalhos de valor também são rádios).
const formasDePagamento = () => within(screen.getByRole("group", { name: "Forma de pagamento" })).getAllByRole("radio");
const rotulo = (radio: HTMLElement) => radio.closest("label")?.textContent;

function renderPagamento(props: Partial<PagamentoSaidaProps> = {}) {
  const handlers = { onFormaChange: vi.fn(), onRecebidoChange: vi.fn(), onAtalhoChange: vi.fn(), onEnter: vi.fn() };
  renderWithTheme(
    <PagamentoSaida consulta={consulta} forma={FORMA_DINHEIRO} recebido="" atalho={null} {...handlers} {...props} />,
  );
  return handlers;
}

describe("PagamentoSaida", () => {
  it("oferece Dinheiro, Crédito, Débito e Pix, com a forma atual marcada", () => {
    renderPagamento();
    expect(screen.getByRole("group", { name: "Forma de pagamento" })).toBeInTheDocument();
    expect(formasDePagamento().map(rotulo)).toEqual(["Dinheiro", "Crédito", "Débito", "Pix"]);
    expect(screen.getByRole("radio", { name: "Dinheiro" })).toBeChecked();
  });

  it("troca a forma de pagamento", () => {
    const { onFormaChange } = renderPagamento();
    fireEvent.click(screen.getByRole("radio", { name: "Pix" }));
    expect(onFormaChange).toHaveBeenCalledWith(forma("Pix"));
  });

  it("em Dinheiro oferece os atalhos e orienta a escolher enquanto nada foi escolhido", () => {
    renderPagamento();
    const grupo = within(screen.getByRole("group", { name: "Cliente pagou com" }));
    expect(grupo.getAllByRole("radio").map(rotulo)).toEqual(["Exato", "R$ 50", "R$ 100", "Outro"]);
    expect(screen.getByText(ESCOLHA_ATALHO_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
    expect(screen.queryByText("Troco")).not.toBeInTheDocument();
  });

  it("sugere as próximas notas redondas acima do valor cobrado", () => {
    renderPagamento({ consulta: { ...consulta, valor: 220 } });
    expect(screen.getByRole("radio", { name: "R$ 250" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "R$ 300" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "R$ 200" })).not.toBeInTheDocument();
  });

  it("avisa o atalho tocado", () => {
    const { onAtalhoChange } = renderPagamento({ consulta: { ...consulta, valor: 220 } });
    fireEvent.click(screen.getByRole("radio", { name: "Exato" }));
    fireEvent.click(screen.getByRole("radio", { name: "R$ 250" }));
    fireEvent.click(screen.getByRole("radio", { name: "Outro" }));
    expect(onAtalhoChange.mock.calls.map(([atalho]) => atalho)).toEqual(["exato", 250, "outro"]);
  });

  it("o exato mostra Sem troco", () => {
    renderPagamento({ atalho: "exato", recebido: "R$ 12,50" });
    expect(screen.getByRole("radio", { name: "Exato" })).toBeChecked();
    expect(screen.getByText("Sem troco")).toBeInTheDocument();
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
    expect(screen.queryByText(ESCOLHA_ATALHO_MESSAGE)).not.toBeInTheDocument();
  });

  it("uma nota mostra o troco", () => {
    renderPagamento({ atalho: 50, recebido: "R$ 50,00" });
    expect(screen.getByText("Troco")).toBeInTheDocument();
    expect(screen.getByText(/^R\$\s37,50$/)).toBeInTheDocument();
  });

  it("Outro mostra o campo já focado e orienta enquanto vazio", () => {
    renderPagamento({ atalho: "outro" });
    const campo = screen.getByLabelText("Valor recebido");
    expect(campo).toBeEnabled();
    expect(campo).toHaveFocus();
    expect(screen.getByText(DIGITE_VALOR_HINT)).toBeInTheDocument();
    expect(screen.queryByText(ESCOLHA_ATALHO_MESSAGE)).not.toBeInTheDocument();
  });

  it("Outro com valor menor deixa o campo com erro e diz quanto falta", () => {
    renderPagamento({ atalho: "outro", recebido: "R$ 10,00" });
    expect(screen.getByLabelText("Valor recebido")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/^Faltam R\$\s2,50 para o valor cobrado\.$/)).toBeInTheDocument();
    expect(screen.queryByText("Troco")).not.toBeInTheDocument();
  });

  it("Outro com valor suficiente mostra o troco ao digitar", () => {
    renderPagamento({ atalho: "outro", recebido: "R$ 20,00" });
    expect(screen.getByText("Troco")).toBeInTheDocument();
    expect(screen.getByText(/^R\$\s7,50$/)).toBeInTheDocument();
  });

  it.each(["Crédito", "Débito", "Pix"])("em %s não há atalhos, valor recebido nem troco", (label) => {
    renderPagamento({ forma: forma(label) });
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Cliente pagou com" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Troco|Faltam|Escolha quanto/)).not.toBeInTheDocument();
  });

  it("envia o valor digitado e pede a confirmação com Enter", async () => {
    const { onRecebidoChange, onEnter } = renderPagamento({ atalho: "outro" });
    await userEvent.type(screen.getByLabelText("Valor recebido"), "5{Enter}");
    expect(onRecebidoChange).toHaveBeenCalledWith("R$ 5");
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("sem veículo o pagamento fica visível, porém inativo e sem troco", () => {
    renderPagamento({ consulta: null });
    expect(screen.getByRole("radio", { name: "Pix" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Exato" })).toBeDisabled();
    expect(screen.queryByText(/Troco|Faltam|Escolha quanto/)).not.toBeInTheDocument();
  });

  it("trava tudo durante o envio", () => {
    renderPagamento({ disabled: true, atalho: "outro" });
    expect(screen.getByRole("radio", { name: "Crédito" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Exato" })).toBeDisabled();
    expect(screen.getByLabelText("Valor recebido")).toBeDisabled();
  });
});

const aceitos = (...labels: string[]): MeiosPagamento => ({
  status: "pronto",
  opcoes: FORMAS_SAIDA.filter((item) => labels.includes(item.label)),
});

describe("PagamentoSaida: meios aceitos pela empresa", () => {
  it("mostra só os meios aceitos", () => {
    renderPagamento({ meios: aceitos("Crédito", "Pix"), forma: forma("Crédito") });
    expect(formasDePagamento().map(rotulo)).toEqual(["Crédito", "Pix"]);
    expect(screen.queryByRole("radio", { name: "Dinheiro" })).not.toBeInTheDocument();
    expect(screen.queryByText(MEIO_UNICO_HINT)).not.toBeInTheDocument();
  });

  it("com um único meio mostra o texto de apoio", () => {
    renderPagamento({ meios: aceitos("Pix"), forma: forma("Pix") });
    expect(formasDePagamento()).toHaveLength(1);
    expect(screen.getByRole("radio", { name: "Pix" })).toBeChecked();
    expect(screen.getByText(MEIO_UNICO_HINT)).toBeInTheDocument();
  });

  it("sem Dinheiro aceito não há valor recebido nem troco", () => {
    renderPagamento({ meios: aceitos("Débito", "Pix"), forma: forma("Débito"), recebido: "50" });
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
    expect(screen.queryByText(/Troco|Faltam/)).not.toBeInTheDocument();
  });

  it("com Dinheiro aceito e escolhido ainda pede o valor recebido", () => {
    renderPagamento({ meios: aceitos("Dinheiro", "Pix"), forma: FORMA_DINHEIRO, atalho: "outro" });
    expect(screen.getByLabelText("Valor recebido")).toBeEnabled();
  });

  it("enquanto carrega mostra o esqueleto anunciado e nenhum meio", () => {
    renderPagamento({ meios: { status: "carregando" } });
    expect(screen.getByRole("status", { name: "Carregando meios de pagamento" })).toHaveAttribute("aria-busy", "true");
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
  });

  it("na falha mostra a mensagem e Tentar novamente refaz a busca", () => {
    const refetch = vi.fn();
    renderPagamento({ meios: { status: "erro", mensagem: "Não foi possível conectar ao servidor.", refetch } });
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor.");
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("com todos os meios desligados orienta a revisar em Minha Empresa", () => {
    renderPagamento({ meios: { status: "vazio" } });
    expect(screen.getByRole("alert")).toHaveTextContent(SEM_MEIOS_MESSAGE);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });

  it("troca entre os meios aceitos", () => {
    const { onFormaChange } = renderPagamento({ meios: aceitos("Crédito", "Pix"), forma: forma("Crédito") });
    fireEvent.click(screen.getByRole("radio", { name: "Pix" }));
    expect(onFormaChange).toHaveBeenCalledWith(forma("Pix"));
  });

  it("sem a prop meios continua oferecendo as quatro formas", () => {
    renderPagamento();
    expect(formasDePagamento()).toHaveLength(4);
  });
});
