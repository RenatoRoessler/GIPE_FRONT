import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TecladoProvider } from "@/components/teclado/TecladoProvider";
import { MEDIA_TOQUE } from "@/components/teclado/useTecladoCampo";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { QuadroChaves } from "@/types/quadroChaves";
import type { PatioVeiculo } from "@/types/patio";
import type { SaidaConsulta } from "@/types/saida";
import type { EntradaRegistrada } from "@/types/veiculo";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/api/services/patio", () => ({
  registrarEntrada: vi.fn(),
  listPatio: vi.fn(),
  consultarSaida: vi.fn(),
  registrarSaida: vi.fn(),
  resolverBuscaPorToken: vi.fn(),
}));
vi.mock("@/lib/api/services/veiculo", () => ({ consultarPlaca: vi.fn(), listModelos: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/api/services/quadroChaves", () => ({ listQuadros: vi.fn().mockResolvedValue([]), escolherQuadroChave: vi.fn() }));
vi.mock("@/lib/api/services/configuracao", () => ({ getConfiguracao: vi.fn(), updateConfiguracao: vi.fn() }));
vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn().mockRejectedValue(new Error("sem empresa")) }));

// O leitor em si é testado à parte: aqui ele só devolve uma placa lida.
vi.mock("../LeitorPlacaModal", () => ({
  LeitorPlacaModal: ({
    open,
    onConfirm,
    onDigitar,
    onFalha,
  }: {
    open: boolean;
    onConfirm: (placa: string) => void;
    onDigitar: () => void;
    onFalha: (motivo: "negada" | "indisponivel") => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Leitor de placa">
        <button type="button" onClick={() => onFalha("negada")}>
          câmera negada
        </button>
        <button type="button" onClick={() => onConfirm("ABC1D23")}>
          confirmar leitura
        </button>
        <button type="button" onClick={onDigitar}>
          digitar leitura
        </button>
      </div>
    ) : null,
}));

import { getConfiguracao } from "@/lib/api/services/configuracao";
import { consultarSaida, listPatio, registrarEntrada } from "@/lib/api/services/patio";
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

const handlers = { onClose: vi.fn(), onSuccess: vi.fn(), onDarSaida: vi.fn() };

// Pátio vazio por padrão; os testes de "já está no pátio" põem um veículo na lista.
beforeEach(() => {
  vi.mocked(listPatio).mockReset().mockResolvedValue([]);
  vi.mocked(consultarSaida).mockReset().mockResolvedValue({ patioId: 77, placa: "ABC1D23", valor: 220, mensalista: false } as SaidaConsulta);
  handlers.onDarSaida.mockReset();
  // Padrão da empresa: modelo e cor obrigatórios, prisma opcional.
  vi.mocked(getConfiguracao).mockReset().mockResolvedValue({ modelo: true, cor: true, prisma: false, servicos: false, entradaDiretoCamera: true, alteradoPorId: null, alteradoEm: null });
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

  it("no celular a leitura da placa abre junto com a tela; no computador não", async () => {
    const toque = (ativo: boolean) =>
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: ativo && query === MEDIA_TOQUE,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }));
    toque(true);
    const celular = renderModal();
    expect(await screen.findByRole("dialog", { name: "Leitor de placa" })).toBeInTheDocument();
    celular.unmount();

    toque(false);
    renderModal();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByRole("dialog", { name: "Leitor de placa" })).not.toBeInTheDocument();
    vi.unstubAllGlobals();
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
  async function digitarPlacaNoPatio(user: User) {
    vi.mocked(listPatio).mockResolvedValue([noPatio]);
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    return screen.findByRole("heading", { name: "Este veículo já está no pátio" });
  }

  it("troca o formulário por um cartão com valor, entrada e permanência", async () => {
    const user = userEvent.setup();
    await digitarPlacaNoPatio(user);

    expect(await screen.findByText(/^R\$\s220,00$/)).toBeInTheDocument();
    expect(screen.getByText("1h 40min")).toBeInTheDocument();
    expect(screen.getByText("ONIX · PRATA · Carro pequeno")).toBeInTheDocument();
    // Não há entrada a registrar: modelo, categoria e cor somem.
    expect(screen.queryByLabelText("Modelo")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Carro pequeno" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("o botão principal vira Dar saída com o valor e some o Registrar entrada", async () => {
    const user = userEvent.setup();
    await digitarPlacaNoPatio(user);

    expect(await screen.findByRole("button", { name: /^Dar saída · R\$\s220,00$/ })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Registrar entrada" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    expect(screen.queryByText("Esta placa já está no pátio.")).not.toBeInTheDocument();
  });

  it("Dar saída leva a placa para a confirmação de saída", async () => {
    const user = userEvent.setup();
    await digitarPlacaNoPatio(user);

    await user.click(await screen.findByRole("button", { name: /^Dar saída/ }));

    expect(handlers.onDarSaida).toHaveBeenCalledWith({ tipo: "placa", valor: "ABC1D23" });
    expect(registrarEntrada).not.toHaveBeenCalled();
  });

  it("enquanto o valor não chega, o botão já aparece sem valor", async () => {
    vi.mocked(consultarSaida).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    await digitarPlacaNoPatio(user);

    expect(screen.getByRole("button", { name: "Dar saída" })).toBeEnabled();
    expect(screen.getByText("Calculando o valor…")).toBeInTheDocument();
  });

  it("se o valor falhar, ainda dá para dar a saída, sem o valor", async () => {
    vi.mocked(consultarSaida).mockRejectedValue(new Error("falha"));
    const user = userEvent.setup();
    await digitarPlacaNoPatio(user);

    expect(await screen.findByRole("button", { name: "Dar saída" })).toBeEnabled();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it("Corrigir placa limpa a placa e volta ao formulário de entrada", async () => {
    const user = userEvent.setup();
    await digitarPlacaNoPatio(user);

    await user.click(screen.getByRole("button", { name: "Corrigir placa" }));

    await waitFor(() => expect(screen.getByLabelText("Placa")).toHaveValue(""));
    expect(screen.queryByRole("heading", { name: "Este veículo já está no pátio" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Carro pequeno" })).toBeInTheDocument();
  });

  it("o Enter na placa também não registra", async () => {
    const user = userEvent.setup();
    await digitarPlacaNoPatio(user);
    await user.type(screen.getByLabelText("Placa"), "{Enter}");
    expect(registrarEntrada).not.toHaveBeenCalled();
    expect(handlers.onDarSaida).not.toHaveBeenCalled();
  });

  it("sem a placa na lista, nenhum aviso", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await waitFor(() => expect(listPatio).toHaveBeenCalled());
    expect(screen.queryByText(/já está no pátio/)).not.toBeInTheDocument();
    expect(consultarSaida).not.toHaveBeenCalled();
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

describe("EntradaVeiculoModal: regras da empresa", () => {
  const dadosMensalista = { nome: "Maria", intervaloPermitido: { de: "07:00", ate: "19:00" } };
  const cadastroBase = { placa: "ABC1D23", encontrado: true, origem: "mensalista", modelo: "ONIX", cor: "Vermelho", categoria: 2 };

  beforeEach(() => {
    vi.mocked(registrarEntrada).mockReset();
    vi.mocked(consultarPlaca).mockReset();
  });

  const configurar = (regras: { modelo?: boolean; cor?: boolean; prisma?: boolean }) =>
    vi.mocked(getConfiguracao).mockResolvedValue({ modelo: true, cor: true, prisma: false, servicos: false, entradaDiretoCamera: true, alteradoPorId: 1, alteradoEm: "2026-11-08T16:36:03", ...regras });

  it("com o prisma obrigatório mostra o campo, pede no rodapé e envia o prisma", async () => {
    configurar({ prisma: true });
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await preencher(user);
    await user.click(await screen.findByLabelText("Prisma"));
    expect(screen.getByText("Falta: prisma.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeDisabled();

    await user.type(screen.getByLabelText("Prisma"), "45");
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntrada).mock.calls[0][0]).toMatchObject({ modelo: "Onix", cor: "AZUL", prisma: 45 });
  });

    it("o prisma só aceita números de 1 a 999: 0 bloqueia o registro e diz a regra", async () => {
      configurar({ prisma: true });
      const user = userEvent.setup();
      renderModal();
      await preencher(user);
      const campo = await screen.findByLabelText("Prisma");
      await user.type(campo, "0");
      await user.tab();
      expect(await screen.findByText("Use um número de 1 a 999")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeDisabled();

      await user.clear(campo);
      await user.type(campo, "1000");
      expect(campo).toHaveValue("100");
      await user.clear(campo);
      await user.type(campo, "999");
      expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeEnabled();
    });

    it("o prisma vai como número inteiro, sem zeros à esquerda", async () => {
      configurar({ prisma: true });
      vi.mocked(registrarEntrada).mockResolvedValue(registrada);
      const user = userEvent.setup();
      renderModal();
      await preencher(user);
      await user.type(await screen.findByLabelText("Prisma"), "007");
      await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
      await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
      expect(vi.mocked(registrarEntrada).mock.calls[0][0].prisma).toBe(7);
    });

  it("sem o prisma obrigatório o campo não aparece e o payload não leva prisma", async () => {
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await preencher(user);
    expect(screen.queryByLabelText("Prisma")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntrada).mock.calls[0][0]).not.toHaveProperty("prisma");
  });

  it("mensalista entra sem o prisma, mesmo com ele obrigatório", async () => {
    configurar({ prisma: true });
    vi.mocked(consultarPlaca).mockResolvedValue({ ...cadastroBase, mensalista: true, dadosMensalista });
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText("Placa");
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await screen.findByText("Maria");
    await waitFor(() => expect(screen.queryByLabelText("Prisma")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeEnabled());
  });

  it("com modelo e cor desligados os campos não aparecem; só placa e categoria bastam, e o payload os omite", async () => {
    configurar({ modelo: false, cor: false });
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText("Placa");
    await waitFor(() => expect(screen.queryByLabelText("Modelo")).not.toBeInTheDocument());
    expect(screen.queryByRole("group", { name: "Cor" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    const payload = vi.mocked(registrarEntrada).mock.calls[0][0];
    expect(payload).toMatchObject({ placa: "ABC1D23", categoria: 2 });
    expect(payload).not.toHaveProperty("modelo");
    expect(payload).not.toHaveProperty("cor");
  });
});

describe("EntradaVeiculoModal: com o teclado aberto", () => {
  function renderComTeclado() {
    return renderWithProviders(
      <TecladoProvider>
        <EntradaVeiculoModal {...handlers} />
      </TecladoProvider>,
    );
  }

  function simularToque() {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === MEDIA_TOQUE,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, "visualViewport", { value: undefined, configurable: true });
  });

  it("o rótulo Placa sai da tela, mas o campo segue com o nome acessível", () => {
    renderModal();
    expect(screen.getByLabelText("Placa")).toBeInTheDocument();
    expect(screen.getByText("Placa", { selector: "label" })).toHaveStyle({ position: "absolute" });
  });

  it("sem teclado os botões ficam no rodapé", () => {
    renderModal();
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("com o teclado de placa aberto esconde Registrar entrada e Cancelar, e eles voltam ao completar a placa", async () => {
    simularToque();
    renderComTeclado();
    // No celular a leitura abre junto; o operador escolhe digitar.
    fireEvent.click(await screen.findByRole("button", { name: "digitar leitura" }));
    await screen.findByRole("group", { name: "Teclado de placa" });

    expect(screen.queryByRole("button", { name: "Registrar entrada" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    // Cancelar continua possível pelo X do cabeçalho.
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();

    for (const tecla of ["A", "B", "C", "1", "D", "2", "3"]) {
      fireEvent.click(screen.getByRole("button", { name: tecla }));
    }

    expect(await screen.findByRole("button", { name: "Registrar entrada" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Teclado de placa" })).not.toBeInTheDocument();
  });

  it("com o teclado do sistema aberto (área visível reduzida) esconde os botões e depois os devolve", () => {
    const ouvintes = new Set<() => void>();
    const area = {
      height: 800,
      addEventListener: (_: string, ouvinte: () => void) => ouvintes.add(ouvinte),
      removeEventListener: (_: string, ouvinte: () => void) => ouvintes.delete(ouvinte),
    };
    Object.defineProperty(window, "visualViewport", { value: area, configurable: true });
    vi.stubGlobal("innerHeight", 800);
    renderModal();
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeInTheDocument();

    area.height = 400;
    act(() => ouvintes.forEach((ouvinte) => ouvinte()));
    expect(screen.queryByRole("button", { name: "Registrar entrada" })).not.toBeInTheDocument();

    area.height = 800;
    act(() => ouvintes.forEach((ouvinte) => ouvinte()));
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeInTheDocument();
  });

  it("fechar pelo cabeçalho com dados preenchidos ainda pede confirmação", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc");

    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(await screen.findByText("Descartar entrada?")).toBeInTheDocument();
    expect(handlers.onClose).not.toHaveBeenCalled();
  });
});

describe("EntradaVeiculoModal: câmera negada", () => {
  function simularToque() {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === MEDIA_TOQUE,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function abrirComCameraNegada() {
    simularToque();
    renderModal();
    fireEvent.click(await screen.findByRole("button", { name: "câmera negada" }));
  }

  it("fecha o leitor, foca a placa e mostra a faixa com Tentar câmera", async () => {
    await abrirComCameraNegada();

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Leitor de placa" })).not.toBeInTheDocument());
    expect(screen.getByText("Câmera indisponível. Digite a placa.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar câmera" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Placa")).toHaveFocus());
    // Os passos do cadeado só aparecem depois de tentar de novo.
    expect(screen.queryByRole("group", { name: "Como liberar a câmera" })).not.toBeInTheDocument();
  });

  it("Tentar câmera reabre o leitor", async () => {
    await abrirComCameraNegada();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Leitor de placa" })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Tentar câmera" }));

    expect(await screen.findByRole("dialog", { name: "Leitor de placa" })).toBeInTheDocument();
  });

  it("se falhar de novo depois de Tentar câmera, explica como liberar a câmera", async () => {
    await abrirComCameraNegada();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Leitor de placa" })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Tentar câmera" }));
    fireEvent.click(await screen.findByRole("button", { name: "câmera negada" }));

    expect(await screen.findByRole("group", { name: "Como liberar a câmera" })).toBeInTheDocument();
  });

  it("a faixa some quando uma placa é lida", async () => {
    await abrirComCameraNegada();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Leitor de placa" })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Tentar câmera" }));
    fireEvent.click(await screen.findByRole("button", { name: "confirmar leitura" }));

    await waitFor(() => expect(screen.getByLabelText("Placa")).toHaveValue("ABC1D23"));
    expect(screen.queryByText("Câmera indisponível. Digite a placa.")).not.toBeInTheDocument();
  });

  it("sem falha de câmera não há faixa", () => {
    renderModal();
    expect(screen.queryByText("Câmera indisponível. Digite a placa.")).not.toBeInTheDocument();
  });
});

// Ajuste 7: as categorias são anunciadas pelo nome ("Carro médio"), não pelo código ("1", "2", "6").
describe("EntradaVeiculoModal: nomes acessíveis das categorias", () => {
  it.each(["Carro pequeno", "Carro médio", "Carro grande", "Moto", "Caminhonete", "Caminhão"])("a categoria %s é achada pelo nome", (nome) => {
    renderModal();
    expect(screen.getByRole("radio", { name: nome })).toBeInTheDocument();
  });

  it("nenhuma categoria tem o código como nome", () => {
    renderModal();
    const grupo = screen.getByRole("group", { name: "Categoria (define a tarifa)" });
    for (const radio of Array.from(grupo.querySelectorAll<HTMLInputElement>('input[type="radio"]'))) {
      expect(radio).toHaveAccessibleName();
      expect(radio).not.toHaveAccessibleName(/^\d+$/);
    }
  });
});
