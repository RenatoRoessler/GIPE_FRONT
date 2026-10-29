import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { TIPO_CATEGORIA, TIPO_REGRA, type PrecoView } from "@/types/preco";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/lib/api/services/preco", () => ({ getPreco: vi.fn(), createPreco: vi.fn(), updatePreco: vi.fn() }));

vi.mock("@/lib/api/services/conveniada", () => ({
  listConveniadas: vi.fn().mockResolvedValue([
    { empresaConveniadaId: 4, nomeFantasia: "Auto Peças Sul", razaoSocial: "Auto Peças Sul LTDA" },
    { empresaConveniadaId: 9, nomeFantasia: "", razaoSocial: "Norte Ltda" },
  ]),
}));

import { createPreco, getPreco, updatePreco } from "@/lib/api/services/preco";
import { toPrecoFormValues } from "@/lib/api/services/preco.mapper";
import { inicioVigenciaDeHoje } from "../novoPreco";
import { PrecoWizard } from "./PrecoWizard";
import { PrecoWizardForm } from "./PrecoWizardForm";

const TABELA: PrecoView = {
  rotatividadeId: 7,
  empresaConveniadaId: null,
  descricao: "Tarifa padrão rotativo",
  tipoRegra: TIPO_REGRA.Padrao,
  inicioVigencia: "2026-06-06T00:00:00",
  fimVigencia: null,
  toleranciaEntradaMinutos: 10,
  toleranciaAlteracaoFaixaMinutos: 5,
  periodoDiaria: 720,
  valorDiaria: 35,
  valorAdicionalDiaria: 1,
  ativo: true,
  regras: [{ diaSemana: 2, horaInicio: "06:00:00", horaFim: "22:00:00", dataInicio: null, dataFim: null, ativo: true }],
  faixas: [{ minutosLimite: 60, valor: 10, percentualConveniada: null }],
  categorias: [TIPO_CATEGORIA.Todas],
};

// Preencher o fluxo campo a campo é lento; o limite padrão ficaria perto do estouro.
vi.setConfig({ testTimeout: 20_000 });

