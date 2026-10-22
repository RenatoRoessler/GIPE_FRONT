import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatDateTime } from "@/components/caixa/format";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { ReciboCliente } from "@/types/veiculo";

vi.mock("@/lib/api/services/patio", () => ({ consultarRecibo: vi.fn() }));
vi.mock("./reciboSaidaPdf", () => ({ baixarReciboSaidaPdf: vi.fn() }));

// O modal em si é testado à parte: aqui só interessa quando a página oferece a nota e o que faz com a resposta.
const nota = vi.hoisted(() => ({ props: null as null | { token: string; valor: number; placa?: string | null; onClose: () => void; onSolicitada: (n: unknown) => void } }));
vi.mock("@/components/notas/NotaFiscalModal", () => ({
  NotaFiscalModal: (props: NonNullable<typeof nota.props>) => {
    nota.props = props;
    return (
      <div role="dialog" aria-label="Modal da nota">
        <button type="button" onClick={() => props.onSolicitada({ notaFiscalId: 1, valor: props.valor, dataSolicitacao: "2026-10-23T10:00:00" })}>
          solicitar
        </button>
        <button type="button" onClick={props.onClose}>
          fechar modal
        </button>
      </div>
    );
  },
}));

import { consultarRecibo } from "@/lib/api/services/patio";
import { ReciboPublico } from "./ReciboPublico";
import { baixarReciboSaidaPdf } from "./reciboSaidaPdf";

const recibo: ReciboCliente = {
  cnpj: "66326569000150",
  razaoSocial: "Estacionamento Central",
  endereco: "Avenida Sete de Setembro, 123",
  telefone: "54996384949",
  placa: "HZB5188",
  modelo: "Fusion",
  cor: "preto",
  categoriaId: 7,
  categoriaNome: "Carro grande",
  dataEntrada: "2026-10-14T20:01:32.468252",
  dataSaida: "2026-10-22T11:41:32.432745",
  minutosPermanencia: 11019,
  permanencia: "7d 15h 39min",
  valor: 15100,
  formaPagamento: 1,
  descricaoFormaPagamento: "Dinheiro",
  token: "ABCD1234EF",
  notaFiscalSolicitada: false,
};

function abrir(extra: Partial<ReciboCliente> = {}) {
  vi.mocked(consultarRecibo).mockResolvedValue({ ...recibo, ...extra });
  return renderWithProviders(<ReciboPublico token="ABCD1234EF" />);
}

