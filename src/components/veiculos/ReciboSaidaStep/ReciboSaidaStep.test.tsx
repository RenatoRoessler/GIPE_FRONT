import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { SaidaConsulta } from "@/types/saida";
import { ReciboSaidaStep, type SaidaResultado } from "./ReciboSaidaStep";

vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn().mockRejectedValue(new Error("sem empresa")) }));

// O modal em si é testado à parte: aqui só interessa quando o recibo oferece a nota e o que faz com a resposta.
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

const consulta = {
  patioId: 7,
  placa: "BRA2E19",
  categoria: 2,
  modelo: "ONIX",
  cor: "PRATA",
  codigoTicket: 482,
  sequencial: 12,
  mensalista: true,
  dataHoraEntrada: "2026-10-17T10:00:00",
  dataHoraSaida: "2026-10-17T12:35:00",
  minutosPermanencia: 155,
  rotatividadeDescricao: null,
  valor: 20,
} as SaidaConsulta;

const resultado: SaidaResultado = {
  saida: {
    patioId: 7,
    placa: "BRA2E19",
    dataHoraEntrada: "2026-10-17T10:00:00",
    dataHoraSaida: "2026-10-17T12:36:00",
    minutosPermanencia: 156,
    valor: 0,
    formaPagamento: 1,
  },
  recebido: null,
  troco: null,
  emitidoEm: "2026-10-17T12:36:00",
};

function renderStep(c: SaidaConsulta) {
  return renderWithProviders(<ReciboSaidaStep consulta={c} resultado={resultado} onConcluir={() => {}} />);
}

