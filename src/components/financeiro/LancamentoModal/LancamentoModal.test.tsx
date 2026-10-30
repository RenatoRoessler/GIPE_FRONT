import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { formatDataInput } from "@/lib/periodo";
import { renderWithProviders } from "@/test/render";
import type { Turno } from "@/types/caixa";
import type { FinanceiroCategoria, Lancamento } from "@/types/financeiro";

vi.mock("@/lib/api/services/financeiro", () => ({
  listCategorias: vi.fn(),
  getLancamento: vi.fn(),
  createLancamento: vi.fn(),
  updateLancamento: vi.fn(),
  cancelarLancamento: vi.fn(),
}));

vi.mock("@/lib/api/services/caixa", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/services/caixa")>()),
  getTurnoAtual: vi.fn(),
}));

import { getTurnoAtual } from "@/lib/api/services/caixa";
import { createLancamento, getLancamento, listCategorias, updateLancamento } from "@/lib/api/services/financeiro";
import { LancamentoModal } from "./LancamentoModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const HOJE = formatDataInput(new Date());

function cat(id: number, nome: string, tipo: 1 | 2, extra: Partial<FinanceiroCategoria> = {}): FinanceiroCategoria {
  return { financeiroCategoriaId: id, nome, tipo, financeiroCategoriaPaiId: null, categoriaPai: null, ativo: true, ...extra };
}

const categorias = [
  cat(1, "Outras receitas", 1),
  cat(2, "Despesas fixas", 2),
  cat(3, "Energia", 2, { financeiroCategoriaPaiId: 2, categoriaPai: "Despesas fixas" }),
  cat(4, "Antiga", 2, { ativo: false }),
];

// Fundo de R$ 100 e R$ 214 em dinheiro: R$ 314 na gaveta.
function turno(extra: Partial<Turno> = {}): Turno {
  return {
    turnoId: 1,
    caixaId: 1,
    usuarioId: 1,
    usuario: "Ana",
    usuarioIdFechamento: null,
    dataHoraInicio: "2026-10-30T07:00:00",
    dataHoraFim: null,
    valorFundoCaixa: 100,
    status: 1,
    saldoCaixa: 0,
    totalEntradas: null,
    totalSaidas: null,
    totalSaida: null,
    saldoCaixaInformado: null,
    totalDiferenca: null,
    observacao: null,
    disponivelSangria: null,
    formasPagamento: [{ formaPagamento: 1, valorEsperado: 214 } as Turno["formasPagamento"][number]],
    ...extra,
  };
}

const existente: Lancamento = {
  financeiroLancamentoId: 7,
  financeiroCategoriaId: 3,
  categoria: "Energia",
  categoriaPai: "Despesas fixas",
  tipo: 2,
  descricao: "Conta de luz",
  valor: 450,
  dataPagamento: "2026-10-22",
  formaPagamento: 2,
  favorecido: "Cia. Elétrica",
  documento: null,
  observacao: null,
  peloCaixa: false,
  cancelado: false,
  canceladoPor: null,
};

const handlers = { onClose: vi.fn(), onSuccess: vi.fn(), onCancelar: vi.fn(), onCriarCategoria: vi.fn() };

beforeEach(() => {
  vi.mocked(listCategorias).mockReset().mockResolvedValue(categorias);
  vi.mocked(getLancamento).mockReset();
  vi.mocked(createLancamento).mockReset();
  vi.mocked(updateLancamento).mockReset();
  vi.mocked(getTurnoAtual).mockReset().mockResolvedValue(turno());
  Object.values(handlers).forEach((funcao) => funcao.mockReset());
});

async function preencher(user: ReturnType<typeof userEvent.setup>, valor = "450,00") {
  // As categorias chegam depois da janela: espera a opção existir antes de escolhê-la.
  await screen.findByRole("option", { name: "↳ Energia" });
  await user.selectOptions(screen.getByLabelText("Categoria"), "3");
  await user.type(screen.getByLabelText("Descrição"), "Conta de luz");
  await user.type(screen.getByLabelText("Valor (R$)"), valor);
}

