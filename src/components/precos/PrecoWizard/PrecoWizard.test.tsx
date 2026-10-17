import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { TIPO_CATEGORIA, TIPO_REGRA, type PrecoView } from "@/types/preco";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/lib/api/services/preco", () => ({ getPreco: vi.fn(), createPreco: vi.fn(), updatePreco: vi.fn() }));

import { createPreco, getPreco, updatePreco } from "@/lib/api/services/preco";
import { toPrecoFormValues } from "@/lib/api/services/preco.mapper";
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

async function avancarAteACategoria(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Avançar" }));
  await screen.findByText(/Etapa 2 de 4/);
  await user.click(screen.getByRole("button", { name: "Avançar" }));
  await screen.findByText(/Etapa 3 de 4/);
  await user.click(screen.getByRole("button", { name: "Avançar" }));
  await screen.findByText(/Etapa 4 de 4/);
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

  it("cancelar o cadastro não altera o endereço da lista além de voltar", async () => {
    const user = await renderCadastro();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(push).toHaveBeenCalledWith("/precos");
    expect(createPreco).not.toHaveBeenCalled();
  });
});
