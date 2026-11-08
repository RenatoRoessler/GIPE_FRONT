import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { formatDataInput } from "@/lib/periodo";
import { renderWithProviders } from "@/test/render";
import type { Conveniada } from "@/types/conveniada";
import type { FaturaDetalhe } from "@/types/fatura";

vi.mock("@/lib/api/services/fatura", () => ({ emitirFatura: vi.fn() }));
vi.mock("@/lib/api/services/conveniada", () => ({ listConveniadas: vi.fn() }));

import { listConveniadas } from "@/lib/api/services/conveniada";
import { emitirFatura } from "@/lib/api/services/fatura";
import { EmitirFaturaModal } from "./EmitirFaturaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const conveniada = (id: number, nomeFantasia: string, ativo = true): Conveniada => ({
  empresaConvenioId: id,
  empresaConveniadaId: id,
  empresaGuid: `g${id}`,
  razaoSocial: `${nomeFantasia} LTDA`,
  nomeFantasia,
  cnpj: "11222333000181",
  telefone: "11987654321",
  endereco: { logradouro: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" },
  ativo,
  dataCriacao: "2026-03-12T10:00:00",
});

const HOJE = formatDataInput(new Date());
const detalhe = { fatura: { convenioFaturaId: 12, quantidadeSaidas: 14, valorTotal: 1250 }, itens: [] } as unknown as FaturaDetalhe;

const onClose = vi.fn();
const onEmitida = vi.fn();

function renderizar() {
  return renderWithProviders(<EmitirFaturaModal onClose={onClose} onEmitida={onEmitida} />);
}

async function escolherConveniada(nome: string) {
  await screen.findByRole("option", { name: nome });
  await userEvent.setup().selectOptions(screen.getByLabelText("Conveniada"), nome);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listConveniadas).mockResolvedValue([conveniada(53, "Auto Peças"), conveniada(54, "Transportes", false)]);
});

describe("EmitirFaturaModal", () => {
  it("abre com o vencimento 30 dias à frente, o aviso da regra e a conveniada por escolher", async () => {
    renderizar();

    expect(screen.getByRole("dialog", { name: "Emitir fatura" })).toBeInTheDocument();
    const vencimento = screen.getByLabelText("Vencimento") as HTMLInputElement;
    expect(vencimento.min).toBe(HOJE);
    expect(vencimento.value > HOJE).toBe(true);
    expect(screen.getByText(/reúne todas as saídas em aberto/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Conveniada")).toHaveValue("");
    expect(await screen.findByRole("option", { name: "Transportes (encerrado)" })).toBeInTheDocument();
  });

  it("com uma única conveniada, ela já vem escolhida", async () => {
    vi.mocked(listConveniadas).mockResolvedValue([conveniada(53, "Auto Peças")]);
    renderizar();

    await waitFor(() => expect(screen.getByLabelText("Conveniada")).toHaveValue("53"));
  });

  it("sem conveniada escolhida, mostra o erro e não envia", async () => {
    const user = userEvent.setup();
    renderizar();

    await screen.findByRole("option", { name: "Auto Peças" });
    await user.click(screen.getByRole("button", { name: "Emitir fatura" }));

    expect(await screen.findByText("Escolha a conveniada.")).toBeInTheDocument();
    expect(emitirFatura).not.toHaveBeenCalled();
  });

  it("recusa vencimento anterior a hoje", async () => {
    const user = userEvent.setup();
    renderizar();

    await escolherConveniada("Auto Peças");
    fireEvent.change(screen.getByLabelText("Vencimento"), { target: { value: "2020-01-01" } });
    await user.click(screen.getByRole("button", { name: "Emitir fatura" }));

    expect(await screen.findByText("O vencimento não pode ser antes de hoje.")).toBeInTheDocument();
    expect(emitirFatura).not.toHaveBeenCalled();
  });

  it("observação acima de 500 caracteres: contador em erro e emissão travada", async () => {
    renderizar();

    await escolherConveniada("Auto Peças");
    fireEvent.change(screen.getByLabelText("Observação (opcional)"), { target: { value: "a".repeat(501) } });

    expect(screen.getByText("501 / 500")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Emitir fatura" })).toBeDisabled();
  });

  it("emite com os valores digitados e entrega a fatura criada", async () => {
    vi.mocked(emitirFatura).mockResolvedValue(detalhe);
    const user = userEvent.setup();
    renderizar();

    await escolherConveniada("Auto Peças");
    fireEvent.change(screen.getByLabelText("Vencimento"), { target: { value: "2099-12-31" } });
    await user.type(screen.getByLabelText("Observação (opcional)"), "fechamento");
    await user.click(screen.getByRole("button", { name: "Emitir fatura" }));

    await waitFor(() => expect(onEmitida).toHaveBeenCalledWith(detalhe));
    expect(emitirFatura).toHaveBeenCalledWith({ empresaConveniadaId: "53", vencimento: "2099-12-31", observacao: "fechamento" });
  });

  it("erro do back (sem saídas) fica no topo e o modal continua aberto com os dados", async () => {
    vi.mocked(emitirFatura).mockRejectedValue(new ApiError("validation", "Não há saídas em aberto para esta conveniada."));
    const user = userEvent.setup();
    renderizar();

    await escolherConveniada("Auto Peças");
    await user.type(screen.getByLabelText("Observação (opcional)"), "fechamento");
    await user.click(screen.getByRole("button", { name: "Emitir fatura" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não há saídas em aberto para esta conveniada.");
    expect(onEmitida).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Conveniada")).toHaveValue("53");
    expect(screen.getByLabelText("Observação (opcional)")).toHaveValue("fechamento");
    expect(screen.getByRole("button", { name: "Emitir fatura" })).toBeEnabled();
  });

  it("enquanto envia, trava os campos e mostra Emitindo", async () => {
    vi.mocked(emitirFatura).mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    renderizar();

    await escolherConveniada("Auto Peças");
    await user.click(screen.getByRole("button", { name: "Emitir fatura" }));

    expect(await screen.findByRole("button", { name: "Emitindo…" })).toBeDisabled();
    expect(screen.getByLabelText("Conveniada")).toBeDisabled();
  });

  it("Cancelar fecha sem emitir", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(emitirFatura).not.toHaveBeenCalled();
  });
});