describe("LancamentoModal: cadastro", () => {
  it("abre como saída, em dinheiro e com a data de hoje", async () => {
    renderWithProviders(<LancamentoModal {...handlers} />);

    expect(screen.getByRole("radio", { name: "Saída" })).toBeChecked();
    expect(screen.getByLabelText("Forma de pagamento")).toHaveValue("1");
    expect(screen.getByLabelText("Data do pagamento")).toHaveValue(HOJE);
    expect(screen.getByLabelText("Pago a")).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Entrou pela gaveta do caixa" })).not.toBeInTheDocument();
  });

  it("abre no tipo pedido por quem chamou", () => {
    renderWithProviders(<LancamentoModal tipoInicial={1} {...handlers} />);

    expect(screen.getByRole("radio", { name: "Entrada" })).toBeChecked();
    expect(screen.getByLabelText("Recebido de")).toBeInTheDocument();
  });

  it("oferece só as categorias ativas do tipo, as filhas recuadas", async () => {
    renderWithProviders(<LancamentoModal {...handlers} />);

    const select = (await screen.findByRole("option", { name: "↳ Energia" })).closest("select")!;
    expect(Array.from(select.options).map((opcao) => opcao.textContent)).toEqual(["Selecione", "Despesas fixas", "↳ Energia"]);
  });

  it("trocar o tipo desfaz a categoria e troca as opções", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);
    await screen.findByRole("option", { name: "↳ Energia" });
    await user.selectOptions(screen.getByLabelText("Categoria"), "3");

    await user.click(screen.getByRole("radio", { name: "Entrada" }));

    expect(screen.getByLabelText("Categoria")).toHaveValue("");
    expect(screen.getByRole("option", { name: "Outras receitas" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "↳ Energia" })).not.toBeInTheDocument();
  });

  it("cadastra e avisa o sucesso", async () => {
    vi.mocked(createLancamento).mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);

    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(createLancamento).toHaveBeenCalledWith({
        tipo: "2",
        financeiroCategoriaId: "3",
        descricao: "Conta de luz",
        valor: "R$ 450,00",
        dataPagamento: HOJE,
        formaPagamento: "1",
        favorecido: "",
        documento: "",
        observacao: "",
        peloCaixa: false,
      }),
    );
    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Lançamento salvo."));
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("não envia sem categoria, descrição e valor, e mostra os erros nos campos", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Selecione a categoria")).toBeInTheDocument();
    expect(screen.getByText("Informe a descrição")).toBeInTheDocument();
    expect(screen.getByText("Informe um valor maior que zero, com até 2 casas decimais.")).toBeInTheDocument();
    expect(createLancamento).not.toHaveBeenCalled();
  });

  it("recusa data futura", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);
    await preencher(user);

    fireEvent.change(screen.getByLabelText("Data do pagamento"), { target: { value: "2999-01-01" } });
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Só é possível lançar o que já foi pago.")).toBeInTheDocument();
    expect(createLancamento).not.toHaveBeenCalled();
  });

  it("erro do servidor aparece no aviso do topo e a janela continua aberta", async () => {
    vi.mocked(createLancamento).mockRejectedValue(new ApiError("validation", "A categoria precisa estar ativa.", 400));
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);
    await preencher(user);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A categoria precisa estar ativa.");
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("sem categoria do tipo, avisa e leva a criar uma", async () => {
    vi.mocked(listCategorias).mockResolvedValue([cat(1, "Outras receitas", 1)]);
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);

    expect(await screen.findByText("Não há categoria de despesa ativa.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Criar categoria" }));
    expect(handlers.onCriarCategoria).toHaveBeenCalled();
  });

  it("fechar com dados preenchidos pede confirmação antes de descartar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);
    await user.type(screen.getByLabelText("Descrição"), "x");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handlers.onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(handlers.onClose).toHaveBeenCalled();
  });
});

