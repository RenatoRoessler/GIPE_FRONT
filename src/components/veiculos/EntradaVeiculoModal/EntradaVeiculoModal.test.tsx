import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { QuadroChaves } from "@/types/quadroChaves";
import type { PatioVeiculo } from "@/types/patio";
import type { EntradaRegistrada } from "@/types/veiculo";

vi.mock("@/lib/api/services/patio", () => ({ registrarEntrada: vi.fn(), listPatio: vi.fn() }));
vi.mock("@/lib/api/services/veiculo", () => ({ consultarPlaca: vi.fn(), listModelos: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/api/services/quadroChaves", () => ({ listQuadros: vi.fn().mockResolvedValue([]), escolherQuadroChave: vi.fn() }));
vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn().mockRejectedValue(new Error("sem empresa")) }));

// O leitor em si é testado à parte: aqui ele só devolve uma placa lida.
vi.mock("../LeitorPlacaModal", () => ({
  LeitorPlacaModal: ({ open, onConfirm, onDigitar }: { open: boolean; onConfirm: (placa: string) => void; onDigitar: () => void }) =>
    open ? (
      <div role="dialog" aria-label="Leitor de placa">
        <button type="button" onClick={() => onConfirm("ABC1D23")}>
          confirmar leitura
        </button>
        <button type="button" onClick={onDigitar}>
          digitar leitura
        </button>
      </div>
    ) : null,
}));

import { listPatio, registrarEntrada } from "@/lib/api/services/patio";
import { escolherQuadroChave, listQuadros } from "@/lib/api/services/quadroChaves";
import { consultarPlaca } from "@/lib/api/services/veiculo";
import { EntradaVeiculoModal } from "./EntradaVeiculoModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const handlers = { onClose: vi.fn(), onSuccess: vi.fn() };

// Pátio vazio por padrão; os testes de "já está no pátio" põem um veículo na lista.
beforeEach(() => {
  vi.mocked(listPatio).mockReset().mockResolvedValue([]);
});

const registrada: EntradaRegistrada = {
  patioId: 10,
  placa: "ABC1D23",
  categoria: 2,
  codigoTicket: 1,
  sequencial: 7,
  mensalista: false,
  modelo: "ONIX",
  cor: "AZUL",
  dataHoraEntrada: "2026-10-17T10:06:06.2094",
  rotatividadeId: 1,
  rotatividadeDescricao: "Tabela padrão",
  usuarioIdEntrada: 1,
  usuarioEntrada: "Operador",
  token: "227SUSYV",
};

type User = ReturnType<typeof userEvent.setup>;

// Placa, categoria, modelo e cor são obrigatórios (o back recusa sem eles).
async function preencher(user: User, { placa = "abc1d23", categoria = "Carro pequeno", modelo = "Onix", cor = "Azul" } = {}) {
  await user.type(screen.getByLabelText("Placa"), placa);
  await user.click(screen.getByRole("radio", { name: categoria }));
  await user.type(screen.getByLabelText("Modelo"), modelo);
  await user.click(screen.getByRole("radio", { name: cor }));
}

function renderModal() {
  return renderWithProviders(<EntradaVeiculoModal {...handlers} />);
}