beforeEach(() => {
  push.mockReset();
  vi.mocked(getPreco).mockReset().mockResolvedValue(TABELA);
  vi.mocked(updatePreco).mockReset().mockResolvedValue(undefined);
  vi.mocked(createPreco).mockReset().mockResolvedValue(undefined);
  // O wizard só pede confirmação ao cancelar com alterações; nenhum teste deve depender disso.
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

type Usuario = ReturnType<typeof userEvent.setup>;

// A navegação é livre: qualquer etapa abre direto pelo indicador.
async function irParaEtapa(user: Usuario, numero: number) {
  await user.click(screen.getByRole("button", { name: new RegExp(`^Etapa ${numero}:`) }));
  await screen.findByText(new RegExp(`Etapa ${numero} de 3`));
}

async function avancarAteACategoria(user: Usuario) {
  await user.click(screen.getByRole("button", { name: /^Avançar/ }));
  await screen.findByText(/Etapa 2 de 3/);
  await user.click(screen.getByRole("button", { name: /^Avançar/ }));
  await screen.findByText(/Etapa 3 de 3/);
}

describe("PrecoWizard: edição", () => {
  it("carrega a tabela sem depender de cache de página", async () => {
    renderWithProviders(<PrecoWizard id={7} />);
    expect(await screen.findByLabelText("Descrição")).toHaveValue("Tarifa padrão rotativo");
    expect(getPreco).toHaveBeenCalledTimes(1);
    expect(getPreco).toHaveBeenCalledWith(7);
  });

  it("tabela que não existe mostra o aviso e o caminho de volta", async () => {
    vi.mocked(getPreco).mockRejectedValue(new ApiError("not_found", "Tabela de preço não encontrada.", 404));
    renderWithProviders(<PrecoWizard id={99} />);
    expect(await screen.findByText("Tabela de preço não encontrada.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para a listagem" })).toHaveAttribute("href", "/precos");
  });

  it("falha ao carregar mostra o erro e Tentar novamente busca de novo", async () => {
    const user = userEvent.setup();
    vi.mocked(getPreco).mockRejectedValueOnce(new ApiError("network"));
    renderWithProviders(<PrecoWizard id={7} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar a tabela de preço.");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByLabelText("Descrição")).toBeInTheDocument();
    expect(getPreco).toHaveBeenCalledTimes(2);
  });

  it("depois de salvar volta para a lista com a tabela editada selecionada", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrecoWizard id={7} />);
    const descricao = await screen.findByLabelText("Descrição");
    await user.clear(descricao);
    await user.type(descricao, "Tarifa padrão revisada");
    await avancarAteACategoria(user);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith("/precos?salvo=atualizado&preco=7");
    expect(updatePreco).toHaveBeenCalledWith(7, expect.objectContaining({ info: expect.objectContaining({ descricao: "Tarifa padrão revisada" }) }));
  });

  it("atualiza o cache da lista e da tabela depois de salvar", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(<PrecoWizard id={7} />);
    queryClient.setQueryData(["precos", "todas"], [TABELA]);
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");

    const descricao = await screen.findByLabelText("Descrição");
    await user.clear(descricao);
    await user.type(descricao, "Outra descrição");
    await avancarAteACategoria(user);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    const chaves = invalidar.mock.calls.map(([filtro]) => filtro?.queryKey);
    expect(chaves).toContainEqual(["precos"]);
    expect(chaves).toContainEqual(["preco", 7]);
    // O prefixo ["precos"] cobre a chave da carga completa usada pela tela de lista e detalhe.
    expect(queryClient.getQueryState(["precos", "todas"])?.isInvalidated).toBe(true);
  });

  it("falha ao salvar não volta para a lista", async () => {
    const user = userEvent.setup();
    vi.mocked(updatePreco).mockRejectedValue(new ApiError("server", "Erro no servidor.", 500));
    renderWithProviders(<PrecoWizard id={7} />);
    const descricao = await screen.findByLabelText("Descrição");
    await user.clear(descricao);
    await user.type(descricao, "Falha ao salvar");
    await avancarAteACategoria(user);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Erro no servidor.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("salvar sem mudanças fica desabilitado e o painel só marca 'Alterado' depois de editar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrecoWizard id={7} />);
    await screen.findByLabelText("Descrição");
    await irParaEtapa(user, 3);
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
    expect(screen.getByText("Nenhuma alteração para salvar.")).toBeInTheDocument();
    expect(screen.queryByText("Alterado")).not.toBeInTheDocument();

    await irParaEtapa(user, 1);
    const descricao = screen.getByLabelText("Descrição");
    await user.clear(descricao);
    await user.type(descricao, "Tarifa revisada");
    expect(screen.getByText("Alterado")).toBeInTheDocument();
    expect(screen.getByText("Descrição: Tarifa padrão rotativo → Tarifa revisada")).toBeInTheDocument();
    await irParaEtapa(user, 3);
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeEnabled();
  });

  it("cancelar sem alterações volta à lista sem selecionar nada", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrecoWizard id={7} />);
    await screen.findByLabelText("Descrição");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(push).toHaveBeenCalledWith("/precos");
  });
});

