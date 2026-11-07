import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { PatioVeiculo } from "@/types/patio";
import type { ComprovanteCliente } from "@/types/veiculo";

const nav = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), query: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => new URLSearchParams(nav.query),
}));
vi.mock("@/lib/api/services/patio", () => ({ listPatio: vi.fn(), consultarComprovante: vi.fn() }));
vi.mock("@/lib/api/services/quadroChaves", () => ({ listQuadros: vi.fn(), escolherQuadroChave: vi.fn() }));
vi.mock("@/contexts/CurrentUserContext", () => ({
  useCurrentUser: () => ({ user: { id: "x", name: "Renato", email: "r@e.com", perfil: 1 }, isLoading: false }),
}));
// Os dois modais têm testes próprios: aqui só importa como o ticket os abre e o que faz com o resultado.
vi.mock("@/components/veiculos/SaidaVeiculoModal", () => ({
  SaidaVeiculoModal: ({ buscaInicial, onClose, onSuccess }: { buscaInicial: { valor: string }; onClose: () => void; onSuccess: (m: string) => void }) => (
    <div role="dialog" aria-label="Saída">
      <span>{`Saída de ${buscaInicial.valor}`}</span>
      <button type="button" onClick={() => onSuccess("Saída realizada com sucesso.")}>
        Concluir saída
      </button>
      <button type="button" onClick={onClose}>
        Cancelar saída
      </button>
    </div>
  ),
}));
vi.mock("@/components/quadros/GuardarChaveModal", () => ({
  GuardarChaveModal: ({ veiculo, onClose, onGuardado }: { veiculo: { placa: string }; onClose: () => void; onGuardado: (c: { linha: string; coluna: number }) => void }) => (
    <div role="dialog" aria-label="Guardar chave">
      <span>{`Chave de ${veiculo.placa}`}</span>
      <button type="button" onClick={() => onGuardado({ linha: "A", coluna: 2 })}>
        Confirmar gancho
      </button>
      <button type="button" onClick={onClose}>
        Cancelar chave
      </button>
    </div>
  ),
}));

import { consultarComprovante, listPatio } from "@/lib/api/services/patio";
import { listQuadros } from "@/lib/api/services/quadroChaves";
import { TicketView } from "./TicketView";

function veiculo(extra: Partial<PatioVeiculo> = {}): PatioVeiculo {
  return {
    patioId: 7,
    placa: "FLP3C88",
    categoria: 2,
    modelo: "Corolla",
    cor: "BRANCO",
    codigoTicket: 24024,
    sequencial: 2464,
    mensalista: false,
    dataHoraEntrada: "2026-10-17T15:30:22",
    minutosPermanencia: 8,
    permanencia: "8min",
    rotatividadeDescricao: "TABELA CARROS",
    usuarioEntrada: "Ana",
    token: "ABCD1234",
    ...extra,
  };
}

const comprovante: ComprovanteCliente = {
  cnpj: "00000000000100",
  razaoSocial: "Estacionamento Central",
  endereco: null,
  telefone: null,
  placa: "FLP3C88",
  modelo: "Corolla",
  cor: "BRANCO",
  categoriaId: 2,
  categoriaDescricao: "Carro pequeno",
  dataHoraEntrada: "2026-10-17T15:30:22",
  dataHoraConsulta: "2026-10-17T15:38:22",
  minutosPermanencia: 8,
  permanencia: "8min",
  sequencial: 2464,
  token: "ABCD1234",
  valorAtual: 12,
};

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const QUADRO = { id: 1, nome: "Recepção" };

function abrir(lista: PatioVeiculo[] = [veiculo()], patioId = 7) {
  vi.mocked(listPatio).mockResolvedValue(lista);
  return renderWithProviders(<TicketView patioId={patioId} />);
}