describe("EntradaVeiculoModal", () => {
  beforeEach(() => {
    vi.mocked(registrarEntrada).mockReset();
    vi.mocked(consultarPlaca).mockReset();
    handlers.onClose.mockReset();
    handlers.onSuccess.mockReset();
    vi.mocked(listQuadros).mockReset().mockResolvedValue([]);
    vi.mocked(escolherQuadroChave).mockReset();
  });

  it("começa sem cor pré-marcada, com o registro bloqueado e dizendo o que falta", () => {
    renderModal();
    expect(screen.queryByRole("radio", { checked: true })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeDisabled();
    expect(screen.getByText("Informe a placa completa.")).toBeInTheDocument();
  });

  it("depois da placa, o rodapé lista o que falta e vai encurtando", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    expect(screen.getByText("Falta: modelo, categoria e cor.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Modelo"), "Onix");
    expect(screen.getByText("Falta: categoria e cor.")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));
    expect(screen.getByText("Falta: cor.")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Azul" }));
    expect(screen.queryByText(/^Falta:/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeEnabled();
  });

  it("o modelo vem antes da categoria e da cor, com os carros do menor para o maior", () => {
    renderModal();
    const grupo = screen.getByRole("group", { name: /Categoria/ });
    const nomes = Array.from(grupo.querySelectorAll("label")).map((label) => label.textContent?.trim());
    expect(nomes).toEqual(["Carro pequeno", "Carro médio", "Carro grande", "Moto", "Caminhonete", "Caminhão"]);
    const modelo = screen.getByLabelText("Modelo");
    const cor = screen.getByRole("group", { name: /^Cor/ });
    expect(modelo.compareDocumentPosition(grupo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(grupo.compareDocumentPosition(cor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("mostra as mensagens específicas do back, e não o texto genérico", async () => {
    vi.mocked(registrarEntrada).mockRejectedValue(
      new ApiError("validation", "Um ou mais erros ocorreram", 400, [
        { code: "BUSINESS_ERROR", message: "Modelo: O modelo do veículo é obrigatório" },
        { code: "BUSINESS_ERROR", message: "Cor: A cor do veículo é obrigatória" },
      ]),
    );
    const user = userEvent.setup();
    renderModal();
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Modelo: O modelo do veículo é obrigatório");
    expect(alerta).toHaveTextContent("Cor: A cor do veículo é obrigatória");
    expect(alerta).not.toHaveTextContent("Um ou mais erros ocorreram");
  });

  it("sem detalhes, mostra a mensagem do erro", async () => {
    vi.mocked(registrarEntrada).mockRejectedValue(new Error("Sem caixa aberto."));
    const user = userEvent.setup();
    renderModal();
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sem caixa aberto.");
  });

  it("só libera o registro com placa, categoria, modelo e cor", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeDisabled();
    await user.type(screen.getByLabelText("Modelo"), "Onix");
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "Azul" }));
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeEnabled();
  });

  it("envia a cor escolhida do enum e mostra o cupom com o link do token", async () => {
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));

    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntrada).mock.calls[0][0]).toMatchObject({ placa: "ABC1D23", categoria: 2, modelo: "Onix", cor: "AZUL" });
    expect(await screen.findByText("Entrada registrada")).toBeInTheDocument();
  });

  it("aplica a cor do cadastro só quando ela existe na lista", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({
      placa: "ABC1D23",
      encontrado: true,
      origem: "x",
      modelo: "ONIX",
      cor: "Vermelho",
      categoria: 2,
    });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await waitFor(() => expect(screen.getByRole("radio", { name: "Vermelho" })).toBeChecked());
  });

  it("mostra como texto a cor do cadastro que não é da lista, sem escolher outra no lugar", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({
      placa: "ABC1D23",
      encontrado: true,
      origem: "x",
      modelo: "ONIX",
      cor: "cinza claro",
      categoria: 2,
    });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await screen.findByText("Dados do cadastro preenchidos.");
    expect(screen.getByRole("radio", { name: "Prata" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Cinza" })).not.toBeChecked();
    expect(screen.getByText(/Cor no cadastro: cinza claro/)).toBeInTheDocument();
  });

  it("placa sem cadastro avisa que o modelo e a categoria são com o operador", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ placa: "ABC1D23", encontrado: false, origem: "x" } as never);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    expect(await screen.findByText("Placa sem cadastro: preencha o modelo e escolha a categoria.")).toBeInTheDocument();
  });

  it("ao trocar a placa, tira o que a consulta da anterior preencheu", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ placa: "ABC1D23", encontrado: true, origem: "x", modelo: "ONIX", cor: "Vermelho", categoria: 3 });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await waitFor(() => expect(screen.getByRole("radio", { name: "Carro médio" })).toBeChecked());
    expect(screen.getByLabelText("Modelo")).toHaveValue("ONIX");

    await user.type(screen.getByLabelText("Placa"), "{backspace}");

    await waitFor(() => expect(screen.getByRole("radio", { name: "Carro médio" })).not.toBeChecked());
    expect(screen.getByLabelText("Modelo")).toHaveValue("");
    expect(screen.getByRole("radio", { name: "Vermelho" })).not.toBeChecked();
  });

  it("ao trocar a placa, mantém o que o operador mudou à mão", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ placa: "ABC1D23", encontrado: true, origem: "x", modelo: "ONIX", cor: "Vermelho", categoria: 3 });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await waitFor(() => expect(screen.getByRole("radio", { name: "Carro médio" })).toBeChecked());
    await user.click(screen.getByRole("radio", { name: "Carro grande" }));

    await user.type(screen.getByLabelText("Placa"), "{backspace}");

    await waitFor(() => expect(screen.getByLabelText("Modelo")).toHaveValue(""));
    expect(screen.getByRole("radio", { name: "Carro grande" })).toBeChecked();
  });

  it("Enter na placa leva ao primeiro campo que falta (o modelo), sem mostrar erro nem registrar", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23{Enter}");
    expect(screen.getByLabelText("Modelo")).toHaveFocus();
    expect(screen.queryByText("Selecione a categoria")).not.toBeInTheDocument();
    expect(registrarEntrada).not.toHaveBeenCalled();
  });

  it("o botão da câmera fica fora da ordem do Tab", () => {
    renderModal();
    expect(screen.getByRole("button", { name: "Ler placa pela câmera" })).toHaveAttribute("tabindex", "-1");
  });

  it("preenche a placa e consulta o cadastro ao confirmar a leitura da câmera", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({
      placa: "ABC1D23",
      encontrado: true,
      origem: "x",
      modelo: "ONIX",
      cor: "Vermelho",
      categoria: 2,
    });
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole("button", { name: "Ler placa pela câmera" }));
    await user.click(screen.getByRole("button", { name: "confirmar leitura" }));

    expect(screen.getByLabelText("Placa")).toHaveValue("ABC1D23");
    await waitFor(() => expect(screen.getByRole("radio", { name: "Vermelho" })).toBeChecked());
    expect(consultarPlaca).toHaveBeenCalledWith("ABC1D23", expect.any(AbortSignal));
    expect(screen.queryByRole("dialog", { name: "Leitor de placa" })).not.toBeInTheDocument();
    expect(registrarEntrada).not.toHaveBeenCalled();
  });

  it("devolve o foco ao campo da placa ao escolher digitar", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole("button", { name: "Ler placa pela câmera" }));
    await user.click(screen.getByRole("button", { name: "digitar leitura" }));
    await waitFor(() => expect(screen.getByLabelText("Placa")).toHaveFocus());
  });

  it("desabilita o botão de câmera enquanto envia a entrada", async () => {
    vi.mocked(registrarEntrada).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderModal();
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Ler placa pela câmera" })).toBeDisabled());
  });
});