describe("ReciboPublico", () => {
  beforeEach(() => {
    vi.mocked(consultarRecibo).mockReset();
  });

  it("mostra o carregamento anunciado e depois o recibo", async () => {
    vi.mocked(consultarRecibo).mockResolvedValue(recibo);
    renderWithProviders(<ReciboPublico token="ABCD1234EF" />);

    expect(screen.getByRole("status", { name: "Carregando recibo" })).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("heading", { level: 1, name: "Estacionamento Central" })).toBeInTheDocument();
    expect(consultarRecibo).toHaveBeenCalledWith("ABCD1234EF");
  });

  it("mostra a empresa com CNPJ, endereço e telefone formatados", async () => {
    abrir();

    await screen.findByText("Recibo de saída");
    expect(screen.getByText("CNPJ 66.326.569/0001-50")).toBeInTheDocument();
    expect(screen.getByText("Avenida Sete de Setembro, 123")).toBeInTheDocument();
    expect(screen.getByText("(54) 99638-4949")).toBeInTheDocument();
  });

  it("mostra o total pago em reais, a forma de pagamento e os dados da saída", async () => {
    abrir();

    expect(await screen.findByText("Saída registrada")).toBeInTheDocument();
    expect(screen.getByText("Carro grande")).toBeInTheDocument();
    expect(screen.getByText("Total pago")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s15\.100,00/)).toBeInTheDocument();
    expect(screen.getByText("Dinheiro")).toBeInTheDocument();
    expect(screen.getByText("HZB-5188")).toBeInTheDocument();
    expect(screen.getByText("Fusion · preto")).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(recibo.dataEntrada))).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(recibo.dataSaida))).toBeInTheDocument();
    expect(screen.getByText("183h 39min")).toBeInTheDocument();
    expect(screen.queryByText("Mensalista")).not.toBeInTheDocument();
  });

  it("omite campos ausentes, sem escrever null nem traço sobrando", async () => {
    abrir({ endereco: null, telefone: null, modelo: null, cor: null, descricaoFormaPagamento: null });

    await screen.findByText("Recibo de saída");
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
    expect(screen.queryByText("Avenida Sete de Setembro, 123")).not.toBeInTheDocument();
    expect(screen.queryByText("Dinheiro")).not.toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("mensalista mostra a etiqueta e \"Sem cobrança\", sem total nem forma de pagamento", async () => {
    abrir({ mensalista: true, valor: 0 });

    expect(await screen.findByText("Sem cobrança")).toBeInTheDocument();
    expect(screen.getByText("Mensalista")).toBeInTheDocument();
    expect(screen.queryByText("Total pago")).not.toBeInTheDocument();
    expect(screen.queryByText("Dinheiro")).not.toBeInTheDocument();
  });

  it("valor zero sem o campo de mensalista também mostra \"Sem cobrança\", sem a etiqueta", async () => {
    abrir({ valor: 0 });

    expect(await screen.findByText("Sem cobrança")).toBeInTheDocument();
    expect(screen.queryByText("Mensalista")).not.toBeInTheDocument();
    expect(screen.queryByText("Dinheiro")).not.toBeInTheDocument();
  });

  it("indica a nota fiscal só quando foi solicitada", async () => {
    const { unmount } = abrir({ notaFiscalSolicitada: true });
    expect(await screen.findByText("Nota fiscal solicitada.")).toBeInTheDocument();
    unmount();

    abrir({ notaFiscalSolicitada: false });
    await screen.findByText("Recibo de saída");
    expect(screen.queryByText("Nota fiscal solicitada.")).not.toBeInTheDocument();
  });

  it("recibo inexistente mostra a mensagem, sem erro técnico", async () => {
    vi.mocked(consultarRecibo).mockRejectedValue(new ApiError("not_found", "Recibo não encontrado.", 404));
    renderWithProviders(<ReciboPublico token="ABCD1234EF" />);

    expect(await screen.findByRole("heading", { name: "Recibo não encontrado" })).toBeInTheDocument();
    expect(screen.getByText("Confira o QR code ou procure o operador do estacionamento.")).toBeInTheDocument();
  });

  it("erro de rede mostra a mensagem e deixa tentar de novo", async () => {
    vi.mocked(consultarRecibo).mockRejectedValueOnce(new ApiError("network"));
    const user = userEvent.setup();
    renderWithProviders(<ReciboPublico token="ABCD1234EF" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o recibo");
    vi.mocked(consultarRecibo).mockResolvedValue(recibo);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Estacionamento Central" })).toBeInTheDocument();
  });

  it("Imprimir chama a impressão do navegador", async () => {
    const imprimir = vi.spyOn(window, "print").mockImplementation(() => undefined);
    abrir();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Imprimir" }));
    await waitFor(() => expect(imprimir).toHaveBeenCalledTimes(1));
    imprimir.mockRestore();
  });

  it("Baixar PDF gera o recibo com o endereço desta página", async () => {
    vi.mocked(baixarReciboSaidaPdf).mockResolvedValue(undefined);
    abrir();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Baixar PDF" }));

    await waitFor(() => expect(baixarReciboSaidaPdf).toHaveBeenCalledWith(expect.objectContaining({ placa: "HZB5188" }), window.location.href));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("enquanto gera o PDF o botão fica desabilitado e diz \"Gerando...\"", async () => {
    let concluir: () => void = () => undefined;
    vi.mocked(baixarReciboSaidaPdf).mockReturnValue(new Promise<void>((resolve) => (concluir = resolve)));
    abrir();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Baixar PDF" }));
    expect(await screen.findByRole("button", { name: "Gerando..." })).toBeDisabled();

    concluir();
    expect(await screen.findByRole("button", { name: "Baixar PDF" })).toBeEnabled();
  });

  it("falha ao gerar o PDF mostra o erro e deixa tentar de novo", async () => {
    vi.mocked(baixarReciboSaidaPdf).mockRejectedValueOnce(new Error("falhou"));
    abrir();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Baixar PDF" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível gerar o PDF. Tente novamente.");

    vi.mocked(baixarReciboSaidaPdf).mockResolvedValue(undefined);
    await user.click(screen.getByRole("button", { name: "Baixar PDF" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});

describe("ReciboPublico: nota fiscal", () => {
  beforeEach(() => {
    vi.mocked(consultarRecibo).mockReset();
  });

  it("recibo com cobrança e sem nota solicitada oferece \"Solicitar nota\"", async () => {
    abrir();
    expect(await screen.findByRole("button", { name: "Solicitar nota" })).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByText("Nota fiscal solicitada.")).not.toBeInTheDocument();
  });

  it.each([
    ["nota já solicitada", { notaFiscalSolicitada: true }],
    ["mensalista", { mensalista: true, valor: 0 }],
    ["valor zero", { valor: 0 }],
  ])("não oferece a nota com %s", async (_nome, extra) => {
    abrir(extra as Partial<ReciboCliente>);
    await screen.findByText("Recibo de saída");
    expect(screen.queryByRole("button", { name: "Solicitar nota" })).not.toBeInTheDocument();
  });

  it("nota já solicitada mostra o aviso no rodapé", async () => {
    abrir({ notaFiscalSolicitada: true });
    expect(await screen.findByText("Nota fiscal solicitada.")).toBeInTheDocument();
  });

  it("abre o modal com o código, o valor em reais e a placa do recibo", async () => {
    abrir();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Solicitar nota" }));

    expect(screen.getByRole("dialog", { name: "Modal da nota" })).toBeInTheDocument();
    expect(nota.props).toMatchObject({ token: "ABCD1234EF", valor: 15100, placa: "HZB5188" });
  });

  it("fechar o modal sem solicitar mantém o botão", async () => {
    abrir();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Solicitar nota" }));
    await user.click(screen.getByRole("button", { name: "fechar modal" }));

    expect(screen.queryByRole("dialog", { name: "Modal da nota" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Solicitar nota" })).toBeInTheDocument();
  });

  it("depois de solicitada o botão some e o rodapé passa a dizer que a nota foi solicitada, sem nova consulta", async () => {
    abrir();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Solicitar nota" }));
    await user.click(screen.getByRole("button", { name: "solicitar" }));
    await user.click(screen.getByRole("button", { name: "fechar modal" }));

    expect(screen.queryByRole("button", { name: "Solicitar nota" })).not.toBeInTheDocument();
    expect(screen.getByText("Nota fiscal solicitada.")).toBeInTheDocument();
    expect(consultarRecibo).toHaveBeenCalledTimes(1);
  });

  it("as outras ações continuam: Baixar PDF e Imprimir", async () => {
    abrir();
    expect(await screen.findByRole("button", { name: "Baixar PDF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeInTheDocument();
  });
});