beforeEach(() => {
  nav.replace.mockReset();
  nav.push.mockReset();
  nav.query = "";
  vi.mocked(listPatio).mockReset();
  vi.mocked(consultarComprovante).mockReset().mockResolvedValue(comprovante);
  vi.mocked(listQuadros)
    .mockReset()
    .mockResolvedValue([QUADRO] as never);
});

describe("TicketView: dados", () => {
  it("mostra o veículo, o tipo, a permanência e o valor até agora", async () => {
    abrir();

    expect(await screen.findByText("FLP3C88")).toBeInTheDocument();
    expect(screen.getByText("Corolla · BRANCO · Carro pequeno")).toBeInTheDocument();
    expect(screen.getByText("Avulso")).toBeInTheDocument();
    expect(screen.getByText("24024")).toBeInTheDocument();
    expect(await screen.findByText("R$ 12,00")).toBeInTheDocument();
    expect(screen.getByText("Permanência").nextElementSibling).toHaveTextContent("8min");
    expect(consultarComprovante).toHaveBeenCalledWith("ABCD1234");
  });

  it("lista a entrada, a tabela de preço, e o operador, sem o sequencial nem próxima faixa", async () => {
    abrir();
    await screen.findByText("FLP3C88");

    const itens = screen.getByLabelText("Detalhes do ticket");
    expect(within(itens).getByText("TABELA CARROS")).toBeInTheDocument();
    expect(within(itens).getByText("Ana")).toBeInTheDocument();
    expect(within(itens).queryByText("Sequencial")).not.toBeInTheDocument();
    expect(within(itens).queryByText("2464")).not.toBeInTheDocument();
    expect(screen.queryByText(/Próxima faixa/)).not.toBeInTheDocument();
  });

  it("mensalista mostra Mensal no lugar do valor e a ação sem valor", async () => {
    abrir([veiculo({ mensalista: true })]);

    expect(await screen.findByText("Mensal")).toBeInTheDocument();
    expect(screen.getByText("Mensalista")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar saída" })).toBeInTheDocument();
  });

  it("a ação de saída traz o valor quando há cobrança", async () => {
    abrir();

    expect(await screen.findByRole("button", { name: "Registrar saída · R$ 12,00" })).toBeInTheDocument();
  });

  it("sem token não há QR nem valor, e o aviso explica", async () => {
    abrir([veiculo({ token: null })]);
    await screen.findByText("FLP3C88");

    expect(screen.queryByRole("button", { name: /Mostrar QR/ })).not.toBeInTheDocument();
    expect(screen.getByText("Comprovante indisponível para este veículo.")).toBeInTheDocument();
    expect(consultarComprovante).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Registrar saída" })).toBeInTheDocument();
  });

  it("falha no valor mostra traço e deixa tentar de novo, sem derrubar o ticket", async () => {
    vi.mocked(consultarComprovante).mockRejectedValueOnce(new ApiError("server", "Falhou", 500));
    abrir();

    const tentar = await screen.findByRole("button", { name: "Tentar novamente" });
    expect(screen.getByText("FLP3C88")).toBeInTheDocument();
    await userEvent.click(tentar);
    expect(await screen.findByText("R$ 12,00")).toBeInTheDocument();
  });

  it("carregando mostra esqueletos num status", () => {
    vi.mocked(listPatio).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<TicketView patioId={7} />);

    expect(screen.getByRole("status", { name: "Carregando o ticket" })).toBeInTheDocument();
  });

  it("veículo fora do pátio diz isso e volta à lista", async () => {
    abrir([veiculo({ patioId: 99 })]);

    expect(await screen.findByText("Este carro não está mais no pátio")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Voltar ao pátio" }));
    expect(nav.replace).toHaveBeenCalledWith("/patio");
  });

  it("erro na lista mostra a mensagem e deixa tentar de novo", async () => {
    vi.mocked(listPatio).mockRejectedValue(new ApiError("server", "Serviço fora do ar.", 500));
    renderWithProviders(<TicketView patioId={7} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Serviço fora do ar.");
  });
});

describe("TicketView: navegação", () => {
  it("Fechar o popup leva à lista com os filtros que vieram na URL", async () => {
    nav.query = "tipo=avulsos&q=gol";
    abrir();
    await screen.findByText("FLP3C88");

    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(nav.replace).toHaveBeenCalledWith("/patio?q=gol&tipo=avulsos");
  });

  it("Mostrar QR abre o comprovante, levando os filtros", async () => {
    nav.query = "tipo=avulsos";
    abrir();

    await userEvent.click(await screen.findByRole("button", { name: "Mostrar QR do ticket ao cliente" }));

    expect(nav.push).toHaveBeenCalledWith("/patio/7/comprovante?tipo=avulsos&de=ticket");
  });
});

describe("TicketView: saída", () => {
  it("abre a saída já com a placa do veículo", async () => {
    abrir();
    await userEvent.click(await screen.findByRole("button", { name: /^Registrar saída/ }));

    expect(screen.getByText("Saída de FLP3C88")).toBeInTheDocument();
  });

  it("concluída, volta à lista pedindo o aviso, e mantém os filtros", async () => {
    nav.query = "tipo=avulsos";
    abrir();
    await userEvent.click(await screen.findByRole("button", { name: /^Registrar saída/ }));
    await userEvent.click(screen.getByRole("button", { name: "Concluir saída" }));

    expect(nav.replace).toHaveBeenCalledWith("/patio?tipo=avulsos&saiu=FLP3C88");
  });

  it("cancelada, o ticket continua na tela", async () => {
    abrir();
    await userEvent.click(await screen.findByRole("button", { name: /^Registrar saída/ }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar saída" }));

    expect(screen.queryByRole("dialog", { name: "Saída" })).not.toBeInTheDocument();
    expect(screen.getByText("FLP3C88")).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("o modal continua na tela mesmo depois de o veículo sair da lista", async () => {
    const { queryClient } = abrir();
    await userEvent.click(await screen.findByRole("button", { name: /^Registrar saída/ }));

    queryClient.setQueryData(["patio"], []);

    await waitFor(() => expect(screen.getByRole("dialog", { name: "Saída" })).toBeInTheDocument());
  });
});

describe("TicketView: chave", () => {
  it("fora do quadro oferece guardar a chave e avisa quando guarda", async () => {
    abrir();
    expect(await screen.findByText("Fora do quadro")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Guardar chave de FLP3C88" }));
    expect(screen.getByText("Chave de FLP3C88")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar gancho" }));

    expect(await screen.findByText("Chave guardada no A2.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Guardar chave" })).not.toBeInTheDocument();
  });

  it("com gancho mostra a posição e oferece alterar", async () => {
    abrir([veiculo({ posicaoChave: "A2" })]);

    expect(await screen.findByText("A2")).toBeInTheDocument();
    expect(screen.queryByText("Fora do quadro")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alterar chave de FLP3C88" })).toBeInTheDocument();
  });

  it("empresa sem quadros não vê o item da chave", async () => {
    vi.mocked(listQuadros).mockResolvedValue([]);
    abrir();
    await screen.findByText("FLP3C88");

    await waitFor(() => expect(screen.queryByText("Quadro de chaves")).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /chave de FLP3C88/ })).not.toBeInTheDocument();
  });

  it("cancelar a chave não muda nada", async () => {
    abrir();
    await userEvent.click(await screen.findByRole("button", { name: "Guardar chave de FLP3C88" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar chave" }));

    expect(screen.queryByRole("dialog", { name: "Guardar chave" })).not.toBeInTheDocument();
    expect(screen.getByText("Fora do quadro")).toBeInTheDocument();
  });
});

describe("TicketView: popup", () => {
  it("abre como um diálogo com o título e o código do ticket", async () => {
    abrir();

    const dialogo = await screen.findByRole("dialog", { name: "Ticket de entrada · 24024" });
    expect(within(dialogo).getByText("FLP3C88")).toBeInTheDocument();
  });
});