describe("EntradaVeiculoModal: mensalista", () => {
  const dadosMensalista = { nome: "Maria", intervaloPermitido: { de: "07:00", ate: "19:00" } };
  const cadastroBase = { placa: "ABC1D23", encontrado: true, origem: "mensalista", modelo: "ONIX", cor: "Vermelho", categoria: 2 };

  beforeEach(() => {
    vi.mocked(registrarEntrada).mockReset();
    vi.mocked(consultarPlaca).mockReset();
  });

  it("não oferece mais a marcação manual de mensalista", () => {
    renderModal();
    expect(screen.queryByText(/Mensalista/)).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("mostra o card e envia mensalista quando a placa é de um mensalista no plano", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ ...cadastroBase, mensalista: true, dadosMensalista });
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();

    expect(await screen.findByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("A entrada será registrada como mensalista.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntrada).mock.calls[0][0]).toMatchObject({ mensalista: true });
  });

  it("avisa que entra como rotativo quando o mensalista está fora do horário contratado", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ ...cadastroBase, mensalista: false, dadosMensalista });
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();

    expect(await screen.findByText("Mensalista fora do horário")).toBeInTheDocument();
    expect(screen.getByText("Horário contratado: 07:00 às 19:00.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntrada).mock.calls[0][0]).toMatchObject({ mensalista: false });
  });

  it("não mostra card para placa de avulso", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ ...cadastroBase, origem: "base", mensalista: false });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await screen.findByText("Dados do cadastro preenchidos.");
    expect(screen.queryByRole("status", { name: /Mensalista/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Mensalista/)).not.toBeInTheDocument();
  });

  it("segue como avulso, sem card, quando a consulta da placa falha", async () => {
    vi.mocked(consultarPlaca).mockRejectedValue(new Error("rede"));
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await screen.findByText(/Não foi possível consultar a placa/);
    expect(screen.queryByText(/Mensalista/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));
    await user.type(screen.getByLabelText("Modelo"), "Onix");
    await user.click(screen.getByRole("radio", { name: "Azul" }));
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntrada).mock.calls[0][0]).toMatchObject({ mensalista: false });
  });

  it("remove o card ao alterar a placa", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ ...cadastroBase, mensalista: true, dadosMensalista });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await screen.findByText("Maria");

    // A placa já tem 7 caracteres: apagar um altera o valor.
    await user.type(screen.getByLabelText("Placa"), "{backspace}");
    await waitFor(() => expect(screen.queryByText("Maria")).not.toBeInTheDocument());
  });
});

const noPatio = {
  patioId: 77,
  placa: "ABC1D23",
  categoria: 2,
  modelo: "ONIX",
  cor: "PRATA",
  codigoTicket: 5,
  sequencial: 3,
  mensalista: false,
  dataHoraEntrada: "2026-10-15T20:13:00",
  minutosPermanencia: 100,
  permanencia: "1h 40min",
  rotatividadeDescricao: null,
  usuarioEntrada: null,
  token: null,
} as PatioVeiculo;