describe("PrecoWizard: cadastro", () => {
  async function renderCadastro() {
    const user = userEvent.setup();
    renderWithProviders(
      <PrecoWizardForm title="Novo preço" initial={toPrecoFormValues(TABELA)} onSave={createPreco} savedFlag="criado" />,
    );
    await screen.findByLabelText("Descrição");
    return user;
  }

  it("depois de criar volta para a lista só com o aviso de criação", async () => {
    const user = await renderCadastro();
    await avancarAteACategoria(user);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    // O back não devolve o id da tabela criada: a lista escolhe a de maior id.
    expect(push).toHaveBeenCalledWith("/precos?salvo=criado");
    expect(createPreco).toHaveBeenCalledTimes(1);
  });

  it("o cadastro novo vem com o início da vigência na data de hoje", async () => {
    renderWithProviders(<PrecoWizard />);
    expect(await screen.findByLabelText("Início da vigência")).toHaveValue(inicioVigenciaDeHoje());
  });

  it("navega livremente entre as etapas sem perder o que foi digitado", async () => {
    const user = await renderCadastro();
    const descricao = screen.getByLabelText("Descrição");
    await user.clear(descricao);
    await user.type(descricao, "Tarifa do evento");
    await irParaEtapa(user, 3);
    await irParaEtapa(user, 1);
    expect(screen.getByLabelText("Descrição")).toHaveValue("Tarifa do evento");
  });

  it("o indicador diz o estado de cada etapa e o cabeçalho, o andamento", async () => {
    const user = await renderCadastro();
    expect(screen.getByText("Pronta para salvar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Etapa 1: O básico, completa" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Descrição"));
    expect(screen.getByRole("button", { name: "Etapa 1: O básico, não preenchida" })).toBeInTheDocument();
    expect(screen.getByText("Rascunho · 2 de 3 etapas")).toBeInTheDocument();

    // Depois de visitada e deixada incompleta, a etapa passa a mostrar pendência.
    await irParaEtapa(user, 2);
    expect(screen.getByRole("button", { name: "Etapa 1: O básico, com pendência" })).toBeInTheDocument();
  });

  it("'Sem data de fim' desabilita o fim da vigência e desmarcar reabilita", async () => {
    const user = await renderCadastro();
    const semFim = screen.getByRole("checkbox", { name: "Sem data de fim" });
    expect(semFim).toBeChecked();
    expect(screen.getByLabelText("Fim da vigência")).toBeDisabled();

    await user.click(semFim);
    expect(screen.getByLabelText("Fim da vigência")).toBeEnabled();
    await user.click(semFim);
    expect(screen.getByLabelText("Fim da vigência")).toBeDisabled();
  });

  it("o campo Empresa conveniada lista as conveniadas ativas e começa em Nenhuma", async () => {
    const user = await renderCadastro();
    const campo = await screen.findByLabelText("Empresa conveniada");

    await waitFor(() => expect(campo).toBeEnabled());
    expect(campo).toHaveValue("");
    expect(screen.getByRole("option", { name: "Auto Peças Sul" })).toBeInTheDocument();

    await user.selectOptions(campo, "9");
    expect(campo).toHaveValue("9");
    expect(screen.getByRole("option", { name: "Norte Ltda" })).toHaveProperty("selected", true);
  });

  it("ao editar, mostra a conveniada gravada na tabela", async () => {
    vi.mocked(getPreco).mockResolvedValue({ ...TABELA, empresaConveniadaId: 4 });
    renderWithProviders(<PrecoWizard id={7} />);

    const campo = await screen.findByLabelText("Empresa conveniada");
    await waitFor(() => expect(campo).toHaveValue("4"));
  });

  it("escolher o tipo de regra em cartões muda o tipo da tabela", async () => {
    const user = await renderCadastro();
    await user.click(screen.getByRole("radio", { name: /^Convênio/ }));
    expect(screen.getByRole("radio", { name: /^Convênio/ })).toBeChecked();
    expect(screen.getByRole("complementary", { name: "Resumo ao vivo da tabela" })).toHaveTextContent("Tipo: Convênio");
  });

  it("a grade de horários desenha a tabela e o resumo acompanha", async () => {
    const user = await renderCadastro();
    await irParaEtapa(user, 2);
    expect(screen.getByRole("button", { name: "Segunda-feira, 06h" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Segunda-feira, 21h" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Segunda-feira, 22h" })).toHaveAttribute("aria-pressed", "false");
    // O resumo em texto aparece na grade e no painel lateral.
    expect(screen.getAllByText("Seg 06:00–22:00").length).toBeGreaterThan(0);
    expect(screen.getByText("16 de 168 horas da semana com cobrança")).toBeInTheDocument();
  });

  it("pintar uma hora, um dia inteiro e usar atalhos atualiza o resumo", async () => {
    const user = await renderCadastro();
    await irParaEtapa(user, 2);

    await user.click(screen.getByRole("button", { name: "Terça-feira, 10h" }));
    expect(screen.getByRole("button", { name: "Terça-feira, 10h" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Ter 10:00–11:00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Alternar o dia inteiro: Domingo" }));
    expect(screen.getByText("Dom 00:00–23:59")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "24 horas" }));
    expect(screen.getByText("168 de 168 horas da semana com cobrança")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar" }));
    expect(screen.getByText("Nenhuma hora pintada na grade.")).toBeInTheDocument();
  });

  it("Avançar fica desabilitado enquanto a etapa estiver inválida e lista o que falta", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PrecoWizardForm
        title="Novo preço"
        initial={{ ...toPrecoFormValues(TABELA), info: { ...toPrecoFormValues(TABELA).info, descricao: "" }, categorias: [] }}
        onSave={createPreco}
        savedFlag="criado"
      />,
    );
    await screen.findByLabelText("Descrição");

    const avancar = screen.getByRole("button", { name: /^Avançar/ });
    expect(avancar).toBeDisabled();
    expect(screen.getByText("Para avançar, falta:")).toBeInTheDocument();
    expect(screen.getByText("Informe a descrição", { selector: "li" })).toBeInTheDocument();
    expect(screen.getByText("Selecione ao menos uma categoria", { selector: "li" })).toBeInTheDocument();

    // Resolver uma pendência tira só ela da lista; resolvidas todas, o botão habilita.
    await user.type(screen.getByLabelText("Descrição"), "Tarifa nova");
    expect(screen.queryByText("Informe a descrição", { selector: "li" })).not.toBeInTheDocument();
    expect(avancar).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: "Moto" }));
    expect(screen.queryByText("Para avançar, falta:")).not.toBeInTheDocument();
    expect(avancar).toBeEnabled();

    await user.click(avancar);
    expect(await screen.findByText(/Etapa 2 de 3/)).toBeInTheDocument();
  });

  it("na etapa de horários, Avançar também espera ao menos um horário", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PrecoWizardForm
        title="Novo preço"
        initial={{ ...toPrecoFormValues(TABELA), horarios: [] }}
        onSave={createPreco}
        savedFlag="criado"
      />,
    );
    await screen.findByLabelText("Descrição");
    await irParaEtapa(user, 2);
    expect(screen.getByRole("button", { name: /^Avançar/ })).toBeDisabled();
    expect(screen.getByText("Cadastre ao menos um horário", { selector: "li" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Comercial" }));
    expect(screen.getByRole("button", { name: /^Avançar/ })).toBeEnabled();
  });

  it("aplicar um atalho ou um modelo não move o foco para uma linha criada", async () => {
    const user = await renderCadastro();
    await irParaEtapa(user, 2);
    // Comercial gera 5 linhas e Rotativo 6: o ajuste fino ganha uma linha, mas o foco fica no botão clicado.
    await user.click(screen.getByRole("button", { name: "Comercial" }));
    await user.click(screen.getByRole("button", { name: "Rotativo" }));
    expect(screen.getByRole("button", { name: "Rotativo" })).toHaveFocus();

    await irParaEtapa(user, 3);
    // O modelo de 3 degraus vem depois de 1 faixa; o de 4, depois do de 3 (+1 linha).
    await user.click(screen.getByRole("button", { name: "Rotativo (1 h, 2 h, 3 h)" }));
    await user.click(screen.getByRole("button", { name: "A cada 30 min até 2 h" }));
    expect(screen.getByRole("button", { name: "A cada 30 min até 2 h" })).toHaveFocus();
  });

  it("a grade não apaga horários que só o ajuste fino edita", async () => {
    const user = userEvent.setup();
    const quebrado = { diaSemana: "3", horaInicio: "08:30", horaFim: "12:15", dataInicio: "", dataFim: "", ativo: true };
    const initial = toPrecoFormValues(TABELA);
    renderWithProviders(
      <PrecoWizardForm
        title="Novo preço"
        initial={{ ...initial, horarios: [...initial.horarios, quebrado] }}
        onSave={createPreco}
        savedFlag="criado"
      />,
    );
    await screen.findByLabelText("Descrição");
    await irParaEtapa(user, 2);

    // Há um horário com minutos: o ajuste fino já abre, e a grade só desenha o de horas cheias.
    expect(screen.getByLabelText("Hora de início — horário 2")).toHaveValue("08:30");
    await user.click(screen.getByRole("button", { name: "Limpar" }));
    expect(screen.getByText("Nenhuma hora pintada na grade.")).toBeInTheDocument();
    expect(screen.getByLabelText("Hora de início — horário 1")).toHaveValue("08:30");
    expect(screen.queryByLabelText("Hora de início — horário 2")).not.toBeInTheDocument();
  });

  it("o limite da faixa é digitado em horas e minutos e grava a soma em minutos", async () => {
    const user = await renderCadastro();
    await irParaEtapa(user, 3);
    expect(screen.getByLabelText("Horas — faixa 1")).toHaveValue("1");
    expect(screen.getByLabelText("Minutos — faixa 1")).toHaveValue("0");

    await user.type(screen.getByLabelText("Minutos — faixa 1"), "{Backspace}45");
    expect(screen.getByLabelText("Horas — faixa 1")).toHaveValue("1");
    expect(screen.getByLabelText("Minutos — faixa 1")).toHaveValue("45");

    // Mais de 59 minutos viram horas.
    await user.clear(screen.getByLabelText("Minutos — faixa 1"));
    await user.type(screen.getByLabelText("Minutos — faixa 1"), "90");
    expect(screen.getByLabelText("Horas — faixa 1")).toHaveValue("2");
    expect(screen.getByLabelText("Minutos — faixa 1")).toHaveValue("30");
  });

  it("os modelos preenchem as faixas e cada degrau mostra o salto para o anterior", async () => {
    const user = await renderCadastro();
    await irParaEtapa(user, 3);
    await user.click(screen.getByRole("button", { name: "Rotativo (1 h, 2 h, 3 h)" }));

    expect(screen.getByLabelText("Salto em relação à faixa anterior: + R$ 6,00")).toBeInTheDocument();
    expect(screen.getByLabelText("Salto em relação à faixa anterior: + R$ 4,00")).toBeInTheDocument();
    expect(screen.getByText("Faixas sem problemas.")).toBeInTheDocument();
  });

  it("avisa, sem bloquear, quando um degrau custa menos que o anterior e quando a diária é menor que o último", async () => {
    const user = await renderCadastro();
    await irParaEtapa(user, 3);
    await user.click(screen.getByRole("button", { name: "Rotativo (1 h, 2 h, 3 h)" }));

    const valor3 = screen.getByLabelText("Valor (R$) — faixa 3");
    await user.clear(valor3);
    await user.type(valor3, "5,00");
    expect(screen.getByRole("list", { name: "Avisos sobre as faixas" })).toHaveTextContent("A faixa de 3 h custa menos que a de 2 h.");

    // Diária (R$ 35,00 na tabela) abaixo do último degrau.
    await user.clear(valor3);
    await user.type(valor3, "40,00");
    expect(screen.getByRole("list", { name: "Avisos sobre as faixas" })).toHaveTextContent(/A diária \(R\$\s35,00\) é menor que o último degrau/);

    // Aviso não impede salvar.
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(createPreco).toHaveBeenCalledTimes(1));
  });

  it("salvar com pendência em outra etapa leva à primeira etapa incompleta e mostra o que falta", async () => {
    const user = userEvent.setup();
    const initial = toPrecoFormValues(TABELA);
    renderWithProviders(
      <PrecoWizardForm
        title="Novo preço"
        initial={{ ...initial, info: { ...initial.info, descricao: "" } }}
        onSave={createPreco}
        savedFlag="criado"
      />,
    );
    await screen.findByLabelText("Descrição");
    await irParaEtapa(user, 3);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText(/Etapa 1 de 3/)).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Há campos a corrigir na etapa 1 (O básico).");
    expect(screen.getByRole("alert")).toHaveTextContent("Informe a descrição");
    expect(createPreco).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("o valor da diária e o adicional são obrigatórios: Salvar espera os dois e a lista diz quais faltam", async () => {
    const user = userEvent.setup();
    const initial = toPrecoFormValues(TABELA);
    renderWithProviders(
      <PrecoWizardForm
        title="Novo preço"
        initial={{ ...initial, info: { ...initial.info, valorDiaria: "", valorAdicionalDiaria: "" } }}
        onSave={createPreco}
        savedFlag="criado"
      />,
    );
    await screen.findByLabelText("Descrição");
    await irParaEtapa(user, 3);

    expect(screen.getByLabelText("Valor da diária (R$)")).toBeRequired();
    expect(screen.getByLabelText("Valor adicional da diária (R$)")).toBeRequired();
    expect(screen.getByText("Para salvar, falta:")).toBeInTheDocument();
    expect(screen.getByText("Informe o valor da diária", { selector: "li" })).toBeInTheDocument();
    expect(screen.getByText("Informe o valor adicional", { selector: "li" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();

    await user.type(screen.getByLabelText("Valor da diária (R$)"), "35,00");
    expect(screen.queryByText("Informe o valor da diária", { selector: "li" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();

    await user.type(screen.getByLabelText("Valor adicional da diária (R$)"), "1,00");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("cancelar o cadastro não altera o endereço da lista além de voltar", async () => {
    const user = await renderCadastro();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(push).toHaveBeenCalledWith("/precos");
    expect(createPreco).not.toHaveBeenCalled();
  });
});
