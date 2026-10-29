import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { CATEGORIA_VEICULO } from "@/types/veiculo";
import type { SaidaConsulta } from "@/types/saida";
import { FORMA_DINHEIRO, FORMAS_SAIDA } from "../saida";
import type { MeiosPagamento } from "../useMeiosPagamento";
import { MEIO_UNICO_HINT, PagamentoSaida, SEM_MEIOS_MESSAGE, type PagamentoSaidaProps } from "./PagamentoSaida";

const consulta = {
  patioId: 1,
  placa: "BRA2E19",
  categoria: CATEGORIA_VEICULO.CarroMedio,
  valor: 12.5,
} as SaidaConsulta;

const forma = (label: string) => FORMAS_SAIDA.find((item) => item.label === label)!.value;

function renderPagamento(props: Partial<PagamentoSaidaProps> = {}) {
  const handlers = { onFormaChange: vi.fn(), onRecebidoChange: vi.fn(), onEnter: vi.fn() };
  renderWithTheme(<PagamentoSaida consulta={consulta} forma={FORMA_DINHEIRO} recebido="" {...handlers} {...props} />);
  return handlers;
}

describe("PagamentoSaida", () => {
  it("oferece Dinheiro, Crédito, Débito e Pix, com a forma atual marcada", () => {
    renderPagamento();
    expect(screen.getByRole("group", { name: "Forma de pagamento" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((radio) => radio.closest("label")?.textContent)).toEqual([
      "Dinheiro",
      "Crédito",
      "Débito",
      "Pix",
    ]);
    expect(screen.getByRole("radio", { name: "Dinheiro" })).toBeChecked();
  });

  it("troca a forma de pagamento", () => {
    const { onFormaChange } = renderPagamento();
    fireEvent.click(screen.getByRole("radio", { name: "Pix" }));
    expect(onFormaChange).toHaveBeenCalledWith(forma("Pix"));
  });

  it("em Dinheiro pede o valor recebido e orienta enquanto vazio", () => {
    renderPagamento();
    expect(screen.getByLabelText("Valor recebido")).toBeEnabled();
    expect(screen.getByText("Informe o valor recebido.")).toBeInTheDocument();
  });

  it("mostra quanto falta quando o recebido é menor", () => {
    renderPagamento({ recebido: "10,00" });
    expect(screen.getByText(/^Faltam R\$\s2,50\.$/)).toBeInTheDocument();
  });

  it("mostra o troco quando o recebido cobre o valor", () => {
    renderPagamento({ recebido: "20,00" });
    expect(screen.getByText(/^Troco: R\$\s7,50$/)).toBeInTheDocument();
  });

  it.each(["Crédito", "Débito", "Pix"])("em %s não há valor recebido nem troco", (label) => {
    renderPagamento({ forma: forma(label) });
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
    expect(screen.queryByText(/Troco|Faltam|Informe o valor/)).not.toBeInTheDocument();
  });

  it("envia o valor digitado e pede a confirmação com Enter, sem tirar o foco do campo atual", async () => {
    const { onRecebidoChange, onEnter } = renderPagamento();
    const campo = screen.getByLabelText("Valor recebido");
    expect(campo).not.toHaveFocus();
    await userEvent.type(campo, "5{Enter}");
    expect(onRecebidoChange).toHaveBeenCalledWith("R$ 5");
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("sem veículo o pagamento fica visível, porém inativo e sem troco", () => {
    renderPagamento({ consulta: null });
    expect(screen.getByRole("radio", { name: "Pix" })).toBeDisabled();
    expect(screen.getByLabelText("Valor recebido")).toBeDisabled();
    expect(screen.queryByText(/Troco|Faltam|Informe o valor/)).not.toBeInTheDocument();
  });

  it("trava tudo durante o envio", () => {
    renderPagamento({ disabled: true });
    expect(screen.getByRole("radio", { name: "Crédito" })).toBeDisabled();
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
    expect(screen.getAllByRole("radio").map((radio) => radio.closest("label")?.textContent)).toEqual(["Crédito", "Pix"]);
    expect(screen.queryByRole("radio", { name: "Dinheiro" })).not.toBeInTheDocument();
    expect(screen.queryByText(MEIO_UNICO_HINT)).not.toBeInTheDocument();
  });

  it("com um único meio mostra o texto de apoio", () => {
    renderPagamento({ meios: aceitos("Pix"), forma: forma("Pix") });
    expect(screen.getAllByRole("radio")).toHaveLength(1);
    expect(screen.getByRole("radio", { name: "Pix" })).toBeChecked();
    expect(screen.getByText(MEIO_UNICO_HINT)).toBeInTheDocument();
  });

  it("sem Dinheiro aceito não há valor recebido nem troco", () => {
    renderPagamento({ meios: aceitos("Débito", "Pix"), forma: forma("Débito"), recebido: "50" });
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
    expect(screen.queryByText(/Troco|Faltam/)).not.toBeInTheDocument();
  });

  it("com Dinheiro aceito e escolhido ainda pede o valor recebido", () => {
    renderPagamento({ meios: aceitos("Dinheiro", "Pix"), forma: FORMA_DINHEIRO });
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
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });
});