describe("EntradaVeiculoModal: placa que já está no pátio", () => {
  it("avisa, bloqueia o registro e leva ao ticket", async () => {
    vi.mocked(listPatio).mockResolvedValue([noPatio]);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));

    const aviso = await screen.findByRole("alert");
    expect(aviso).toHaveTextContent("ABC1D23 já está no pátio desde");
    expect(screen.getByRole("link", { name: "Ver o ticket e dar saída" })).toHaveAttribute("href", "/patio/77");
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeDisabled();
    expect(screen.getByText("Esta placa já está no pátio.")).toBeInTheDocument();
  });

  it("o Enter também não registra", async () => {
    vi.mocked(listPatio).mockResolvedValue([noPatio]);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await screen.findByRole("alert");
    await user.type(screen.getByLabelText("Placa"), "{Enter}");
    expect(registrarEntrada).not.toHaveBeenCalled();
  });

  it("sem a placa na lista, nenhum aviso", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await waitFor(() => expect(listPatio).toHaveBeenCalled());
    expect(screen.queryByText(/já está no pátio/)).not.toBeInTheDocument();
  });
});

describe("EntradaVeiculoModal: lista do pátio", () => {
  it("registrar a entrada invalida a lista do pátio", async () => {
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    const { queryClient } = renderModal();
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");
    await preencher(user);

    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));

    await screen.findByText("Entrada registrada");
    expect(invalidar).toHaveBeenCalledWith({ queryKey: PATIO_QUERY_KEY });
  });

  it("uma entrada recusada não mexe na lista do pátio", async () => {
    vi.mocked(registrarEntrada).mockRejectedValue(new Error("Sem caixa aberto."));
    const user = userEvent.setup();
    const { queryClient } = renderModal();
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");
    await preencher(user);

    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));

    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(invalidar).not.toHaveBeenCalledWith({ queryKey: PATIO_QUERY_KEY });
  });
});

describe("EntradaVeiculoModal: gancho da chave", () => {
  const quadro: QuadroChaves = {
    patioQuadroId: 1,
    nome: "Recepção",
    linhas: [{ linha: "A", colunas: [{ patioQuadroChaveId: 5, coluna: 1, disponivel: true }] }],
  };

  beforeEach(() => {
    vi.mocked(registrarEntrada).mockReset().mockResolvedValue(registrada);
    vi.mocked(listQuadros).mockReset().mockResolvedValue([quadro]);
    vi.mocked(escolherQuadroChave).mockReset();
    handlers.onClose.mockReset();
    handlers.onSuccess.mockReset();
  });

  async function registrar() {
    const user = userEvent.setup();
    const rendered = renderModal();
    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    return { user, ...rendered };
  }

  it("com quadro cadastrado passa pela escolha do gancho antes do comprovante", async () => {
    vi.mocked(escolherQuadroChave).mockResolvedValue({
      patioId: 10, placa: "ABC1D23", patioQuadroId: 1, quadro: "Recepção", patioQuadroChaveId: 5, linha: "A", coluna: 1,
    });
    const { user } = await registrar();

    expect(await screen.findByRole("button", { name: "Guardar no gancho A1" })).toBeInTheDocument();
    // A confirmação já aparece acima do quadro, com o ticket e a hora.
    expect(screen.getByText(/^Entrada registrada · Ticket nº 7 · /)).toBeInTheDocument();
    expect(screen.queryByText(/null|undefined/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar no gancho A1" }));

    expect(escolherQuadroChave).toHaveBeenCalledWith(10, 5);
    expect(await screen.findByText("Entrada registrada")).toBeInTheDocument();
  });

  it("Escolher depois segue para o comprovante sem guardar", async () => {
    const { user } = await registrar();
    await user.click(await screen.findByRole("button", { name: "Escolher depois" }));
    expect(await screen.findByText("Entrada registrada")).toBeInTheDocument();
    expect(escolherQuadroChave).not.toHaveBeenCalled();
  });

  it("guardar o gancho invalida os quadros e o pátio", async () => {
    vi.mocked(escolherQuadroChave).mockResolvedValue({
      patioId: 10, placa: "ABC1D23", patioQuadroId: 1, quadro: "Recepção", patioQuadroChaveId: 5, linha: "A", coluna: 1,
    });
    const { user, queryClient } = await registrar();
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");
    await user.click(await screen.findByRole("button", { name: "Guardar no gancho A1" }));
    await screen.findByText("Entrada registrada");
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["quadros-chaves"] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: PATIO_QUERY_KEY });
  });

  it("fechar na escolha do gancho conclui a entrada já registrada", async () => {
    const { user } = await registrar();
    await screen.findByRole("button", { name: "Guardar no gancho A1" });
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(handlers.onSuccess).toHaveBeenCalledWith("Entrada registrada.");
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("sem quadros cadastrados a entrada vai direto ao comprovante", async () => {
    vi.mocked(listQuadros).mockResolvedValue([]);
    await registrar();
    expect(await screen.findByText("Entrada registrada")).toBeInTheDocument();
  });
});
