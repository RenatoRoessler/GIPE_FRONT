import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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

// jsdom não implementa <dialog> (o popup de erro usa o Modal).
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

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

// Cabeçalho da seção no acordeão (o painel de conclusão tem botões com os mesmos nomes, mas sem aria-expanded).
function cabecalho(titulo: string) {
  const botao = screen.getAllByRole("button", { name: new RegExp(titulo) }).find((el) => el.hasAttribute("aria-expanded"));
  if (!botao) {
    throw new Error(`Seção "${titulo}" não encontrada`);
  }
  return botao;
}

// As seções navegam livremente: qualquer uma abre direto pelo cabeçalho, e abrir uma fecha a outra.
async function abrirSecao(user: Usuario, titulo: string) {
  if (cabecalho(titulo).getAttribute("aria-expanded") !== "true") {
    await user.click(cabecalho(titulo));
  }
  await waitFor(() => expect(cabecalho(titulo)).toHaveAttribute("aria-expanded", "true"));
}

async function mudarDescricao(user: Usuario, texto: string) {
  await abrirSecao(user, "O básico");
  const descricao = screen.getByLabelText("Descrição");
  await user.clear(descricao);
  if (texto !== "") {
    await user.type(descricao, texto);
  }
}

function status() {
  return screen.getByRole("complementary", { name: "Conclusão do cadastro" });
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
    await screen.findByLabelText("Descrição");
    await mudarDescricao(user, "Tarifa padrão revisada");
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

    await screen.findByLabelText("Descrição");
    await mudarDescricao(user, "Outra descrição");
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
    await screen.findByLabelText("Descrição");
    await mudarDescricao(user, "Falha ao salvar");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    const popup = await screen.findByRole("dialog", { name: "Não foi possível salvar as alterações" });
    expect(within(popup).getByText("Erro no servidor.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Erro no servidor.");
    expect(push).not.toHaveBeenCalled();
  });

  it("abre com todas as seções fechadas, cada uma com o resumo do que está salvo", async () => {
    renderWithProviders(<PrecoWizard id={7} />);
    await screen.findByLabelText("Descrição");
    for (const titulo of ["O básico", "Categorias", "Quando vale", "Quanto cobra"]) {
      expect(cabecalho(titulo)).toHaveAttribute("aria-expanded", "false");
    }
    expect(cabecalho("O básico")).toHaveTextContent("Padrão · 06/06/2026 → sem fim");
    expect(cabecalho("Categorias")).toHaveTextContent("Todas");
    expect(cabecalho("Quando vale")).toHaveTextContent("Seg 06:00–22:00");
    expect(cabecalho("Quanto cobra")).toHaveTextContent("1 degrau · diária R$ 35,00");
    expect(screen.getByRole("heading", { name: "Editar preço" })).toBeInTheDocument();
    expect(screen.getByText("Tarifa padrão rotativo", { selector: "strong" })).toBeInTheDocument();
  });

  it("salvar sem mudanças fica desabilitado e a seção só ganha 'Alterado' com antes → depois depois de editar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrecoWizard id={7} />);
    await screen.findByLabelText("Descrição");
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
    expect(status()).toHaveTextContent("Tudo salvo");
    expect(screen.queryByText("Alterado")).not.toBeInTheDocument();

    await mudarDescricao(user, "Tarifa revisada");
    expect(within(cabecalho("O básico")).getByText("Alterado")).toBeInTheDocument();
    expect(cabecalho("O básico")).toHaveTextContent("Descrição: Tarifa padrão rotativo → Tarifa revisada");
    expect(within(cabecalho("Quanto cobra")).queryByText("Alterado")).not.toBeInTheDocument();
    expect(status()).toHaveTextContent("1 mudança");
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeEnabled();

    // Voltar ao valor salvo desfaz a mudança.
    await mudarDescricao(user, "Tarifa padrão rotativo");
    expect(screen.queryByText("Alterado")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
  });

  it("muda só a diária, em outra seção, e salva sem passar pelas demais", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrecoWizard id={7} />);
    await screen.findByLabelText("Descrição");
    await abrirSecao(user, "Quanto cobra");
    await user.click(screen.getByRole("button", { name: "Aumentar valor da diária" }));

    expect(cabecalho("Quanto cobra")).toHaveTextContent("Valor da diária: R$ 35,00 → R$ 36,00");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(updatePreco).toHaveBeenCalledTimes(1));
    expect(updatePreco).toHaveBeenCalledWith(7, expect.objectContaining({ info: expect.objectContaining({ valorDiaria: "36,00" }) }));
  });

  it("salvar com pendência em outra seção abre a primeira com problema e mostra o que falta", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrecoWizard id={7} />);
    await screen.findByLabelText("Descrição");
    await mudarDescricao(user, "");
    await abrirSecao(user, "Quanto cobra");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(cabecalho("O básico")).toHaveAttribute("aria-expanded", "true"));
    expect(cabecalho("Quanto cobra")).toHaveAttribute("aria-expanded", "false");
    expect(await screen.findByRole("alert")).toHaveTextContent("Há campos a corrigir em O básico.");
    expect(screen.getByRole("alert")).toHaveTextContent("Informe a descrição");
    expect(updatePreco).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
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
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    // O back não devolve o id da tabela criada: a lista escolhe a de maior id.
    expect(push).toHaveBeenCalledWith("/precos?salvo=criado");
    expect(createPreco).toHaveBeenCalledTimes(1);
  });

  it("falha ao cadastrar abre o popup com o erro e mantém o aviso na página", async () => {
    vi.mocked(createPreco).mockRejectedValue(new ApiError("validation", "Já existe uma tabela com esta descrição.", 400));
    const user = await renderCadastro();
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    const popup = await screen.findByRole("dialog", { name: "Não foi possível cadastrar o preço" });
    expect(within(popup).getByText("Já existe uma tabela com esta descrição.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await user.click(within(popup).getByRole("button", { name: "Voltar ao formulário" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Já existe uma tabela com esta descrição.");
  });

  it("Tentar novamente no popup salva de novo", async () => {
    vi.mocked(createPreco).mockRejectedValueOnce(new ApiError("network")).mockResolvedValueOnce(undefined);
    const user = await renderCadastro();
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    const popup = await screen.findByRole("dialog", { name: "Não foi possível cadastrar o preço" });
    await user.click(within(popup).getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/precos?salvo=criado"));
    expect(createPreco).toHaveBeenCalledTimes(2);
  });

  it("o cadastro novo vem com o início da vigência na data de hoje", async () => {
    renderWithProviders(<PrecoWizard />);
    expect(await screen.findByRole("radio", { name: "Começa hoje" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Sem fim" })).toBeChecked();
    expect(cabecalho("O básico")).toHaveTextContent("→ sem fim");
    expect(inicioVigenciaDeHoje()).toMatch(/T00:00$/);
  });

  it("o cadastro novo começa com O básico aberta e as outras fechadas", async () => {
    await renderCadastro();
    expect(cabecalho("O básico")).toHaveAttribute("aria-expanded", "true");
    for (const titulo of ["Categorias", "Quando vale", "Quanto cobra"]) {
      expect(cabecalho(titulo)).toHaveAttribute("aria-expanded", "false");
    }
    expect(screen.queryByText("Alterado")).not.toBeInTheDocument();
  });

  it("navega livremente entre as seções sem perder o que foi digitado", async () => {
    const user = await renderCadastro();
    await mudarDescricao(user, "Tarifa do evento");
    await abrirSecao(user, "Quanto cobra");
    await abrirSecao(user, "O básico");
    expect(screen.getByLabelText("Descrição")).toHaveValue("Tarifa do evento");
  });

  it("Continuar abre a próxima seção e fecha a atual", async () => {
    const user = await renderCadastro();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(cabecalho("Categorias")).toHaveAttribute("aria-expanded", "true"));
    expect(cabecalho("O básico")).toHaveAttribute("aria-expanded", "false");
  });

  it("as marcas dizem o estado de cada seção e o painel, o andamento", async () => {
    const user = await renderCadastro();
    expect(status()).toHaveTextContent("Pronta para salvar");
    expect(within(cabecalho("O básico")).getByRole("img", { name: "Seção pronta" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Descrição"));
    expect(within(cabecalho("O básico")).getByRole("img", { name: "Seção 1" })).toBeInTheDocument();
    expect(status()).toHaveTextContent("Faltam: Informe a descrição");

    // Depois de visitada e deixada incompleta, a seção passa a mostrar pendência.
    await abrirSecao(user, "Quando vale");
    expect(within(cabecalho("O básico")).getByRole("img", { name: "Seção com erro" })).toBeInTheDocument();
    expect(cabecalho("O básico")).toHaveTextContent("Há campos para corrigir");
  });

  it("'Sem fim' esconde a data de fim e 'Termina em…' mostra o seletor", async () => {
    const user = await renderCadastro();
    expect(screen.getByRole("radio", { name: "Sem fim" })).toBeChecked();
    expect(screen.queryByLabelText("Data de fim")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Termina em…" }));
    expect(screen.getByLabelText("Data de fim")).toBeEnabled();
    await user.click(screen.getByRole("radio", { name: "Sem fim" }));
    expect(screen.queryByLabelText("Data de fim")).not.toBeInTheDocument();
  });

  it("o campo Empresa conveniada lista as conveniadas ativas e começa em Nenhuma", async () => {
    const user = await renderCadastro();
    const campo = await screen.findByLabelText("Empresa conveniada");

    // Fora do tipo Convênio o campo fica travado.
    expect(campo).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /^Convênio/ }));
    await waitFor(() => expect(campo).toBeEnabled());
    expect(campo).toHaveValue("");
    expect(screen.getByRole("option", { name: "Auto Peças Sul" })).toBeInTheDocument();

    await user.selectOptions(campo, "9");
    expect(campo).toHaveValue("9");
    expect(screen.getByRole("option", { name: "Norte Ltda" })).toHaveProperty("selected", true);

    // Voltar a outro tipo trava o campo e limpa a empresa.
    await user.click(screen.getByRole("radio", { name: /^Padrão/ }));
    expect(campo).toBeDisabled();
    expect(campo).toHaveValue("");
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
    await abrirSecao(user, "Quando vale");
    expect(screen.getByRole("button", { name: "Segunda-feira, 06h" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Segunda-feira, 21h" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Segunda-feira, 22h" })).toHaveAttribute("aria-pressed", "false");
    // O resumo em texto aparece no cabeçalho da seção, na grade e no painel lateral.
    expect(screen.getAllByText("Seg 06:00–22:00").length).toBeGreaterThan(0);
    expect(screen.getByText("16 de 168 horas da semana com cobrança")).toBeInTheDocument();
  });

  it("pintar uma hora, um dia inteiro e usar atalhos atualiza o resumo", async () => {
    const user = await renderCadastro();
    await abrirSecao(user, "Quando vale");

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

  it("Salvar fica desabilitado enquanto houver pendência e o status diz o que falta", async () => {
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

    const salvar = screen.getByRole("button", { name: "Salvar" });
    expect(salvar).toBeDisabled();
    expect(status()).toHaveTextContent("Faltam: Informe a descrição (+1)");

    // Resolver uma pendência tira só ela do status; resolvidas todas, o botão habilita.
    await user.type(screen.getByLabelText("Descrição"), "Tarifa nova");
    expect(status()).toHaveTextContent("Faltam: Selecione ao menos uma categoria");
    expect(salvar).toBeDisabled();
    await abrirSecao(user, "Categorias");
    await user.click(screen.getByRole("checkbox", { name: "Moto" }));
    expect(status()).toHaveTextContent("Pronta para salvar");
    expect(salvar).toBeEnabled();

    await user.click(salvar);
    await waitFor(() => expect(createPreco).toHaveBeenCalledTimes(1));
  });

  it("Salvar também espera ao menos um horário", async () => {
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
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(status()).toHaveTextContent("Faltam: Cadastre ao menos um horário");

    await abrirSecao(user, "Quando vale");
    await user.click(screen.getByRole("button", { name: "Comercial" }));
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("aplicar um atalho ou um modelo não move o foco para uma linha criada", async () => {
    const user = await renderCadastro();
    await abrirSecao(user, "Quando vale");
    // Comercial gera 5 linhas e Rotativo 6: o ajuste fino ganha uma linha, mas o foco fica no botão clicado.
    await user.click(screen.getByRole("button", { name: "Comercial" }));
    await user.click(screen.getByRole("button", { name: "Rotativo" }));
    expect(screen.getByRole("button", { name: "Rotativo" })).toHaveFocus();

    await abrirSecao(user, "Quanto cobra");
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
    await abrirSecao(user, "Quando vale");

    // Há um horário com minutos: o ajuste fino já abre, e a grade só desenha o de horas cheias.
    expect(screen.getByLabelText("Hora de início — horário 2")).toHaveValue("08:30");
    await user.click(screen.getByRole("button", { name: "Limpar" }));
    expect(screen.getByText("Nenhuma hora pintada na grade.")).toBeInTheDocument();
    expect(screen.getByLabelText("Hora de início — horário 1")).toHaveValue("08:30");
    expect(screen.queryByLabelText("Hora de início — horário 2")).not.toBeInTheDocument();
  });

  it("o limite da faixa é digitado em horas e minutos e grava a soma em minutos", async () => {
    const user = await renderCadastro();
    await abrirSecao(user, "Quanto cobra");
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
    await abrirSecao(user, "Quanto cobra");
    await user.click(screen.getByRole("button", { name: "Rotativo (1 h, 2 h, 3 h)" }));

    expect(screen.getByLabelText("Salto em relação à faixa anterior: + R$ 6,00")).toBeInTheDocument();
    expect(screen.getByLabelText("Salto em relação à faixa anterior: + R$ 4,00")).toBeInTheDocument();
    expect(screen.getByText("Faixas sem problemas.")).toBeInTheDocument();
  });

  it("avisa, sem bloquear, quando um degrau custa menos que o anterior e quando a diária é menor que o último", async () => {
    const user = await renderCadastro();
    await abrirSecao(user, "Quanto cobra");
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

  it("o valor da diária e o adicional são obrigatórios: Salvar espera os dois e o status diz o que falta", async () => {
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
    await abrirSecao(user, "Quanto cobra");

    expect(status()).toHaveTextContent(/Faltam: Informe o valor da diária/);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();

    // Vazio aparece como traço; o primeiro toque leva ao mínimo (R$ 0,00) e os − / + andam de R$ 1,00 em R$ 1,00.
    await user.click(screen.getByRole("button", { name: "Aumentar valor da diária" }));
    expect(screen.getByRole("spinbutton", { name: "Valor da diária" })).toHaveAttribute("aria-valuenow", "0");
    await user.click(screen.getByRole("button", { name: "Aumentar valor da diária" }));
    expect(screen.getByRole("spinbutton", { name: "Valor da diária" })).toHaveAttribute("aria-valuenow", "1");
    expect(status()).toHaveTextContent("Faltam: Informe o valor adicional");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Aumentar valor adicional da diária" }));
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("cancelar o cadastro não altera o endereço da lista além de voltar", async () => {
    const user = await renderCadastro();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(push).toHaveBeenCalledWith("/precos");
    expect(createPreco).not.toHaveBeenCalled();
  });
});