describe("ReciboSaidaStep: QR do recibo", () => {
  const comCodigo: SaidaResultado = { ...resultado, saida: { ...resultado.saida, tokenRecibo: "ABCD1234EF" } };

  it("monta o link da página pública a partir do código do recibo, na tela e na impressão", () => {
    renderWithProviders(<ReciboSaidaStep consulta={consulta} resultado={comCodigo} onConcluir={() => {}} />);

    // O recibo aparece duas vezes: na tela e no nó usado só na impressão.
    expect(screen.getAllByRole("img", { name: "QR code do recibo de saída" })).toHaveLength(2);
    expect(screen.getAllByText(`${window.location.host}/recibo/ABCD1234EF`)).toHaveLength(2);
  });

  it("codifica o código do recibo no endereço", () => {
    const estranho: SaidaResultado = { ...resultado, saida: { ...resultado.saida, tokenRecibo: "AB CD/12" } };
    renderWithProviders(<ReciboSaidaStep consulta={consulta} resultado={estranho} onConcluir={() => {}} />);
    expect(screen.getAllByText(`${window.location.host}/recibo/AB%20CD%2F12`).length).toBeGreaterThan(0);
  });

  it.each([null, undefined, ""])("sem código do recibo (%s) não mostra QR e o recibo continua normal", (tokenRecibo) => {
    renderWithProviders(
      <ReciboSaidaStep consulta={consulta} resultado={{ ...resultado, saida: { ...resultado.saida, tokenRecibo } }} onConcluir={() => {}} />,
    );

    expect(screen.queryByRole("img", { name: "QR code do recibo de saída" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Saída registrada");
    expect(screen.getAllByText("Sem cobrança").length).toBeGreaterThan(0);
  });

  it("recibo de avulso com código também mostra o QR, e os dados de pagamento continuam", () => {
    renderWithProviders(
      <ReciboSaidaStep consulta={{ ...consulta, mensalista: false }} resultado={comCodigo} onConcluir={() => {}} />,
    );
    expect(screen.getAllByRole("img", { name: "QR code do recibo de saída" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pagamento").length).toBeGreaterThan(0);
  });
});

describe("ReciboSaidaStep", () => {
  it("repassa a condição de mensalista ao recibo", () => {
    renderStep(consulta);
    expect(screen.getAllByText("Sem cobrança").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pagamento")).not.toBeInTheDocument();
  });

  it("avulso mantém o recibo com forma de pagamento", () => {
    renderStep({ ...consulta, mensalista: false });
    expect(screen.getAllByText("Pagamento").length).toBeGreaterThan(0);
    expect(screen.queryByText("Sem cobrança")).not.toBeInTheDocument();
  });
});

describe("ReciboSaidaStep: nota fiscal", () => {
  const comCobranca: SaidaResultado = {
    ...resultado,
    saida: { ...resultado.saida, valor: 15100, tokenRecibo: "ABCD1234EF" },
  };
  const avulso = { ...consulta, mensalista: false };

  it("saída com cobrança e código do recibo oferece \"Gerar nota fiscal\"", () => {
    renderWithProviders(<ReciboSaidaStep consulta={avulso} resultado={comCobranca} onConcluir={() => {}} />);
    expect(screen.getByRole("button", { name: "Gerar nota fiscal" })).toHaveAttribute("aria-haspopup", "dialog");
  });

  it.each([
    ["mensalista", { ...consulta, mensalista: true }, comCobranca],
    ["valor zero", avulso, { ...comCobranca, saida: { ...comCobranca.saida, valor: 0 } }],
    ["sem código do recibo", avulso, { ...comCobranca, saida: { ...comCobranca.saida, tokenRecibo: null } }],
    ["código do recibo vazio", avulso, { ...comCobranca, saida: { ...comCobranca.saida, tokenRecibo: "" } }],
  ])("não oferece a nota para %s", (_nome, c, r) => {
    renderWithProviders(<ReciboSaidaStep consulta={c} resultado={r} onConcluir={() => {}} />);
    expect(screen.queryByRole("button", { name: "Gerar nota fiscal" })).not.toBeInTheDocument();
  });

  it("abre o modal com o código, o valor e a placa da saída", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReciboSaidaStep consulta={avulso} resultado={comCobranca} onConcluir={() => {}} />);

    expect(screen.queryByRole("dialog", { name: "Modal da nota" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Gerar nota fiscal" }));

    expect(screen.getByRole("dialog", { name: "Modal da nota" })).toBeInTheDocument();
    expect(nota.props).toMatchObject({ token: "ABCD1234EF", valor: 15100, placa: "BRA2E19" });
  });

  it("fechar o modal sem solicitar mantém o botão", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReciboSaidaStep consulta={avulso} resultado={comCobranca} onConcluir={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Gerar nota fiscal" }));
    await user.click(screen.getByRole("button", { name: "fechar modal" }));

    expect(screen.queryByRole("dialog", { name: "Modal da nota" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerar nota fiscal" })).toBeInTheDocument();
  });

  it("depois de solicitada, o botão dá lugar a \"Nota fiscal solicitada\" e invalida as pendentes", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(<ReciboSaidaStep consulta={avulso} resultado={comCobranca} onConcluir={() => {}} />);
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getByRole("button", { name: "Gerar nota fiscal" }));
    await user.click(screen.getByRole("button", { name: "solicitar" }));
    await user.click(screen.getByRole("button", { name: "fechar modal" }));

    expect(screen.queryByRole("button", { name: "Gerar nota fiscal" })).not.toBeInTheDocument();
    expect(screen.getByText("Nota fiscal solicitada")).toBeInTheDocument();
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["notas-pendentes"] });
  });

  it("o botão fica fora do recibo da impressão", () => {
    renderWithProviders(<ReciboSaidaStep consulta={avulso} resultado={comCobranca} onConcluir={() => {}} />);

    const impressao = document.getElementById("recibo-print-root") as HTMLElement;
    expect(impressao).toBeInTheDocument();
    expect(impressao).not.toHaveTextContent("Gerar nota fiscal");
    expect(impressao).not.toHaveTextContent("Nota fiscal solicitada");
  });
});