describe("LancamentoModal: pelo caixa", () => {
  const interruptor = () => screen.findByRole("switch", { name: "Saiu da gaveta do caixa" });

  it("em dinheiro, hoje e com turno aberto, o interruptor fica habilitado", async () => {
    renderWithProviders(<LancamentoModal {...handlers} />);

    await waitFor(() => expect(screen.getByRole("switch", { name: "Saiu da gaveta do caixa" })).toBeEnabled());
  });

  it("ligado, explica o efeito e mostra o disponível na gaveta numa saída", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);
    const chave = await interruptor();
    await waitFor(() => expect(chave).toBeEnabled());

    await user.click(chave);

    expect(screen.getByText("Vai aparecer no turno atual e entrar na conferência do caixa.")).toBeInTheDocument();
    expect(screen.getByText(/Disponível na gaveta:\s*R\$\s*314,00/)).toBeInTheDocument();
  });

  it("saída acima do disponível mostra o erro no valor e não envia", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);
    await preencher(user, "400,00");
    const chave = await interruptor();
    await waitFor(() => expect(chave).toBeEnabled());

    await user.click(chave);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText(/Maior que o dinheiro na gaveta \(R\$\s*314,00\)\./)).toBeInTheDocument();
    expect(createLancamento).not.toHaveBeenCalled();
  });

  it("saída dentro do disponível envia com peloCaixa", async () => {
    vi.mocked(createLancamento).mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);
    await preencher(user, "100,00");
    const chave = await interruptor();
    await waitFor(() => expect(chave).toBeEnabled());

    await user.click(chave);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(createLancamento).toHaveBeenCalledWith(expect.objectContaining({ peloCaixa: true, formaPagamento: "1", dataPagamento: HOJE })));
  });

  it("entrada pelo caixa não tem limite de gaveta", async () => {
    vi.mocked(createLancamento).mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal tipoInicial={1} {...handlers} />);
    await screen.findByRole("option", { name: "Outras receitas" });
    await user.selectOptions(screen.getByLabelText("Categoria"), "1");
    await user.type(screen.getByLabelText("Descrição"), "Troco do cofre");
    await user.type(screen.getByLabelText("Valor (R$)"), "999,00");
    const chave = await screen.findByRole("switch", { name: "Entrou pela gaveta do caixa" });
    await waitFor(() => expect(chave).toBeEnabled());

    await user.click(chave);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(createLancamento).toHaveBeenCalledWith(expect.objectContaining({ peloCaixa: true })));
  });

  it("com outra forma de pagamento, fica desabilitado e diz o motivo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);

    await user.selectOptions(screen.getByLabelText("Forma de pagamento"), "2");

    expect(await interruptor()).toBeDisabled();
    expect(screen.getByText("Só para pagamentos em dinheiro, com a data de hoje.")).toBeInTheDocument();
  });

  it("mudar a forma de pagamento com o interruptor ligado o desliga", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);
    const chave = await interruptor();
    await waitFor(() => expect(chave).toBeEnabled());
    await user.click(chave);
    expect(chave).toHaveAttribute("aria-checked", "true");

    await user.selectOptions(screen.getByLabelText("Forma de pagamento"), "2");

    expect(chave).toHaveAttribute("aria-checked", "false");
  });

  it("mudar a data com o interruptor ligado o desliga", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal {...handlers} />);
    const chave = await interruptor();
    await waitFor(() => expect(chave).toBeEnabled());
    await user.click(chave);

    fireEvent.change(screen.getByLabelText("Data do pagamento"), { target: { value: "2026-01-02" } });

    expect(chave).toHaveAttribute("aria-checked", "false");
    expect(chave).toBeDisabled();
  });

  it("sem turno, pede para abrir o caixa", async () => {
    vi.mocked(getTurnoAtual).mockResolvedValue(null);
    renderWithProviders(<LancamentoModal {...handlers} />);

    expect(await screen.findByText("Abra o caixa para lançar pela gaveta.")).toBeInTheDocument();
    expect(await interruptor()).toBeDisabled();
  });

  it("sem permissão para ver o turno, deixa ligar e avisa que o caixa confere ao salvar", async () => {
    vi.mocked(getTurnoAtual).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    renderWithProviders(<LancamentoModal {...handlers} />);

    expect(await screen.findByText("O caixa confere o valor ao salvar.")).toBeInTheDocument();
    expect(await interruptor()).toBeEnabled();
  });
});

describe("LancamentoModal: edição", () => {
  it("carrega o lançamento, mostra os dados e trava o tipo", async () => {
    vi.mocked(getLancamento).mockResolvedValue(existente);
    renderWithProviders(<LancamentoModal id={7} {...handlers} />);

    expect(screen.getByRole("status", { name: "Carregando lançamento" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Descrição")).toHaveValue("Conta de luz");
    expect(screen.getByLabelText("Valor (R$)")).toHaveValue("R$ 450,00");
    expect(screen.getByLabelText("Data do pagamento")).toHaveValue("2026-10-22");
    expect(screen.getByLabelText("Forma de pagamento")).toHaveValue("2");
    expect(screen.getByLabelText("Pago a")).toHaveValue("Cia. Elétrica");
    expect(screen.getByRole("radio", { name: "Saída" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Saída" })).toBeDisabled();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("salva com o id e o lançamento atual, e avisa a atualização", async () => {
    vi.mocked(getLancamento).mockResolvedValue(existente);
    vi.mocked(updateLancamento).mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal id={7} {...handlers} />);

    const descricao = await screen.findByLabelText("Descrição");
    await user.clear(descricao);
    await user.type(descricao, "Conta de luz de outubro");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(updateLancamento).toHaveBeenCalledWith(7, expect.objectContaining({ descricao: "Conta de luz de outubro", valor: "R$ 450,00", peloCaixa: false }), existente),
    );
    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Lançamento atualizado."));
  });

  it("mantém a categoria do lançamento mesmo inativa", async () => {
    vi.mocked(getLancamento).mockResolvedValue({ ...existente, financeiroCategoriaId: 4, categoria: "Antiga", categoriaPai: null });
    renderWithProviders(<LancamentoModal id={7} {...handlers} />);

    expect(await screen.findByRole("option", { name: "Antiga (inativa)" })).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toHaveValue("4");
  });

  it("sem o tipo na resposta, abre no tipo da categoria", async () => {
    vi.mocked(getLancamento).mockResolvedValue({ ...existente, tipo: null, financeiroCategoriaId: 1, categoria: "Outras receitas", categoriaPai: null });
    renderWithProviders(<LancamentoModal id={7} {...handlers} />);

    await screen.findByLabelText("Descrição");
    expect(screen.getByRole("radio", { name: "Entrada" })).toBeChecked();
  });

  it("lançamento feito pelo caixa trava valor, data e forma e oferece cancelar", async () => {
    const peloCaixa = { ...existente, peloCaixa: true, formaPagamento: 1, dataPagamento: HOJE };
    vi.mocked(getLancamento).mockResolvedValue(peloCaixa);
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal id={7} {...handlers} />);

    expect(await screen.findByText("Para mudar valor, data ou forma de pagamento, cancele e lance de novo.")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor (R$)")).toBeDisabled();
    expect(screen.getByLabelText("Data do pagamento")).toBeDisabled();
    expect(screen.getByLabelText("Forma de pagamento")).toBeDisabled();
    expect(screen.getByLabelText("Descrição")).toBeEnabled();
    expect(screen.getByLabelText("Categoria")).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Cancelar lançamento" }));
    expect(handlers.onCancelar).toHaveBeenCalledWith(peloCaixa);
  });

  it("lançamento cancelado não abre para edição", async () => {
    vi.mocked(getLancamento).mockResolvedValue({ ...existente, cancelado: true });
    renderWithProviders(<LancamentoModal id={7} {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Este lançamento foi cancelado e não pode ser editado.");
    expect(screen.queryByLabelText("Descrição")).not.toBeInTheDocument();
  });

  it("erro ao carregar mostra a mensagem e deixa tentar de novo", async () => {
    vi.mocked(getLancamento).mockRejectedValueOnce(new ApiError("not_found", "Lançamento não encontrado.", 404)).mockResolvedValueOnce(existente);
    const user = userEvent.setup();
    renderWithProviders(<LancamentoModal id={7} {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o lançamento. Lançamento não encontrado.");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByLabelText("Descrição")).toHaveValue("Conta de luz");
  });
});
